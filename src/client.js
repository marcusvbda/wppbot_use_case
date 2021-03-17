'use strict'

const Util = require('./util/Util')
const EventEmitter = require('events')
const puppeteer = require('puppeteer')
const moduleRaid = require('./util/ModuleRaid')
const InterfaceController = require('./util/InterfaceController')
const { WhatsWebURL, DefaultOptions, Events } = require('./util/Constants')
const { ExposeStore, LoadUtils } = require('./util/Injected')
const { ClientInfo, Message, MessageMedia, Location, Contact, GroupNotification } = require('./structures')

class Client extends EventEmitter {
	constructor(options = {}) {
		super()
		this.options = Util.mergeDefault(DefaultOptions, options)
		this.pupBrowser = null
		this.pupPage = null
	}

	async initialize() {
		const browser = await puppeteer.launch(this.options.puppeteer)
		const page = (await browser.pages())[0]
		page.setUserAgent(this.options.userAgent)
		this.pupBrowser = browser
		this.pupPage = page

		if (this.options.session) {
			await page.evaluateOnNewDocument(
				session => {
					localStorage.clear()
					localStorage.setItem('WABrowserId', session.WABrowserId)
					localStorage.setItem('WASecretBundle', session.WASecretBundle)
					localStorage.setItem('WAToken1', session.WAToken1)
					localStorage.setItem('WAToken2', session.WAToken2)
				}, this.options.session)
		}

		await page.goto(WhatsWebURL, {
			waitUntil: 'load',
			timeout: 0,
		})

		const KEEP_PHONE_CONNECTED_IMG_SELECTOR = '[data-asset-intro-image-light="true"], [data-asset-intro-image-dark="true"]'

		if (this.options.session) {
			try {
				await page.waitForSelector(KEEP_PHONE_CONNECTED_IMG_SELECTOR, { timeout: this.options.authTimeoutMs })
			} catch (err) {
				if (err.name === 'TimeoutError') {
					this.emit(Events.AUTHENTICATION_FAILURE, 'Unable to log in. Are the session details valid?')
					browser.close()
					if (this.options.restartOnAuthFail) {
						this.options.session = null
						this.initialize()
					}
					return
				}
				throw err
			}
		} else {
			const getQrCode = async () => {
				var QR_RETRY_SELECTOR = 'div[data-ref] > span > div'
				var qrRetry = await page.$(QR_RETRY_SELECTOR)
				if (qrRetry) {
					await qrRetry.click()
				}
				const QR_CANVAS_SELECTOR = 'canvas'
				await page.waitForSelector(QR_CANVAS_SELECTOR, { timeout: this.options.qrTimeoutMs })
				const qr_code_value = await page.$eval(QR_CANVAS_SELECTOR, canvas => canvas.parentNode.getAttribute("data-ref"))
				this.emit(Events.QR_RECEIVED, qr_code_value)
			}
			getQrCode()
			this._qrRefreshInterval = setInterval(getQrCode, this.options.qrRefreshIntervalMs)
			await page.waitForSelector(KEEP_PHONE_CONNECTED_IMG_SELECTOR, { timeout: 0 })
			clearInterval(this._qrRefreshInterval)
			this._qrRefreshInterval = undefined
		}
		await page.evaluate(ExposeStore, moduleRaid.toString())

		const localStorage = JSON.parse(await page.evaluate(() => {
			return JSON.stringify(window.localStorage)
		}))

		const session = {
			WABrowserId: localStorage.WABrowserId,
			WASecretBundle: localStorage.WASecretBundle,
			WAToken1: localStorage.WAToken1,
			WAToken2: localStorage.WAToken2
		}

		this.emit(Events.AUTHENTICATED, session)

		await page.waitForFunction('window.Store != undefined')

		await page.evaluate(LoadUtils)

		this.info = new ClientInfo(this, await page.evaluate(() => {
			return window.Store.Conn.serialize()
		}))

		this.interface = new InterfaceController(this)

		await page.exposeFunction('onAddMessageEvent', msg => {
			if (!msg.isNewMsg) return
			if (msg.type === 'gp2') {
				const notification = new GroupNotification(this, msg)
				if (msg.subtype === 'add' || msg.subtype === 'invite') {
					this.emit(Events.GROUP_JOIN, notification)
				} else if (msg.subtype === 'remove' || msg.subtype === 'leave') {
					this.emit(Events.GROUP_LEAVE, notification)
				} else {
					this.emit(Events.GROUP_UPDATE, notification)
				}
				return
			}

			const message = new Message(this, msg)
			this.emit(Events.MESSAGE_CREATE, message)

			if (msg.id.fromMe) return

			this.emit(Events.MESSAGE_RECEIVED, message)
		})

		await page.exposeFunction('onMessageMediaUploadedEvent', (msg) => {

			const message = new Message(this, msg)

			/**
			 * Emitted when media has been uploaded for a message sent by the client.
			 * @event Client#media_uploaded
			 * @param {Message} message The message with media that was uploaded
			 */
			this.emit(Events.MEDIA_UPLOADED, message)
		})

		await page.evaluate(() => {
			window.Store.Msg.on('add', (msg) => { if (msg.isNewMsg) window.onAddMessageEvent(window.WWebJS.getMessageModel(msg)) })
			window.Store.Msg.on('change:isUnsentMedia', (msg, unsent) => { if (msg.id.fromMe && !unsent) window.onMessageMediaUploadedEvent(window.WWebJS.getMessageModel(msg)) })
		})

		this.emit(Events.READY)
	}
	async sendMessage(chatId, content, options = {}) {
		if (chatId.indexOf("@c.u") == -1) {
			chatId = `${chatId}@c.us`
		}
		let internalOptions = {
			linkPreview: options.linkPreview === false ? undefined : true,
			sendAudioAsVoice: options.sendAudioAsVoice,
			sendMediaAsSticker: options.sendMediaAsSticker,
			sendMediaAsDocument: options.sendMediaAsDocument,
			caption: options.caption,
			quotedMessageId: options.quotedMessageId,
			parseVCards: options.parseVCards === false ? false : true,
			mentionedJidList: Array.isArray(options.mentions) ? options.mentions.map(contact => contact.id._serialized) : []
		}

		const sendSeen = typeof options.sendSeen === 'undefined' ? true : options.sendSeen

		if (content instanceof MessageMedia) {
			internalOptions.attachment = content
			content = ''
		} else if (options.media instanceof MessageMedia) {
			internalOptions.attachment = options.media
			internalOptions.caption = content
			content = ''
		} else if (content instanceof Location) {
			internalOptions.location = content
			content = ''
		} else if (content instanceof Contact) {
			internalOptions.contactCard = content.id._serialized
			content = ''
		} else if (Array.isArray(content) && content.length > 0 && content[0] instanceof Contact) {
			internalOptions.contactCardList = content.map(contact => contact.id._serialized)
			content = ''
		}

		if (internalOptions.sendMediaAsSticker && internalOptions.attachment) {
			internalOptions.attachment = await Util.formatToWebpSticker(internalOptions.attachment)
		}

		const newMessage = await this.pupPage.evaluate(async (chatId, message, options, sendSeen) => {
			const chatWid = window.Store.WidFactory.createWid(chatId)
			const chat = await window.Store.Chat.find(chatWid)

			if (sendSeen) {
				window.WWebJS.sendSeen(chatId)
			}

			const msg = await window.WWebJS.sendMessage(chat, message, options, sendSeen)
			return msg.serialize()
		}, chatId, content, internalOptions, sendSeen)

		return new Message(this, newMessage)
	}
}

module.exports = Client
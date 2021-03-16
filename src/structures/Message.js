'use strict'

const Base = require('./Base')
const MessageMedia = require('./MessageMedia')
const Location = require('./Location')
const { MessageTypes } = require('../util/Constants')

class Message extends Base {
	constructor(client, data) {
		super(client)

		if (data) this._patch(data)
	}

	_patch(data) {
		this.mediaKey = data.mediaKey

		this.id = data.id
		this.ack = data.ack
		this.hasMedia = data.clientUrl || data.deprecatedMms3Url ? true : false

		this.body = this.hasMedia ? data.caption || '' : data.body || ''

		this.type = data.type


		this.timestamp = data.t

		this.from = (typeof (data.from) === 'object' && data.from !== null) ? data.from._serialized : data.from

		this.to = (typeof (data.to) === 'object' && data.to !== null) ? data.to._serialized : data.to

		this.author = (typeof (data.author) === 'object' && data.author !== null) ? data.author._serialized : data.author

		this.isForwarded = data.isForwarded

		this.isStatus = data.isStatusV3

		this.isStarred = data.star

		this.broadcast = data.broadcast

		this.fromMe = data.id.fromMe

		this.hasQuotedMsg = data.quotedMsg ? true : false

		this.location = data.type === MessageTypes.LOCATION ? new Location(data.lat, data.lng, data.loc) : undefined

		this.vCards = data.type === MessageTypes.CONTACT_CARD_MULTI ? data.vcardList.map((c) => c.vcard) : data.type === MessageTypes.CONTACT_CARD ? [data.body] : []

		this.mentionedIds = []

		if (data.mentionedJidList) {
			this.mentionedIds = data.mentionedJidList
		}

		this.links = data.links

		return super._patch(data)
	}

	_getChatId() {
		return this.fromMe ? this.to : this.from
	}

	getChat() {
		return this.client.getChatById(this._getChatId())
	}

	getContact() {
		return this.client.getContactById(this.author || this.from)
	}

	async getMentions() {
		return await Promise.all(this.mentionedIds.map(async m => await this.client.getContactById(m)))
	}

	async getQuotedMessage() {
		if (!this.hasQuotedMsg) return undefined

		const quotedMsg = await this.client.pupPage.evaluate((msgId) => {
			let msg = window.Store.Msg.get(msgId)
			return msg.quotedMsgObj().serialize()
		}, this.id._serialized)

		return new Message(this.client, quotedMsg)
	}

	async reply(content, chatId, options = {}) {
		if (!chatId) {
			chatId = this._getChatId()
		}

		options = {
			...options,
			quotedMessageId: this.id._serialized
		}

		return this.client.sendMessage(chatId, content, options)
	}

	async forward(chat) {
		const chatId = typeof chat === 'string' ? chat : chat.id._serialized

		await this.client.pupPage.evaluate(async (msgId, chatId) => {
			let msg = window.Store.Msg.get(msgId)
			let chat = window.Store.Chat.get(chatId)

			return await chat.forwardMessages([msg])
		}, this.id._serialized, chatId)
	}

	async downloadMedia() {
		if (!this.hasMedia) {
			return undefined
		}

		const result = await this.client.pupPage.evaluate(async (msgId) => {
			const msg = window.Store.Msg.get(msgId)

			if (msg.mediaData.mediaStage != 'RESOLVED') {
				await msg.downloadMedia(true, 1)
			}

			if (msg.mediaData.mediaStage.includes('ERROR')) {
				return undefined
			}

			const mediaUrl = msg.clientUrl || msg.deprecatedMms3Url

			const buffer = await window.WWebJS.downloadBuffer(mediaUrl)
			const decrypted = await window.Store.CryptoLib.decryptE2EMedia(msg.type, buffer, msg.mediaKey, msg.mimetype)
			const data = await window.WWebJS.readBlobAsync(decrypted._blob)

			return {
				data: data.split(',')[1],
				mimetype: msg.mimetype,
				filename: msg.filename
			}

		}, this.id._serialized)

		if (!result) return undefined
		return new MessageMedia(result.mimetype, result.data, result.filename)
	}

	async delete(everyone) {
		await this.client.pupPage.evaluate((msgId, everyone) => {
			let msg = window.Store.Msg.get(msgId)

			if (everyone && msg.id.fromMe && msg.canRevoke()) {
				return window.Store.Cmd.sendRevokeMsgs(msg.chat, [msg], true)
			}

			return window.Store.Cmd.sendDeleteMsgs(msg.chat, [msg], true)
		}, this.id._serialized, everyone)
	}

	async star() {
		await this.client.pupPage.evaluate((msgId) => {
			let msg = window.Store.Msg.get(msgId)

			if (msg.canStar()) {
				return msg.chat.sendStarMsgs([msg], true)
			}
		}, this.id._serialized)
	}

	async unstar() {
		await this.client.pupPage.evaluate((msgId) => {
			let msg = window.Store.Msg.get(msgId)

			if (msg.canStar()) {
				return msg.chat.sendStarMsgs([msg], false)
			}
		}, this.id._serialized)
	}

	async getInfo() {
		const info = await this.client.pupPage.evaluate(async (msgId) => {
			const msg = window.Store.Msg.get(msgId)
			if (!msg) return null

			return await window.Store.Wap.queryMsgInfo(msg.id)
		}, this.id._serialized)

		if (info.status) {
			return null
		}

		return info
	}
}

module.exports = Message

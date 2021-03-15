const EventEmitter = require('events')
const puppeteer = require('puppeteer')

const Client = {
	event: new EventEmitter(),
	browser: null,
	page: null,
	async initialize(session_name) {
		await this.startSession(session_name)
		return this
	},
	async startSession(session_name) {
		this.browser = await puppeteer.launch({
			headless: true,
			userDataDir: `\\session\\${session_name}`
		})
		this.page = await this.browser.newPage()
		await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36')
	},
	makeUrl(to, message) {
		return `https://web.whatsapp.com/send?phone=${to}&text=${message}`
	},
	async authenticate() {
		await this.page.goto("https://web.whatsapp.com/")
		await this.page.waitForSelector('[aria-label="Scan me!"]')
		let qr_code_value = await this.page.evaluate(() => {
			return document.querySelector('[aria-label="Scan me!"]').parentNode.getAttribute("data-ref")
		})
		this.event.emit('qr_code', qr_code_value)
		try {
			await this.page.waitForSelector('#side', { timeout: 15000 })
			this.event.emit('connected')
		} catch {
			await this.authenticate()
		}
	},
	async sendMessage(to, message) {
		let route = this.makeUrl(to, message)
		await this.page.goto(route, { waitUntil: 'networkidle2' })
		await this.page.waitForSelector('[data-testid="send"]')
		this.event.emit('connected')
		await this.page.evaluate(() => {
			document.querySelector('[data-testid="send"]').parentNode.click()
		})
		this.event.emit('sent_message', { to, message })
		// await this.browser.close()
	},
}

module.exports = Client
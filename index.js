
(async () => {
	const puppeteer = require('puppeteer')
	const qrcode = require('qrcode-terminal')
	const browser = await puppeteer.launch({
		headless: true,
		// slowMo: 250,
		devtools: true,
		// userDataDir : "\\session",
		// args: ['--start-maximized']
	})
	const page = await browser.newPage()
	await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36')
	await page.setViewport({ width: 1000, height: 728 })
	await page.goto('https://web.whatsapp.com/send?phone=+5514997569008&text=Oi gata, tudo bem ?')

	await page.waitForSelector('[aria-label="Scan me!"]')
	let qr_code_value = await page.evaluate(() => {
		return document.querySelector('[aria-label="Scan me!"]').parentNode.getAttribute("data-ref")
	})
	qrcode.generate(qr_code_value, { small: true })

	await page.waitForSelector('[data-testid="send"]')
	await page.screenshot({ path: 'debug/2.png' })
	await page.evaluate(() => {
		document.querySelector('[data-testid="send"]').parentNode.click()
	})
	await page.screenshot({ path: 'debug/3.png' })
	console.log("Enviou")
	await browser.close()
})()
const qrcode = require('qrcode-terminal')
const Client = require('./src/client')
const imageToBase64 = require('image-to-base64')
const { MessageMedia } = require('./src/structures')

const fs = require('fs')
const SESSION_FILE_PATH = './session.json'
let sessionCfg
if (fs.existsSync(SESSION_FILE_PATH)) {
	sessionCfg = require(SESSION_FILE_PATH)
}

const client = new Client({ puppeteer: { headless: true }, session: sessionCfg })

client.on('qr', qr => {
	qrcode.generate(qr, { small: true })
})

const sendImageMessage = () => {
	// imageToBase64("./image.png").then(photo => {
	// 	const media = new MessageMedia('image/png', photo)
	// 	client.sendMessage("5514997569008", media, { caption: 'Here\'s your requested *media.*' })
	// }).catch(error => console.log(error))

	const media = MessageMedia.fromFilePath('./image.png')
	client.sendMessage("5514996766177", media, { caption: "Participe da nossa live *Hoje*" })
}

client.on('ready', () => {
	console.log("client is ready")
	// client.sendMessage("5514997569008@c.us", 'lorem ipsum')

	sendImageMessage()
})

client.on('authenticated', (session) => {
	console.log('Authenticated')
	sessionCfg = session
	fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
		if (err) {
			console.error(err)
		}
	})
})

client.on('message_create', message => {
	console.log(`sent message to ${message.to}`)
})

client.on('message', async msg => {
	console.log('message received', msg)
	if (msg.body.toLowerCase().trim() == '!info') {
		let info = client.info
		client.sendMessage(msg.from, `
            *Connection info*
            User name: ${info.pushname}
            My number: ${info.me.user}
            Platform: ${info.platform}
            WhatsApp version: ${info.phone.wa_version}
        `)
	}
})

client.initialize()
const qrcode = require('qrcode-terminal')
const Client = require('whatsapp_engine_js')
// const imageToBase64 = require('image-to-base64')
const { MessageMedia } = require('whatsapp_engine_js/src/structures')

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

const validateAndSendMessage = (number, cb) => {
	client.getAccountId(number).then(account => {
		if (account.isValid) {
			cb(account)
		} else {
			console.log("Invalid Number ", number)
		}
	})
}

const sendImageMessageTextMessage = () => {
	let number = "5514996766177"
	validateAndSendMessage(number, (account) => {
		client.sendMessage(account.id, "foi deu certo")
	})
}

const sendImageMessageBase64ImageMessage = () => {
	let number = "5514996766177"
	validateAndSendMessage(number, (account) => {
		imageToBase64("./image.png").then(photo => {
			const media = new MessageMedia('image/png', photo)
			client.sendMessage(account.id, media, { caption: 'Here\'s your requested *media.*' })
		}).catch(error => console.log(error))
	})
}

const sendImageMessageImageMessage = () => {
	let number = "5514996766177"
	validateAndSendMessage(number, (account) => {
		const media = MessageMedia.fromFilePath('./image.png')
		client.sendMessage("5514996766177", media, { caption: "Bla bal bla" })
	})
}

client.on('ready', () => {
	console.log("client is ready")
	sendImageMessageTextMessage()
	// sendImageMessageImageMessage()
	// sendImageMessageBase64ImageMessage()
})

client.on('auth_failure', () => {
	console.log("auth failed")
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
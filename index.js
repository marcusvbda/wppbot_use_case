const qrcode = require('qrcode-terminal')
const Client = require('./src/client')

const fs = require('fs')
const SESSION_FILE_PATH = './session.json'
let sessionCfg
if (fs.existsSync(SESSION_FILE_PATH)) {
	sessionCfg = require(SESSION_FILE_PATH)
}

const client = new Client({ puppeteer: { headless: false }, session: sessionCfg })

client.on('qr', qr => {
	qrcode.generate(qr, { small: true })
})

client.on('ready', () => {
	console.log('Client is ready!')
	client.sendMessage("5514996766177", 'Oi , Tudo bem ? isso é um teste')
})

client.on('authenticated', (session) => {
	console.log('Authenticated', session)
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


client.initialize()
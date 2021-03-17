const qrcode = require('qrcode-terminal')
const Client = require('./src/client')
const client = new Client()

client.on('qr', qr => {
	console.log("Scan qr code")
	qrcode.generate(qr, { small: true })
})

client.on('ready', () => {
	console.log('Client is ready!')
	// let phones = ["5514996212777", "5514996216606", "5514997569008"]
	// phones.forEach(phone => client.sendMessage(phone, 'Oi , Tudo bem ? isso é um teste'))

})

// client.on('authenticated', () => {
// 	console.log('Authenticated')
// })

client.on('message_create', message => {
	console.log(`sent message to ${message.to}`)
})


client.initialize()
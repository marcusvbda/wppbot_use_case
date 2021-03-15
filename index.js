
(async () => {
	let session_name = "3854361464b9a2c3832c47bd39cddf54"
	const Client = require('./client')

	let client = await Client.initialize(session_name)

	client.event.on("qr_code", code => {
		const qrcode = require('qrcode-terminal')
		console.log("Scan this qrcode")
		qrcode.generate(code, { small: true })

	})

	client.event.on("sent_message", message => {
		console.log(message)
	})

	client.event.on("connected", () => {
		console.log("connected")
	})

	// await client.authenticate()
	// await client.sendMessage("+5514997569008", "mensagem de teste api wpp")
	// await client.sendMessage("+5514996766177", "teste a1212")
})()
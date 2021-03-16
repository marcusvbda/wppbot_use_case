require('dotenv').config()
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())
app.use(cors({ credentials: true }))

app.post('/teste', async (req, res) => {
	return res.status(202).send("teste")
})


app.post('/check-auth', async (req, res) => {
	const Client = require('./src/client')
	let { session } = req.body
	if (!session) return res.status(403).send('Not Authorized')
	let client = await Client.initialize(session)
	client.event.on("auth-checked", result => {
		console.log(result)
		return res.status(result ? 202 : 403).send(result)
	})
	client.checkAuth()
})

//validade de 10segundos
app.post('/get-qr-code', async (req, res) => {
	const Client = require('./src/client')
	let { session } = req.body
	if (!session) return res.status(403).send('Not Authorized')
	let client = await Client.initialize(session)
	client.on("qr-code", result => {
		return res.status(result.success ? 202 : 403).send(result.code)
	})
	client.getQrcode()
})

app.post('/send', async (req, res) => {
	const Client = require('./src/client')
	let { session, to, message } = req.body
	if (!session) return res.status(403).send('Not Authorized')
	let client = await Client.initialize(session)
	client.event.on("sent-message", result => {
		return res.status(result.success ? 202 : 403).send({ to: result.to, messagem: result.message })
	})
	client.sendMessage(to, message)
})

const port = process.env.SERVER_PORT
app.listen(port, () => {
	console.log(`App listening on port ${port}`)
})
'use strict'

const fs = require('fs')
const path = require('path')
const mime = require('mime')

class MessageMedia {
	constructor(mimetype, data, filename) {
		this.mimetype = mimetype
		this.data = data
		this.filename = filename
	}
	static fromFilePath(filePath) {
		const b64data = fs.readFileSync(filePath, { encoding: 'base64' })
		const mimetype = mime.getType(filePath)
		const filename = path.basename(filePath)

		return new MessageMedia(mimetype, b64data, filename)
	}
}

module.exports = MessageMedia
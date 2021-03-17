'use strict'

const Base = require('./Base')

class GroupNotification extends Base {
	constructor(client, data) {
		super(client)

		if (data) this._patch(data)
	}

	_patch(data) {
		this.id = data.id

		this.body = data.body || ''

		this.type = data.subtype

		this.timestamp = data.t

		this.chatId = typeof (data.from) === 'object' ? data.from._serialized : data.from

		this.author = typeof (data.author) === 'object' ? data.author._serialized : data.author

		this.recipientIds = []

		if (data.recipients) {
			this.recipientIds = data.recipients
		}

		return super._patch(data)
	}

	getChat() {
		return this.client.getChatById(this.chatId)
	}

	getContact() {
		return this.client.getContactById(this.author)
	}

	async getRecipients() {
		return await Promise.all(this.recipientIds.map(async m => await this.client.getContactById(m)))
	}

	async reply(content, options = {}) {
		return this.client.sendMessage(this.chatId, content, options)
	}

}

module.exports = GroupNotification

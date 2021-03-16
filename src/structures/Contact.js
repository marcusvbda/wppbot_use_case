'use strict'

const Base = require('./Base')
class Contact extends Base {
	constructor(client, data) {
		super(client)

		if (data) this._patch(data)
	}

	_patch(data) {
		this.id = data.id

		this.number = data.userid

		this.isBusiness = data.isBusiness

		this.isEnterprise = data.isEnterprise

		this.labels = data.labels
		this.name = data.name
		this.pushname = data.pushname

		this.sectionHeader = data.sectionHeader
		this.shortName = data.shortName

		this.statusMute = data.statusMute
		this.type = data.type
		this.verifiedLevel = data.verifiedLevel
		this.verifiedName = data.verifiedName
		this.isMe = data.isMe
		this.isUser = data.isUser
		this.isGroup = data.isGroup
		this.isWAContact = data.isWAContact
		this.isMyContact = data.isMyContact
		this.isBlocked = data.isBlocked

		return super._patch(data)
	}

	async getProfilePicUrl() {
		return await this.client.getProfilePicUrl(this.id._serialized)
	}

	async getChat() {
		if (this.isMe) return null

		return await this.client.getChatById(this.id._serialized)
	}

	async block() {
		if (this.isGroup) return false

		await this.client.pupPage.evaluate(async (contactId) => {
			const contact = window.Store.Contact.get(contactId)
			await window.Store.BlockContact.blockContact(contact)
		}, this.id._serialized)

		return true
	}

	async unblock() {
		if (this.isGroup) return false

		await this.client.pupPage.evaluate(async (contactId) => {
			const contact = window.Store.Contact.get(contactId)
			await window.Store.BlockContact.unblockContact(contact)
		}, this.id._serialized)

		return true
	}

	async getAbout() {
		const about = await this.client.pupPage.evaluate(async (contactId) => {
			return window.Store.Wap.statusFind(contactId)
		}, this.id._serialized)

		if (typeof about.status !== 'string')
			return null

		return about.status
	}

}

module.exports = Contact
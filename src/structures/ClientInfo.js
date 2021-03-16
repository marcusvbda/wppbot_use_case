'use strict'

const Base = require('./Base')

class ClientInfo extends Base {
	constructor(client, data) {
		super(client)

		if (data) this._patch(data)
	}

	_patch(data) {
		this.pushname = data.pushname
		this.me = data.wid
		this.wid = data.wid
		this.phone = data.phone

		this.platform = data.platform
		return super._patch(data)
	}

	async getBatteryStatus() {
		return await this.client.pupPage.evaluate(() => {
			const { battery, plugged } = window.Store.Conn
			return { battery, plugged }
		})
	}

}

module.exports = ClientInfo
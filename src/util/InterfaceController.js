'use strict'

class InterfaceController {

	constructor(props) {
		this.pupPage = props.pupPage
	}

	async openChatWindow(chatId) {
		await this.pupPage.evaluate(async chatId => {
			let chat = await window.Store.Chat.get(chatId)
			await window.Store.Cmd.openChatAt(chat)
		}, chatId)
	}

	async openChatDrawer(chatId) {
		await this.pupPage.evaluate(async chatId => {
			let chat = await window.Store.Chat.get(chatId)
			await window.Store.Cmd.chatInfoDrawer(chat)
		}, chatId)
	}

	async openChatSearch(chatId) {
		await this.pupPage.evaluate(async chatId => {
			let chat = await window.Store.Chat.get(chatId)
			await window.Store.Cmd.chatSearch(chat)
		}, chatId)
	}

	async openChatWindowAt(msgId) {
		await this.pupPage.evaluate(async msgId => {
			let msg = await window.Store.Msg.get(msgId)
			await window.Store.Cmd.openChatAt(msg.chat, msg.chat.getSearchContext(msg))
		}, msgId)
	}

	async openMessageDrawer(msgId) {
		await this.pupPage.evaluate(async msgId => {
			let msg = await window.Store.Msg.get(msgId)
			await window.Store.Cmd.msgInfoDrawer(msg)
		}, msgId)
	}

	async closeRightDrawer() {
		await this.pupPage.evaluate(async () => {
			await window.Store.Cmd.closeDrawerRight()
		})
	}

}

module.exports = InterfaceController
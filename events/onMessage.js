const { prefix } = require('../config.json')
const { handle } = require('../commandHandler.js')

module.exports = {
    name: 'messageCreate',
    async execute(client, message) {
        if (message.content.startsWith(prefix) && !message.author.bot) {
            handle(client, message)
        }
    }
}
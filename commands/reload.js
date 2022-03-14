const { prefix } = require('../config.json')

module.exports = {
    name: 'reload',
    description: 'Перезагружает команды',
    usage: '<название команды>',
    dmOnly: true,
    guildOnly: true,
    ownerOnly: true,
    minArgs: 1,
    maxArgs: 1,
    async execute(client, message, args) {
        const commandName = args[0];
        if (client.commands.has(commandName)) {
            delete require.cache[require.resolve(`./${commandName}.js`)]
            client.commands.delete(commandName)
            const props = require(`./${commandName}.js`)
            client.commands.set(commandName, props)
        message.reply(`Команда ${commandName} была перезагружена.`)   
        } else {
            message.reply(`> Такой команды не существует.\n Чтобы посмотреть список доступных команд используйте \`${prefix}help\``)
        }
    }
}
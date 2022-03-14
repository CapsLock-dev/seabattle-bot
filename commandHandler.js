const { ownerId, prefix } = require('./config.json')

module.exports = {
    async handle(client, message) {
        const args = message.content.slice(prefix.length).trim().split(/ +/g)
        const app = await client.application.fetch()
        const command = args.shift()
        if (client.commands.has(command)) {
            try {
                const cmd = client.commands.get(command)
                if (check(cmd, message, args, app)) {
                    cmd.execute(client, message, args)
                }
            } catch (err) {
                console.error(err)
                message.reply('Произошла ошибка во время выполнения команды.')
            }
        } else {
            message.reply(`> Такой команды не существует`)
            return false
        }
    }
}
function check(command, message, args, app) {
    if (!command.dmOnly && command.guildOnly && !message.guild) {
        message.reply('> Эту команду можно использовать только на сервере.')
        return false
    } else if (!command.guildOnly && command.dmOnly && message.guild) {
        message.reply('> Эту команду можно использовать только в лс.')
        return false
    } else if (command.ownerOnly && message.author.id != app.owner.id) {
        message.reply('> Эту команду может использовать только владелец бота.')
        return false
    } else if (command.minArgs && command.maxArgs && (command.minArgs > args.length || args.length > command.maxArgs)) {
        message.reply(`> Неверные аргументы. \n Использование команды: \`${prefix}${command.name} ${command.usage}\`.`)
         return false   
    }
    return true
}
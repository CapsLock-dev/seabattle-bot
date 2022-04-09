const { prefix } = require('./config.json')

module.exports = {
    async handle(client, message) {
        const args = message.content.slice(prefix.length).trim().split(/ +/g)
        const app = await client.application.fetch()
        const command = args.shift()

        if (client.commands.has(command)) {
            try {
                const cmd = client.commands.get(command)
                const res = check(cmd, message, args, app)
                if (res) cmd.execute(client, message, args)
            } catch (err) {
                console.error(err)
                message.reply('Произошла ошибка во время выполнения команды.')
            }
        } else {
            message.reply(`**Ошибка:**\n> Такой команды не существует`)
            return false
        }
    }
}
function check(command, message, args, app) {
    const {dmOnly, guildOnly, ownerOnly, minArgs, maxArgs} = command.settings
    let reply = '**Ошибка:**\n>'

    if (!dmOnly && guildOnly && !message.guild) {
        reply += 'Эту команду можно использовать только на сервере'
    } else if (dmOnly && !guildOnly && message.guild) {
        reply += 'Эту команду можно использовать только в лс'
    } else if (ownerOnly && message.author.id != app.owner.id) {
        reply += 'Эту команду может использовать только владелец бота'
    } else if (minArgs && maxArgs > 0 && (minArgs > args.length || maxArgs < args.length)) {
        reply += `Неверные аргументы. \n Использование команды: \`${prefix}${command.name} ${command.usage}\``
    } else {
        return true
    }

    message.reply(reply)
    return false
}
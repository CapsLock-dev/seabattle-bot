const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const Bot = require('./classes/seabattle/Bot')
const Game = require('./classes/seabattle/Game')
const Player = require('./classes/seabattle/Player')

module.exports = {
    name: 'seabattle',
    description: 'Морской бой',
    usage: '<solo/online>(default: online)',
    settings: {
        dmOnly: true,
        ownerOnly: false,
        guildOnly: false,
        minArgs: 0,
        maxArgs: 1
    },
    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    async execute(client, message, args) {
        const author = message.author
        const channel = message.channel
        const solo = args[0] === 'solo'
        if (client.seabattleInGame.findById(author.id) || client.seabattleQueue.findById(author.id)) {
            channel.send('Вы уже ищете игру или находитесь в ней')
            return
        }
        if (client.seabattleQueue.length() == 0 && !solo) {
            client.seabattleQueue.push(author)
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('cancel')
                        .setLabel('Отменить поиск')
                        .setStyle('DANGER')
                )
            const searchMessage = await message.author.send({ content: 'Поиск игры...', components: [row] })
            const filter = i => i.customId === 'cancel'
            const collector = message.channel.createMessageComponentCollector({ filter });

            collector.on('collect', i => { collector.stop() })
            collector.on('end', async i => {
                await searchMessage.edit({ content: 'Поиск отменен', components: [] })
                client.seabattleQueue.removeById(author.id)
                setTimeout(() => { searchMessage.delete() }, 3000)
            })
        } else {
            let player2 = null
            if (!solo) {
                const enemy = client.seabattleQueue.pop()
                const enemyDM = await enemy.createDM()
                client.seabattleInGame.push(author, enemy)
                player2 = new Player(enemy.username, enemy.id, enemyDM, client)
            } else {
                player2 = new Bot()
            }
            const player1 = new Player(author.username, author.id, channel, client)
            new Game(player1, player2, client)
        }
    }
}
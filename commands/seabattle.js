const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const Game = require('./classes/seabattle/Game')

module.exports = {
    name: 'seabattle',
    description: 'Морской бой',
    usage: '',
    dmOnly: true,
    ownerOnly: false,
    guildOnly: false,
    async execute(client, message) {
        if (client.seabattleQueue.includes(message.author) && client.seabattleInGame.includes(message.author)) {
            message.channel.send('Вы уже ищете игру или находитесь в ней')
        } else {
            if (client.seabattleQueue.length == 0) {
                client.seabattleQueue.push(message.author)

                const button = new MessageButton().setCustomId('cancel').setLabel('Отменить поиск').setStyle('DANGER')
                const row = new MessageActionRow().addComponents(button)
                const searchMessage = await message.author.send({content: 'Поиск игры...', components: [row]})
                const filter = i => i.customId === 'cancel'
                const collector = message.channel.createMessageComponentCollector({ filter });
                
                collector.on('collect', i => { collector.stop() })
                collector.on('end', async i => {
                    await searchMessage.edit({content: 'Поиск отменен', components: []})
                    client.seabattleQueue.splice(client.seabattleQueue.indexOf(message.author))
                    setTimeout(() => {searchMessage.delete()}, 3000)
                })
            } else {
                const enemy = client.seabattleQueue.pop()
                const enemyDM = await enemy.createDM()
                const player = message.author
                const playerDM = message.channel
                client.seabattleInGame.push(player, enemy)
                enemyDM.send('Игра найдена')
                playerDM.send('Игра найдена')
                const game = new Game(player, enemy, playerDM, enemyDM, client)
            }
        }
    }
}
const { Client, Collection, Intents } = require('discord.js')
const fs = require('fs');

const client = new Client({ 
    partials: ["CHANNEL"],
    intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] 
})
client.commands = new Collection()
client.seabattleQueue = new Array()
client.seabattleInGame = new Array()

for (file of fs.readdirSync('./commands').filter(file => file.endsWith('.js'))) {
    const command = require(`./commands/${file}`)
    client.commands.set(command.name, command)
}
for (file of fs.readdirSync('./events').filter(file => file.endsWith('.js'))) {
    const event = require(`./events/${file}`)
    if (event.once) {
        client.once(event.name, (...args) => event.execute(client, ...args))
    } else {
        client.on(event.name, (...args) => event.execute(client, ...args));
    }
}
 
client.login(process.env.token)
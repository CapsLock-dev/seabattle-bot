const Battlefield = require("./Battlefield")
const Game = require('./Game')
const Screen = require('./Screen')
const Ship = require("./Ship")

class Player {
    ready = false
    battlefield = new Battlefield()
    directions = {
        'в': 'col',
        'г': 'row'
    }
    letters = 'абвгдежзик'.split('')

    constructor(name, id, channel, client) {
        this.name = name
        this.id = id
        this.collector = channel.createMessageCollector()
        this.screen = new Screen(channel, client)
    }

    /**
     * @param {Game} game 
     */
    init(game) {
        this.game = game
        this.collector.on('collect', async msg => {
            if (!msg.author.bot) this.#messageHandler(msg)
        })
        this.collector.on('end', (collected, reason) => {
            this.game.end(reason)
        })
    }

    async #messageHandler(msg) {
        msg = msg.content.replace(/\s/g, '').toLowerCase()
        this.lastMsg = msg
        if (msg == 'random') {
            this.#randomShips()
        } else if (msg == 'leave') {
            this.#leave()
        } else {
            const { x, y, dir } = this.#coordCalc(msg)
            switch (this.game.gameState) {
                case this.game.state.preparation:
                    if (this.ready) break
                    const output = this.battlefield.addShip(new Ship(this.battlefield.ships[0], dir, x, y))
                    const shipName = this.#whichShip(this.battlefield.ships[0])
                    if (output) {
                        this.screen.sendMsg(output + `\nУкажите координаты ${shipName}ого корабля`)
                    } else {
                        this.battlefield.ships.shift()
                        let message = `${shipName}ый корабль установлен\n` +
                        `Укажите координаты ${this.#whichShip(this.battlefield.ships[0])}ого корабля`
                        if (this.battlefield.ships.length == 0) {
                            this.ready = true
                            message = 'Все ваши корабли установлены\nОжидание противника'
                        }
                        await this.screen.sendMatrix(this.battlefield.matrix, 'Ваше поле', message)
                    }
                    this.game.readyCheck()
                    break
                case this.game.state.battle:
                    this.game.shot(x, y, this)
                    break
            }
        }
    }
    /**
     * @param {Player} player 
     */
    shot(x, y, player) {
        const output = this.battlefield.addShot(x, y)
        let result = this.battlefield.successShot.includes(output)
        if (output) {
            if (this.battlefield.defeat) {
                this.game.end(`Победа игрока ${player.name}`)
            } else {
                this.shotInfo(x, y, 'Ваше поле', output, this.battlefield.matrix)
                player.shotInfo(x, y, `Поле игрока ${this.name}`, output, this.battlefield.matrix)
            }
        } else {
            result = true
            player.sendMsg(`Неверные координаты.\n`)
        }
        return result
    }

    async shotInfo(x, y, owner, output, matrix) {
        const description = `Выстрел: ${this.letters[x]}${y+1}. ${output}`
        await this.screen.sendMatrix(matrix, owner, description)
    }
    
    async yourTurn(target) {
        await this.screen.sendMatrix(target.battlefield.matrix, `Поле игрока ${target.name}`, this.game.helpMsg)
    }

    #coordCalc(msg) {
        if (!msg || !msg.match(/\d/g)) return false
        return {
            x: this.letters.indexOf(msg[0]),
            y: msg.match(/\d/g).join('') - 1,
            dir: this.directions[msg.match(/.$/)[0]]
        }
    }

    #whichShip(shipSize) {
        const shipNames = {
            4: 'четырехпалубн',
            3: 'трехпалубн',
            2: 'двухпалубн',
            1: 'однопалубн'
        }
        return shipNames[shipSize]
    }

    async #randomShips() {    
        if (this.game.gameState === this.game.state.preparation) {
            this.battlefield.init()
            this.battlefield.randomShips()
            await this.screen.sendMatrix(this.battlefield.matrix, 'Ваше поле', 'Корабли установлены')
            this.ready = true
            this.game.readyCheck()
        }
    }

    stopCollector() {
        this.collector.stop()
    }

    #leave() {
        this.game.end(`${this.name} покинул игру`)
    }

    sendMsg(msg) {
        this.screen.sendMsg(msg)
    }

}

module.exports = Player
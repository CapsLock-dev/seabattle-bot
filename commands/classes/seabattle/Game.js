const Battlefield = require('./Battlefield')
const Player = require('./Player')
const Ship = require('./Ship')
const Screen = require('./Screen')

class Game {
    gameState = null
    turn = null
    noTurn = null
    state = {
        preparation: 'Подготовка',
        battle: 'Битва'
    }

    constructor(player, opponent, playerChannel, opponentChannel, client) {
        this.player = new Player(player, new Screen(playerChannel, client), new Battlefield())
        this.opponent = new Player(opponent, new Screen(opponentChannel, client), new Battlefield())
        this.client = client
        this.start()
    }
    start() {
        const filter = m => m.author.bot == false
        this.collectorPlayer = this.player.screen.channel.createMessageCollector({ filter, idle: 10 * 60 * 60 * 1000 });
        this.collectorOpponent = this.opponent.screen.channel.createMessageCollector({ filter, idle: 10 * 60 * 60 * 1000 });
        this.collectorPlayer.on('collect', m => {
            this.msgHandler(this.player, m)
        })
        this.collectorOpponent.on('collect', m => {
            this.msgHandler(this.opponent, m)
        })
        this.collectorPlayer.on('end', (collected, reason) => {
            this.end(reason)
        })
        this.collectorOpponent.on('end', (collected, reason) => {
            this.end(reason)
        })
        this.gameState = this.state.preparation
    }

    dirCalc(dir) {
        let direction = false
        if (dir === 'в') {
            direction = 'col'
        } else if (dir === 'г') {
            direction = 'row'
        }
        return direction
    }

    whichShip(ship) {
        let shipNames = {
            4: 'четырехпалубн',
            3: 'трехпалубн',
            2: 'двухпалубн',
            1: 'однопалубн'
        }
        return shipNames[ship]  
    }

    coordCalc(msg) {
        const letters = 'абвгдежзик'.split('')
        msg.replace(' ', '')
        if (msg.match(/\d/g) == null || msg.match(/.$/ == null)) {
            return false
        }
        const result = { 
            x: letters.indexOf(msg[0].toLowerCase()),
            y: msg.match(/\d/g).join('')-1, 
            dir: this.dirCalc(msg.match(/.$/)[0])
        }
        return result
    }

    async startBattle() {
        this.swapTurn() 
        this.sendBoth(`Ход игрока ${this.turn.user.username}`)
        await this.turn.screen.sendMatrix(this.noTurn.battlefield.matrix, this.gameState, `Поле игрока ${this.noTurn.user.username}`)
        this.turn.screen.sendMsg('Укажите координаты места куда хотите выстрелить\n> Пример: а1')
    }

    async repeat() {
        this.sendBoth(`Ход игрока ${this.turn.user.username}`)
        await this.turn.screen.sendMatrix(this.noTurn.battlefield.matrix, this.gameState, `Поле игрока ${this.noTurn.user.username}`)
        this.turn.screen.sendMsg('Укажите координаты места куда хотите выстрелить\n> Пример: а1')
    }

    async preparation(msg, player) {
        const { battlefield, screen } = player
        if (msg.content.replace(' ', '') == 'рандом') {
            battlefield.init()
            battlefield.randomShips()
            await screen.sendMatrix(battlefield.matrix, this.gameState, 'Ваше поле')
            player.ready = true
        } else {
            if (this.coordCalc(msg.content) == false) {
                return screen.sendMsg('Неправильные координаты')
            } 
            const { x, y, dir } = this.coordCalc(msg.content)
            const output = battlefield.addShip(new Ship(battlefield.ships[0], dir, x, y))
            const shipName = this.whichShip(battlefield.ships[0])
            if (output) {
                screen.sendMsg(output)
                screen.sendMsg(`Укажите координаты ${shipName}ого корабля`)
            } else {
                screen.sendMsg(`${shipName}ый корабль установлен`)
                await screen.sendMatrix(battlefield.matrix, this.gameState, 'Ваше поле')
                battlefield.ships.shift()
                screen.sendMsg(`Укажите координаты ${this.whichShip(battlefield.ships[0])}ого корабля`)
                if (battlefield.ships.length == 0) player.ready = true
            }
        }
        if (this.player.ready && this.opponent.ready) {
            this.gameState = this.state.battle
            this.startBattle()
        }
    }

    async battle(msg, player) {
        const { screen } = player
        if (this.turn == player) {
            const {x, y} = this.coordCalc(msg.content)
            const output = this.noTurn.battlefield.addShot(x, y)
            if (this.noTurn.battlefield.defeat) {
                this.end(`Победа игрока ${this.turn.user.username}`)
                return
            }
            if (output) {
                this.sendBoth(`${output}. Выстрел: ${'абвгдежзик'[x]}${y+1}`)
                await this.noTurn.screen.sendMatrix(this.noTurn.battlefield.matrix, this.gameState, 'Ваше поле')
                if (output === 'Попал' || output === 'Убил'){
                    this.repeat()
                } else {
                    this.startBattle()
                }
            } else {
                screen.sendMsg('Укажите координаты места куда хотите выстрелить\n> Пример: а1')
            }
        }
    }

    async msgHandler(player, msg) {
        if (msg.content === 'leave') {
            this.end(`${player.user.username} покинул игру. \nИгра закончена`)
        } else if (this.gameState === this.state.preparation) {
            this.preparation(msg, player)
        } else if(this.gameState === this.state.battle) {
            this.battle(msg, player)
        } 
    }

    anotherPlayer(player) {
        let array = [this.player, this.opponent]
        array.splice(array.indexOf(player), 1)
        return array[0]
    }
    
    end(reason) {
        if (reason === 'user') return
        if (reason !== 'idle') {
            this.collectorOpponent.stop()
            this.collectorPlayer.stop()
        }       
        this.sendBoth(reason)
        this.client.seabattleInGame.splice(this.client.seabattleQueue.indexOf(this.player.user), 1)
        this.client.seabattleInGame.splice(this.client.seabattleQueue.indexOf(this.opponent.user), 1)
    }

    sendBoth(msg) {
        this.player.screen.sendMsg(msg)
        this.opponent.screen.sendMsg(msg)
    }

    swapTurn() {
        if (this.turn == this.player) {
            this.turn = this.opponent
            this.noTurn = this.player
        } else if (this.turn == this.opponent) {
            this.turn = this.player
            this.noTurn = this.opponent
        } else {
            let array = [this.player, this.opponent]
            this.turn = array[Math.round(Math.random())]
            this.noTurn = this.anotherPlayer(this.turn)
        }
    }
}
module.exports = Game
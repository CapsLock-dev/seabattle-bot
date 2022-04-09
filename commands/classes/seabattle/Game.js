const Battlefield = require('./Battlefield')
const Player = require('./Player')
const Ship = require('./Ship')
const Screen = require('./Screen')
const Bot = require('./Bot')

class Game {
    gameState = null
    turn = null
    state = {
        preparation: 'Подготовка',
        battle: 'Битва',
        end: 'Конец'
    }
    helpMsg = 'Укажите координаты места куда хотите выстрелить\nПример: а1'
    /** 
     * @param {Player} user1 
     * @param {Player} user2 
     */
    constructor(user1, user2, client) {
        this.player = user1
        this.opponent = user2
        this.client = client
        this.start()
    }

    start() {
        this.gameState = this.state.preparation
        this.player.init(this)
        this.opponent.init(this)
    }

    shot(x, y, player) {
        if (this.turn === player) {
            let repeat = this.anotherPlayer(this.turn).shot(x, y, player)
            if (this.gameState !== this.state.end) setTimeout(() => {this.swapTurn(repeat)}, 1000)
        }
    }

    end(reason) {
        this.gameState = this.state.end
        this.sendBoth(reason)
        this.player.stopCollector()
        this.opponent.stopCollector()
        this.client.seabattleInGame.removeById(this.player.id)
        this.client.seabattleInGame.removeById(this.opponent.id)
    }

    sendBoth(msg) {
        this.player.sendMsg(msg)
        this.opponent.sendMsg(msg)
    }

    anotherPlayer(player) {
        let array = [this.player, this.opponent]
        array.splice(array.indexOf(player), 1)
        return array[0]
    }

    swapTurn(repeat=false) { 
        if (!repeat) {
            if (this.turn) {
                this.turn = this.anotherPlayer(this.turn)
            } else {
                this.turn = [this.player, this.opponent][Math.round(Math.random())]
            }
        }
        this.sendBoth('Ход игрока ' + this.turn.name)
        this.turn.yourTurn(this.anotherPlayer(this.turn))
    }

    readyCheck() {
        if (this.player.ready && this.opponent.ready) {
            this.gameState = this.state.battle
            this.swapTurn()
        }
    }
}
module.exports = Game
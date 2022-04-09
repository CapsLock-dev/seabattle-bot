const Battlefield = require("./Battlefield");
const Player = require("./Player");

class Bot {
    battlefield = new Battlefield()
    ready = true
    name = 'Бот'
    letters = 'абвгдежзик'.split('')
    lastShot = {
        x: null,
        y: null,
        prevResult: null,
        result: null,
        foundCorrectDir: false,
        axis: {}
    }
    lastDetectedShip = {
        x: null,
        y: null
    }
    constructor() { }

    init(game) {
        this.game = game
        this.battlefield.randomShips()
    }

    shot(x, y, player) {
        const output = this.battlefield.addShot(x, y)
        let result = this.battlefield.successShot.includes(output)
        if (output) {
            if (this.battlefield.defeat) {
                this.game.end(`Победа игрока ${player.name}`)
            } else {
                player.shotInfo(x, y, `Поле игрока ${this.name}`, output, this.battlefield.matrix)
            }
        } else {
            result = true
            player.sendMsg(`Неверные координаты.`)
        }
        return result
    }

    shotInfo(x, y, owner, output, matrix) {
        // Записываем данные последнего выстрела
        this.lastShot.prevResult = this.lastShot.result
        this.lastShot.result = output
        this.lastShot.x = x
        this.lastShot.y = y

        switch (output) {
            case this.battlefield.shotOutput.shot:
                if (!this.lastDetectedShip.x && !this.lastDetectedShip.y) {
                    // Обнаружил корабль
                    this.lastDetectedShip = { x, y }
                } else if (this.lastDetectedShip.x && this.lastDetectedShip.y) {
                    // Найдена ось
                    this.lastShot.foundCorrectDir = true
                }
                break

            case this.battlefield.shotOutput.kill:
                // Корабль убит
                this.lastShot.axis = {}
                this.lastShot.foundCorrectDir = false
                this.lastDetectedShip = { x: null, y: null }
                break
        }
    }

    yourTurn(target) {
        const { x, y } = this.#randomCoords(target)
        console.log(`x: ${x} y: ${y}`)
        setTimeout(() => { this.game.shot(x, y, this) }, 1500)
    }

    #randomCoords(target) {
        let x = 0
        let y = 0
        // Если обнаружен корабль
        if (this.lastDetectedShip.x && this.lastDetectedShip.y) {
            if (this.lastShot.foundCorrectDir) {
                // Добиваем корабль
                const dx = this.lastShot.axis.direction === 'row'
                const dy = this.lastShot.axis.direction === 'col'
                switch (this.lastShot.result) {
                    case this.battlefield.shotOutput.shot:
                        // Если прошлый выстрел удачный, продолжаем в том же направлении
                        x = this.lastShot.x + dx * this.lastShot.axis.sign
                        y = this.lastShot.y + dy * this.lastShot.axis.sign
                        if (!this.#canShot(x, y, target.battlefield)) {
                            const sign = [1, -1].filter(el => el !== this.lastShot.axis.sign)[0]
                            x = this.lastDetectedShip.x + dx * sign
                            y = this.lastDetectedShip.y + dy * sign
                            this.lastShot.axis.sign = sign
                        }
                        break

                    case this.battlefield.shotOutput.miss:
                        // Если прошлый выстрел не удачный, продолжаем в противоположном направлении
                        const sign = [1, -1].filter(el => el !== this.lastShot.axis.sign)[0]
                        x = this.lastDetectedShip.x + dx * sign
                        y = this.lastDetectedShip.y + dy * sign
                        this.lastShot.axis.sign = sign
                        break
                }
            } else {
                // Ищем продолжение корабля
                let direction, sign
                let result = false
                while (!result) {
                    console.log('Ищу ось на которой лежит корабль')
                    direction = ['col', 'row'][Math.round(Math.random())]
                    sign = [1, -1][Math.round(Math.random())]
                    const dx = direction === 'row'
                    const dy = direction === 'col'

                    x = this.lastDetectedShip.x + dx * sign
                    y = this.lastDetectedShip.y + dy * sign
                    result = this.#canShot(x, y, target.battlefield)
                }
                this.lastShot.axis = { direction, sign }
            }
        }
        // Ищем корабли
        while (!this.#canShot(x, y, target.battlefield)) {
            x = Math.round(Math.random() * 9)
            y = Math.round(Math.random() * 9)
        }
        return { x, y }
    }

    #canShot(x, y, targetBattlefield) {
        return 0 <= x && x < 10 && 0 <= y && y < 10 && !targetBattlefield.matrix[y][x].shot
    }

    stopCollector() { }

    sendMsg(msg) { }
}

module.exports = Bot
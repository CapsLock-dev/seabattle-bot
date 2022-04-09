const Ship = require("./Ship")

class Battlefield {
    matrix = []
    ships = []
    defeat = false
    #shipsLeft = 10
    shotOutput = {
        shot: 'Попал',
        kill: 'Убил',
        miss: 'Мимо'
    }
    successShot = [this.shotOutput.kill, this.shotOutput.shot]
    constructor() {
        this.init()
    }

    init() {
        this.ships = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1]
        const matrix = []
        for (let y = 0; y < 10; y++) {
            const row = []
            for (let x = 0; x < 10; x++) {
                const item = {
                    x,
                    y,
                    ship: null,
                    shot: false,
                    free: true,
                }
                row.push(item)
            }
            matrix.push(row)
        }
        this.matrix = matrix
    }

    #inField(x, y) {
        return 0 <= x && x < 10 && 0 <= y && y < 10
    }

    #canBePlaced(x, y, direction, size) {
        if (!this.#inField(x, y)) return false
        if (size == 1) {
            return x < 10 && y < 10 && this.matrix[y][x].free
        }
        if (direction == 'row' || direction == 'col') {
            const dx = direction === 'row'
            const dy = direction === 'col'
            for (let i = 0; i < size; i++) {
                const cx = x + dx * i
                const cy = y + dy * i
                if (cx > 9 || cy > 9 || !this.matrix[cy][cx].free) return false
            }
            return true
        } else {
            return false
        }
    }

    randomShips() {
        for (let size = 4; size >= 1; size--) {
            for (let n = 0; n < 5 - size; n++) {
                const direction = size == 1 ? false : ['col', 'row'][Math.round(Math.random())]
                const dx = direction === 'row'
                const dy = direction === 'col'
                let correct = false
                while (!correct) {
                    const x = Math.round(Math.random() * (9-size*dx))
                    const y = Math.round(Math.random() * (9-size*dy))
                    const result = this.addShip(new Ship(size, direction, x, y))
                    if (result == false) {
                        correct = true
                    }
                }
            }
        }
    }

    addShip(ship) {
        let message = 'Ошибка'
        const x = ship.startX
        const y = ship.startY
        if (this.#canBePlaced(x, y, ship.direction, ship.size)) {
            const dx = ship.direction === 'row'
            const dy = ship.direction === 'col'
            const dxy = ship.size === 1
            for (let i = 0; i < ship.size; i++) {
                const cx = x + dx * i
                const cy = y + dy * i
                this.matrix[cy][cx].ship = ship
                this.matrix[cy][cx].free = false
            }
            for (let cy = y - 1; cy < y + 1 + ship.size * dy + dx + dxy; cy++) {
                for (let cx = x - 1; cx < x + 1 + ship.size * dx + dy + dxy; cx++) {
                    if (this.#inField(cx, cy)) this.matrix[cy][cx].free = false
                }
            }
            message = false
        } else {
            message = 'Вы не можете поставить здесь корабль'
        }
        return message
    }

    addShot(x, y) {
        let message = false
        if (this.#inField(x, y) && !this.matrix[y][x].shot) {
            if (this.matrix[y][x].ship != null) {
                this.matrix[y][x].ship.size -= 1;
                message = this.shotOutput.shot
                if (this.matrix[y][x].ship.size == 0) {
                    message = this.shotOutput.kill
                    this.#shipsLeft -= 1
                    this.matrix[y][x].ship.killed = true
                    const { startX, startY, direction, maxSize } = this.matrix[y][x].ship
                    const dx = direction === 'row'
                    const dy = direction === 'col'
                    const dxy = maxSize === 1
                    for (let cy = startY - 1; cy < startY + 1 + maxSize * dy + dx + dxy; cy++) {
                        for (let cx = startX - 1; cx < startX + 1 + maxSize * dx + dy + dxy; cx++) {
                            if (this.#inField(cx, cy)) {
                                this.matrix[cy][cx].shot = true
                            }
                        }
                    }
                    if (this.#shipsLeft <= 0) {
                        this.defeat = true
                    }
                }
            } else {
                message = this.shotOutput.miss
            }
            this.matrix[y][x].shot = true
        }
        return message
    }

}

module.exports = Battlefield
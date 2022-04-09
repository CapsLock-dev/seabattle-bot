const { MessageEmbed, MessageAttachment } = require('discord.js')
const fs = require('fs')
const { createCanvas, loadImage } = require('canvas')

class Screen {
    markers = {
        ship: 'ship.png',
        blank: 'blank.png',
        shot: 'shot.png',
        sunkenShip: 'sunkenShip.png'
    }
    #channel
    #client

    constructor(channel, client) {
        this.#channel = channel
        this.#client = client
        this.#start()
    }

    async #start() {
        this.sendMsg('Координаты вводите в формате {буква}{номер}-{направление}.' +
                     'Направление: горизонтальное=г, вертикальное=в\nПример: а1-г')
        this.sendMsg('Список доступных команд:\n`leave` - покинуть игру\n`random` - расставить корабли случайно')

        const canvas = createCanvas(550, 550)
        const context = canvas.getContext('2d');
        const image = await loadImage('./images/field.png')
        context.drawImage(image, 0, 0, 550, 550)
        const matrix = new MessageAttachment(canvas.toBuffer(), 'matrix.png')
        const emb = await this.#embed(matrix, 'Ваше поле', 'Укажите координаты четырехпалубного корабля\nПример: а1-г')
        this.sendMsg(emb)
    }

    #choseMarker(item) {
        const markers = this.markers
        let marker = ''
        if (item.ship && item.shot) {
            marker = markers.sunkenShip
        } else if (item.ship && !item.shot) {
            marker = markers.ship
        } else if (!item.ship && item.shot) {
            marker = markers.shot
        } else {
            marker = markers.blank
        }
        return marker
    }

    #markersCoords(matrix, isEnemy = false) {
        const array = []
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const cell = matrix[y][x]
                array.push({
                    marker: this.#choseMarker(cell),
                    x: cell.x,
                    y: cell.y
                })
            } 
        }
        return array.filter(i => i.marker != this.markers.blank && (!isEnemy || (isEnemy && i.marker != this.markers.ship)))
    }
    
    async #drawMatrix(matrix, isEnemy = false) {
        const field = await loadImage('./images/field.png')
        const markers = this.#markersCoords(matrix, isEnemy)
        const canvas = createCanvas(550, 550)
        const context = canvas.getContext('2d');
        context.drawImage(field, 0, 0, 550, 550)
        for (let i=0; i<markers.length; i++) {
            const { marker, x, y } = markers[i]
            const image = await loadImage('./images/' + marker)
            context.drawImage(image, x*50+50, y*50+50, 50, 50)
        }
        return new MessageAttachment(canvas.toBuffer(), 'matrix.png')
    }

    async #embed(matrix, fieldOwner, description) {
        const app = await this.#client.application.fetch()
        const emb = new MessageEmbed()
            .setTimestamp()
            .setFooter({ text: `Made by: ${app.owner.username}:${app.owner.discriminator}`, iconURL: app.owner.avatarURL() })
            .setColor('#06cc9e')
            .setDescription(description)
            .setTitle('Морской бой | ' + fieldOwner)
            .setImage('attachment://matrix.png')
        return {embeds: [emb], files: [matrix]}
    }

    async sendMsg(msg) {
        await this.#channel.send(msg)
    }

    async sendMatrix(matrix, fieldOwner, description) {
        const isEnemy = fieldOwner.includes('Ваше') ? false : true
        const matrix1 = await this.#drawMatrix(matrix, isEnemy)
        const emb = await this.#embed(matrix1, fieldOwner, description)
        await this.sendMsg(emb)
    }
}

module.exports = Screen
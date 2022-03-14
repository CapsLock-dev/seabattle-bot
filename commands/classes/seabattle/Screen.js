const { MessageEmbed, MessageAttachment } = require('discord.js')
const fs = require('fs')
const { createCanvas, loadImage } = require('canvas')

class Screen {
    channel = null
    message = null
    battleMsg = null
    markers = {
        ship: 'ship.png',
        blank: 'blank.png',
        shot: 'shot.png',
        sunkenShip: 'sunkenShip.png'
    }

    constructor(channel, client) {
        this.channel = channel
        this.client = client
        this.start()
    }

    async start() {
        this.sendMsg('Координаты вводите в формате {буква}{номер}-{направление}. Направление: горизонтальное=г, вертикальное=в')
        this.sendMsg('>Пример: а1-г')
        this.sendMsg('Чтобы расставить корабли рандомно введите: рандом')
        const canvas = createCanvas(550, 550)
        const context = canvas.getContext('2d');
        const image = await loadImage('./images/field.png')
        context.drawImage(image, 0, 0, 550, 550)
        const matrix = new MessageAttachment(canvas.toBuffer(), 'matrix.png')
        this.sendMatrix(matrix, 'Подготовка', 'Ваше поле', true)
        this.sendMsg('Укажите координаты четырехпалубного корабля')
    }

    choseMarker(item) {
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

    markerCoords(matrix, isEnemy = false) {
        const array = []
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const cell = matrix[y][x]
                const item = {
                    marker: this.choseMarker(cell),
                    x: cell.x,
                    y: cell.y
                }
                let filter = item.marker != this.markers.blank
                if (isEnemy) {
                    filter = item.marker != this.markers.blank && item.marker != this.markers.ship
                }
                if (filter) array.push(item)
            }
        }
        return array
    }
    
    async drawMatrix(matrix, isEnemy = false) {
        const field = await loadImage('./images/field.png')
        const markers = this.markerCoords(matrix, isEnemy)
        const canvas = createCanvas(550, 550)
        const context = canvas.getContext('2d');
        context.fillStyle = '#000001';
        context.fillRect(0, 0, 550, 550);
        context.drawImage(field, 0, 0, 550, 550)
        for (let i=0; i<markers.length; i++) {
            const { marker, x, y } = markers[i]
            const image = await loadImage('./images/' + marker)
            context.drawImage(image, x*50+50, y*50+50, 50, 50)
        }
        return new MessageAttachment(canvas.toBuffer(), 'matrix.png')
    }

    async embed(matrix, gameState, fieldOwner) {
        const app = await this.client.application.fetch()
        const emb = new MessageEmbed()
            .setTimestamp()
            .setFooter({ text: `Made by: ${app.owner.username}:${app.owner.discriminator}`, iconURL: app.owner.avatarURL() })
            .setColor('#06cc9e')
            .setDescription('Info: ' + gameState)
            .setTitle('Морской бой | ' + fieldOwner)
            .setImage('attachment://matrix.png')
        return {embeds: [emb], files: [matrix]}
    }

    sendMsg(msg) {
        this.channel.send(msg)
    }

    async sendMatrix(matrix, gameState, fieldOwner, force=false) {
        let isEnemy = false
        if (!fieldOwner.includes('Ваше')) isEnemy = true
        let emb
        if (!force) {
            matrix = await this.drawMatrix(matrix, isEnemy)
        }
        emb = await this.embed(matrix, gameState, fieldOwner)
        this.channel.send(emb)
    }
}

module.exports = Screen
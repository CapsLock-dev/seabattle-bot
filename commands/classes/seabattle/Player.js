class Player {
    /**
     * @param {Battlefield} battlefield 
     */
    ready = false
    constructor(user, screen, battlefield) {
        this.user = user
        this.screen = screen
        this.battlefield = battlefield
    }
}

module.exports = Player
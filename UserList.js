class UserList {
    #users
    constructor() {
        this.#users = []
    }
    push(...user) {
        if (this.#users.includes(user)) return false
        user.forEach(el => this.#users.push(el))
        return true
    }
    pop() {
        return this.#users.pop()
    }
    removeById(id) {
        const index = this.#users.indexOf(this.findById(id))
        this.#users.splice(index, 1)
    }
    findById(id) {
        return this.#users.find((user) => user.id === id)
    }
    length() {
        return this.#users.length
    }
    
}
module.exports = UserList
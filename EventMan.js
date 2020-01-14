const PromiseOrphanage = require("./PromiseOrphanage")

/**
 *  Event Man is a event emitter which support async/sync operation, and is flexiable to customize how to the wait async listeners to finished.
 */
class EventMan {
  constructor() {
    this.events = {}
    this.PromiseOrphanageCollection = {}
    this.lastSymbol = null
    this.thisArg = undefined
  }

  /**
   * create if there is not function array for the event.
   * @param {String} eventName event name
   */
  ensureEventListenerArray(eventName) {
    if (typeof eventName !== "string") throw TypeError("Invalid event name. Should be string.")
    if (!this.events[eventName]) this.events[eventName] = []
  }

  /**
   * listening to an event.
   * @param {String|Array} eventNames event's name to listening
   * @param {Function|Array} funcs callback
   */
  on(eventNames, funcs) {
    if (!eventNames) throw new ReferenceError("Inaccessible event name.")
    if (!funcs) throw new ReferenceError("Inaccessible callback.")

    if (typeof eventNames === "string") eventNames = [eventNames]
    if (typeof funcs === "function") funcs = [funcs]

    if (typeof eventNames[Symbol.iterator] !== "function") throw new TypeError("Invalid event name.")
    if (typeof funcs[Symbol.iterator] !== "function") throw new TypeError("Invalid callback.")
    for (let func of funcs) if (typeof func !== "function") throw new TypeError("Found invalid callback.")

    for (let name of eventNames) {
      this.ensureEventListenerArray(name)
      for (let func of funcs) this.events[name].push(func)
    }
  }

  /**
   * emit an event
   * @param {String} eventName event name
   * @param  {...any} args arguments pass to the listeners
   * @return {EventMan} return EventMan instance itself
   */
  emit(eventName, ...args) {
    if (typeof eventName !== "string") throw new TypeError("Invalid event name. Should be string")
    let promises = []
    let funcs = this.events[eventName]
    if (!funcs) funcs = []
    for (let func of funcs) promises.push(func.apply(this.thisArg === undefined ? this : this.thisArg, args))
    let orph = new PromiseOrphanage(promises)
    this.PromiseOrphanageCollection[orph.symbol] = orph
    this.lastSymbol = orph.symbol
    return this
  }

  /**
   * Get PromiseOrphanage by symbol. If symbol is not passed, get last created PromiseOrphanage
   * @param {Symbol} symbol symbol as index to get PromiseOrphanage, default to the last symbol of the last created PromiseOrphanage
   * @return {PromiseOrphanage|undefined} return
   */
  getPromiseOrphanage(symbol) {
    if (symbol && typeof symbol !== "symbol") throw TypeError("Invalid symbol.")
    symbol = symbol || this.lastSymbol
    let orph = this.PromiseOrphanageCollection[symbol]
    return orph
  }

  /**
   * remove and return PromiseOrphanage
   * @param {Symbol} symbol symbol as index to delete PromiseOrphanage, default to the last symbol of the last created PromiseOrphanage
   * @return return the remove PromiseOrphanage
   */
  removePromiseOrphanage(symbol) {
    if (symbol && typeof symbol !== "symbol") throw TypeError("Invalid symbol.")
    symbol = symbol || this.lastSymbol
    let orph = this.PromiseOrphanageCollection[symbol]
    delete this.PromiseOrphanageCollection[symbol]
    if (this.lastSymbol === symbol) this.lastSymbol = null
    return orph
  }

  /**
   * Get current PromiseOrphanage(Access by lastSymbol), if not existed, throw ReferenceError.
   */
  get currentPromiseOrphanage() {
    let orph = this.getPromiseOrphanage()
    if (!orph)
      throw ReferenceError("Failed to get last PromiseOrphanage. Make sure it's not clear or han't call .once before.")
    return orph
  }

  /**
   * Return a Promise use to await until all async listeners is finished successfully.
   * And remove the listeners' Promise recorded in this instance.
   */
  get once() {
    let orph = this.currentPromiseOrphanage
    this.removePromiseOrphanage()
    return orph.once
  }

  /**
   * Return a Promise use to await until all async listeners is finished successfully
   */
  get all() {
    return this.currentPromiseOrphanage.all
  }

  /**
   * Return a Promise use to await until one of the async listeners is finished successfully.
   * Reject if all listeners failed.
   */
  get any() {
    return this.currentPromiseOrphanage.any
  }

  /**
   * Return a Promise use to await until one of the async listeners is finished successfully or unsuccessfully
   */
  get race() {
    return this.currentPromiseOrphanage.race
  }

  /**
   * Return a Promise use to await until all of the async listeners is finished regardless successfully or unsuccessfully
   * Will always resolved and resolve with an array indicate the status of all async listener execution,
   * and the value resolved with or Error rejected with
   */
  get allFinish() {
    return this.currentPromiseOrphanage.allFinish
  }

  /**
   * clear a set of Promises(PromiseOrphanage) by sybmol.
   * if symbol is not passed, will remove the Promises created by the last call of emit function.
   * @param {Symbol|undefined} symbol symbol use to find the target promises, default to the last created symbol.
   * @return {PromiseOrphanage|undefined} PromiseOrphanage which contains corresponding promises, or undefined if not exists.
   */
  clear(symbol) {
    return this.removePromiseOrphanage(symbol)
  }

  /**
   * Clear all Promises record.
   */
  clearAll() {
    let allPromises = []
    for (let symbol of Object.getOwnPropertySymbols(this.PromiseOrphanageCollection))
      allPromises = allPromises.concat(this.PromiseOrphanageCollection[symbol].shiveringPromises)
    this.lastSymbol = null
    this.PromiseOrphanageCollection = {}
    return new PromiseOrphanage(allPromises)
  }

  /**
   * clear all listeners that listening on the event
   * @param {string} name event name
   */
  clearListener(name) {
    delete this.events[name]
  }

  /**
   * clear all listeners
   */
  clearAllListener() {
    this.events = {}
  }
}

module.exports = EventMan

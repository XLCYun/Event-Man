const type = require("../../type/type")
const WmErrorUtil = require("../../WMError/WmErrorUtil")
const Code = require("../../api/responseCode/code")
const PromiseOrphanage = require("./PromiseOrphanage")

/**
 * 支持 async 异步函数的事件模型类
 */
class EventMan {
  constructor() {
    this.events = {}
    this.PromiseOrphanageCollection = {}
  }

  ensureEvent(eventName) {
    if (!events[eventName]) this.events[eventName] = []
  }

  /**
   * 监听某个事件
   * @param {String} eventName 监听的事件名
   * @param {Function} func 调用的函数
   */
  on(eventName, func) {
    if (type.isNotString(eventName))
      throw new WmErrorUtil.generate(Code.ARGUMENT_ERROR, "监听事件失败，事件名称类型非法")
    if (type.isNotFunction(func))
      throw new WmErrorUtil.generate(Code.ARGUMENT_ERROR, "监听事件失败，第二个参数应为函数")
    this.ensureEvent(eventName)
    this.events[eventName].push(func)
  }

  /**
   * 发出的事件名，传递给监听函数的参数
   * @param {String} eventName 发出的事件名
   * @param  {...any} args 传递给监听函数的参数
   */
  async emit(eventName, ...args) {
    if (util.type.isNotAccessible(this.events[eventName])) return
    let funcs = this.events[eventName]
    for (let f of funcs) await funcs.apply(this, args)
  }

  async emitOnce(eventName, ...args) {}

  async emitAll(eventName, ...args){}

  async emitAny(eventName, ...args){}

  async emitRace(eventName, ...args){}

  async emitAllFinish(eventName, ...args){}
}

module.exports = EventMan

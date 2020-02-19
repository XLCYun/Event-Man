"use strict"

let promiseReflect = require("multiple-promises-reflect")

/**
 * Containing and managing promises.
 */
class PromiseOrphanage {
  constructor(promises) {
    this.symbol = Symbol()
    this.shiveringPromises = []
    if (promises)
      if (typeof promises[Symbol.iterator] === "function") {
        for (let prom of promises) if (Promise.resolve(prom) === prom) this.shiveringPromises.push(prom)
      } else throw new Error("Passed promises array is not iterable")
  }

  /** is all promises handled. */
  get isRescued() {
    return this.shiveringPromises.length === 0
  }

  /** like once, return a promise which will be resolved when all promise is resolved,
   * and set rescue to true */
  rescue() {
    return this.once
  }

  /**
   * use Promise.race to implement .any function.
   * Recursively call itself until get a resolved promise
   * or the promises array is empty.
   * @param {Array} promises Promises to race
   * @param {Array} errors Collected error so far
   */
  recursiveRaceUntilResolved(promises, errors) {
    return new Promise((resolve, reject) => {
      if (promises.length === 0) reject(errors)
      Promise.race(promises).then(res => {
        if (res.status === "resolved") resolve(res.data)
        else {
          errors.push(res)
          let index = promises.findIndex(e => e._reflect_index === res.index)
          if (index !== -1) promises.splice(index, 1)
          this.recursiveRaceUntilResolved(promises, errors)
            .then(resolve)
            .catch(reject)
        }
      })
    })
  }

  /**
   * return a promise which will be resolved when all promises resolved
   * if no promise, return Promise.resolve()
   */
  get all() {
    if (this.isRescued) return Promise.resolve()
    return Promise.all(this.shiveringPromises)
  }

  /**
   * return a Promise which will be resolved when all promised is resolved.
   * and set rescued to true.
   */
  get once() {
    if (this.isRescued) return Promise.resolve()
    let tmp = this.shiveringPromises
    this.shiveringPromises = []
    return Promise.all(tmp)
  }

  /**
   * Like Promise.race. return a Promise which will be resolved or rejected
   * when one of the promises is resolved or rejected.
   * If there is not promised, it will return a forever pending promise.
   */
  get race() {
    return Promise.race(this.shiveringPromises)
  }

  /**
   * Return a Promise which is resolved when one of the promises is resolved.
   * if all rejected, returned Promised will be rejected.
   * if no promises, retunred rejected Promised.
   */
  get any() {
    if (this.isRescued) return Promise.reject()
    // resolve first non-promise element
    for (let pro of this.shiveringPromises) if (Promise.resolve(pro) !== pro) return Promise.resolve(pro)

    let anyPromiseArray = promiseReflect(this.shiveringPromises, true)
    return this.recursiveRaceUntilResolved(anyPromiseArray, [])
  }

  /**
   * return a Promise which will be resolve and only resolve
   * when all promises are resolved or rejected.
   * Returned promised will be resolved with a array contained
   * the result and Error that promises resolved or rejected with.
   */
  get allFinish() {
    if (this.isRescued) return Promise.resolve([])
    return Promise.all(promiseReflect(this.shiveringPromises)).then(values =>
      values.sort((r1, r2) => r1.index - r2.index).map(e => (e.status === "resolved" ? e.data : e.error))
    )
  }
}

module.exports = PromiseOrphanage

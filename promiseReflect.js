"use strict"

/**
 * return a promise which will only resolved, and resolve with a object
 * indicated the promise's status(resolved or rejected, resolved value or rejected error,
 * and index of the promise it attached)
 * @param {Promise} promise Promise
 * @param {Number} index index of the promise in its array
 * @param {Boolean} injectReflectIndexToPromiseItSelfAsWell when true, index will be inject to the return promised as property _reflect_index
 */
function reflectOne(promise, index = 0, injectReflectIndexToPromiseItSelfAsWell = false) {
  if (Promise.resolve(promise) !== promise) throw Error("invalid argument, not promise object.")
  let res = promise
    .then(data => {
      return { data: data, status: "resolved", index: index }
    })
    .catch(error => {
      return { error: error, status: "rejected", index: index }
    })
  if (injectReflectIndexToPromiseItSelfAsWell === true) res._reflect_index = index
  return res
}

/**
 * return a promise which will only resolved, and resolve with a object
 * indicated the promise's status(resolved or rejcted, resolved value or rejected error,
 * and index of the promise in the passed array).
 * @param {Promise|Array} promise Promise or array of Promises to reflect
 * @param {Boolean} injectReflectIndexToPromiseItSelfAsWell when true, index will be inject to the return promised as property _reflect_index
 */
function reflect(promise, injectReflectIndexToPromiseItSelfAsWell = false) {
  if (promise) {
    if (typeof promise[Symbol.iterator] === "function") {
      let index = 0
      let reflectPromises = []
      for (let pro of promise)
        reflectPromises.push(reflectOne(pro, index++, injectReflectIndexToPromiseItSelfAsWell))
      return reflectPromises
    } else return reflectOne(promise, 0)
  } else throw Error("invalid promise arguemnt to reflect. ")
}

module.exports = reflect

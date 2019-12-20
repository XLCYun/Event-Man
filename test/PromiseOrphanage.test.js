const mocha = require("mocha")
const assert = require("assert")
const PromiseOrphanage = require("../PromiseOrphanage")

let rejectedPromise = Promise.reject()
let resolvePromise = Promise.resolve()
let rejectedWithError = Promise.reject(new Error("rejected"))
let resolvedWithValue = Promise.resolve("resolved")
let foreverPendingPromise = Promise.race([])

let rejectedPromiseArray = [rejectedWithError, rejectedPromise]
let resolvedPromiseArray = [resolvedWithValue, resolvePromise]
let rejectedAndResolvedArray = [rejectedWithError, rejectedPromise, resolvedWithValue, resolvePromise]
let resolvedAndRejectedArray = [resolvedWithValue, resolvePromise, rejectedWithError, rejectedPromise]

function resolveMS(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(ms), ms)
  })
}

function rejectMS(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(ms), ms)
  })
}

describe("allRescue", () => {
  it("constructor", async function() {
    var orph

    try {
      orph = new PromiseOrphanage([])
    } catch (e) {
      assert.fail("should not throw error")
    }

    try {
      orph = new PromiseOrphanage()
    } catch (e) {
      assert.fail("should not throw error")
    }

    try {
      orph = new PromiseOrphanage([1, 2, rejectedPromise, resolvePromise])
    } catch (e) {
      assert.fail("should not throw error")
    }

    assert.equal(orph.shiveringPromises.length, 2)
    try {
      orph = new PromiseOrphanage([1, 2, rejectedWithError, resolvedWithValue, foreverPendingPromise])
    } catch (e) {
      assert.fail("should not throw error")
    }
    assert.equal(orph.shiveringPromises.length, 3)

    try {
      orph = new PromiseOrphanage([])
    } catch (e) {
      assert.fail("should not throw error")
    }
    assert.equal(orph.shiveringPromises.length, 0)

    try {
      orph = new PromiseOrphanage([1, 2, "342", Symbol(), new Error("")])
    } catch (e) {
      assert.fail("should not throw error")
    }
    assert.equal(orph.shiveringPromises.length, 0)

    let invalid = [Symbol(), 3, NaN, () => {}, "invalid", new Error("")]
    for (let i of invalid) {
      try {
        orph = new PromiseOrphanage(i)
        assert.fail("should throw error, and not be executed")
      } catch (e) {}
    }
  })
})
describe("all", () => {
  it("all function: rejected", async () => {
    try {
      new PromiseOrphanage([rejectedPromise, rejectedWithError])
      assert.fail("should throw error")
    } catch (e) {}

    try {
      new PromiseOrphanage([rejectedPromise])
      assert.fail("should throw error")
    } catch (e) {}

    try {
      new PromiseOrphanage([rejectedWithError])
      assert.fail("should throw error")
    } catch (e) {}

    try {
      new PromiseOrphanage([resolvePromise, rejectedWithError])
      assert.fail("should throw error")
    } catch (e) {}

    try {
      new PromiseOrphanage([resolvedWithValue, rejectedPromise])
      assert.fail("should throw error")
    } catch (e) {}

    try {
      new PromiseOrphanage([])
      assert.fail("should throw error")
    } catch (e) {}
  })

  it("all function: all resolved", async function() {
    let orph = new PromiseOrphanage([resolvePromise, resolvedWithValue])
    let res = await orph.all
    assert.equal(res.length, 2)
    assert.equal(res[0], undefined)
    assert.equal(res[1], "resolved")

    orph = new PromiseOrphanage([
      resolvePromise,
      Promise.resolve([12, 34, Symbol()]),
      resolvedWithValue,
      resolveMS(100)
    ])
    res = await orph.all
    assert.equal(res.length, 4)
    assert.equal(res[0], undefined)
    assert.equal(res[1].length, 3)
    assert.equal(res[1][0], 12)
    assert.equal(res[1][1], 34)
    assert.ok(typeof res[1][2] === "symbol")
    assert.equal(res[2], "resolved")
    assert.equal(res[3], 100)

    orph = new PromiseOrphanage()
    res = await orph.all
    assert.equal(res, undefined)
  })
})

describe("rescue", function() {
  let orph
  this.beforeEach(function() {
    orph = new PromiseOrphanage([[resolvePromise, rejectedWithError, foreverPendingPromise]])
    orph.rescue
  })

  it("rescue behave like any", async function() {
    let rescuedOrph = new PromiseOrphanage([[resolvePromise, rejectedWithError, foreverPendingPromise]])
    try {
      await rescuedOrph
      assert.fail("should throw error")
    } catch (e) {}
    assert.equal(rescuedOrph.isRescued, true)
  })

  it("all rescued, call all", async () => {
    let all = await orph.all
    assert.equal(all, undefined)
  })

  it("all rescued, call any", async () => {
    try {
      let any = await orph.any
      assert.fail("should throw error")
    } catch (e) {}
  })

  it("all rescued, call race, forever pending", done => {
    setTimeout(() => {
      done()
    }, 1000)
    orph.race.then(e => assert.fail("should not be executed"))
  })

  it("all rescued, call once", async () => {
    let once = await orph.once
    assert.equal(once, undefined)
  })

  it("all rescued, call allFinish", async () => {
    let allFinish = await orph.allFinish
    assert.deepEqual(allFinish, [])
  })
})

describe("once", async () => {
  it("once, empty []", async () => {
    let orph = new PromiseOrphanage([])
    assert.equal(await orph.once, undefined)
    assert.ok(orph.isRescued)
  })

  it("once, rejected", async () => {
    try {
      var orph = new PromiseOrphanage([rejectedPromise, rejectedWithError])
      await orph.once
      assert.fail("should not be executed")
    } catch (e) {}
    assert.ok(orph.isRescued)
  })

  it("once, resolved", async () => {
    let orph = new PromiseOrphanage([resolvedWithValue, resolvePromise])
    assert.deepEqual(await orph.once, ["resolved", undefined])
    assert.ok(orph.isRescued)
  })

  it("once, resolved and rejected", async () => {
    try {
      var orph = new PromiseOrphanage([resolvedWithValue, resolvePromise, rejectedWithError])
      await orph.once
      assert.fail("should not be executed")
    } catch (e) {}
    assert.ok(orph.isRescued)
  })

  it("once, resolveMS 5 10 15", async () => {
    try {
      var orph = new PromiseOrphanage([resolveMS(5), resolveMS(10), resolveMS(15)])
      let res = await orph.once
      assert.deepEqual(res, [5, 10, 15])
    } catch (e) {}
    assert.ok(orph.isRescued)
  })
})

describe("race", function() {
  let rejectedOrph
  let resolvedOrph
  let rejAndResOrph
  let resAndRejOrph

  this.beforeEach(() => {
    rejectedOrph = new PromiseOrphanage(rejectedPromiseArray)
    resolvedOrph = new PromiseOrphanage(resolvedPromiseArray)
    rejAndResOrph = new PromiseOrphanage(rejectedAndResolvedArray)
    resAndRejOrph = new PromiseOrphanage(resolvedAndRejectedArray)
  })

  it("race, empty []", async function() {
    let orph = new PromiseOrphanage([])
    setTimeout(() => {
      done()
    }, 1000)
    orph.race.then(e => assert.fail("should not be executed"))
  })

  it("race, resolved", async function() {
    assert.equal(await resolvedOrph.race, "resolved")
  })

  it("race, rejected", async function() {
    try {
      await rejectedOrph.race
      assert.fail("should not be executed")
    } catch (e) {}
  })

  it("reace, reject and resolved", async function() {
    try {
      await rejAndResOrph.race
      assert.fail("should not be executed")
    } catch (e) {}
  })

  it("race, resolved and rejected", async function() {
    assert.equal(await resAndRejOrph.race, "resolved")
  })

  it("race, resolveMS 50 100 150", async function() {
    let orph = new PromiseOrphanage([resolveMS(50), resolveMS(100), resolveMS(150)])
    assert.equal(await orph.race, 50)
  })

  it("race, resolveMS 50 100 150 rejectMS 20", async function() {
    let orph = new PromiseOrphanage([resolveMS(50), resolveMS(100), resolveMS(150), rejectMS(20)])
    try {
      await orph.race
    } catch (e) {
      assert.equal(e, 20)
    }
  })
})

describe("any", function() {
  let rejectedOrph
  let resolvedOrph
  let rejAndResOrph
  let resAndRejOrph

  this.beforeEach(() => {
    rejectedOrph = new PromiseOrphanage(rejectedPromiseArray)
    resolvedOrph = new PromiseOrphanage(resolvedPromiseArray)
    rejAndResOrph = new PromiseOrphanage(rejectedAndResolvedArray)
    resAndRejOrph = new PromiseOrphanage(resolvedAndRejectedArray)
  })

  it("any, empty []", async function() {
    try {
      let orph = new PromiseOrphanage([])
      await orph.any
      assert.fail("should not be executed")
    } catch (e) {}
  })

  it("any, resolved", async function() {
    assert.equal(await resolvedOrph.any, "resolved")
  })

  it("any, rejected", async function() {
    try {
      await rejectedOrph.any
      assert.fail("should not be executed")
    } catch (e) {}
  })

  it("any, inject promise, resolve first non-promise element", async function() {
    let orph = new PromiseOrphanage([resolvePromise, 34, rejectedPromise])
    orph.shiveringPromises.push(34)
    assert.equal(await orph.any, 34)
  })

  it("any, reject and resolved", async function() {
    assert.equal(await rejAndResOrph.any, "resolved")
  })

  it("any, resolved and rejected", async function() {
    assert.equal(await resAndRejOrph.any, "resolved")
  })

  it("any, resolveMS 50 100 150", async function() {
    let orph = new PromiseOrphanage([resolveMS(50), resolveMS(100), resolveMS(150)])
    assert.equal(await orph.any, 50)
  })

  it("any, resolveMS 50 100 150 rejectMS 20", async function() {
    let orph = new PromiseOrphanage([resolveMS(50), resolveMS(100), resolveMS(150), rejectMS(20)])
    assert.equal(await orph.any, 50)
  })
})

describe("allFinish", function() {
  let rejectedOrph
  let resolvedOrph
  let rejAndResOrph
  let resAndRejOrph

  this.beforeEach(() => {
    rejectedOrph = new PromiseOrphanage(rejectedPromiseArray)
    resolvedOrph = new PromiseOrphanage(resolvedPromiseArray)
    rejAndResOrph = new PromiseOrphanage(rejectedAndResolvedArray)
    resAndRejOrph = new PromiseOrphanage(resolvedAndRejectedArray)
  })

  it("allFinish, empty []", async function() {
    let orph = new PromiseOrphanage([])
    assert.deepEqual(await orph.allFinish, [])
  })

  it("allFinish, resolved", async function() {
    assert.deepEqual(await resolvedOrph.allFinish, ["resolved", undefined])
  })

  it("allFinish, rejected", async function() {
    let res = await rejectedOrph.allFinish
    assert.ok(res[0] instanceof Error)
    assert.ok(res[1] === undefined)
  })

  it("allFinish, reject and resolved", async function() {
    let res = await rejAndResOrph.allFinish
    assert.ok(res[0] instanceof Error)
    assert.ok(res[1] === undefined)
    assert.ok(res[2] === "resolved")
    assert.ok(res[3] === undefined)
  })

  it("allFinish, resolved and rejected", async function() {
    let res = await resAndRejOrph.allFinish
    assert.ok(res[0] === "resolved")
    assert.ok(res[1] === undefined)
    assert.ok(res[2] instanceof Error)
    assert.ok(res[3] === undefined)
  })
})

const mocha = require("mocha")
const assert = require("assert")
const EventMan = require("../EventMan")
const PromiseOrphanage = require("../PromiseOrphanage")

const notStringValue = [Symbol(), true, 3.4, () => {}, new Object(), null, undefined]
const mixedTypeValue = [Symbol(), true, 3.4, () => {}, new Object(), null, undefined, "", NaN, new Date()]

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

describe("event man", function() {
  describe("ensureEventListenerArray", function() {
    var event
    this.beforeEach(() => {
      event = new EventMan()
    })

    it("not existed event name", () => {
      event.ensureEventListenerArray("g")
      assert.ok(!!event.events["g"])
    })

    it("empty event name is ok", () => {
      event.ensureEventListenerArray("")
      assert.ok(!!event.events[""])
    })

    it("existed event name", () => {
      event.ensureEventListenerArray("g")
      assert.ok(Array.isArray(event.events["g"]))

      event.events["g"].push(() => {})
      event.events["g"].push(() => {})

      event.ensureEventListenerArray("g")
      assert.equal(event.events["g"].length, 2)
    })

    const wrapper = function(i) {
      return function() {
        try {
          event.ensureEventListenerArray(i)
          assert.fail("should not be executed")
        } catch (e) {}
      }
    }
    for (let i of notStringValue) it(`illegal event name, ${typeof i}`, wrapper(i))
  })

  describe("on", function() {
    var event
    this.beforeEach(() => {
      event = new EventMan()
    })

    it("on: no argument", () => {
      try {
        event.on()
        assert.fail("should not be executed")
      } catch (e) {
        assert.ok(e instanceof ReferenceError)
      }
    })

    it("on: one argument", () => {
      for (let i of notStringValue)
        try {
          event.on(i)
          assert.fail("should not be executed")
        } catch (e) {
          assert.ok(e instanceof ReferenceError)
        }
    })

    it("on: two argument, invalid both", () => {
      for (let i of notStringValue)
        try {
          event.on(i, i)
          assert.fail("should not be executed")
        } catch (e) {}
    })

    it("on: two argument, valid event name, invalid funcs", () => {
      for (let i of notStringValue)
        for (let name of ["event", ["event", "event"]])
          try {
            event.on(name, i)
            assert.fail("should not be executed")
          } catch (e) {}
    })

    it("on: two argument, valid funcs, invalid event name", () => {
      for (let i of notStringValue)
        for (let funcs of [() => {}, [() => {}, () => {}]])
          try {
            event.on(i, funcs)
            assert.fail("should not be executed")
          } catch (e) {}
    })

    it("on: one event, one func", () => {
      const func = () => {}
      event.on("event", func)
      assert.equal(event.events["event"].length, 1)
      assert.equal(event.events["event"][0], func)
    })

    it("on: one event, multiple func", () => {
      const funcs = [() => {}, () => {}, () => {}, Array.isArray]
      event.on("event", funcs)
      assert.equal(event.events["event"].length, funcs.length)
      assert.deepEqual(event.events["event"], funcs)
    })

    it("on: one func, multiple event", () => {
      const func = () => {}
      for (let i = 0; i < 100; i++) {
        let eventName = `event${i}`
        event.on(eventName, func)
      }
      for (let i = 0; i < 100; i++) {
        let eventName = `event${i}`
        assert.equal(event.events[eventName].length, 1)
        assert.equal(event.events[eventName][0], func)
      }
    })

    it("on: multiple func, multiple event", () => {
      let eventNames = []
      let funcs = []
      for (let i = 0; i < 100; i++) {
        eventNames.push(`event${i}`)
        funcs.push(() => {})
      }
      event.on(eventNames, funcs)
      for (let i = 0; i < 100; i++) {
        let eventName = `event${i}`
        assert.equal(event.events[eventName].length, 100)
        assert.deepEqual(event.events[eventName], funcs)
      }
    })
  })

  describe("getPromiseOrphanage", function() {
    let event
    let existedOrph
    this.beforeEach(() => {
      event = new EventMan()
      existedOrph = new PromiseOrphanage()
      event.lastSymbol = existedOrph.symbol
      event.PromiseOrphanageCollection[event.lastSymbol] = existedOrph
    })

    describe("arguemnt error", function() {
      it("no argument, no lastSymbol", () => {
        try {
          event.lastSymbol = null
          event.getPromiseOrphanage()
          assert.fail("should not be executed")
        } catch (e) {}
      })

      it("no argument, has lastSymbol", () => {
        let orph = event.getPromiseOrphanage()
        assert.equal(orph, existedOrph)
      })

      const wrapper = function(arg) {
        return function() {
          try {
            event.getPromiseOrphanage(arg)
            assert.fail("should not be executed")
          } catch (e) {}
        }
      }

      let invalidArgs = [].concat(notStringValue.filter(e => typeof e !== "symbol"))
      invalidArgs.push("string")
      for (let arg of invalidArgs) it("invalid argument, " + typeof arg, wrapper(arg))
    })

    describe("functionality", function() {
      it("valid argument, not exists", function() {
        let orph = event.getPromiseOrphanage(Symbol())
        assert.equal(orph, undefined)
      })

      it("valid argument, exists", function() {
        event.lastSymbol = null
        let orph = event.getPromiseOrphanage(existedOrph.symbol)
        assert.equal(orph, existedOrph)
      })
    })
  })

  describe("removePromiseOrphanage", function() {
    let event
    let existedOrph
    this.beforeEach(() => {
      event = new EventMan()
      existedOrph = new PromiseOrphanage()
      event.lastSymbol = existedOrph.symbol
      event.PromiseOrphanageCollection[event.lastSymbol] = existedOrph
    })

    describe("argument error", function() {
      let args = [].concat(mixedTypeValue.filter(e => typeof e !== "symbol"))
      const wrapper = function(arg) {
        return function() {
          try {
            event.removePromiseOrphanage(arg)
            assert.fail("should not be executed")
          } catch (e) {}
        }
      }
      for (let arg of args) it(`invalid argument: ${typeof arg}`, wrapper(arg))
    })

    describe("functionality", function() {
      it("no argument, no exists lastSymbol", function() {
        event.lastSymbol = null
        let res = event.removePromiseOrphanage()
        assert.equal(res, undefined)
        assert.equal(event.PromiseOrphanageCollection[existedOrph.symbol], existedOrph)
      })

      it("no argument, exists lastSymbol", function() {
        let res = event.removePromiseOrphanage()
        assert.equal(res, existedOrph)
        assert.equal(event.PromiseOrphanageCollection[existedOrph.symbol], undefined)
      })
    })
  })

  describe("currentPromiseOrphanage", function() {
    let event
    let existedOrph
    this.beforeEach(() => {
      event = new EventMan()
      existedOrph = new PromiseOrphanage()
      event.lastSymbol = existedOrph.symbol
      event.PromiseOrphanageCollection[event.lastSymbol] = existedOrph
    })

    describe("functionality", function() {
      it("no exists lastSymbol", function() {
        try {
          event.lastSymbol = null
          let res = event.currentPromiseOrphanage
          assert.fail("should not be executed")
        } catch (e) {}
      })

      it("exists lastSymbol", function() {
        let res = event.currentPromiseOrphanage
        assert.equal(res, existedOrph)
        assert.ok(event.PromiseOrphanageCollection[existedOrph.symbol] !== undefined)
      })
    })
  })

  describe("clear", function() {
    let event
    let existedOrph
    this.beforeEach(() => {
      event = new EventMan()
      existedOrph = new PromiseOrphanage()
      event.lastSymbol = existedOrph.symbol
      event.PromiseOrphanageCollection[event.lastSymbol] = existedOrph
    })

    describe("argument error", function() {
      let args = [].concat(mixedTypeValue.filter(e => typeof e !== "symbol"))
      const wrapper = function(arg) {
        return function() {
          try {
            event.clear(arg)
            assert.fail("should not be executed")
          } catch (e) {}
        }
      }
      for (let arg of args) it(`invalid argument: ${typeof arg}`, wrapper(arg))
    })

    describe("functionality", function() {
      it("no argument, no exists lastSymbol", function() {
        event.lastSymbol = null
        let res = event.clear()
        assert.equal(res, undefined)
        assert.equal(event.PromiseOrphanageCollection[existedOrph.symbol], existedOrph)
      })

      it("no argument, exists lastSymbol", function() {
        let res = event.clear()
        assert.equal(res, existedOrph)
        assert.equal(event.PromiseOrphanageCollection[existedOrph.symbol], undefined)
      })
    })
  })

  describe("clearAll", function() {
    it("no PromiseOrphanage", function() {
      let event = new EventMan()
      let res = event.clearAll()
      assert.deepEqual(event.PromiseOrphanageCollection, {})
      assert.equal(event.lastSymbol, null)
      assert.ok(res instanceof PromiseOrphanage)
      assert.equal(res.shiveringPromises.length, 0)
    })

    it("multiple PromiseOrphanage", function() {
      let event = new EventMan()
      let promises = []

      for (let i = 0; i < 1000; i++)
        for (let j = 0; j < 2; j++) promises.push(j === 1 ? Promise.resolve() : Promise.reject().catch(e => e))
      for (let i = 0; i < 10; i++) {
        let orph = new PromiseOrphanage(promises.slice(i * 100, i * 100 + 100))
        event.PromiseOrphanageCollection[orph.symbol] = orph
      }

      let res = event.clearAll()

      assert.deepEqual(event.PromiseOrphanageCollection, {})
      assert.equal(event.lastSymbol, null)
      assert.ok(res instanceof PromiseOrphanage)
      assert.equal(res.shiveringPromises.length, 1000)
      for (let i = 0; i < 1000; i++) assert.ok(res.shiveringPromises.indexOf(promises[i]) !== -1)
    })
  })

  describe("emit", function() {
    let event
    let existedOrph
    this.beforeEach(() => {
      event = new EventMan()
      existedOrph = new PromiseOrphanage()
      event.lastSymbol = existedOrph.symbol
      event.PromiseOrphanageCollection[event.lastSymbol] = existedOrph
    })

    describe("argument", function() {
      it("invalid event name", async function() {
        let invalid = mixedTypeValue.filter(e => typeof e !== "string")
        for (let i of invalid) {
          try {
            event.emit(i)
            assert.fail("should not be executed")
          } catch (e) {
            assert.ok(e instanceof TypeError)
          }
        }
      })

      it("return", async function() {
        let res = event.emit("")
        assert.equal(event, res)
      })

      it("not callback function event", async function() {
        assert.equal(event.emit("noListenerEvent").currentPromiseOrphanage.shiveringPromises.length, 0)
      })

      it("argument passing", async function() {
        const wrapper = function(number) {
          return function(...args) {
            assert.equal(args.length, number)
            for (let i = 0; i < number; i++) assert.equal(args[i], i + 1)
          }
        }
        let passArgs = []
        for (let i = 0; i < 100; i++) {
          let func = wrapper(i)
          if (i !== 0) passArgs.push(i)
          event.on(i.toString(), func)

          let args = [i.toString()].concat(passArgs)
          await event.emit.apply(event, args).once
        }
      })

      it("call function", async function() {
        let res = 0
        const wrapper = function(number, type) {
          return type === "sync"
            ? function() {
                res |= 1 << number
              }
            : async function() {
                res |= 1 << number
              }
        }
        for (let i = 0; i < 30; i++) event.on("callFunctionTest", wrapper(i, i % 2 === 0 ? "sync" : "async"))
        await event.emit("callFunctionTest").once
        assert.equal(res, 1073741823)
      })
    })
  })

  describe("once", function() {
    let event
    let existedOrph
    this.beforeEach(() => {
      event = new EventMan()
      existedOrph = new PromiseOrphanage()
      event.lastSymbol = existedOrph.symbol
      event.PromiseOrphanageCollection[event.lastSymbol] = existedOrph
    })

    it("no lastSymbol", function() {
      event.lastSymbol = null
      try {
        event.once
        assert.fail("should not be execute")
      } catch (e) {}
    })

    it("has lastSymbol, test remove PromiseOrphanage and lastSymbol", function() {
      let lastSymbol = event.lastSymbol
      assert.equal(event.PromiseOrphanageCollection[lastSymbol], existedOrph)
      event.once
      assert.equal(event.lastSymbol, null)
      assert.equal(event.PromiseOrphanageCollection[lastSymbol], undefined)
    })

    it("basic functionality which depend on PromiseOrphanage, resolved", async function() {
      let res50 = resolveMS(50)
      let res100 = resolveMS(100)
      let res150 = resolveMS(150)
      let res200 = resolveMS(200)
      existedOrph.shiveringPromises = [res50, res100, res150, res200]
      let res = await event.once
      assert.deepEqual(res, [50, 100, 150, 200])
    })

    it("basic functionality which depend on PromiseOrphanage, rejected", async function() {
      let res50 = resolveMS(50)
      let res100 = resolveMS(100)
      let rej150 = rejectMS(150)
      existedOrph.shiveringPromises = [res50, res100, rej150]
      try {
        await event.once
        assert.fail("should not be executed")
      } catch (e) {}
    })
  })
})

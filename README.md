# Event-Man

Event Man is a event emitter which support async/sync listener, and is flexiable to customize how to the wait async listeners to finished.

## Usage

```js
const EventMan = require("./EventMan.js")

let event = new EventMan()

event.on("finished", async name => {
  console.log("Finished by " + name)
})

await event.emit("finished", "Richard").once
```

Output:

```js
Finished by Richard
```

As we know, async is a syntactic sugar of Promise, async function will return a Promise. When you emit an event, Event Man will call all the async/sync listener, and save the returned Promises.

If you access the getters `all`, `any`, `race` or `allFinish`, rather than `once` which has a side effect of clearing all the returned Promises, you can retrieve the results multiple times:

```js
let allFinish = await event.emit("finished", "Richard").allFinish
...
let all = await event.all // retrieve using all getter.
```

You can call `clear()` to clear the Promises that created and stored in Event Man of the last time emition.

```js
await event.emit("clear")
event.clear()
// or
await event.emit('clear").clear()
```

Be aware that **`emit` function return the instance of Event Man itself.**

call `clearAll()` to clear all the Promises stored in Event Man.

```js
event.clearAll()
```

## once

```javascript
let result = await event.emit("finished").once
```

Return a Promise which works like [Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all).

It also will clear the Promises that created by the last time emition. Therefore is like:

```js
let result = await event.emit("finished").all
event.clear()
```

`result` will be a array containing the values of all async listeners return.

## all

Works like [Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all).

```javascript
let result = await event.emit("finished").all
```

## any

Works like [Promise.any](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any)

```javascript
let result = await event.emit("finished").any
```

## race

Works like [Promise.race](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)

```javascript
let result = await event.emit("finished").race
```

## allFinish

```javascript
let result = await event.emit("finished").allFinish
```

The Promise returned by `allFinish` will never be reject, but resolve with a array contains the results returned by async function(resolved value or rejected value), check on the example:

```js {cmd="node"}
const resolvedFunc = async function() {
  return "resolved function"
}
const rejectedFunc = async function() {
  throw new Error("rejected")
}

const EventMan = require("./EventMan.js")

async function allFinishExample() {
  let event = new EventMan()

  event.on("allFinish", resolvedFunc)
  event.on("allFinish", rejectedFunc)

  let res = await event.emit("allFinish").allFinish
  console.log(res)
}
allFinishExample()
```

Output:

```js
[ 'resolved function',
  Error: rejected
      at EventMan.rejectedFunc (E:\Project\EventMan\wziuqsp3w_code_chunk:5:9)
      at EventMan.emit (E:\Project\EventMan\EventMan.js:56:48)
      at allFinishExample (E:\Project\EventMan\wziuqsp3w_code_chunk:16:25)
      at Object. (E:\Project\EventMan\wziuqsp3w_code_chunk:19:1)
      at Module._compile (internal/modules/cjs/loader.js:776:30)
      at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)
      at Module.load (internal/modules/cjs/loader.js:653:32)
      at tryModuleLoad (internal/modules/cjs/loader.js:593:12)
      at Function.Module._load (internal/modules/cjs/loader.js:585:3)
      at Function.Module.runMain (internal/modules/cjs/loader.js:829:12) ]
```

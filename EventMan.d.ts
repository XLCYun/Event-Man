// Type definitions for EventMan
// Definitions by: XLCYun@foxmail.com <https://github.com/XLCYun>
import PromiseOrphanage = require("./PromiseOrphanage")

type AnyFunction = (...args: any[]) => any

declare class EventMan<BindThis = any, AsyncResolvedData = any, AsyncRejectedError = Error> {
  constructor()
  events: EventMan.EventRegisterRecord
  PromiseOrphanageCollection: EventMan.PromiseOrphanageCollection<AsyncResolvedData, AsyncRejectedError>
  lastSymbol: null | Symbol
  thisArgs: undefined | BindThis

  ensureEventListenerArray(eventName: string): void
  on(eventName: string, funcs: AnyFunction | AnyFunction[])
  emit(eventName: string, ...args: any[]): EventMan
  getPromiseOrphanage(symbol?: Symbol): PromiseOrphanage
  removePromiseOrphanage(symbol?: Symbol): PromiseOrphanage
  get currentPromiseOrphanage(): PromiseOrphanage
  get once(): Promise<AsyncResolvedData[]>
  get all(): Promise<AsyncResolvedData[]>
  get any(): Promise<AsyncResolvedData>
  get race(): Promise<AsyncResolvedData>
  get allFinish(): Promise<(AsyncResolvedData | AsyncRejectedError)[]>
  clear(symbol?: Symbol): PromiseOrphanage
  clearAll(): PromiseOrphanage
  clearListener(name: string): void
  clearAllListener(): void
}

declare namespace EventMan {
  export interface EventRegisterRecord {
    [index: string]: AnyFunction[]
  }
  export interface PromiseOrphanageCollection<AsyncResolvedData = any, AsyncThrowError = Error> {
    [index: Symbol]: PromiseOrphanage<AsyncResolvedData, AsyncThrowError>
  }
}

export = EventMan

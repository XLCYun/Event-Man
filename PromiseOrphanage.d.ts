// Type definitions for PromiseOrphanage
// Definitions by: XLCYun@foxmail.com <https://github.com/XLCYun>

/*~ This declaration specifies that the class constructor function
 *~ is the exported object from the file
 */

declare class PromiseOrphanage<ResolvedData = any, RejectedError = Error> {
  constructor(promises?: Iterable<PromiseLike<ResolvedData>>)
  symbol: Symbol
  shiveringPromises: Promise<ResolvedData>[]

  get isRescued(): boolean
  rescue(): Promise<ResolvedData[]>
  recursiveRaceUntilResolved(promises: Promise<ResolvedData>[], errors: Error[]): Promise<ResolvedData>
  get all(): Promise<ResolvedData[]>
  get once(): Promise<ResolvedData[]>
  get race(): Promise<ResolvedData>
  get any(): Promise<ResolvedData>
  get allFinish(): Promise<(ResolvedData | RejectedError)[]>
}

export = PromiseOrphanage
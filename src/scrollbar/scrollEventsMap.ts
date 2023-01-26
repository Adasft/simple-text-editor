import { ScrollEventTypes } from "../types/scrollbarTypes";

export default class ScrollEventsMap {
  private readonly _storage: Map<string, Array<Function>> = new Map();
  private readonly _emiterCanceled: Set<ScrollEventTypes> = new Set();

  public cancel(eventType: ScrollEventTypes): void {
    this._emiterCanceled.add(eventType)
  }

  public attach(eventType: ScrollEventTypes, listener: Function): void {
    if (typeof listener !== "function") return;

    if (!this._storage.has(eventType)) {
      this._storage.set(eventType, [listener]);
    } else {
      this._storage.get(eventType)?.push(listener);
    }
  }

  public emit(eventType: ScrollEventTypes, ...args: any): boolean {
    if (!this._storage.has(eventType)) return false;

    if (this._emiterCanceled.has(eventType)) {
      return this._emiterCanceled.delete(eventType)
    }

    this._storage.get(eventType)?.forEach((listener) => listener(...args));
    return true
  }

  public remove(eventType: ScrollEventTypes): boolean {
    if (typeof eventType !== "string") return false;
    return this._storage.delete(eventType);
  }
}

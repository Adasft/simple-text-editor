import { EventType, HTMLElementExtended } from "../types/domTypes";
import { hasOwn } from "../helpers";

export type BusyEvent = { type: EventType; target: HTMLElementExtended };

class DOMListenersManager {
  readonly #busyListeners: Array<BusyEvent> = [];
  readonly #domEventsMap: Map<HTMLElement | Document, Set<EventType>> = new Map();

  static #instance: DOMListenersManager;

  public static Manager(): DOMListenersManager {
    if (!DOMListenersManager.#instance) {
      DOMListenersManager.#instance = new DOMListenersManager();
    }
    return DOMListenersManager.#instance;
  }

  private constructor() {}

  handlerEvent<E extends keyof WindowEventMap>(ev: WindowEventMap[E]): void {
    const listener = this.#busyListeners.find(({ type }) => type === ev.type);
    const target: HTMLElementExtended = listener
      ? listener.target
      : (ev.target as HTMLElementExtended);
    const type: string = listener ? listener.type : ev.type;

    if (hasOwn(target, "__extendedInstance")) {
      const eventListeners = target.__extendedInstance.eventListeners;
      if (eventListeners) {
        const listener = eventListeners[type as EventType];
        listener && listener(ev);
      }
    }
  }

  public setEvent(target: HTMLElement | Document, type: EventType): void {
    if (!this.#domEventsMap.has(target)) {
      this.#domEventsMap.set(target, new Set());
    }

    const events = this.#domEventsMap.get(target);

    if (events?.has(type)) return;
    events?.add(type);
  }

  public getBusy(type: EventType): number {
    return this.#busyListeners.findIndex(({ type: t }) => t === type);
  }

  public occupyListener(listener: BusyEvent): void {
    if (
      this.#busyListeners.findIndex(({ type }) => type === listener.type) >= 0
    )
      return;
    this.#busyListeners.push(listener);
  }

  public vacateListener(type: EventType): void {
    this.#busyListeners.splice(this.getBusy(type), 1);
  }

  public hasEvent(
    target: HTMLObjectElement | Document,
    type: EventType
  ): boolean {
    const eventsMap = this.#domEventsMap.get(target);
    return !eventsMap ? false : eventsMap.has(type);
  }
}

const manager = DOMListenersManager.Manager();

export function on(
  target: HTMLObjectElement | Document,
  type: string,
  handler?: Function,
  options?: EventListenerOptions
) {
  if (/firefox|fxios/i.test(navigator.userAgent) && type === "mousewheel") {
    type = "DOMMouseScroll";
  }

  if (manager.hasEvent(target, type as EventType)) return;

  manager.setEvent(target, type as EventType);

  const listener = <E extends keyof WindowEventMap>(ev: WindowEventMap[E]) => {
    if (typeof handler === "function") handler(ev);
    manager.handlerEvent(ev);
  };

  if (target.addEventListener) {
    target.addEventListener(type, listener, options);
  }
}

export function occupyListener(listener: BusyEvent) {
  manager.occupyListener(listener);
}

export function vacateListener(type: EventType) {
  manager.vacateListener(type);
}

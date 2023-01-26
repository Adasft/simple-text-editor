import { defineProperty, hasOwn, isDef } from "../helpers";
import {
  HTMLElementExtended,
  ElementProps,
  ElementScrollbarsProps,
  EventTypesMap,
  AttrsMap,
} from "../types/domTypes";
import { on } from "./listeners";

class ElementExtended implements ElementExtended {
  public readonly element: HTMLElementExtended;
  public readonly children: Array<HTMLElementExtended>;
  public eventListeners: EventTypesMap | null = null;
  public scrollbars: ElementScrollbarsProps | null = null;

  constructor(
    tag: keyof HTMLElementTagNameMap,
    children?: Array<HTMLElementExtended>
  ) {
    this.element = document.createElement(tag) as HTMLElementExtended;
    this.children = children || [];

    defineProperty(this.element, "__extendedInstance", this, {
      writable: false,
    });
  }

  #inheritEventsToChildren(
    events: EventTypesMap,
    children: Array<HTMLElementExtended>
  ): void {
    for (const child of this.children) {
      const extendedInstance = child.__extendedInstance;
      let inheritEvents = { ...events };

      if (extendedInstance.hasEvents()) {
        inheritEvents = { ...events, ...extendedInstance.eventListeners };
      }

      extendedInstance.setEvents(inheritEvents);
      this.#inheritEventsToChildren(events, extendedInstance.children);
    }
  }

  public setEvents(events: EventTypesMap): void {
    this.eventListeners = events;
    Object.keys(events).forEach((type) => {
      on(document, type);
    });
  }

  public hasEvents(): boolean {
    return isDef(this.eventListeners);
  }

  public hasEvent(eventType: keyof WindowEventMap): boolean {
    return hasOwn(this.eventListeners as object, eventType);
  }

  public setAttrs(attrs: AttrsMap): void {
    Object.entries(attrs).forEach(([attrName, attrValue]) => {
      this.element.setAttribute(attrName, attrValue);
    });
  }

  public addEventsListener(events: EventTypesMap): void {
    this.setEvents(events);
    this.#inheritEventsToChildren(events, this.children);
  }

  public appendChildren(): void {
    this.children.forEach((child) => this.element.appendChild(child));
  }
}

export default function createElement(
  tag: keyof HTMLElementTagNameMap,
  props: ElementProps = {},
  ...children: Array<HTMLElementExtended>
): HTMLElementExtended {
  const extendedInstance: ElementExtended = new ElementExtended(tag, children);

  if (props.attrs) {
    extendedInstance.setAttrs(props.attrs);
  }

  if (props.on) {
    extendedInstance.addEventsListener(props.on);
  }

  extendedInstance.appendChildren();

  return extendedInstance.element;
}

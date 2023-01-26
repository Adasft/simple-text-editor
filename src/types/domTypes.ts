import Scrollbars from "../scrollbar/scrollbar";

export type EventType = keyof WindowEventMap;

export type EventTypesMap = {
  [eventType in EventType]?: Function;
};

export type AttrsMap = {
  [attr: string]: string;
};

export type ElementProps = {
  attrs?: AttrsMap;
  on?: EventTypesMap;
};

export type SizeDimensionProps = "width" | "height";

export type ElementScrollbarsAxis = {
  vertical: Scrollbars | null;
  horizontal: Scrollbars | null;
};

type ElementOldSizeProps = {
  oldWidth: number;
  oldHeight: number;
};

export type ElementScrollbarsProps = ElementScrollbarsAxis & {
  readonly contentOldSize: ElementOldSizeProps;
  readonly overshadow: Function;
  readonly UUID: string;
};

export interface ElementExtended {
  readonly element: HTMLElementExtended;
  readonly children: Array<HTMLElementExtended>;
  eventListeners: EventTypesMap | null;
  scrollbars: ElementScrollbarsProps | null;

  hasEvents(): boolean;
  hasEvent(eventType: keyof WindowEventMap): boolean;
  setEvents(events: EventTypesMap): void;
  setAttrs(attrs: AttrsMap): void;
  addEventsListener(events: EventTypesMap): void;
  appendChildren(): void;
}

export interface HTMLElementExtended extends HTMLObjectElement {
  readonly __extendedInstance: ElementExtended;
}

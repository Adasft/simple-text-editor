import ScrollEventsMap from "../scrollbar/scrollEventsMap";
import Scrollbars from "../scrollbar/scrollbar";
import SetOfItems from "../scrollbar/setOfItems";
import { EventType, HTMLElementExtended, SizeDimensionProps } from "./domTypes";

export interface BaseScrollbarsProps {
  mouseInTarget: boolean;
  noScrolling: boolean
  noCancelMoveByEphemeralResize: boolean
  isForcedResize: boolean

  cancelEmitter(eventType: EventType): void
  setTargetPropsResized(props: Array<SizeDimensionProps>): void;
  relativeToScroller(scrollMove: number): number;
  attachEvent(eventType: ScrollEventTypes, listener: Function): void;
  emitEvent(eventType: ScrollEventTypes, ...args: any): void;
  removeEvent(eventType: ScrollEventTypes): boolean;
  isVertical(): boolean;
  isHorizontal(): boolean;
  moveByScroll(...items: Array<HTMLElement>): void;
  scrollToTop(): void;
  scrollToLeft(): void;
  scrollToBottom(): void;
  scrollToRight(): void;
  scrollTo({ x, y }: CoorsMap): void;
  overshadow(shadow: boolean, scrollElement: HTMLElementExtended): void;
  overshadowTrack(shadow: boolean): void;
  overshadowThumb(shadow: boolean): void;
  moveThumb(scrollMove: number): void;
  moveScroll(move: CoorsMap | undefined, accumulate: boolean): void;
  append(): void;
  remove(): void;
  show(): void;
  hidden(): void;
  enable(): void;
  disable(): void;
  resize(): void;
  forceResizeShouldAppend
  (): void

  get mouseInteractivity(): MouseInteractivityProps;
  get MAX_SPIN_VALUE(): number;
  get MIN_SPIN_VALUE(): number;
  get MAX_UNITY_VALUE(): number;
  get MIN_UNITY_VALUE(): number;
  get THUMB_MIN_SIZE(): number;
  get itemsToMove(): SetOfItems;
  get eventsMap(): ScrollEventsMap;
  get direction(): ScrollDirection;
  get view(): HTMLElementExtended;
  get scroller(): HTMLElementExtended;
  get axis(): symbol;
  get overshadowTime(): number;
  get trackAlwaysVisible(): boolean;
  get thumbAlwaysVisible(): boolean;
  get trackClickBehavior(): "jump" | "step";
  get clientWidth(): number;
  get clientHeight(): number;
  get scrollWidth(): number;
  get scrollHeight(): number;
  get styles(): ScrollbarStyles;
  get scrollThumb(): HTMLElementExtended;
  get scrollTrack(): HTMLElementExtended;
  get scrollbar(): HTMLElementExtended;
  get verticalScroll(): Scrollbars | null;
  get horizontalScroll(): Scrollbars | null;
  get isWrapped(): boolean;
  get isVisible(): boolean;
  get isEnable(): boolean;
  get isTrackOvershadowed(): boolean;
  get isThumbOvershadowed(): boolean;
  get wheelDirection(): ScrollDirectionIndicator;
  get thumbIsPressed(): boolean;
  get movedPixels(): number;
  get movement(): number;
  get scrollTop(): number;
  get scrollLeft(): number;
  get scrollBottom(): number;
  get scrollRight(): number;
  get scrollPos(): symbol;
  get isRendered(): boolean;
}

// export declare class ScrollbarsWrapper {
//   public readonly scrollbars: ElementScrollbarsAxis;
//   public readonly verticalScrollOptions: ScrollbarOptions | {};
//   public readonly horizontalScrollOptions: ScrollbarOptions | {};
//   public readonly wrapperOptions: ScrollbarOptions;

//   constructor(options: WrapperOptions)

//   private _getScrollbarOptions(axis: symbol): ScrollbarOptions
//   private _normalizeOptions(options: ScrollbarOptions): void
//   public append(): ScrollbarsWrapper
// }

// export declare class Scrollbars extends BaseScrollbar implements Scrollbar {
//   private readonly _view: HTMLElementExtended;
//   private readonly _scroller: HTMLElementExtended;
//   private readonly _axis: symbol;
//   private readonly _overshadowTime: number;
//   private readonly _trackAlwaysVisible: boolean;
//   private readonly _thumbAlwaysVisible: boolean;
//   private readonly _trackClickBehavior: "jump" | "step";
//   private readonly _mouseInteractivity: MouseInteractivityProps;
//   private readonly _MAX_SPIN_VALUE: number;
//   private readonly _MIN_SPIN_VALUE: number;
//   private readonly _MAX_UNITY_VALUE: number;
//   private readonly _MIN_UNITY_VALUE: number;
//   private readonly _THUMB_MIN_SIZE: number;
//   private readonly _itemsToMove: any; //SetOfItems
//   private readonly _eventsMap: any; //ScrollEventsMap
//   private readonly _direction: ScrollDirection;
//   private readonly _scrollThumb: HTMLElementExtended;
//   private readonly _scrollTrack: HTMLElementExtended;
//   private readonly _scrollbar: HTMLElementExtended;
//   private readonly _styles: ScrollbarStyles;
//   private readonly _isWrapped: boolean;

//   private _verticalScroll: Scrollbars | null;
//   private _horizontalScroll: Scrollbars | null;
//   private _targetPropsResized: Array<SizeDimensionProps>;
//   private _scrollWidth: number;
//   private _scrollHeight: number;
//   private _long: number | undefined;
//   private _isRendered: boolean;
//   private _scrollPos: symbol;
//   private _movement: number;
//   private _scrollTop: number;
//   private _scrollLeft: number;
//   private _scrollBottom: number;
//   private _scrollRight: number;
//   private _movedPixels: number;
//   private _thumbIsPressed: boolean;
//   private _wheelDirection: ScrollDirectionIndicator;
//   private _isTrackOvershadowed: boolean;
//   private _isThumbOvershadowed: boolean;
//   private _isVisible: boolean;
//   private _isEnable: boolean;
//   private _mouseInTarget: boolean;

//   constructor(options: ScrollbarOptions);

//   private _setTargetScroll(): void;
//   private _removeTargetScroll(): void;
//   private _normalizeStyles(rules: ScrollbarStylesProps): ScrollbarStylesProps;
//   private _controlStyles(styles: ScrollbarStyles): ScrollbarStyles;
//   private _getRealScrollSizeFor(
//     prop: SizeDimensionProps,
//     defaultSize: number
//   ): number;
//   private _getScrollRect(): void;
//   private _getMouseMove(x: number, y: number): CoorsMap;
//   private _normalizeMovement(
//     startMovement: number,
//     endMovement: number,
//     prop: SizeDimensionProps
//   );
//   private _normalizeEndMovement(scrollMove: number): number;
//   private _calculateEnd(
//     scrollMove: number,
//     trackSize: number,
//     thumbSize: number
//   ): void;
//   private _normalizeScrollMove(scrollMove: number): number;
//   private _getScrollSizeBasedAxis(): void;
//   private _isThumbInMinSize(): boolean;
//   private _calculateMovement(scrollMove: number): void;
//   private _moveScroller(scrollMove: number): void;
//   private _scrollingTop(): void;
//   private _scrollingLeft(): void;
//   private _scrolling(): void;
//   private _calculateWheelSpinValue(size: number): number;
//   private _calculateWheelUnityValue(size: number): number;
//   private _shrinkScroll(): void;
//   private _shouldShrinkScroll(width: number): number;
//   private _getRectBasedAxis();
//   private _calculateSizeRelativeToScroll(size: number): number;
//   private _shouldUpdateSize(): number;
//   private _updateSize(): void;
//   private _updateThumb(): void;
//   private _updateScroll(): void;
//   private _applyStyles(
//     isThumb: boolean,
//     ...scrollbars: Array<HTMLElementExtended>
//   ): void;
//   private _getPosBasedAxisComputed(isThumb: boolean);
//   private _getStylesComputed(isThumb: boolean);
//   private _getStyles();
//   private _scrollbarStyles();
//   private _trackStyles();
//   private _calculateThumbSize();
//   private _getThumbMinSize();
//   private _thumbStyles();
//   private _shouldUpdatedHorizontalScroll(): void;
//   private _executeOnResize(prop: SizeDimensionProps): void;
//   private _inDOM(): boolean;
//   private _toggleVisibility(visibility: string): void;

//   public setTargetPropsResized(props: Array<SizeDimensionProps>): void;
//   public relativeToScroller(scrollMove: number): number;
//   public thumbPressed({ x, y }: MouseEvent): void;
//   public thumbDespressed(): void;
//   public thumbSlipped({ target, type, x, y }: MouseEvent): void;
//   public trackClicked({ x, y }: MouseEvent): void;
//   public scrollWheel(e: WheelEvent): void;
//   public attachEvent(eventType: ScrollEventTypes, listener: Function): void;
//   public emitEvent(eventType: ScrollEventTypes, ...args: any): void;
//   public removeEvent(eventType: ScrollEventTypes): boolean;
//   public isVertical(): boolean;
//   public isHorizontal(): boolean;
//   public moveByScroll(...items: Array<HTMLElement>): void;
//   public scrollToTop(): void;
//   public scrollToLeft(): void;
//   public scrollToBottom(): void;
//   public scrollToRight(): void;
//   public scrollTo({ x, y }: CoorsMap): void;
//   public overshadow(shadow: boolean, scrollElement: HTMLElementExtended): void;
//   public overshadowTrack(shadow: boolean): void;
//   public overshadowThumb(shadow: boolean): void;
//   public moveThumb(scrollMove: number): void;
//   public moveScroll(move: CoorsMap | undefined, accumulate: boolean): void;
//   public append(): void;
//   public remove(): void;
//   public show(): void;
//   public hidden(): void;
//   public enable(): void;
//   public disable(): void;
//   public resize(): void;

//   public static on(
//     scrollbar: Scrollbars,
//     eventType: ScrollEventTypes,
//     listener: Function
//   ): void;
//   public static remove(
//     scrollbar: Scrollbars,
//     eventType: ScrollEventTypes
//   ): boolean;
//   public static Wrapper(options: WrapperOptions): ScrollbarsWrapper

//   public set verticalScroll(scrollbar: Scrollbars | null)
//   public set horizontalScroll(scrollbar: Scrollbars | null)
// }

export type ScrollAxis = {
  VERTICAL_SCROLL: symbol;
  HORIZONTAL_SCROLL: symbol;
};

export type ScrollPosistion = {
  START: symbol;
  MIDDLE: symbol;
  END: symbol;
};

export type CoorsMap = {
  x: number;
  y: number;
};

export type MouseInteractivityProps = {
  prevPos: CoorsMap;
  currPos: CoorsMap;
  offsetStart: number;
  offsetEnd: number;
};

export type ScrollbarOptions = {
  view: HTMLElementExtended;
  scroller: HTMLElementExtended;
  width?: number;
  height?: number;
  trackAlwaysVisible?: boolean;
  thumbAlwaysVisible?: boolean;
  overshadowTime?: number;
  styles?: ScrollbarStyles;
  axis?: symbol;
  wrapped?: boolean;
  visible?: boolean;
  enable?: boolean;
  rendered?: boolean;
  trackClickBehavior?: "jump" | "step";
  paddingOnSidesTrack?: number; // TODO: Implementar
};

export type WrapperOptions = {
  view: HTMLElementExtended;
  scroller: HTMLElementExtended;
  noVerticalScroll?: boolean; // TODO: Implementar
  noHorizontalScroll?: boolean; // TODO: Implementar
  verticalScrollOptions?: ScrollbarOptions | {};
  horizontalScrollOptions?: ScrollbarOptions | {};
};

// bg, border-radius, border, box-shadow, cursor
export type ScrollbarStylesProps = {
  background?: string;
  borderRadius?: string | number;
  border?: string;
  boxShadow?: string;
  cursor?: string;
};

export type ScrollbarStyles = {
  track?: ScrollbarStylesProps;
  thumb?: ScrollbarStylesProps;
  scrollbar?: ScrollbarStylesProps;
};

export type ScrollEventTypes =
  | "scroll"
  | "remove"
  | "append"
  | "visibility-change"
  | "enable-change"
  | "resize"
  | string;

export type ScrollDirectionIndicator = -1 /* UP */ | 1; /* DOWN */

export type ScrollDirection = {
  x: ScrollDirectionIndicator;
  y: ScrollDirectionIndicator;
};

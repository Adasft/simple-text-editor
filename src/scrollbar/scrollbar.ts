import createElement from "../dom/createElement";
import css from "../dom/css";
import { occupyListener, on, vacateListener } from "../dom/listeners";
import { getProp, isUndef } from "../helpers";
import {
  ElementScrollbarsAxis,
  EventType,
  HTMLElementExtended,
  SizeDimensionProps,
} from "../types/domTypes";
import {
  CoorsMap,
  MouseInteractivityProps,
  ScrollDirection,
  ScrollDirectionIndicator,
  ScrollEventTypes,
  ScrollbarOptions,
  ScrollbarStyles,
  ScrollbarStylesProps,
  WrapperOptions,
} from "../types/scrollbarTypes";
import BaseScrollbars from "./baseScrollbar";
import ScrollEventsMap from "./scrollEventsMap";
import SetOfItems from "./setOfItems";

const getDefaultStyles = (background: string): ScrollbarStylesProps => ({
  background: background,
  borderRadius: 0,
  border: "none",
  boxShadow: "none",
  cursor: "default",
});

const defaultStyles: ScrollbarStyles = {
  track: getDefaultStyles("rgb(0 0 0 / 30%)"),
  thumb: getDefaultStyles("rgb(0 0 0 / 30%)"),
  scrollbar: getDefaultStyles("transparent"),
};

class ScrollbarsWrapper {
  public readonly scrollbars: ElementScrollbarsAxis;
  public readonly verticalScrollOptions: ScrollbarOptions | {};
  public readonly horizontalScrollOptions: ScrollbarOptions | {};
  public readonly wrapperOptions: ScrollbarOptions;

  constructor({
    view,
    scroller,
    verticalScrollOptions = {},
    horizontalScrollOptions = {},
  }: WrapperOptions) {
    this.wrapperOptions = {
      view,
      scroller,
      wrapped: true,
    };

    this.verticalScrollOptions = verticalScrollOptions;
    this.horizontalScrollOptions = horizontalScrollOptions;

    this._normalizeOptions(this.verticalScrollOptions);
    this._normalizeOptions(this.horizontalScrollOptions);

    this.scrollbars = {
      vertical: new Scrollbars(
        this._getScrollbarOptions(BaseScrollbars.AXIS.VERTICAL_SCROLL)
      ),
      horizontal: new Scrollbars(
        this._getScrollbarOptions(BaseScrollbars.AXIS.HORIZONTAL_SCROLL)
      ),
    };

    if (this.scrollbars.vertical)
      this.scrollbars.vertical.horizontalScroll = this.scrollbars.horizontal;
    if (this.scrollbars.horizontal)
      this.scrollbars.horizontal.verticalScroll = this.scrollbars.vertical;

    BaseScrollbars.configureView(view, scroller, this.scrollbars);
  }

  _getScrollbarOptions(axis: symbol): ScrollbarOptions {
    const scrollOptions =
      axis === BaseScrollbars.AXIS.VERTICAL_SCROLL
        ? this.verticalScrollOptions
        : this.horizontalScrollOptions;

    return {
      ...this.wrapperOptions,
      ...scrollOptions,
      axis,
    };
  }

  _normalizeOptions(options: ScrollbarOptions | {}): void {
    ["view", "scroller", "axis", "wrapped"].forEach((option) =>
      Reflect.deleteProperty(options, option)
    );
  }

  public append(): this {
    this.scrollbars.vertical?.append();
    this.scrollbars.horizontal?.append();
    return this;
  }
}

export default class Scrollbars extends BaseScrollbars {
  private readonly _view: HTMLElementExtended;
  private readonly _scroller: HTMLElementExtended;
  private readonly _axis: symbol;
  private readonly _overshadowTime: number;
  private readonly _trackAlwaysVisible: boolean;
  private readonly _thumbAlwaysVisible: boolean;
  private readonly _trackClickBehavior: "jump" | "step";

  private readonly _mouseInteractivity: MouseInteractivityProps = {
    prevPos: { x: 0, y: 0 },
    currPos: { x: 0, y: 0 },
    offsetStart: 0,
    offsetEnd: 0,
  };

  private readonly _MAX_SPIN_VALUE: number = 120;
  private readonly _MIN_SPIN_VALUE: number = 20;
  private readonly _MAX_UNITY_VALUE: number = 200;
  private readonly _MIN_UNITY_VALUE: number = 100;
  private readonly _THUMB_MIN_SIZE: number = 40;
  private readonly _itemsToMove: SetOfItems = new SetOfItems();
  private readonly _eventsMap: ScrollEventsMap = new ScrollEventsMap();
  private readonly _direction: ScrollDirection = { x: 1, y: 1 };

  private readonly _scrollThumb: HTMLElementExtended;
  private readonly _scrollTrack: HTMLElementExtended;
  private readonly _scrollbar: HTMLElementExtended;
  private readonly _styles: ScrollbarStyles;
  private readonly _isWrapped: boolean;

  private _verticalScroll: Scrollbars | null;
  private _horizontalScroll: Scrollbars | null;
  private _targetPropsResized: Array<SizeDimensionProps> = [];
  private _scrollWidth: number;
  private _scrollHeight: number;
  private _long: number | undefined = undefined;
  private _isRendered: boolean;
  private _scrollPos: symbol = BaseScrollbars.POS.START;
  private _movement: number = 0;
  private _scrollTop: number = 0;
  private _scrollLeft: number = 0;
  private _scrollBottom: number = 0;
  private _scrollRight: number = 0;
  private _movedPixels: number = 0;
  private _thumbIsPressed: boolean = false;
  private _wheelDirection: ScrollDirectionIndicator = 1;
  private _isTrackOvershadowed: boolean = false;
  private _isThumbOvershadowed: boolean = false;
  private _isVisible: boolean;
  private _isEnable: boolean;

  constructor({
    view,
    scroller,
    width,
    height,
    trackAlwaysVisible = true,
    thumbAlwaysVisible = true,
    trackClickBehavior = "jump",
    overshadowTime = 0.2,
    styles = defaultStyles,
    axis = BaseScrollbars.AXIS.VERTICAL_SCROLL,
    wrapped = false,
    visible = true,
    enable = true,
    rendered = true,
  }: ScrollbarOptions) {
    super();

    this._view = view;
    this._scroller = scroller;
    this._trackAlwaysVisible = trackAlwaysVisible;
    this._thumbAlwaysVisible = thumbAlwaysVisible;
    this._trackClickBehavior = trackClickBehavior;
    this._overshadowTime = overshadowTime;
    this._axis = axis;
    this._isWrapped = wrapped;
    this._isVisible = visible;
    this._isEnable = enable;
    this._scrollWidth = this._getRealScrollSizeFor("width", width || 0);
    this._scrollHeight = this._getRealScrollSizeFor("height", height || 0);
    this._styles = this._controlStyles(styles);
    this._isRendered = rendered;

    const { viewSize: targetSize, scrollerSize } = this._getRectBasedAxis();

    if (scrollerSize <= targetSize) {
      this._isRendered = false;
    }

    this._scrollThumb = createElement("div", {
      attrs: {
        class: "TextEditor-scrollbar-thumb",
        style: css(this._thumbStyles()).toString(),
      },
      on: {
        mousedown: (e: MouseEvent) => {
          this.thumbPressed(e);
        },
        mousemove: (e: MouseEvent) => {
          this.thumbSlipped(e);
        },
      },
    });

    this._scrollTrack = createElement("div", {
      attrs: {
        class: "TextEditor-scrollbar-track",
        style: css(this._trackStyles()).toString(),
      },
      on: {
        click: (e: MouseEvent) => {
          this.trackClicked(e);
        },
      },
    });

    this._scrollbar = createElement(
      "div",
      {
        attrs: {
          class: "TextEditor-scrollbar",
          style: css(this._scrollbarStyles()).toString(),
        },
      },
      this._scrollTrack,
      this._scrollThumb
    );

    this._verticalScroll = this.isVertical() ? this : null;
    this._horizontalScroll = this.isHorizontal() ? this : null;

    if (!this._isWrapped) {
      BaseScrollbars.configureView(this._view, this._scroller, {
        vertical: this._verticalScroll,
        horizontal: this._horizontalScroll,
      });
    }

    css({ position: "relative", overflow: "hidden" }).from(this._view);

    on(document, "mouseup", () => this._depressScroll());
  }

  private _depressScroll(): void {
    BaseScrollbars.targetScroll && BaseScrollbars.targetScroll.thumbDepress();
  }

  private _setTargetScroll(): void {
    BaseScrollbars.targetScroll = this; // Set the scroll of intance with target
  }

  private _removeTargetScroll(): void {
    BaseScrollbars.targetScroll = null; // Remove the scroll of this intance with target
  }

  private _normalizeStyles(rules: ScrollbarStylesProps): ScrollbarStylesProps {
    const acceptedRules = [
      "background",
      "borderRadius",
      "border-radius",
      "border",
      "boxShadow",
      "box-shadow",
      "cursor",
    ];
    Object.keys(rules).forEach(
      (rule) =>
        !acceptedRules.includes(rule) && Reflect.deleteProperty(rules, rule)
    );
    return rules;
  }

  private _controlStyles(styles: ScrollbarStyles): ScrollbarStyles {
    const controlledStyles: ScrollbarStyles = defaultStyles;

    if (styles.scrollbar)
      controlledStyles.scrollbar = {
        ...controlledStyles.scrollbar,
        ...this._normalizeStyles(styles.scrollbar),
      };
    if (styles.track)
      controlledStyles.track = {
        ...controlledStyles.track,
        ...this._normalizeStyles(styles.track),
      };
    if (styles.thumb)
      controlledStyles.thumb = {
        ...controlledStyles.thumb,
        ...this._normalizeStyles(styles.thumb),
      };

    return controlledStyles;
  }

  private _getRealScrollSizeFor(
    prop: SizeDimensionProps,
    defaultSize: number
  ): number {
    if (!!defaultSize) {
      this._long = defaultSize;
      return defaultSize;
    }

    const { width, height } = this._view.getBoundingClientRect();
    switch (prop) {
      case "width":
        return this.isVertical() ? 15 : width;
      case "height":
        return this.isHorizontal() ? 15 : height;
      default:
        return 0;
    }
  }

  private _getScrollRect() {
    return {
      track: this._scrollTrack.getBoundingClientRect(),
      thumb: this._scrollThumb.getBoundingClientRect(),
    };
  }

  private _getMouseMove(x: number, y: number): CoorsMap {
    this._mouseInteractivity.currPos.x = x;
    this._mouseInteractivity.currPos.y = y;

    return {
      x:
        this._mouseInteractivity.currPos.x - this._mouseInteractivity.prevPos.x,
      y:
        this._mouseInteractivity.currPos.y - this._mouseInteractivity.prevPos.y,
    };
  }

  private _normalizeScrollMovementIfThumbInMinSize(
    movement: number,
    predicatorCallback?: (movement: number, diffPercentage: number) => number
  ): number {
    const { trackSize, thumbSize } = this._getScrollSizeBasedAxis();
    const { viewSize, scrollerSize } = this._getRectBasedAxis();

    if (thumbSize === 0 || trackSize === 0 || scrollerSize === 0)
      return movement;

    const diffPercentage =
      (thumbSize / trackSize - viewSize / scrollerSize) * trackSize;
    const normalizedMovement = predicatorCallback
      ? predicatorCallback(movement, diffPercentage)
      : movement + diffPercentage;

    // return movement < diffPercentage ? movement : normalizedMovement;
    return Math.floor(movement) <= Math.floor(diffPercentage)
      ? movement
      : normalizedMovement;
  }

  private _keepInRangeOfMovement(
    startMovement: number,
    endMovement: number,
    prop: SizeDimensionProps
  ) {
    const { track, thumb } = this._getScrollRect();
    let normalizedMovement = startMovement;
    let pos: symbol;

    if (startMovement < 0) {
      pos = BaseScrollbars.POS.START;
      normalizedMovement = 0;
    } else if (endMovement < 0) {
      pos = BaseScrollbars.POS.END;
      normalizedMovement = track[prop] - thumb[prop];
    } else {
      pos = BaseScrollbars.POS.MIDDLE;
    }

    this._scrollPos = pos;

    return {
      normalizedMovement,
      normalizedEndMovement: this._keepInRangeOfEndMovement(endMovement),
    };
  }

  private _keepInRangeOfEndMovement(scrollMove: number): number {
    return this._scrollPos === BaseScrollbars.POS.END ? 0 : scrollMove;
  }

  private _calculateEnd(
    scrollMove: number,
    trackSize: number,
    thumbSize: number
  ): void {
    const distance = trackSize - (scrollMove + thumbSize);
    this.isVertical()
      ? (this._scrollBottom = distance)
      : (this._scrollRight = distance);
  }

  // private _normalizeScrollingMovement(scrollMove: number): number {
  //   const { trackSize, thumbSize } = this._getScrollSizeBasedAxis();
  //   const { viewSize, scrollerSize } = this._getRectBasedAxis();

  //   if (thumbSize === 0 || trackSize === 0 || scrollerSize === 0)
  //     return scrollMove;

  //   const diffPercentage =
  //     (thumbSize / trackSize - viewSize / scrollerSize) * trackSize;

  //   return scrollMove < diffPercentage
  //     ? scrollMove
  //     : scrollMove + diffPercentage;
  // }

  private _getScrollSizeBasedAxis() {
    const { track, thumb } = this._getScrollRect();
    const trackSize = this.isVertical() ? track.height : track.width;
    const thumbSize = this.isVertical() ? thumb.height : thumb.width;
    return { trackSize, thumbSize };
  }

  private _isThumbInMinSize(): boolean {
    const { thumbSize } = this._getScrollSizeBasedAxis();
    return thumbSize <= this._THUMB_MIN_SIZE;
  }

  private _calculateMovement(scrollMove: number): void {
    if (this._isThumbInMinSize()) {
      scrollMove = this._normalizeScrollMovementIfThumbInMinSize(scrollMove);
    }

    const movement = this.relativeToScroller(scrollMove);
    this._movedPixels = movement - this._movement;
    this._movement = movement;
  }

  private _moveScroller(scrollMove: number): void {
    this._calculateMovement(scrollMove);

    if (!this._itemsToMove.empty()) {
      this._itemsToMove.move(this._movement);
    }

    css({
      transform: `translateX(${-(
        this._horizontalScroll?._movement || 0
      )}px) translateY(${-(this._verticalScroll?._movement || 0)}px)`,
    }).from(this._scroller);
  }

  private _scrollingTop(): void {
    this._moveScroller(this._scrollTop);
  }

  private _scrollingLeft(): void {
    this._moveScroller(this._scrollLeft);
  }

  private _scrolling(): void {
    if (!this._isEnable) return;

    if (this._isWrapped) {
      this._verticalScroll && this._verticalScroll._scrollingTop();
      this._horizontalScroll && this._horizontalScroll._scrollingLeft();
    } else if (this.isVertical()) {
      this._scrollingTop();
    } else {
      this._scrollingLeft();
    }
  }

  private _calculateWheelSpinValue(size: number): number {
    const value = this._MAX_SPIN_VALUE - size / this._MAX_SPIN_VALUE;

    return value < this._MIN_SPIN_VALUE ? this._MIN_SPIN_VALUE : value;
  }

  private _calculateWheelUnityValue(size: number): number {
    const value = this._MIN_UNITY_VALUE + size / this._MAX_UNITY_VALUE;

    return value > this._MAX_UNITY_VALUE ? this._MAX_UNITY_VALUE : value;
  }

  private _shrinkScroll(): void {
    this._updateThumb();
    this._updateScroll();
  }

  private _shouldShrinkScroll(width: number): number {
    return !this.isHorizontal() ||
      !this._verticalScroll ||
      !this._verticalScroll._isVisible ||
      !this._verticalScroll._isRendered
      ? width
      : width - this._verticalScroll._scrollWidth;
  }

  private _getRectBasedAxis() {
    const isVertical = this.isVertical();
    const viewRect = this._view.getBoundingClientRect();
    const scrollerRect = this._scroller.getBoundingClientRect();

    return {
      viewSize: isVertical
        ? viewRect.height
        : this._shouldShrinkScroll(viewRect.width),
      scrollerSize: isVertical ? scrollerRect.height : scrollerRect.width,
      viewDist: isVertical ? viewRect.bottom : viewRect.right,
      scrollerDist: isVertical ? scrollerRect.bottom : scrollerRect.right,
    };
  }

  private _calculateSizeRelativeToScroll(size: number): number {
    const { scrollerSize } = this._getRectBasedAxis();

    if (scrollerSize < this.scrollHeight) {
      if (this.isVertical())
        console.log({ scrollerSize, size, h: this.scrollHeight });
      return 0;
    }

    return (
      (size / scrollerSize) *
      (this.isVertical() ? this._scrollHeight : this._scrollWidth)
    );
  }

  public relativeToScroll(size: number): number {
    size = this._calculateSizeRelativeToScroll(size);
    if (this._isThumbInMinSize()) {
      size = this._normalizeScrollMovementIfThumbInMinSize(
        size,
        (a, b) => a - b
      );
    }
    return size;
  }

  private _shouldUpdateSize(): number {
    const { viewSize: targetSize } = this._getRectBasedAxis();

    if (!this._long || targetSize <= this._long) return targetSize;

    return this._long;
  }

  private _updateSize(): void {
    if (this.isVertical()) {
      this._scrollHeight = this._shouldUpdateSize();
    } else if (this.isHorizontal()) {
      this._scrollWidth = this._shouldUpdateSize();
    }
  }

  private _updateThumb(): void {
    this._applyStyles(true, this._scrollThumb);
  }

  private _updateScroll(): void {
    this._applyStyles(false, this._scrollbar, this._scrollTrack);
  }

  private _applyStyles(
    isThumb: boolean,
    ...scrolls: Array<HTMLElementExtended>
  ): void {
    const stylesComputed = this._getStylesComputed(isThumb);
    scrolls.forEach((scroll) => css(stylesComputed).from(scroll));
  }

  private _getPosBasedAxisComputed(isThumb = true) {
    return this.isVertical()
      ? { top: isThumb ? this._scrollTop : 0, right: 0 }
      : { left: isThumb ? this._scrollLeft : 0, bottom: 0 };
  }

  private _getStylesComputed(isThumb: boolean) {
    const thumbSize = this._calculateThumbSize();
    return {
      width: isThumb ? thumbSize.width : this._scrollWidth,
      height: isThumb ? thumbSize.height : this._scrollHeight,
      ...this._getPosBasedAxisComputed(isThumb),
    };
  }

  private _getStyles() {
    return {
      position: "absolute",
      ...this._getStylesComputed(false),
    };
  }

  private _scrollbarStyles() {
    return {
      zIndex: "100",
      visibility: this._isVisible ? "visible" : "hidden",
      userSelect: "none",
      ...this._styles.scrollbar,
      ...this._getStyles(),
    };
  }

  private _trackStyles() {
    return {
      ...this._styles.track,
      ...this._getStyles(),
    };
  }

  private _calculateThumbSize() {
    const longSize = this._calculateSizeRelativeToScroll(
      this._getRectBasedAxis().viewSize
    );

    return {
      width: this.isVertical() ? this._scrollWidth : longSize,
      height: this.isHorizontal() ? this._scrollHeight : longSize,
    };
  }

  private _getThumbMinSize() {
    const minSizeProp = this.isVertical() ? "minHeight" : "minWidth";
    return { [minSizeProp]: this._THUMB_MIN_SIZE };
  }

  private _thumbStyles() {
    return {
      position: "absolute",
      ...this._styles.thumb,
      ...this._getThumbMinSize(),
      ...this._calculateThumbSize(),
      ...this._getPosBasedAxisComputed(),
    };
  }

  private _shouldUpdatedHorizontalScroll(): void {
    if (this.isVertical() && this._horizontalScroll) {
      this._horizontalScroll.resize();
    }
  }

  private _executeOnResize(prop: SizeDimensionProps): void {
    switch (prop) {
      case "width":
        this._horizontalScroll?.emitEvent("resize");
        break;
      case "height":
        this._verticalScroll?.emitEvent("resize");
        break;
      default:
        return;
    }
  }

  private _inDOM(): boolean {
    return Array.from(this._view.children).includes(this._scrollbar);
  }

  private _toggleVisibility(visibility: string): void {
    css({ visibility }).from(this._scrollbar);
    this._shouldUpdatedHorizontalScroll();
    this.emitEvent("visibility-change");
  }

  public cancelEmitter(eventType: ScrollEventTypes): void {
    this._eventsMap.cancel(eventType);
  }

  public setTargetPropsResized(props: Array<SizeDimensionProps>): void {
    this._targetPropsResized = props;
  }

  public relativeToScroller(scrollMove: number): number {
    const { scrollerSize } = this._getRectBasedAxis();
    return (
      (scrollMove /
        (this.isVertical() ? this._scrollHeight : this._scrollWidth)) *
      scrollerSize
    );
  }

  // Handlers events
  public thumbPressed({ x, y }: MouseEvent): void {
    if (!this._isRendered) return;

    this._thumbIsPressed = true;
    this._mouseInteractivity.prevPos.x = x;
    this._mouseInteractivity.prevPos.y = y;
    this._setTargetScroll();
  }

  public thumbDepress(): void {
    if (!this._isRendered) return;

    if (this.mouseInTarget && this._verticalScroll?._isVisible) {
      BaseScrollbars.targetScroll = this._verticalScroll;
    } else {
      this._removeTargetScroll();
    }

    if (!this.mouseInTarget)
      this._view.__extendedInstance.scrollbars?.overshadow(true);

    this._mouseInteractivity.offsetStart = 0;
    this._mouseInteractivity.offsetEnd = 0;

    this._thumbIsPressed = false;
    vacateListener("mousemove");
  }

  public thumbSlipped({ target, type, x, y }: MouseEvent): void {
    if (!this._thumbIsPressed || !this._isRendered) return;

    const { track } = this._getScrollRect();
    const isVertical = this.isVertical();
    const cursorMove = this._getMouseMove(x, y);
    const offset = isVertical ? y - track.top : x - track.left;
    const shouldMove =
      this._scrollPos === BaseScrollbars.POS.MIDDLE ||
      (this._mouseInteractivity.offsetEnd <=
        this._mouseInteractivity.offsetStart &&
        this._scrollPos === BaseScrollbars.POS.END) ||
      (this._mouseInteractivity.offsetEnd >=
        this._mouseInteractivity.offsetStart &&
        this._scrollPos === BaseScrollbars.POS.START);

    this._direction.x = cursorMove.x < 0 ? -1 : 1;
    this._direction.y = cursorMove.y < 0 ? -1 : 1;

    if (shouldMove) this.moveScroll(cursorMove);

    this._mouseInteractivity.prevPos.x = x;
    this._mouseInteractivity.prevPos.y = y;
    this._mouseInteractivity.offsetEnd = offset;

    if (this._scrollPos === BaseScrollbars.POS.MIDDLE)
      this._mouseInteractivity.offsetStart = offset;

    occupyListener({
      target: target as HTMLElementExtended,
      type: type as EventType,
    });
  }

  public trackClicked({ x, y }: MouseEvent): void {
    if (!this._isRendered) return;

    const { track, thumb } = this._getScrollRect();
    const cursorPos = this.isVertical() ? y - track.y : x - track.x;
    let accumulate = false,
      scrollMoveX = cursorPos - thumb.width / 2,
      scrollMoveY = cursorPos - thumb.height / 2;

    this._direction.x = cursorPos > this._scrollLeft ? 1 : -1;
    this._direction.y = cursorPos > this._scrollTop ? 1 : -1;

    if (this._trackClickBehavior === "step") {
      accumulate = true;
      scrollMoveX = thumb.width * this._direction.x;
      scrollMoveY = thumb.height * this._direction.y; // pisado - lizo
    }

    const move: CoorsMap = { x: scrollMoveX, y: scrollMoveY };

    this.moveScroll(move, accumulate);
  }

  public scrollWheel(e: WheelEvent): void {
    if (!this._isRendered || (!this._isVisible && !this._isEnable)) return;

    e.preventDefault();

    const { scrollerSize } = this._getRectBasedAxis();

    this._wheelDirection = e.deltaY < 0 ? 1 : -1;
    this._direction.y = (this._wheelDirection * -1) as ScrollDirectionIndicator;

    const spin: number =
      this._calculateWheelSpinValue(scrollerSize) * this._wheelDirection;
    const unity: number = this._calculateWheelUnityValue(scrollerSize);

    this.moveScroll({ x: 0, y: -((spin / unity) * 10) });
  }

  public attachEvent(eventType: ScrollEventTypes, listener: Function): void {
    this._eventsMap.attach(eventType, listener);
  }

  public emitEvent(eventType: ScrollEventTypes, ...args: any): void {
    this._eventsMap.emit(eventType, ...args);
  }

  public removeEvent(eventType: ScrollEventTypes): boolean {
    return this._eventsMap.remove(eventType);
  }

  public isVertical(): boolean {
    return this._axis === BaseScrollbars.AXIS.VERTICAL_SCROLL;
  }

  public isHorizontal(): boolean {
    return this._axis === BaseScrollbars.AXIS.HORIZONTAL_SCROLL;
  }

  public moveByScroll(...items: Array<HTMLElement>): void {
    if (!Array.isArray(items)) return;
    this._itemsToMove.add(...items);
  }

  public scrollToTop(): void {
    this._direction.y = -1;
    this.moveThumb(-1);
  }

  public scrollToLeft(): void {
    this._direction.x = -1;
    this.moveThumb(-1);
  }

  public scrollToBottom(): void {
    const { track } = this._getScrollRect();
    this._direction.y = 1;
    this.moveThumb(track.height);
  }

  public scrollToRight(): void {
    const { track } = this._getScrollRect();
    this._direction.x = 1;
    this.moveThumb(track.width);
  }

  public scrollTo({ x, y }: CoorsMap = { x: 0, y: 0 }): void {
    [this._verticalScroll, this._horizontalScroll].forEach((scroll) => {
      scroll &&
        scroll.moveScroll(
          {
            x: scroll._calculateSizeRelativeToScroll(x || scroll._movement),
            y: scroll._calculateSizeRelativeToScroll(y || scroll._movement),
          },
          false
        );
    });
  }

  public overshadow(shadow: boolean, scrollElement: HTMLElementExtended): void {
    css({
      opacity: shadow ? "0" : "1",
      transition: `opacity ${this._overshadowTime}s`,
    }).from(scrollElement);
  }

  public overshadowTrack(shadow: boolean): void {
    this._isTrackOvershadowed = shadow;
    this.overshadow(shadow, this._scrollTrack);
  }

  public overshadowThumb(shadow: boolean): void {
    this._isThumbOvershadowed = shadow;
    this.overshadow(shadow, this._scrollThumb);
  }

  public moveThumb(scrollMove: number): void {
    if (isUndef(scrollMove)) return;

    const { track, thumb } = this._getScrollRect();
    const isVertical = this.isVertical();
    const trackSize = isVertical ? track.height : track.width;
    const thumbSize = isVertical ? thumb.height : thumb.width;

    this._calculateEnd(scrollMove, trackSize, thumbSize);

    const [endMovement, prop]: [number, SizeDimensionProps] = isVertical
      ? [this._scrollBottom, "height"]
      : [this._scrollRight, "width"];
    const { normalizedMovement, normalizedEndMovement } =
      this._keepInRangeOfMovement(scrollMove, endMovement, prop);

    let dirAxis: "x" | "y" = "y";
    if (isVertical) {
      this._scrollTop = normalizedMovement;
      this._scrollBottom = normalizedEndMovement;
    } else {
      dirAxis = "x";
      this._scrollLeft = normalizedMovement;
      this._scrollRight = normalizedEndMovement;
    }

    if (!this.noScrolling) {
      // console.log('hgola')
      this._scrolling();
    }

    this._direction[dirAxis] = this._movedPixels < 0 ? -1 : 1;
    css({ [isVertical ? "top" : "left"]: normalizedMovement }).from(
      this._scrollThumb
    );

    this.emitEvent("scroll");
  }

  public moveScroll(move: CoorsMap | undefined, accumulate = true): void {
    if (!move) return;

    if (this.isVertical()) {
      this._scrollTop = accumulate ? this._scrollTop + move.y : move.y;
      this.moveThumb(this._scrollTop);
    } else {
      this._scrollLeft = accumulate ? this._scrollLeft + move.x : move.x;
      this.moveThumb(this._scrollLeft);
    }
  }

  public append(force: boolean = false): void {
    const { viewSize, scrollerSize } = this._getRectBasedAxis();

    if (!force && scrollerSize <= viewSize) return;

    this._isRendered = true;

    if (!this._inDOM()) {
      this._view.appendChild(this._scrollbar);
      this._shouldUpdatedHorizontalScroll();
      this.emitEvent("append");
    }
  }

  public remove(): void {
    this._isRendered = false;

    if (this._inDOM()) {
      this._scrollbar.remove();
      this._shouldUpdatedHorizontalScroll();
      this.emitEvent("remove");
    }
  }

  public show(): void {
    this._isVisible = true;
    this._toggleVisibility("visible");
  }

  public hidden(): void {
    this._isVisible = false;
    this._toggleVisibility("hidden");
  }

  public enable(): void {
    this._isEnable = true;
    this.moveThumb(this._calculateSizeRelativeToScroll(this._movement));
    this.emitEvent("enable-change");
  }

  public disable(): void {
    this._isEnable = false;
    this.emitEvent("enable-change");
  }

  public resize(): void {
    if (this.isForcedResize) {
      this.isForcedResize = false;
      return;
    }

    console.log("hola", this.axis);

    const { viewSize, scrollerSize, viewDist, scrollerDist } =
      this._getRectBasedAxis();

    if (scrollerDist < viewDist) {
      this._movement -= viewDist - scrollerDist;
    }

    if (scrollerSize <= viewSize) {
      this.remove();
    } else {
      this.append();
    }

    this._updateSize();

    if (this.noCancelMoveByEphemeralResize) {
      this.moveThumb(
        this._calculateSizeRelativeToScroll(
          this._movement
        ) /* Scrollbars Move */
      );
    }

    this.noCancelMoveByEphemeralResize = true;
    this._shrinkScroll();

    this._targetPropsResized.forEach((prop) => this._executeOnResize(prop));
  }

  public forceResizeShouldAppend(): void {
    this.append(true);
    this._updateSize();
    // if (updateScrollMovement) {
    //   // this.noScrolling = true
    //   this.moveThumb(
    //     this.relativeToScroll(this._movement)
    //   );
    //   // this.noScrolling = false
    // }
    this._shrinkScroll();
    this.isForcedResize = true;
  }

  // TODO: Agregar a la interfaz
  public forceResizeShouldRemove(): void {
    const { scrollerSize, viewSize } = this._getRectBasedAxis();
    if (scrollerSize <= viewSize) {
      this.remove();
    }
    this._updateSize();
    this.moveThumb(this.relativeToScroll(this._movement));
    this._shrinkScroll();
    this.isForcedResize = true;
  }

  public static on(
    scroll: Scrollbars,
    eventType: string,
    listener: Function
  ): void {
    if (
      isUndef(scroll) ||
      !(scroll instanceof Scrollbars) ||
      typeof eventType !== "string" ||
      typeof listener !== "function"
    )
      return;
    scroll.attachEvent(eventType, listener.bind(scroll, scroll));
  }

  public static remove(scroll: Scrollbars, eventType: string): boolean {
    if (
      isUndef(scroll) ||
      !(scroll instanceof Scrollbars) ||
      typeof eventType !== "string"
    )
      return false;
    return scroll.removeEvent(eventType);
  }

  public static Wrapper(options: WrapperOptions) {
    return new ScrollbarsWrapper(options);
  }

  public set verticalScroll(scrollbar: Scrollbars | null) {
    this._verticalScroll = scrollbar;
  }

  public set horizontalScroll(scrollbar: Scrollbars | null) {
    this._horizontalScroll = scrollbar;
  }

  public get mouseInteractivity(): MouseInteractivityProps {
    return this._mouseInteractivity;
  }

  public get MAX_SPIN_VALUE(): number {
    return this._MAX_SPIN_VALUE;
  }

  public get MIN_SPIN_VALUE(): number {
    return this._MIN_SPIN_VALUE;
  }

  public get MAX_UNITY_VALUE(): number {
    return this._MAX_UNITY_VALUE;
  }

  public get MIN_UNITY_VALUE(): number {
    return this._MIN_UNITY_VALUE;
  }

  public get THUMB_MIN_SIZE(): number {
    return this._THUMB_MIN_SIZE;
  }

  public get itemsToMove(): SetOfItems {
    return this._itemsToMove;
  }

  public get eventsMap(): ScrollEventsMap {
    return this._eventsMap;
  }

  public get direction(): ScrollDirection {
    return this._direction;
  }

  public get view(): HTMLElementExtended {
    return this._view;
  }

  public get scroller(): HTMLElementExtended {
    return this._scroller;
  }

  public get axis(): symbol {
    return this._axis;
  }

  public get overshadowTime(): number {
    return this._overshadowTime;
  }

  public get trackAlwaysVisible(): boolean {
    return this._trackAlwaysVisible;
  }

  public get thumbAlwaysVisible(): boolean {
    return this._thumbAlwaysVisible;
  }

  public get trackClickBehavior(): "jump" | "step" {
    return this._trackClickBehavior;
  }

  public get clientWidth(): number {
    return this._scroller.getBoundingClientRect().width;
  }

  public get clientHeight(): number {
    return this._scroller.getBoundingClientRect().height;
  }

  public get scrollWidth(): number {
    return this._scrollWidth;
  }

  public get scrollHeight(): number {
    return this._scrollHeight;
  }

  public get styles(): ScrollbarStyles {
    return this._styles;
  }

  public get scrollThumb(): HTMLElementExtended {
    return this._scrollThumb;
  }

  public get scrollTrack(): HTMLElementExtended {
    return this._scrollTrack;
  }

  public get scrollbar(): HTMLElementExtended {
    return this._scrollbar;
  }

  public get verticalScroll(): Scrollbars | null {
    return this._verticalScroll;
  }

  public get horizontalScroll(): Scrollbars | null {
    return this._horizontalScroll;
  }

  public get isWrapped(): boolean {
    return this._isWrapped;
  }

  public get isVisible(): boolean {
    return this._isVisible;
  }

  public get isEnable(): boolean {
    return this._isEnable;
  }

  public get isTrackOvershadowed(): boolean {
    return this._isTrackOvershadowed;
  }

  public get isThumbOvershadowed(): boolean {
    return this._isThumbOvershadowed;
  }

  public get wheelDirection(): ScrollDirectionIndicator {
    return this._wheelDirection;
  }

  public get thumbIsPressed(): boolean {
    return this._thumbIsPressed;
  }

  public get movedPixels(): number {
    return this._movedPixels;
  }

  public get movement(): number {
    return this._movement;
  }

  public get scrollTop(): number {
    return this._scrollTop;
  }

  public get scrollLeft(): number {
    return this._scrollLeft;
  }

  public get scrollBottom(): number {
    return this._scrollBottom;
  }

  public get scrollRight(): number {
    return this._scrollRight;
  }

  public get scrollPos(): symbol {
    return this._scrollPos;
  }

  public get isRendered(): boolean {
    return this._isRendered;
  }
}

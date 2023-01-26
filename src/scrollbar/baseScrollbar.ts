import { on } from "../dom/listeners";
import { getUUID, isDef } from "../helpers";
import {
  ElementScrollbarsAxis,
  ElementScrollbarsProps,
  EventType,
  HTMLElementExtended,
  SizeDimensionProps,
} from "../types/domTypes";
import {
  BaseScrollbarsProps,
  CoorsMap,
  MouseInteractivityProps,
  ScrollAxis,
  ScrollDirection,
  ScrollDirectionIndicator,
  ScrollEventTypes,
  ScrollPosistion,
  ScrollbarStyles,
} from "../types/scrollbarTypes";
import ScrollEventsMap from "./scrollEventsMap";
import Scrollbars from "./scrollbar";
import SetOfItems from "./setOfItems";

function overshadowAction(
  shadow: boolean,
  verticalScroll: Scrollbars | null,
  horizontalScroll: Scrollbars | null
) {
  const scrolls = [verticalScroll, horizontalScroll];
  scrolls.forEach((scroll) => {
    if (isDef(scroll)) {
      !scroll?.trackAlwaysVisible && scroll?.overshadowTrack(shadow);
      !scroll?.thumbAlwaysVisible && scroll?.overshadowThumb(shadow);
    }
  });
}

function defineScrollbarProps(
  view: HTMLElementExtended,
  scrollbars: ElementScrollbarsAxis
) {
  const { width, height } = view.getBoundingClientRect();
  const UUID = getUUID();

  const scrollbarsProps: ElementScrollbarsProps = {
    vertical: scrollbars.vertical,
    horizontal: scrollbars.horizontal,
    contentOldSize: {
      oldWidth: width,
      oldHeight: height,
    },
    UUID,
    overshadow: (shadow: boolean) =>
      overshadowAction(shadow, scrollbars.vertical, scrollbars.horizontal),
  };

  view.__extendedInstance.scrollbars = scrollbarsProps;

  return scrollbarsProps;
}

abstract class BaseScrollbars implements BaseScrollbarsProps {
  public mouseInTarget: boolean = false;
  public noScrolling: boolean = false
  public noCancelMoveByEphemeralResize: boolean = true;
  public isForcedResize: boolean = false

  public static AXIS: ScrollAxis = {
    VERTICAL_SCROLL: Symbol.for("VERTICAL_SCROLL"),
    HORIZONTAL_SCROLL: Symbol.for("HORIZONTAL_SCROLL"),
  };

  public static POS: ScrollPosistion = {
    END: Symbol.for("END"),
    START: Symbol.for("START"),
    MIDDLE: Symbol.for("MIDDLE"),
  };

  protected static targetScroll: Scrollbars | null = null;

  protected constructor() {}
  
  public abstract cancelEmitter(eventType: EventType): void

  public abstract setTargetPropsResized(props: Array<SizeDimensionProps>): void;

  public abstract relativeToScroller(scrollMove: number): number;

  public abstract isVertical(): boolean;

  public abstract isHorizontal(): boolean;

  public abstract scrollToTop(): void;

  public abstract scrollToLeft(): void;

  public abstract scrollToBottom(): void;

  public abstract scrollToRight(): void;

  public abstract scrollTo(moveCoors: CoorsMap): void;

  public abstract overshadow(
    shadow: boolean,
    scrollElement: HTMLElementExtended
  ): void;

  public abstract overshadowTrack(shadow: boolean): void;

  public abstract overshadowThumb(shadow: boolean): void;

  public abstract moveThumb(scrollMove: number): void;

  public abstract moveScroll(
    move: CoorsMap | undefined,
    accumulate: boolean
  ): void;

  public abstract append(): void;

  public abstract remove(): void;

  public abstract show(): void;

  public abstract hidden(): void;

  public abstract enable(): void;

  public abstract disable(): void;

  public abstract resize(): void;

  public abstract forceResizeShouldAppend(): void

  public abstract moveByScroll(...items: Array<HTMLElement>): void;

  public abstract attachEvent(
    eventType: ScrollEventTypes,
    listener: Function
  ): void;

  public abstract emitEvent(eventType: ScrollEventTypes, ...args: any): void;

  public abstract removeEvent(eventType: ScrollEventTypes): boolean;

  protected abstract trackClicked({ x, y }: MouseEvent): void;

  protected abstract thumbSlipped({ target, type, x, y }: MouseEvent): void;

  protected abstract thumbDepress(): void;

  protected abstract thumbPressed({ x, y }: MouseEvent): void;

  protected abstract scrollWheel(e: WheelEvent): void;

  public abstract get mouseInteractivity(): MouseInteractivityProps;

  public abstract get MAX_SPIN_VALUE(): number;

  public abstract get MIN_SPIN_VALUE(): number;

  public abstract get MAX_UNITY_VALUE(): number;

  public abstract get MIN_UNITY_VALUE(): number;

  public abstract get THUMB_MIN_SIZE(): number;

  public abstract get itemsToMove(): SetOfItems;

  public abstract get eventsMap(): ScrollEventsMap;

  public abstract get direction(): ScrollDirection;

  public abstract get view(): HTMLElementExtended;

  public abstract get scroller(): HTMLElementExtended;

  public abstract get axis(): symbol;

  public abstract get overshadowTime(): number;

  public abstract get trackAlwaysVisible(): boolean;

  public abstract get thumbAlwaysVisible(): boolean;

  public abstract get trackClickBehavior(): "jump" | "step";

  public abstract get clientWidth(): number;

  public abstract get clientHeight(): number;

  public abstract get scrollWidth(): number;

  public abstract get scrollHeight(): number;

  public abstract get styles(): ScrollbarStyles;

  public abstract get scrollThumb(): HTMLElementExtended;

  public abstract get scrollTrack(): HTMLElementExtended;

  public abstract get scrollbar(): HTMLElementExtended;

  public abstract get verticalScroll(): Scrollbars | null;

  public abstract get horizontalScroll(): Scrollbars | null;

  public abstract get isWrapped(): boolean;

  public abstract get isVisible(): boolean;

  public abstract get isEnable(): boolean;

  public abstract get isTrackOvershadowed(): boolean;

  public abstract get isThumbOvershadowed(): boolean;

  public abstract get wheelDirection(): ScrollDirectionIndicator;

  public abstract get thumbIsPressed(): boolean;

  public abstract get movedPixels(): number;

  public abstract get movement(): number;

  public abstract get scrollTop(): number;

  public abstract get scrollLeft(): number;

  public abstract get scrollBottom(): number;

  public abstract get scrollRight(): number;

  public abstract get scrollPos(): symbol;

  public abstract get isRendered(): boolean;

  public static configureView(
    view: HTMLElementExtended,
    scroller: HTMLElementExtended,
    scrollbars: ElementScrollbarsAxis
  ): void {
    const {
      vertical: verticalScroll,
      horizontal: horizontalScroll,
      contentOldSize,
      overshadow,
      UUID,
    } = defineScrollbarProps(view, scrollbars);

    const toggleTargetHandler = (
      isEnter: boolean,
      targetScroll: Scrollbars | null,
      shadow: boolean
    ) => {
      if (verticalScroll) verticalScroll.mouseInTarget = isEnter;
      if (horizontalScroll) horizontalScroll.mouseInTarget = isEnter;

      if (BaseScrollbars.targetScroll?.thumbIsPressed) return;

      overshadow(shadow);

      BaseScrollbars.targetScroll = targetScroll;
    };

    const handlerWheel = (e: WheelEvent) => {
      if (!verticalScroll || !verticalScroll?.isRendered) return;
      if (BaseScrollbars.targetScroll?.thumbIsPressed) {
        verticalScroll.scrollWheel(e);
      } else if (!BaseScrollbars.targetScroll) {
        BaseScrollbars.targetScroll = verticalScroll;
      }
      BaseScrollbars.targetScroll.scrollWheel(e);
    };

    const resizeTrigger: ResizeObserverCallback = (entries) => {
      let propsResized: Array<SizeDimensionProps> = [];

      entries.forEach((entry) => {
        if (
          (entry.target as HTMLElementExtended).__extendedInstance.scrollbars
            ?.UUID !== UUID
        )
          return;

        const { width, height } = entry.contentRect;
        const { oldWidth, oldHeight } = contentOldSize;

        if (oldWidth !== width) {
          propsResized.push("width");
        }
        if (oldHeight !== height) {
          propsResized.push("height");
        }

        contentOldSize.oldWidth = width;
        contentOldSize.oldHeight = height;
      });

      scrollbars.vertical?.setTargetPropsResized(propsResized);
      scrollbars.horizontal?.setTargetPropsResized(propsResized);


      // requestAnimationFrame(() => {
        scrollbars.vertical?.resize();
        scrollbars.horizontal?.resize();

      // })

    };

    on(
      view,
      "mouseenter",
      toggleTargetHandler.bind(null, true, verticalScroll, false)
    );
    on(view, "mouseleave", toggleTargetHandler.bind(null, false, null, true));
    on(view, "mousewheel", handlerWheel);

    const resizeOb: ResizeObserver = new ResizeObserver(resizeTrigger);

    resizeOb.observe(view);
    resizeOb.observe(scroller);
  }
}

export default BaseScrollbars;

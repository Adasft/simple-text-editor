// import { Scroll } from "../scroll/scroll"
import createElement from "../dom/createElement";
import css from "../dom/css";
import { isUndef } from "../helpers";
import Scrollbars from "../scrollbar/scrollbar";
import { CoorsMap } from "../types/scrollbarTypes";

type RenderedViewOptions = {
  view: HTMLElement;
  rendered: HTMLElement;
  list: Array<ListProps>;
  itemHeight: number;
  offsetTop: number;
  scroll: Scrollbars;
};

type ListProps = {
  element: HTMLElement;
  top: number;
  height: number;
  prevSibling: ListProps | undefined;
  isRendered: boolean;

  getTop(index?: number): number;
};

type RenderedViewRange = {
  start: number
  end: number
  size: number
}

interface RenderedViewProps {
  view: HTMLElement;
  rendered: HTMLElement;
  list: Array<ListProps>;
  itemHeight: number;

  calculateItemsRendered(): number;
}

export function createItem(prevSibling: ListProps, content: string) {
  const element = document.createElement("div");
  const pre = document.createElement("pre");
  pre.textContent = content;
  element.classList.add("item");
  element.appendChild(pre);
  css({ fontSize: 15, lineHeight: String(1.5), height: 22.5 }).from(element);
  // console.log(element.clientWidth)
  const item = {
    element,
    height: 22.5,
    top: 0,
    isRendered: false,
    prevSibling,
    getTop(index?: number) {
      let top = 0;
      if (typeof index === "number") top = this.height * index;
      else if (this.prevSibling) {
        top = this.prevSibling.top + this.prevSibling.height;
      }
      // console.log({ element, top })
      this.top = top;
      css({ top }).from(this.element);
      return top;
    },
  };

  return item;
}

export default class RenderedView implements RenderedViewProps {
  view: HTMLElement;
  rendered: HTMLElement;
  list: Array<ListProps>;
  itemHeight: number;
  scroll: Scrollbars;
  #beginIndex: number = 0;
  #endIndex: number = 0;
  #renderedHeight: number = 0;

  constructor({
    view,
    rendered,
    list,
    itemHeight,
    offsetTop,
    scroll,
  }: RenderedViewOptions) {
    this.view = view;
    this.rendered = rendered;
    this.list = list;
    this.itemHeight = itemHeight;
    this.scroll = scroll;
    this.#beginIndex = this.getMarkBegin();
    this.#endIndex = this.getMarkEnd();
    this.#renderedHeight = this.scroll.clientHeight;
    this.#firstInjection();

    Scrollbars.on(this.scroll, "scroll", (s: Scrollbars) => {
      this.dynamicInjectionOfItems();
    });
  }

  calculateItemsRendered(): number {
    const { height } = this.#getRect(this.view);
    const numberItems = Math.floor(height / this.itemHeight);
    return Math.min(numberItems, this.list.length);
  }

  #firstInjection() {
    const numberItems = this.calculateItemsRendered();
    console.log(this.list, numberItems, this.#beginIndex);
    for (let i = this.#beginIndex; i < numberItems; i++) {
      const item = this.list[i];
      item.getTop();
      this.rendered.appendChild(item.element);
      item.isRendered = true;
    }
  }

  #getRect(item: HTMLElement): DOMRect {
    return item.getBoundingClientRect();
  }

  #normalizeIndex(index: number) {
    return index >= this.list.length
      ? this.list.length - 1
      : index < 0
      ? 0
      : index;
  }

  getMarkBegin() {
    return this.#normalizeIndex(
      Math.floor(this.#getOffsetTop() / this.itemHeight)
    );
  }

  getMarkEnd() {
    return this.#normalizeIndex(
      Math.floor(this.#getOffsetBottom() / this.itemHeight)
    );
  }

  #getItemBottom(item: ListProps, index: number) {
    return item.getTop(index) + this.itemHeight;
  }

  #removeItemFromDOM(item: ListProps) {
    item.element.remove();
    item.isRendered = false;
  }

  #appendItemToDOM(item: ListProps) {
    this.rendered.appendChild(item.element);
    item.isRendered = true;
  }

  dynamicInjectionOfItems() {
    const { height } = this.#getRect(this.view);
    const offsetTop = this.scroll.movement;
    const offsetBottom = offsetTop + height;
    const indexMarkBegin = this.getMarkBegin();
    const indexMarkEnd = this.getMarkEnd();

    if (
      indexMarkBegin === this.#beginIndex ||
      indexMarkEnd === this.#endIndex
    ) {
      return;
    }

    let i: number, item: ListProps;

    if (this.scroll.direction.y > 0) {
      (i = this.#beginIndex), (item = this.list[i]);
      this.injectDown(
        item,
        i,
        indexMarkBegin,
        indexMarkEnd,
        offsetTop,
        offsetBottom
      );
    } else {
      (i = this.#endIndex), (item = this.list[i]);
      this.injectUp(
        item,
        i,
        indexMarkBegin,
        indexMarkEnd,
        offsetTop,
        offsetBottom
      );
    }

    this.#beginIndex = indexMarkBegin;
    this.#endIndex = indexMarkEnd;
  }

  injectUp(
    item: ListProps,
    i: number,
    indexMarkBegin: number,
    indexMarkEnd: number,
    offsetTop: number,
    offsetBottom: number
  ) {
    while (
      item.isRendered &&
      i >= indexMarkEnd &&
      item.getTop(i) >= offsetBottom
    ) {
      this.#removeItemFromDOM(item);
      i--;
      item = this.list[i];
    }

    (i = indexMarkBegin), (item = this.list[i]);
    while (
      !item.isRendered &&
      i <= this.#beginIndex &&
      this.#getItemBottom(item, i) >= offsetTop &&
      item.getTop(i) < offsetBottom
    ) {
      this.#appendItemToDOM(item);
      i++;
      item = this.list[i];
    }
  }

  injectDown(
    item: ListProps,
    i: number,
    indexMarkBegin: number,
    indexMarkEnd: number,
    offsetTop: number,
    offsetBottom: number
  ) {
    while (
      item.isRendered &&
      i <= indexMarkBegin &&
      this.#getItemBottom(item, i) <= offsetTop
    ) {
      this.#removeItemFromDOM(item);
      i++;
      item = this.list[i];
    }

    (i = indexMarkEnd), (item = this.list[i]);
    while (
      !item.isRendered &&
      i >= this.#endIndex &&
      item.getTop(i) <= offsetBottom &&
      this.#getItemBottom(item, i) > offsetTop
    ) {
      this.#appendItemToDOM(item);
      i--;
      item = this.list[i];
    }
  }

  #getOffsetTop() {
    return this.scroll.movement;
  }

  #getOffsetBottom() {
    return this.#getOffsetTop() + this.#getRect(this.view).height;
  }

  createNewItems(from: number, manyItems: number) {
    // TODO: Eliminar
    const items: Array<ListProps> = Array(manyItems).fill(null);
    let prevSibling = this.list[from];
    return items.map(
      (item) =>
        (prevSibling = createItem(prevSibling, Math.random().toString(15)))
    );
  }

  updateRenderedHeight(height: number, shouldForce: boolean = false) {
    height = this.scroll.clientHeight + height
    css({ height }).from(this.rendered);
    if(shouldForce) {
      this.scroll.cancelEmitter('scroll')
      this.scroll.forceResizeShouldRemove()
    } else {8
      this.scroll.forceResizeShouldAppend();
    }
  }

  keepIndex(index: number): number {
    return index === this.list.length ? index - 1 : index;
  }

  removeItems(range: RenderedViewRange): void {
    if(range.end >= this.list.length) {
      range.end = this.list.length - 1
    }
    const removedItems = this.list.splice(range.start+1, range.size)
    const indexMarkEnd =  this.getMarkEnd()
    const endViewedItemsRange = range.end > indexMarkEnd
      ? indexMarkEnd - range.start+1
      : range.size
    const viewedItemsRange: RenderedViewRange = { 
      start: 0, 
      end: endViewedItemsRange,
      size: endViewedItemsRange
    }

    // this.scroll.noCancelMoveByEphemeralResize = false;

    const height = viewedItemsRange.size * this.itemHeight
    this.updateRenderedHeight(-height, true)
    
    let i=viewedItemsRange.start, item
    for(; i<viewedItemsRange.end; i++) {
      item = removedItems[i]
      this.#removeItemFromDOM(item)
    }
    
    i = indexMarkEnd, item = this.list[i]
    while(i >= range.start+1 && item.getTop(i) <= this.#getOffsetBottom()) {
      this.#appendItemToDOM(item)
      i--
      item = this.list[i]
    }

    
    // this.scroll.moveThumb(this.scroll.scrollTop)
    // requestAnimationFrame(() => {
   

    // })
  }

  injectNewItems(index: number, items: Array<ListProps>) {
    if (!items.length || index < this.getMarkBegin()) return;

    if (index < 0 || index >= this.list.length) {
      index = this.list.length - 1;
    }

    const lastTop = items.at(-1)?.getTop(index + items.length);
    const height = items.length * this.itemHeight;
    const afterItemIndex = this.list[this.keepIndex(index + 1)];
    const firstItem = items.at(0);
    const lastItem = items.at(-1);

    if (firstItem) {
      firstItem.prevSibling = afterItemIndex.prevSibling;
    }

    afterItemIndex.prevSibling = lastItem;

    this.list.splice(index + 1, 0, ...items);
    this.updateRenderedHeight(height);

    this.scroll.noCancelMoveByEphemeralResize = false;

    // Agregarmos los elementos que se hicieron visibles en la vista despues de agregar los nuevos elementos
    let i = this.keepIndex(index + 1);
    let item = this.list[i];
    while (!item.isRendered && item.getTop(i) <= this.#getOffsetBottom()) {
      this.#appendItemToDOM(item);
      i++;
      item = this.list[i];
    }

    // Eliminamos los elementos que se dejaron de ver al momento de agregar nuevos elementos a la vista.
    i = this.keepIndex(index + items.length + 1);
    item = this.list[i];
    while (item.isRendered) {
      if (item.getTop(i) > this.#getOffsetBottom()) {
        this.#removeItemFromDOM(item);
      }
      i++;
      item = this.list[i];
    }

    // Movemos la posicion del scroll al final del ultimo elemento nuevo agregado.
    // Solo si la cantidad de elementos sobresale de la vista - this.#getRect(this.view).height + this.itemHeight * 2
    if (
      lastTop &&
      lastTop > this.#getOffsetBottom() &&
      this.scroll.isRendered
    ) {
      const viewedItemsCount = (this.calculateItemsRendered() - 1) * this.itemHeight
      const viewedLastItemTop = this.scroll.relativeToScroll(
        lastTop - viewedItemsCount
      );
      this.scroll.moveThumb(viewedLastItemTop);
    }

  }
}

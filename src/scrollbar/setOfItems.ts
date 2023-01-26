import css from "../dom/css";

export default class SetOfItems {
  #storage: Set<HTMLElement> = new Set();

  public add(...values: Array<HTMLElement>): void {
    values.forEach((value) => this.#storage.add(value));
  }

  public remove(value: HTMLElement): boolean {
    return this.#storage.delete(value);
  }

  public empty(): boolean {
    return !this.#storage.size;
  }

  public move(pixels: number): void {
    this.#storage.forEach((item) => {
      if (!(item instanceof HTMLElement)) return;
      css({ transform: `translateY(${-pixels}px)` }).from(item);
    });
  }
}

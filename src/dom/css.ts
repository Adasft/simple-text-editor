import { getProp, toPixel, toSnakeCase } from "../helpers";

export interface CSSStyler {
  from(target: HTMLElement): void;
  toString(): string;
}

type CSSStylesRules = {
  [style in keyof CSSStyleDeclaration]?: string | number | undefined;
};

class CSSStylerFactory implements CSSStyler {
  static #styles: CSSStylesRules = {};
  static #stylesRules: Array<string> = [];

  static #instance: CSSStylerFactory;

  private constructor() {}

  public static Styler(): CSSStylerFactory {
    if (!CSSStylerFactory.#instance) {
      CSSStylerFactory.#instance = new CSSStylerFactory();
    }
    return CSSStylerFactory.#instance;
  }

  public declareStyles(styles: CSSStylesRules): void {
    CSSStylerFactory.#styles = styles;
    CSSStylerFactory.#stylesRules = Object.keys(styles);
  }

  public from(target: HTMLElement): void {
    CSSStylerFactory.#stylesRules.forEach((prop) => {
      target.style.setProperty(
        toSnakeCase(prop),
        toPixel(getProp(CSSStylerFactory.#styles, prop))
      );
    });
  }

  public toString(): string {
    return CSSStylerFactory.#stylesRules
      .map(
        (prop) =>
          `${toSnakeCase(prop)}:${toPixel(
            getProp(CSSStylerFactory.#styles, prop)
          )}`
      )
      .join(";");
  }
}

const styler = CSSStylerFactory.Styler();

export default function css(styles: CSSStylesRules): CSSStyler {
  styler.declareStyles(styles);
  return styler;
}

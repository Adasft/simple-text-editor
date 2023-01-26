export function isDef(val: any): boolean {
  return val !== undefined && val !== null;
}

export function isUndef(val: any): boolean {
  return val === undefined || val === null;
}

export function defineProperty(
  target: object,
  prop: string,
  value: any,
  config: object = { writable: false, enumerable: true, configurable: true }
) {
  Object.defineProperty(target, prop, { value, ...config });
}

export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

export function toPixel(val: string | number): string {
  return typeof val === "number" ? `${val}px` : val;
}

export function hasOwn(target: object | undefined, prop: string): boolean {
  return !!target?.hasOwnProperty(prop);
}

export function getUUID(): string {
  if (typeof crypto === "undefined" || !crypto.randomUUID) {
    const p4 = () =>
      Math.floor((1 + Math.random()) * (0x2710 - 0x3e8) + 0x3e8).toString(16);
    return `${p4() + p4()}-${p4()}-${p4()}-${p4()}-${p4() + p4() + p4()}`;
  }
  return crypto.randomUUID();
}

export function getProp(target: any, key: string): any {
  return target[key as keyof typeof target];
}

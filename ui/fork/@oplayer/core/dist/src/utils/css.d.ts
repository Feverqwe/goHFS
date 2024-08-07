export declare function css(css: DeepCssObject, selector: string): string[];
export type CssKey = Tras<Extract<keyof CSSStyleDeclaration, string>> | `@media ${string}` | `@keyframes ${string}` | `@global${string}`;
export type cssValue = string | number | boolean;
export type CssObject = Record<CssKey, cssValue>;
export type DeepCssObject = Record<CssKey, CssObject | cssValue>;
export type Tras<T extends string, Rusult extends string = ''> = T extends `${infer L}${infer R}` ? L extends 'Q' | 'W' | 'E' | 'R' | 'T' | 'Y' | 'U' | 'I' | 'O' | 'P' | 'A' | 'S' | 'D' | 'F' | 'G' | 'H' | 'J' | 'K' | 'L' | 'Z' | 'X' | 'C' | 'V' | 'B' | 'N' | 'M' ? Tras<R, `${Rusult}-${Lowercase<L>}`> : Tras<R, `${Rusult}${L}`> : `${Rusult}${T}`;
//# sourceMappingURL=css.d.ts.map
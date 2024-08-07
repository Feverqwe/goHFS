import { DeepCssObject } from './css';
export declare namespace $ {
    const create: <K extends keyof HTMLElementTagNameMap>(t: K | `${K}.${string}`, attrs?: Record<string, string | boolean | number | undefined>, tpl?: string) => HTMLElementTagNameMap[K];
    const render: <T extends Element>(elm: T, container: HTMLElement) => T;
    const isBrowser: () => boolean;
    function createSheet(key: string): CSSStyleSheet | null;
    const createCss: ({ sheet, ssrData }: {
        sheet: CSSStyleSheet | null;
        ssrData: string[];
    }) => (...arg: [DeepCssObject] | [string] | any[]) => string;
    const createStyled: () => {
        css: (...arg: [DeepCssObject] | [string] | any[]) => string;
        getCssValue: () => string[];
    };
    const css: (...arg: [DeepCssObject] | [string] | any[]) => string, getCssValue: () => string[];
    const cls: (str: string) => string;
}
export default $;
//# sourceMappingURL=dom.d.ts.map
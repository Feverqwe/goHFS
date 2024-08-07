import type { UIInterface } from '../types';
export declare const arrowSvg: (className?: string) => string;
export declare const selectorOption: (name: string, icon?: string) => string;
export declare const nexter: (name: string, icon?: string) => string;
export declare const back: (name: string) => string;
export declare const switcher: (name: string, icon?: string) => string;
export type Panel = {
    $ref: HTMLElement;
    key: string;
    select?: Function;
    parent?: Panel;
};
export default function (it: UIInterface): void;
//# sourceMappingURL=Setting.d.ts.map
import type Player from '@oplayer/core';
export declare function clamp(value: number, min: number, max: number): number;
export declare function padZero(time: number): string;
export declare function formatTime(duration: number): string;
export declare function download(url: string, name: string): void;
export declare const resolveVideoAndWatermarkDataURL: (player: Player) => string | Error;
export declare const screenShot: (player: Player) => void;
export declare const debounce: (fn: () => void, ms?: number) => {
    callee: () => void;
    clear: () => void | null;
};
export declare const siblings: (el: HTMLElement, cb?: ((el: HTMLElement) => void) | undefined) => (Element | undefined)[];
export declare function addClass(target: HTMLElement, className: string): HTMLElement;
export declare function removeClass(target: HTMLElement, className: string): HTMLElement;
export declare function toggleClass(target: HTMLElement, className: string): boolean;
export declare function hasClass(target: HTMLElement, className: string): boolean;
export declare const DRAG_EVENT_MAP: {
    readonly dragStart: "mousedown" | "touchstart";
    readonly dragMove: "mousemove" | "touchmove";
    readonly dragEnd: "mouseup" | "touchend";
};
//# sourceMappingURL=utils.d.ts.map
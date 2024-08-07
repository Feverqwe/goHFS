import { EVENTS } from './constants';
import type { Player } from './player';
export type Source = {
    src: string;
    poster?: string;
    title?: string;
    format?: 'auto'
    /** hls.js */
     | 'hls' | 'm3u8'
    /** dash.js */
     | 'dash' | 'mpd'
    /** mpegts.js */
     | 'flv' | 'm2ts' | 'mpegts'
    /** other */
     | string;
    type?: 'string';
};
export type Lang = 'auto' | 'zh' | 'zh-CN' | 'en';
export interface PlayerOptions {
    source?: Source;
    autoplay?: boolean;
    autopause?: boolean;
    muted?: boolean;
    loop?: boolean;
    volume?: number;
    playbackRate?: number;
    playsinline?: boolean;
    preload?: 'auto' | 'metadata' | 'none';
    lang?: Lang;
    isLive?: boolean;
    videoAttr?: Record<string, boolean | string>;
    isNativeUI?: () => boolean;
}
export interface Destroyable {
    destroy: () => void | Promise<void>;
    [key: string]: any;
}
export interface PlayerPlugin {
    name: string;
    key?: string;
    version?: string;
    apply: (player: Player) => any;
    destroy?: () => void | Promise<void>;
    load?: (player: Player, src: Source) => false | Destroyable | Promise<false | Destroyable>;
    unload?: () => void | Promise<void>;
}
export type DefaultPlayerEvent = (typeof EVENTS)[number] | (typeof EVENTS)[number][];
export type PlayerEventName = DefaultPlayerEvent | string | string[];
export type PlayerEvent<T = any> = {
    type: PlayerEventName;
    payload: T;
};
export type PlayerListener = (event: PlayerEvent) => void;
export type PartialRequired<T, K extends keyof T> = {
    [P in K]-?: T[P];
} & Omit<T, K>;
export type RequiredPartial<T, K extends keyof T> = Required<Omit<T, K>> & {
    [P in K]?: T[P];
};
//# sourceMappingURL=types.d.ts.map
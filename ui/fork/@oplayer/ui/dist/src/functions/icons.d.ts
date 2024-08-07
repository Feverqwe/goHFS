import type { UiConfig } from '../types';
export declare const ICONS_MAP: {
    play: string;
    pause: string;
    volume: string[];
    fullscreen: string[];
    pip: string[];
    setting: string;
    screenshot: string;
    playbackRate: string;
    subtitle: string;
    loop: string;
    progressIndicator: null;
    loadingIndicator: null;
    quality: string;
    lang: string;
    chromecast: null;
    danmaku: null;
    playlist: null;
    previous: null;
    next: null;
};
export declare namespace Icons {
    const setupIcons: (icons: UiConfig['icons']) => {
        play: string;
        pause: string;
        volume: string[];
        fullscreen: string[];
        pip: string[];
        setting: string;
        screenshot: string;
        playbackRate: string;
        subtitle: string;
        loop: string;
        progressIndicator: null;
        loadingIndicator: null;
        quality: string;
        lang: string;
        chromecast: null;
        danmaku: null;
        playlist: null;
        previous: null;
        next: null;
    };
    const get: <K extends "play" | "pause" | "volume" | "fullscreen" | "pip" | "setting" | "screenshot" | "playbackRate" | "subtitle" | "loop" | "progressIndicator" | "loadingIndicator" | "quality" | "lang" | "chromecast" | "danmaku" | "playlist" | "previous" | "next">(name: K) => {
        play: string;
        pause: string;
        volume: string[];
        fullscreen: string[];
        pip: string[];
        setting: string;
        screenshot: string;
        playbackRate: string;
        subtitle: string;
        loop: string;
        progressIndicator: null;
        loadingIndicator: null;
        quality: string;
        lang: string;
        chromecast: null;
        danmaku: null;
        playlist: null;
        previous: null;
        next: null;
    }[K];
}
//# sourceMappingURL=icons.d.ts.map
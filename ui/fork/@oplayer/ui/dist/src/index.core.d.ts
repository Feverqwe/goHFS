import { Player, $ } from '@oplayer/core';
import ui from './index';
declare const _default: typeof Player & {
    $: typeof $;
    EVENTS: readonly ["abort", "canplay", "canplaythrough", "durationchange", "emptied", "ended", "error", "loadeddata", "loadedmetadata", "loadstart", "pause", "play", "playing", "progress", "ratechange", "seeked", "seeking", "stalled", "suspend", "timeupdate", "volumechange", "waiting", "encrypted", "waitingforkey", "enterpictureinpicture", "leavepictureinpicture", "contextmenu", "loadedplugin", "videoqualitychange", "videosourcechange", "destroy"];
    OH_EVENTS: readonly ["loadedplugin", "videoqualitychange", "videosourcechange", "destroy"];
    VIDEO_EVENTS: readonly ["abort", "canplay", "canplaythrough", "durationchange", "emptied", "ended", "error", "loadeddata", "loadedmetadata", "loadstart", "pause", "play", "playing", "progress", "ratechange", "seeked", "seeking", "stalled", "suspend", "timeupdate", "volumechange", "waiting", "encrypted", "waitingforkey", "enterpictureinpicture", "leavepictureinpicture"];
    PLAYER_EVENTS: readonly ["contextmenu"];
} & {
    isMobile: boolean;
    isiPad: boolean;
    isiPhone: boolean;
    isIOS: boolean;
    isQQBrowser: boolean;
} & {
    ui: typeof ui;
};
export default _default;
//# sourceMappingURL=index.core.d.ts.map
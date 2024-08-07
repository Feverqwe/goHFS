import type { PartialRequired, Player } from '@oplayer/core';
import type { Subtitle as SubtitleConfig, SubtitleSource, UIInterface } from '../types';
export default function (it: UIInterface): Subtitle;
export declare class Subtitle {
    player: Player;
    setting: UIInterface['setting'];
    el: HTMLElement;
    options: PartialRequired<SubtitleConfig, 'source'>;
    $dom: HTMLDivElement;
    $track: HTMLTrackElement;
    $iosTrack?: HTMLTrackElement;
    isShow: boolean;
    currentSubtitle?: SubtitleSource;
    constructor(player: Player, setting: UIInterface['setting'], el: HTMLElement, options?: SubtitleConfig);
    changeSource(payload: SubtitleSource[]): void;
    createContainer(): void;
    createTrack(): void;
    changeOffset(): void;
    processDefault(payload: SubtitleSource[]): void;
    update: () => void;
    show(): void;
    hide(): void;
    fetchSubtitle(): Promise<void> | undefined;
    loadSetting(): void;
    destroy(): void;
}
//# sourceMappingURL=Subtitle.d.ts.map
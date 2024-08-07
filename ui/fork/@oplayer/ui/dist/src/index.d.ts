import { Subtitle } from './components/Subtitle';
import type { Player } from '@oplayer/core';
import type { Highlight, MenuBar, Setting, Thumbnails, UiConfig, UIInterface } from './types';
import { ICONS_MAP } from './functions/icons';
declare class UI implements UIInterface {
    config: UiConfig;
    key: string;
    version: string;
    name: string;
    player: Player;
    $root: HTMLDivElement;
    $coverButton?: HTMLDivElement;
    $controllerBar?: HTMLDivElement | undefined;
    $controllerBottom: HTMLDivElement;
    $mask: HTMLDivElement;
    $setting: HTMLDivElement;
    $subtitle: HTMLDivElement;
    icons: typeof ICONS_MAP;
    subtitle: Subtitle;
    notice: (text: string, position?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'top-left' | 'top-center' | 'top-right' | 'left-bottom') => void;
    keyboard: {
        register: (payload: Record<string, (e: any) => void>) => void;
        unregister: (keys: string[]) => void;
    };
    setting: {
        register: (payload: Setting | Setting[]) => void;
        unregister: (key: string) => void;
        updateLabel: (key: string, text: string) => void;
        select: (key: string, value: boolean | number, shouldBeCallFn?: Boolean) => void;
    };
    menu: {
        register: (menu: MenuBar) => void;
        unregister: (key: string) => void;
        select: (name: string, index: number) => void;
    };
    toggleController: () => void;
    changHighlightSource: (highlights: Highlight[]) => void;
    changThumbnails: (src: Thumbnails) => void;
    progressHoverCallback: ((rate?: number /** 0 ~ 1 */) => void)[];
    constructor(config: UiConfig);
    apply(player: Player): this | undefined;
    destroy(): void;
    /**
     * @deprecated use changHighlightSource
     */
    highlight(highlights: Highlight[]): void;
}
export default function create(config?: UiConfig): UI;
export * from './types';
//# sourceMappingURL=index.d.ts.map
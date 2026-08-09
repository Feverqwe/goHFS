import videojs from 'video.js';
import type ButtonClass from 'video.js/dist/types/button';
import type Player from 'video.js/dist/types/player';

const COMPONENT_NAME = 'GoHfsSettingsButton';
const Button = videojs.getComponent('Button') as typeof ButtonClass;

interface SettingsButtonOptions {
  children?: unknown[];
  className?: string;
  onOpen?: (anchor: HTMLElement) => void;
}

class SettingsButton extends Button {
  private readonly onOpen: (anchor: HTMLElement) => void;

  constructor(player: Player, options?: SettingsButtonOptions) {
    super(player, {controlText: 'Settings'});
    this.onOpen = options?.onOpen ?? (() => undefined);
    this.el().querySelector('.vjs-icon-placeholder')?.classList.add('vjs-icon-cog');
  }

  buildCSSClass(): string {
    return `vjs-settings-button ${super.buildCSSClass()}`;
  }

  handleClick(): void {
    this.onOpen(this.el() as HTMLElement);
  }
}

if (!videojs.getComponent(COMPONENT_NAME)) {
  videojs.registerComponent(COMPONENT_NAME, SettingsButton);
}

export function addSettingsButton(player: Player, onOpen: (anchor: HTMLElement) => void): void {
  const controlBar = player.getChild('controlBar');
  if (!controlBar) return;

  const fullscreenToggle = controlBar.getChild('FullscreenToggle');
  const fullscreenIndex = fullscreenToggle ? controlBar.children().indexOf(fullscreenToggle) : -1;
  controlBar.addChild(COMPONENT_NAME, {onOpen}, fullscreenIndex >= 0 ? fullscreenIndex : undefined);
}

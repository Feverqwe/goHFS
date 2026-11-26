import type {RefObject} from 'react';
import videojs from 'video.js';
import type ButtonClass from 'video.js/dist/types/button';
import type Player from 'video.js/dist/types/player';

const Button = videojs.getComponent('Button') as typeof ButtonClass;

export interface PlaylistControlOptions {
  panelId: string;
  panelOpen: boolean;
  toggleRef: RefObject<HTMLButtonElement | null>;
  onToggle: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

class PlaylistButton extends Button {
  constructor(
    player: Player,
    label: string,
    icon: string,
    private readonly activate: () => void,
  ) {
    super(player, {controlText: label});
    this.el().querySelector('.vjs-icon-placeholder')?.classList.add(icon);
  }

  buildCSSClass(): string {
    return `vjs-playlist-control ${super.buildCSSClass()}`;
  }

  handleClick(): void {
    this.activate();
  }
}

export function addPlaylistControls(player: Player, getOptions: () => PlaylistControlOptions) {
  const bar = player.getChild('controlBar');
  if (!bar) return undefined;

  const previous = new PlaylistButton(player, 'Previous file', 'vjs-icon-previous-item', () =>
    getOptions().onPrevious?.(),
  );
  const next = new PlaylistButton(player, 'Next file', 'vjs-icon-next-item', () =>
    getOptions().onNext?.(),
  );
  const toggle = new PlaylistButton(player, 'Playlist', 'vjs-icon-chapters', () => {
    const {onToggle, panelOpen} = getOptions();
    if (player.isFullscreen()) {
      player
        .exitFullscreen()
        .then(() => {
          if (!panelOpen && !player.isDisposed()) onToggle();
        })
        .catch((err: unknown) => console.error('fullscreen error: %O', err));
      return;
    }
    onToggle();
  });
  toggle.addClass('vjs-playlist-toggle');

  const playToggle = bar.getChild('PlayToggle');
  const playIndex = playToggle ? bar.children().indexOf(playToggle) : 0;
  bar.addChild(previous, {}, playIndex);
  bar.addChild(next, {}, playIndex + 2);
  const settings = bar.getChild('GoHfsSettingsButton');
  bar.addChild(toggle, {}, settings ? bar.children().indexOf(settings) : undefined);
  player.addClass('vjs-has-playlist');

  const toggleElement = toggle.el() as HTMLButtonElement;
  const {toggleRef} = getOptions();
  toggleRef.current = toggleElement;

  const sync = () => {
    const {onPrevious, onNext, panelOpen, panelId} = getOptions();
    if (onPrevious) previous.enable();
    else previous.disable();
    if (onNext) next.enable();
    else next.disable();
    toggleElement.setAttribute('aria-expanded', String(panelOpen));
    if (panelOpen) toggleElement.setAttribute('aria-controls', panelId);
    else toggleElement.removeAttribute('aria-controls');
  };

  sync();
  return {
    sync,
    dispose: () => {
      if (toggleRef.current === toggleElement) toggleRef.current = null;
    },
  };
}

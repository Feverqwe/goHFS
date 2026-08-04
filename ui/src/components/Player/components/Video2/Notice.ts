import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import {NOTICE_DURATION} from './constants';

const COMPONENT_NAME = 'GoHfsNotice';
const Component = videojs.getComponent('Component');

/* eslint-disable react/no-unused-class-component-methods */
class Notice extends Component {
  private hideTimeout?: number;

  createEl(): Element {
    return super.createEl(
      'div',
      {className: 'vjs-notice'},
      {'aria-atomic': 'true', 'aria-live': 'polite'},
    );
  }

  display(text: string): void {
    this.el().textContent = text;
    this.addClass('vjs-notice-visible');
    window.clearTimeout(this.hideTimeout);
    this.hideTimeout = window.setTimeout(() => {
      this.removeClass('vjs-notice-visible');
    }, NOTICE_DURATION);
  }

  dispose(): void {
    window.clearTimeout(this.hideTimeout);
    super.dispose();
  }
}

if (!videojs.getComponent(COMPONENT_NAME)) {
  videojs.registerComponent(COMPONENT_NAME, Notice);
}

export function addNotice(player: Player): Notice {
  return player.addChild(COMPONENT_NAME) as Notice;
}

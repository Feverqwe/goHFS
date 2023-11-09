import React, {FC, useContext, useEffect, useRef, useState} from 'react';
import {Player} from '@oplayer/core';
import OUI from '@oplayer/ui';
import {styled} from '@mui/material';
import Path from 'path-browserify';
import Hls from 'hls.js';
import {isMobile as isMobilePlayer} from '@oplayer/core/src/utils/platform';
import {api} from '../../../../tools/api';
import {getSidV2} from '../../utils';
import {VideoMetadata} from '../../types';
import {TITLE} from '../../constants';
import UrlDialogCtx from '../UrlDialog/UrlDialogCtx';
import {getOption, setOption} from '../../../Folder/utils';
import {SHORT_SKIP, SKIP} from "./constants";

const PLAYER_MPB = 'player.mpb';

const CtrTag = styled('div')(() => {
  return {
    width: '100%',
    height: '100%',
  };
});

interface Video2Props {
  url: string,
  metadata?: VideoMetadata;
}

const Video2: FC<Video2Props> = ({url, metadata}) => {
  const toggleUrlDialog = useContext(UrlDialogCtx);
  const [isPlaying, setPlaying] = useState(false);
  const refCtr = useRef<HTMLDivElement>(null);
  const refStartTime = useRef(metadata ?? 0);

  useEffect(() => {
    let uri;
    try {
      uri = url && new URL(url, location.href);
    } catch (err) {
      // pass
    }
    if (uri) {
      const name = Path.basename(uri.pathname);
      document.title = `[${isPlaying ? '>' : '||'}] ${decodeURIComponent(name)}`;
    }
    return () => {
      document.title = TITLE;
    };
  }, [url, isPlaying]);

  useEffect(() => {
    const ctrEl = refCtr.current;
    if (!ctrEl || !url) return;

    let hls: Hls | undefined;
    if (/\.m3u8$/.test(url)) {
      hls = new Hls();
    }

    const startTime = refStartTime.current;

    const player = Player.make(ctrEl, {
      autoplay: false,
    });

    let ui: ReturnType<typeof OUI>;
    player.use([ui = OUI({
      autoFocus: true,
      pictureInPicture: false,
      miniProgressBar: getOption(PLAYER_MPB, false),
      coverButton: isMobilePlayer,
      ctrlHideBehavior: isMobilePlayer ? 'delay' : 'hover',
      speeds: ['2.0', '1.75', '1.5', '1.25', '1.0', '0.75', '0.5'].reverse(),
      settings: [{
        name: 'Picture in Picture',
        type: 'switcher',
        onChange: async () => {
          if (player.isInPip) {
            await player.exitPip();
          } else {
            await player.enterPip();
          }
        },
      }, {
        name: 'Mini progress bar',
        type: 'switcher',
        onChange: () => {
          const value = getOption(PLAYER_MPB, false);
          setOption(PLAYER_MPB, !value);
        },
        default: getOption(PLAYER_MPB, false),
      }],
      theme: {
        primaryColor: '#90caf9',
      },
    })])
      .create();

    ui.keyboard.unregister?.(['s', 'f', 'ArrowLeft', 'ArrowRight']);

    const emitTime = () => {
      player.emit('notice', {
        text: `${formatTime(player.currentTime)} / ${formatTime(player.duration)}`,
      });
    };

    const emitPlaybackRate = () => {
      player.emit('notice', {
        text: `Playback rate: ${player.playbackRate}`,
      });
    };

    let onKeydown: (e: KeyboardEvent) => void;
    document.addEventListener('keydown', onKeydown = (e: KeyboardEvent) => {
      // console.log('keydown: %s', e.code);
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'INPUT') return;

      const {code} = e;

      const isMeta = e.ctrlKey || e.metaKey || e.shiftKey;

      if (isMeta) {
        switch (code) {
          case 'Period': {
            e.preventDefault();
            if (player.playbackRate < 2) {
              player.setPlaybackRate(player.playbackRate + 0.25);
            }
            emitPlaybackRate();
            break;
          }
          case 'Comma': {
            e.preventDefault();
            if (player.playbackRate > 0.25) {
              player.setPlaybackRate(player.playbackRate - 0.25);
            }
            emitPlaybackRate();
            break;
          }
          case 'Digit0': {
            e.preventDefault();
            player.setPlaybackRate(1);
            emitPlaybackRate();
            break;
          }
        }
      }

      // Bail if a modifier key is set
      if (isMeta) {
        return;
      }

      // showUrlForm(true);

      switch (code) {
        case 'ArrowLeft': {
          e.preventDefault();
          const offset = e.altKey ? SHORT_SKIP : SKIP;
          player.seek(player.currentTime - offset);
          emitTime();
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          const offset = e.altKey ? SHORT_SKIP : SKIP;
          player.seek(player.currentTime + offset);
          emitTime();
          break;
        }
        case 'KeyF': {
          if (player.isFullScreen) {
            player.exitFullscreen().catch((err) => {
              console.error('exitFullscreen error: %O', err);
            });
          } else {
            player.enterFullscreen().catch((err) => {
              console.error('requestFullscreen error: %O', err);
            });
          }
          break;
        }
        case 'KeyN': {
          e.preventDefault();
          toggleUrlDialog();
          break;
        }
      }
    });

    let onTouchstart: (e: TouchEvent) => void;
    if (isMobilePlayer) {
      let startAt = 0;
      document.addEventListener('touchstart', onTouchstart = (e: TouchEvent) => {
        if (e.target !== ui.$mask) return;

        const touch = e.changedTouches[0];
        if (!touch) return;
        const {clientX, target} = touch;
        const targetEl = target as HTMLElement;
        const w = targetEl.clientWidth;
        const now = Date.now();

        if (now - startAt > 300) {
          startAt = now;
        } else {
          // center click
          if (clientX > (w / 3) && clientX < (w / 3) * 2) {
            if (player.isPlaying) {
              player.pause();
            }
            return;
          }

          let offset = SKIP;
          if (clientX < targetEl.clientWidth / 2) {
            offset *= -1;
          }
          player.seek(player.currentTime + offset);
          emitTime();
        }
      });

      ui.$controllerBottom.setAttribute('style', 'zoom: 1.25');
    }

    player.on('play', () => {
      setPlaying(player.isPlaying);
    });
    player.on('pause', () => {
      setPlaying(player.isPlaying);
    });

    player.once('loadedmetadata', () => {
      if (startTime > 0) {
        player.seek(startTime);
      }
      player.play()?.catch((err) => {
        console.error('auto play error: %O', err);
      });
    });

    const sid = getSidV2(url);
    let lastSyncAt = 0;
    player.on('timeupdate', async () => {
      const now = Date.now();

      if (!lastSyncAt) {
        lastSyncAt = now;
      }

      if (lastSyncAt < now - 5 * 1000) {
        lastSyncAt = now;
        try {
          await api.storageSet({
            [sid]: player.currentTime,
          });
        } catch (err) {
          console.error('Storage.set error: %O', err);
        }
      }
    });

    if (hls) {
      hls.loadSource(url);
      hls.attachMedia(player.$video);
    } else {
      player.load({
        src: url,
      });
    }

    return () => {
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('touchstart', onTouchstart);

      if (hls) {
        hls.detachMedia();
        hls.destroy();
      }

      player.destroy();
    };
  }, [url, toggleUrlDialog]);

  return (
    <CtrTag ref={refCtr} />
  );
};

function padZero(time: number): string {
  return time < 10 ? `0${time}` : `${time}`;
}

function formatTime(duration: number): string {
  if (!isFinite(duration)) return '--:--';
  const h = Math.floor(duration / 3600);
  const m = Math.floor((duration % 3600) / 60);
  const s = Math.floor((duration % 3600) % 60);
  return `${h > 0 ? `${padZero(h)}:` : ''}${padZero(m)}:${padZero(s)}`;
}

export default Video2;

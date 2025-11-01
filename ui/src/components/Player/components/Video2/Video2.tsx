import React, {FC, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {styled} from '@mui/material';
import Path from 'path-browserify';
import Hls from 'hls.js';
import {isMobile as isMobilePlayer} from '../../../../../fork/@oplayer/core/dist/index.es';
import type {Player as PlayerType} from '../../../../../fork/@oplayer/core/dist/src';
import type OUIType from '../../../../../fork/@oplayer/ui/dist/src';
import type {Setting} from '../../../../../fork/@oplayer/ui/dist/src';
import {api} from '../../../../tools/api';
import {getSidV2} from '../../utils';
import {VideoMetadata} from '../../types';
import {TITLE} from '../../constants';
import UrlDialogCtx from '../UrlDialog/UrlDialogCtx';
import {getOption, setOption} from '../../../Folder/utils';
import {SHORT_SKIP, SKIP} from './constants';
import {getProgressKey} from '../../../../tools/common';

// eslint-disable-next-line global-require,@typescript-eslint/no-require-imports
const {Player} = require('../../../../../fork/@oplayer/core/dist/index.es') as {
  Player: typeof PlayerType;
};
// eslint-disable-next-line global-require,@typescript-eslint/no-require-imports
const {default: OUI} = require('../../../../../fork/@oplayer/ui/dist/index.es') as {
  default: typeof OUIType;
};

const PLAYER_MPB = 'player.mpb';
const DEBUG_EVENTS = false;
const SAVE_INTERVAL = 3 * 1000;

const CtrTag = styled('div')(() => {
  return {
    width: '100%',
    height: '100%',

    '.subtitles-ctr': {
      fontSize: '1.875em',
      lineHeight: 'initial',
      pointerEvents: 'auto',
    },

    '.progress-wrapper': {
      padding: '6px 0px 6px',
      transition: 'height, margin-bottom .1s',
      '& .progress > div:nth-child(4) > span': {
        transition: '.1s',
      },
      '&:hover': {
        '& .progress': {
          height: '6px',
          marginBottom: '-1px',
          '& > div:nth-child(4) > span': {
            top: '-3px',
          },
        },
      },
    },
    '.fullscreen': {
      '.progress-wrapper:hover .progress > div:nth-child(4) > span': {
        top: '-5px',
      },
    },
  };
});

interface Video2Props {
  url: string;
  metadata?: VideoMetadata;
}

const Video2: FC<Video2Props> = ({url, metadata}) => {
  const toggleUrlDialog = useContext(UrlDialogCtx);
  const [isPlaying, setPlaying] = useState(false);
  const refCtr = useRef<HTMLDivElement>(null);
  const refStartTime = useRef(metadata ?? 0);

  const title = useMemo(() => {
    let uri;
    try {
      uri = url && new URL(url, location.href);
    } catch (err) {
      // pass
    }
    if (uri) {
      const name = Path.basename(uri.pathname);
      return decodeURIComponent(name);
    }
    return '';
  }, [url]);

  useEffect(() => {
    document.title = `[${isPlaying ? '>' : '||'}] ${title}`;
    return () => {
      document.title = TITLE;
    };
  }, [url, isPlaying, title]);

  useEffect(() => {
    const ctrEl = refCtr.current;
    if (!ctrEl || !url) return;

    let hls: Hls | undefined;
    if (/\.m3u8$/.test(url)) {
      hls = new Hls({
        preferManagedMediaSource: false,
        maxBufferLength: 3 * 60,
      });
    }

    const startTime = refStartTime.current;

    const player = Player.make(ctrEl, {
      autoplay: false,
    });
    // fix for safari
    (player as {play: () => void}).play = () => {
      player.$video.play();
    };

    const ui = OUI({
      autoFocus: true,
      pictureInPicture: false,
      miniProgressBar: getOption(PLAYER_MPB, false),
      coverButton: isMobilePlayer,
      ctrlHideBehavior: isMobilePlayer ? 'delay' : 'hover',
      speeds: [
        '3.0',
        '2.75',
        '2.5',
        '2.25',
        '2.0',
        '1.75',
        '1.5',
        '1.25',
        '1.0',
        '0.75',
        '0.5',
      ].reverse(),
      settings: [
        {
          name: 'Picture in Picture',
          type: 'switcher',
          onChange: async () => {
            if (player.isInPip) {
              await player.exitPip();
            } else {
              await player.enterPip();
            }
          },
        },
        {
          name: 'Mini progress bar',
          type: 'switcher',
          onChange: () => {
            const value = getOption(PLAYER_MPB, false);
            setOption(PLAYER_MPB, !value);
          },
          default: getOption(PLAYER_MPB, false),
        },
      ],
      theme: {
        primaryColor: '#90caf9',
      },
    });

    const plugins = [ui];

    player.use(plugins).create();

    ui.keyboard.unregister?.(['s', 'f', 'ArrowLeft', 'ArrowRight']);

    window.addEventListener('fullscreenchange', () => {
      if (player.isFullScreen) {
        player.$root.classList.add('fullscreen');
      } else {
        player.$root.classList.remove('fullscreen');
      }
    });

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
    document.addEventListener(
      'keydown',
      (onKeydown = (e: KeyboardEvent) => {
        // console.log('keydown: %s', e.code);
        const target = e.target as HTMLElement;
        if (target && target.tagName === 'INPUT') return;

        const {code} = e;

        const isMeta = e.ctrlKey || e.metaKey || e.shiftKey;

        if (isMeta) {
          switch (code) {
            case 'Period': {
              e.preventDefault();
              if (player.playbackRate < 3) {
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
              player.exitFullscreen().catch((err: unknown) => {
                console.error('exitFullscreen error: %O', err);
              });
            } else {
              player.enterFullscreen().catch((err: unknown) => {
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
          case 'KeyS': {
            e.preventDefault();
            const len = hls?.subtitleTracks.length;
            if (hls && len) {
              if (hls.subtitleTrack === len - 1) {
                hls.subtitleTrack = -1;

                player.emit('notice', {
                  text: 'Subtitles: Disabled',
                });
              } else {
                hls.subtitleTrack++;

                const track = hls.subtitleTracks[hls.subtitleTrack];
                player.emit('notice', {
                  text: `Stream ${hls.subtitleTrack}: ${track.name}`,
                });
              }
              updateSettings();
            }
            break;
          }
          case 'KeyA': {
            e.preventDefault();
            const len = hls?.audioTracks.length;
            if (hls && len) {
              if (hls.audioTrack === len - 1) {
                hls.audioTrack = 0;
              } else {
                hls.audioTrack++;
              }

              const track = hls.audioTracks[hls.audioTrack];
              player.emit('notice', {
                text: `Audio ${hls.audioTrack}: ${track.name}`,
              });
              updateSettings();
            }
            break;
          }
        }
      }),
    );

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        player.seek(player.currentTime - SHORT_SKIP);
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        player.seek(player.currentTime + SHORT_SKIP);
      });
    }

    let onTouchstart: (e: TouchEvent) => void;
    if (isMobilePlayer) {
      let startAt = 0;
      document.addEventListener(
        'touchstart',
        (onTouchstart = (e: TouchEvent) => {
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
            if (clientX > w / 3 && clientX < (w / 3) * 2) {
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
        }),
      );

      ui.$controllerBottom.setAttribute('style', 'zoom: 1.25');
    }

    player.on('play', () => {
      setPlaying(player.isPlaying);
    });
    player.on('pause', () => {
      setPlaying(player.isPlaying);
    });

    // eslint-disable-next-line no-unused-expressions,@typescript-eslint/no-unused-expressions
    DEBUG_EVENTS &&
      [
        'abort',
        'canplay',
        'canplaythrough',
        'durationchange',
        'emptied',
        'ended',
        'error',
        'loadeddata',
        'loadedmetadata',
        'loadstart',
        'pause',
        'play',
        'playing',
        'ratechange',
        'seeked',
        'seeking',
        'stalled',
        'volumechange',
        'waiting', // 'progress', 'suspend', 'timeupdate',
      ].forEach((type) => {
        player.$video.addEventListener(type, (e: Event) => {
          console.log('Event %s: %O', type, e);
        });
      });

    const continuePlaying = () => {
      if (startTime > 0) {
        player.seek(startTime);
      }
      player.play()?.catch((err: unknown) => {
        console.error('auto play error: %O', err);
      });
    };

    const isBrokenAndroidEdgePlayer =
      /Mozilla.+Android.+AppleWebKit.+Chrome.+Mobile.+Safari.+EdgA/.test(navigator.userAgent);
    if (isBrokenAndroidEdgePlayer) {
      player.once('loadedmetadata', () => {
        if (player.duration > 0) {
          continuePlaying();
        } else {
          player.once('durationchange', () => {
            continuePlaying();
          });
        }
      });
    } else {
      player.once('loadedmetadata', () => {
        continuePlaying();
      });
    }

    let isSeeking = false;
    let isPlaying = false;
    const sid = getSidV2(url);
    const progressKey = getProgressKey(decodeURIComponent(sid));
    let lastSyncAt = 0;
    player.on('timeupdate', async () => {
      const now = Date.now();

      if (!lastSyncAt) {
        lastSyncAt = now;
      }

      if (lastSyncAt < now - SAVE_INTERVAL) {
        lastSyncAt = now;
        if (isSeeking || !isPlaying) {
          return;
        }
        try {
          // console.log('save', player.currentTime);
          await api.storageSet({
            [sid]: player.currentTime,
            [progressKey]:
              Math.trunc((100 / player.duration) * player.currentTime * 1000) / 1000 || undefined,
          });
        } catch (err) {
          console.error('Storage.set error: %O', err);
        }
      }
    });
    player.on('seeking', () => {
      isSeeking = true;
    });
    player.on('seeked', () => {
      isSeeking = false;
      lastSyncAt = Date.now();
    });
    player.on('pause', () => {
      isPlaying = false;
    });
    player.on('play', () => {
      isPlaying = true;
      lastSyncAt = Date.now();
    });

    const updateSettings = () => {
      const subsKey = 'subtitles';
      ui.setting.unregister(subsKey);

      const audioKey = 'audioTracks';
      ui.setting.unregister(audioKey);

      if (hls?.audioTracks.length) {
        const tracksMenu = hls.audioTracks.map((audioTrack, index) => {
          if (!hls) throw new Error('Unexpected case');

          return {
            name: `Audio ${index}: ${audioTrack.name}`,
            type: 'switcher',
            default: hls.audioTrack === index,
            onChange: () => {
              if (!hls) return;
              hls.audioTrack = index;
              updateSettings();
            },
          };
        });

        ui.setting.register([
          {
            key: audioKey,
            name: 'Audio tracks',
            type: 'selector',
            children: tracksMenu as unknown as Setting<unknown>[],
          },
        ]);
      }

      if (hls?.subtitleTracks.length) {
        const sumMenu = hls.subtitleTracks.map((subtitle, index) => {
          if (!hls) throw new Error('Unexpected case');

          return {
            name: `Stream ${index}: ${subtitle.name}`,
            type: 'switcher',
            default: hls.subtitleTrack === index,
            onChange: () => {
              if (!hls) return;
              if (hls.subtitleTrack === index) {
                hls.subtitleTrack = -1;
              } else {
                hls.subtitleTrack = index;
              }
              updateSettings();
            },
          };
        });

        ui.setting.register([
          {
            key: subsKey,
            name: 'Subtitles',
            type: 'selector',
            children: sumMenu as unknown as Setting<unknown>[],
          },
        ]);
      }
    };

    function handleCueChange(this: TextTrack) {
      const {activeCues} = this;
      if (activeCues?.length) {
        let html = '';
        for (let i = 0; i < activeCues.length; i++) {
          const activeCue = activeCues[i] as VTTCue | undefined;
          if (activeCue) {
            html += activeCue.text
              .replace(/\\h/g, '&nbsp;')
              .split(/\r?\n/)
              .map((item: string) => `<p><span>${item}</span></p>`)
              .join('');
          }
        }
        ui.subtitle.$dom.innerHTML = html;
      } else {
        ui.subtitle.$dom.innerHTML = '';
      }
    }

    if (hls) {
      hls.loadSource(url);
      hls.attachMedia(player.$video);
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, updateSettings);
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, updateSettings);

      let dispose = () => {};
      hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, () => {
        ui.subtitle.$dom.innerHTML = '';
        dispose();
        const track = player.$video.textTracks[hls?.subtitleTrack || 0];
        if (!track) return;

        track.mode = 'hidden';
        track.addEventListener('cuechange', handleCueChange);
        dispose = () => {
          track.removeEventListener('cuechange', handleCueChange);
        };
      });

      Object.assign(window, {hlsInstance: hls});
    } else {
      player.load({
        src: url,
      });
    }

    const progressEl = (ui as unknown as {$progress: HTMLElement}).$progress;
    progressEl.classList.add('progress-wrapper');
    progressEl.children[0].classList.add('progress');

    ui.subtitle.$dom.classList.add('subtitles-ctr');

    return () => {
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('touchstart', onTouchstart);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
      }

      if (hls) {
        hls.detachMedia();
        hls.destroy();
      }

      player.destroy();
    };
  }, [url, toggleUrlDialog, title]);

  return <CtrTag ref={refCtr} />;
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

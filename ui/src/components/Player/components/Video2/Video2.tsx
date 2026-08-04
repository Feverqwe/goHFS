import React, {FC, useContext, useEffect, useMemo, useRef, useState} from 'react';
import Hls from 'hls.js';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import {useMutation} from '@tanstack/react-query';
import {api} from '../../../../tools/api';
import {getProgressKey} from '../../../../tools/common';
import {TITLE} from '../../constants';
import {VideoMetadata} from '../../types';
import {getSidV2} from '../../utils';
import UrlDialogCtx from '../UrlDialog/UrlDialogCtx';
import {
  DEBUG_EVENTS,
  DEBUG_EVENT_TYPES,
  PLAYBACK_RATES,
  SAVE_INTERVAL,
  SHORT_SKIP,
  SKIP,
} from './constants';
import {addNotice} from './Notice';
import PlayerContainer from './styles';
import {createTrackController} from './tracks';
import {formatTime, getMediaTitle, isBrokenAndroidEdge, isHlsUrl} from './utils';

interface Video2Props {
  url: string;
  metadata?: VideoMetadata;
}

const Video2: FC<Video2Props> = ({url, metadata}) => {
  const toggleUrlDialog = useContext(UrlDialogCtx);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setPlaying] = useState(false);
  const {mutateAsync: setStorage} = useMutation({mutationFn: api.storageSet});
  const title = useMemo(() => getMediaTitle(url), [url]);

  useEffect(() => {
    document.title = `[${isPlaying ? '>' : '||'}] ${title}`;
    return () => {
      document.title = TITLE;
    };
  }, [isPlaying, title]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !url) return;

    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered');
    container.appendChild(videoElement);

    const player = videojs(videoElement, {
      autoplay: false,
      controls: true,
      playbackRates: PLAYBACK_RATES,
      preload: 'auto',
      responsive: true,
      textTrackSettings: false,
    });
    const notice = addNotice(player);
    const showNotice = (text: string) => notice.display(text);
    const subtitleElement = document.createElement('div');
    subtitleElement.className = 'vjs-custom-subtitles';
    const stopSubtitleInteraction = (event: Event) => event.stopPropagation();
    ['click', 'contextmenu', 'dblclick', 'mousedown', 'mouseup', 'touchstart'].forEach((type) => {
      subtitleElement.addEventListener(type, stopSubtitleInteraction);
    });
    player.el().appendChild(subtitleElement);

    let hls: Hls | undefined;
    if (isHlsUrl(url) && Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 3 * 60,
        preferManagedMediaSource: false,
        renderTextTracksNatively: false,
      });
    }
    const trackController = createTrackController(player, subtitleElement, showNotice, hls);
    const sid = getSidV2(url);
    const progressKey = getProgressKey(decodeURIComponent(sid));
    let lastSyncAt = 0;
    let activelyPlaying = false;
    let hasStarted = false;

    const getCurrentTime = () => player.currentTime() ?? 0;
    const getDuration = () => player.duration() ?? NaN;
    const showTime = () => {
      showNotice(`${formatTime(getCurrentTime())} / ${formatTime(getDuration())}`);
    };
    const showPlaybackRate = () => {
      showNotice(`Playback rate: ${player.playbackRate() ?? 1}`);
    };
    const continuePlaying = () => {
      if (hasStarted) return;
      hasStarted = true;
      if ((metadata ?? 0) > 0) player.currentTime(metadata);
      player.play()?.catch((err: unknown) => {
        console.error('auto play error: %O', err);
      });
    };
    const onLoadedMetadata = () => {
      if (isBrokenAndroidEdge(navigator.userAgent) && getDuration() <= 0) {
        player.one('durationchange', continuePlaying);
      } else {
        continuePlaying();
      }
    };
    const onPlay = () => {
      activelyPlaying = true;
      lastSyncAt = Date.now();
      setPlaying(true);
    };
    const onPause = () => {
      activelyPlaying = false;
      setPlaying(false);
    };
    const onTimeUpdate = async () => {
      const now = Date.now();
      if (!lastSyncAt) lastSyncAt = now;
      if (lastSyncAt >= now - SAVE_INTERVAL || player.seeking() || !activelyPlaying) return;

      lastSyncAt = now;
      const currentTime = getCurrentTime();
      try {
        await setStorage({
          [sid]: currentTime,
          [progressKey]: Math.trunc((100 / getDuration()) * currentTime * 1000) / 1000 || undefined,
        });
      } catch (err) {
        console.error('Storage.set error: %O', err);
      }
    };
    const onKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, button, a, [contenteditable="true"]')) {
        return;
      }

      const {code} = event;
      const hasModifier = event.ctrlKey || event.metaKey || event.shiftKey;
      let handled = false;

      if (hasModifier) {
        const currentRate = player.playbackRate() ?? 1;
        if (code === 'Period') {
          player.playbackRate(Math.min(3, currentRate + 0.25));
          showPlaybackRate();
          handled = true;
        } else if (code === 'Comma') {
          player.playbackRate(Math.max(0.25, currentRate - 0.25));
          showPlaybackRate();
          handled = true;
        } else if (code === 'Digit0') {
          player.playbackRate(1);
          showPlaybackRate();
          handled = true;
        }
      } else {
        switch (code) {
          case 'Space':
            if (!event.repeat) {
              if (player.paused()) {
                player.play()?.catch((err: unknown) => console.error('play error: %O', err));
              } else {
                player.pause();
              }
              handled = true;
            }
            break;
          case 'ArrowLeft':
          case 'ArrowRight': {
            const direction = code === 'ArrowLeft' ? -1 : 1;
            const offset = event.altKey ? SHORT_SKIP : SKIP;
            const nextTime = Math.max(
              0,
              Math.min(getDuration() || Infinity, getCurrentTime() + direction * offset),
            );
            player.currentTime(nextTime);
            showTime();
            handled = true;
            break;
          }
          case 'KeyF':
            if (!event.repeat) {
              const operation = player.isFullscreen()
                ? player.exitFullscreen()
                : player.requestFullscreen();
              operation.catch((err: unknown) => console.error('fullscreen error: %O', err));
              handled = true;
            }
            break;
          case 'KeyN':
            if (!event.repeat) {
              toggleUrlDialog();
              handled = true;
            }
            break;
          case 'KeyS':
            if (!event.repeat) {
              trackController.cycleSubtitleTrack();
              handled = true;
            }
            break;
          case 'KeyA':
            if (!event.repeat) {
              trackController.cycleAudioTrack();
              handled = true;
            }
            break;
        }
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    player.on('loadedmetadata', onLoadedMetadata);
    player.on('play', onPlay);
    player.on('pause', onPause);
    player.on('timeupdate', onTimeUpdate);
    player.on('seeked', () => {
      lastSyncAt = Date.now();
    });
    if (DEBUG_EVENTS) {
      player.on([...DEBUG_EVENT_TYPES], (event: Event) => {
        console.log('Event %s: %O', event.type, event);
      });
    }
    document.addEventListener('keydown', onKeydown, true);

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({title});
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        player.currentTime(Math.max(0, getCurrentTime() - SHORT_SKIP));
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        player.currentTime(Math.min(getDuration() || Infinity, getCurrentTime() + SHORT_SKIP));
      });
    }

    if (hls) {
      hls.loadSource(url);
      hls.attachMedia(player.tech(true).el() as HTMLMediaElement);
    } else {
      player.src(url);
    }

    return () => {
      document.removeEventListener('keydown', onKeydown, true);
      setPlaying(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      }
      trackController.dispose();
      ['click', 'contextmenu', 'dblclick', 'mousedown', 'mouseup', 'touchstart'].forEach((type) => {
        subtitleElement.removeEventListener(type, stopSubtitleInteraction);
      });
      hls?.destroy();
      player.dispose();
      container.replaceChildren();
    };
  }, [metadata, setStorage, title, toggleUrlDialog, url]);

  return <PlayerContainer ref={containerRef} />;
};

export default Video2;

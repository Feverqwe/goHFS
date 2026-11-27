import React, {
  FC,
  type Ref,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Hls from 'hls.js';
import videojs from 'video.js';
import type LiveTracker from 'video.js/dist/types/live-tracker';
import 'video.js/dist/video-js.css';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {api} from '../../../../tools/api';
import {getSidV2} from '../../../../tools/common';
import {queryKeys} from '../../../../tools/queryClient';
import {TITLE} from '../../constants';
import {VideoMetadata} from '../../types';
import {getPlaybackProgressKey} from '../../utils';
import UrlDialogCtx from '../UrlDialog/UrlDialogCtx';
import {
  DEBUG_EVENTS,
  DEBUG_EVENT_TYPES,
  DOUBLE_TAP_DELAY,
  PLAYBACK_RATES,
  SAVE_INTERVAL,
  SHORT_SKIP,
  SKIP,
  TAP_MAX_DURATION,
  TAP_MAX_MOVEMENT,
  TAP_ZONE_WIDTH,
  VOLUME_STEP,
} from './constants';
import {addNotice} from './Notice';
import {addPlaylistControls, type PlaylistControlOptions} from './PlaylistControls';
import {addSettingsButton} from './SettingsButton';
import SettingsMenu from './SettingsMenu';
import PlayerContainer from './styles';
import {createTrackController, type TrackController} from './tracks';
import {formatTime, getMediaTitle, isBrokenAndroidEdge, isHlsUrl} from './utils';

interface Video2Props {
  autoplay?: boolean;
  loadSource?: boolean;
  poster?: string;
  url: string;
  metadata?: VideoMetadata;
  mediaTitle?: string;
  persistPosition?: boolean;
  onPositionChange?: (position: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  onPlaybackError?: () => void;
  ref?: Ref<() => void>;
  onEnded?: () => void;
  playlistControls?: PlaylistControlOptions;
}

type TapZone = 'left' | 'center' | 'right';

interface SettingsControls {
  container: HTMLElement;
  player: ReturnType<typeof videojs>;
  trackController: TrackController;
}

function blurFocusedPlayerControlOnEscape(event: KeyboardEvent): boolean {
  const focusedElement = document.activeElement;
  if (
    event.code !== 'Escape' ||
    !(focusedElement instanceof HTMLElement) ||
    !focusedElement.closest('.vjs-control-bar, .vjs-big-play-button')
  ) {
    return false;
  }
  focusedElement.blur();
  return true;
}

const Video2: FC<Video2Props> = ({
  autoplay = true,
  loadSource = true,
  poster,
  url,
  mediaTitle,
  metadata,
  persistPosition = true,
  onPositionChange,
  onDurationChange,
  onPlayingChange,
  onPlaybackError,
  ref,
  onEnded,
  playlistControls,
}) => {
  const toggleUrlDialog = useContext(UrlDialogCtx);
  const containerRef = useRef<HTMLDivElement>(null);
  const playbackToggle = useRef<(() => void) | null>(null);
  useImperativeHandle(ref, () => () => playbackToggle.current?.(), []);
  const [isPlaying, setPlaying] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLElement | null>(null);
  const [settingsControls, setSettingsControls] = useState<SettingsControls>();
  const queryClient = useQueryClient();
  const {mutateAsync: setStorage} = useMutation({
    mutationFn: api.storageSet,
    scope: {id: 'playback-position'},
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: queryKeys.playlistData(), refetchType: 'none'}),
  });
  const isPlaylist = Boolean(onPositionChange);
  const hasPlaylistControls = Boolean(playlistControls);
  const playlistOptionsRef = useRef(playlistControls);
  const playlistControlsRef = useRef<ReturnType<typeof addPlaylistControls>>(undefined);
  useLayoutEffect(() => {
    playlistOptionsRef.current = playlistControls;
    playlistControlsRef.current?.sync();
  }, [playlistControls]);
  const playlistCallbacks = useRef({
    onPositionChange,
    onDurationChange,
    onPlayingChange,
    onPlaybackError,
    onEnded,
  });
  useLayoutEffect(() => {
    playlistCallbacks.current = {
      onPositionChange,
      onDurationChange,
      onPlayingChange,
      onPlaybackError,
      onEnded,
    };
  }, [onPositionChange, onDurationChange, onPlayingChange, onPlaybackError, onEnded]);
  const title = useMemo(() => mediaTitle ?? getMediaTitle(url), [mediaTitle, url]);

  useEffect(() => {
    document.title = `[${isPlaying ? '>' : '||'}] ${title}`;
    return () => {
      document.title = TITLE;
    };
  }, [isPlaying, title]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !url) return;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isMobileTouch = hasCoarsePointer || navigator.maxTouchPoints > 0;

    const videoElement = document.createElement('video');
    videoElement.classList.add('video-js', 'vjs-big-play-centered');
    container.appendChild(videoElement);

    const player = videojs(videoElement, {
      autoplay: false,
      controlBar: {
        audioTrackButton: false,
        currentTimeDisplay: true,
        durationDisplay: true,
        pictureInPictureToggle: false,
        playbackRateMenuButton: false,
        progressControl: {
          seekBar: {
            playProgressBar: {
              timeTooltip: false,
            },
          },
        },
        remainingTimeDisplay: false,
        subsCapsButton: false,
        timeDivider: true,
      },
      controls: true,
      errorDisplay: !hasPlaylistControls,
      playbackRates: PLAYBACK_RATES,
      poster,
      preload: 'auto',
      responsive: true,
      textTrackSettings: false,
    });
    const playerElement = player.el() as HTMLElement;
    const liveTracker = player.getChild('liveTracker') as LiveTracker | undefined;
    if (isMobileTouch) {
      player.addClass('vjs-mobile-touch');
      player.addClass('vjs-show-big-play-button-on-pause');
    }
    const notice = addNotice(player);
    const showNotice = (text: string) => notice.display(text);
    const subtitleElement = document.createElement('div');
    subtitleElement.className = 'vjs-custom-subtitles';
    subtitleElement.setAttribute('translate', 'yes');
    const stopSubtitleInteraction = (event: Event) => event.stopPropagation();
    ['click', 'contextmenu', 'dblclick', 'mousedown', 'mouseup', 'touchstart'].forEach((type) => {
      subtitleElement.addEventListener(type, stopSubtitleInteraction);
    });
    playerElement.appendChild(subtitleElement);

    const isHlsSource = isHlsUrl(url);
    let hls: Hls | undefined;
    if (isHlsSource && Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 3 * 60,
        preferManagedMediaSource: false,
        renderTextTracksNatively: false,
      });
    }
    const trackController = createTrackController(player, subtitleElement, showNotice, hls);
    addSettingsButton(player, (anchor) => {
      player.userActive(true);
      setSettingsAnchorEl(anchor);
    });
    const initialPlaylistOptions = playlistOptionsRef.current;
    if (initialPlaylistOptions) {
      playlistControlsRef.current = addPlaylistControls(
        player,
        () => playlistOptionsRef.current ?? initialPlaylistOptions,
      );
      const errorElement = document.createElement('div');
      errorElement.className = 'vjs-playlist-error';
      errorElement.setAttribute('role', 'status');
      playerElement.appendChild(errorElement);
      player.one('error', () => {
        errorElement.textContent = player.error()?.message ?? '';
        playlistCallbacks.current.onPlaybackError?.();
      });
    }
    hls?.on(Hls.Events.ERROR, (_, error) => {
      if (error.fatal && !player.error()) {
        player.pause();
        player.error('This stream could not be played.');
      }
    });
    setSettingsControls({container: playerElement, player, trackController});
    const positionKey = getSidV2(url);
    const progressKey = getPlaybackProgressKey(url);
    let lastSyncAt = 0;
    let activelyPlaying = false;
    let hasStarted = false;
    let hasPlayed = false;
    let hasEnded = false;
    let lastPosition: number | undefined;
    let lastSavedTime: number | undefined;
    let touchStart: {x: number; y: number; at: number} | undefined;
    let previousTap: {zone: TapZone; at: number} | undefined;

    const getCurrentTime = () => player.currentTime() ?? 0;
    const getDuration = () => player.duration() ?? NaN;
    const showTime = () => {
      showNotice(`${formatTime(getCurrentTime())} / ${formatTime(getDuration())}`);
    };
    const setPlaybackRate = (rate: number) => {
      player.playbackRate(rate);
      showNotice(`Playback rate: ${rate}`);
    };
    const adjustVolume = (direction: -1 | 1) => {
      const currentVolume = player.volume() ?? 1;
      const nextVolume = Math.max(
        0,
        Math.min(1, Math.round((currentVolume + direction * VOLUME_STEP) * 100) / 100),
      );
      if (nextVolume > 0 && player.muted()) player.muted(false);
      player.volume(nextVolume);
      player.userActive(true);
      showNotice(`Volume: ${Math.round(nextVolume * 100)}%`);
    };
    const onVolumeWheel = (event: WheelEvent) => {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest('.vjs-mute-control, .vjs-volume-control') ||
        event.deltaY === 0
      ) {
        return;
      }

      const direction = event.deltaY < 0 ? 1 : -1;
      adjustVolume(direction);
      event.preventDefault();
      event.stopPropagation();
    };
    const isAtHlsLiveEdge = () => {
      if (!isHlsSource) return false;
      if (!hls) return Boolean(liveTracker?.isLive() && liveTracker.atLiveEdge());

      const liveSyncPosition = hls.liveSyncPosition;
      return Boolean(
        hls.latestLevelDetails?.live &&
        liveSyncPosition !== null &&
        getCurrentTime() >= liveSyncPosition,
      );
    };
    const normalizePlaybackRateAtLiveEdge = () => {
      if ((player.playbackRate() ?? 1) <= 1 || !isAtHlsLiveEdge()) return;
      setPlaybackRate(1);
    };
    const seekBy = (offset: number) => {
      const nextTime = Math.max(0, Math.min(getDuration() || Infinity, getCurrentTime() + offset));
      player.currentTime(nextTime);
      showTime();
    };
    const isTouchControl = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return Boolean(
        target.closest(
          '.vjs-control-bar, .vjs-big-play-button, .vjs-menu, .vjs-modal-dialog, .vjs-custom-subtitles, .vjs-settings-menu',
        ),
      );
    };
    const onTouchStart = (event: TouchEvent) => {
      if (!isMobileTouch || event.touches.length !== 1 || isTouchControl(event.target)) {
        touchStart = undefined;
        return;
      }

      const touch = event.touches[0];
      touchStart = {x: touch.clientX, y: touch.clientY, at: Date.now()};
    };
    const onTouchEnd = (event: TouchEvent) => {
      const start = touchStart;
      touchStart = undefined;
      if (!start || event.changedTouches.length !== 1 || isTouchControl(event.target)) return;

      const touch = event.changedTouches[0];
      const now = Date.now();
      const isLongTap = now - start.at > TAP_MAX_DURATION;
      const touchOffsetX = touch.clientX - start.x;
      const touchOffsetY = touch.clientY - start.y;
      const movedTooFar = Math.hypot(touchOffsetX, touchOffsetY) > TAP_MAX_MOVEMENT;
      if (isLongTap || movedTooFar) {
        previousTap = undefined;
        return;
      }

      const playerRect = playerElement.getBoundingClientRect();
      const horizontalPosition = (touch.clientX - playerRect.left) / playerRect.width;
      let zone: TapZone = 'center';
      if (horizontalPosition < TAP_ZONE_WIDTH) {
        zone = 'left';
      } else if (horizontalPosition > 1 - TAP_ZONE_WIDTH) {
        zone = 'right';
      }

      if (previousTap?.zone === zone && now - previousTap.at <= DOUBLE_TAP_DELAY) {
        previousTap = undefined;
        if (zone === 'center') {
          if (!player.paused()) player.pause();
        } else {
          seekBy(zone === 'left' ? -SKIP : SKIP);
        }
        player.userActive(true);
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }

      previousTap = {zone, at: now};
    };
    const togglePlayback = () => {
      if (player.paused()) {
        player.play()?.catch((err: unknown) => console.error('play error: %O', err));
      } else {
        player.pause();
      }
    };
    playbackToggle.current = togglePlayback;

    const updatePlaying = (playing: boolean) => {
      setPlaying(playing);
      playlistCallbacks.current.onPlayingChange?.(playing);
    };
    const continuePlaying = () => {
      if (hasStarted) return;
      hasStarted = true;
      const duration = getDuration();
      if (metadata && metadata > 0 && (!isPlaylist || !isFinite(duration) || metadata < duration)) {
        player.currentTime(metadata);
      }
      if (!autoplay) return;
      player.play()?.catch((err: unknown) => {
        console.error('auto play error: %O', err);
      });
    };
    const reportDuration = () => {
      playlistCallbacks.current.onDurationChange?.(getDuration());
    };
    const onLoadedMetadata = () => {
      reportDuration();
      if (isBrokenAndroidEdge(navigator.userAgent) && getDuration() <= 0) {
        player.one('durationchange', continuePlaying);
      } else {
        continuePlaying();
      }
    };
    const onPlay = () => {
      activelyPlaying = true;
      hasPlayed = true;
      hasEnded = false;
      lastSyncAt = Date.now();
      updatePlaying(true);
    };
    const savePosition = (currentTime: number, progress?: number) => {
      if (
        !persistPosition ||
        !isFinite(currentTime) ||
        (lastSavedTime === currentTime && progress === undefined)
      )
        return;
      lastSavedTime = currentTime;
      const percent = progress ?? Math.trunc((100 / getDuration()) * currentTime * 1000) / 1000;
      setStorage({
        [positionKey]: currentTime,
        [progressKey]: isFinite(percent) ? percent : undefined,
      }).catch((err: unknown) => {
        if (lastSavedTime === currentTime) lastSavedTime = undefined;
        console.error('Storage.set error: %O', err);
      });
    };
    const reportPosition = () => {
      if (!isPlaylist || !hasPlayed || hasEnded || player.seeking() || player.ended()) return;
      const position = Math.floor(getCurrentTime());
      if (position === lastPosition) return;
      lastPosition = position;
      playlistCallbacks.current.onPositionChange?.(position);
    };
    const flushPosition = () => {
      if (isPlaylist && hasPlayed && !hasEnded && !player.seeking() && !player.ended()) {
        reportPosition();
        savePosition(getCurrentTime());
      }
    };
    const onPause = () => {
      activelyPlaying = false;
      updatePlaying(false);
      flushPosition();
    };
    const onPlaylistEnd = () => {
      if (player.error()) return;
      hasEnded = true;
      lastPosition = 0;
      playlistCallbacks.current.onPositionChange?.(0);
      savePosition(0, 100);
      playlistCallbacks.current.onEnded?.();
    };
    const onTimeUpdate = () => {
      normalizePlaybackRateAtLiveEdge();
      reportPosition();

      const now = Date.now();
      if (!lastSyncAt) lastSyncAt = now;
      if (lastSyncAt >= now - SAVE_INTERVAL || player.seeking() || !activelyPlaying || hasEnded) {
        return;
      }

      lastSyncAt = now;
      savePosition(getCurrentTime());
    };
    const onKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (blurFocusedPlayerControlOnEscape(event)) return;
      if (
        target?.closest(
          'input, textarea, select, button, a, [contenteditable="true"], .vjs-settings-menu',
        )
      ) {
        return;
      }

      const {code} = event;
      const isSeekKey = code === 'ArrowLeft' || code === 'ArrowRight';
      const hasModifier = event.ctrlKey || event.metaKey || event.shiftKey;
      let handled = false;

      if (isSeekKey && !event.metaKey && !event.shiftKey) {
        const direction = code === 'ArrowLeft' ? -1 : 1;
        const altPressed = event.altKey || event.getModifierState('AltGraph');
        const offset = altPressed || event.ctrlKey ? SHORT_SKIP : SKIP;
        seekBy(direction * offset);
        handled = true;
      } else if (hasModifier) {
        const currentRate = player.playbackRate() ?? 1;
        if (code === 'Period') {
          setPlaybackRate(Math.min(3, currentRate + 0.25));
          handled = true;
        } else if (code === 'Comma') {
          setPlaybackRate(Math.max(0.25, currentRate - 0.25));
          handled = true;
        } else if (code === 'Digit0') {
          setPlaybackRate(1);
          handled = true;
        }
      } else {
        switch (code) {
          case 'Space':
            if (!event.repeat) {
              togglePlayback();
              handled = true;
            }
            break;
          case 'ArrowUp':
          case 'ArrowDown':
            adjustVolume(code === 'ArrowUp' ? 1 : -1);
            handled = true;
            break;
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
    player.on('durationchange', reportDuration);
    player.on('play', onPlay);
    player.on('pause', onPause);
    if (isPlaylist) player.on('ended', onPlaylistEnd);
    player.on('timeupdate', onTimeUpdate);
    player.on('seeked', () => {
      lastSyncAt = Date.now();
      if (activelyPlaying) reportPosition();
      else flushPosition();
    });
    if (DEBUG_EVENTS) {
      player.on([...DEBUG_EVENT_TYPES], (event: Event) => {
        console.log('Event %s: %O', event.type, event);
      });
    }
    document.addEventListener('keydown', onKeydown, true);
    playerElement.addEventListener('wheel', onVolumeWheel, {passive: false});
    playerElement.addEventListener('touchstart', onTouchStart, {capture: true, passive: true});
    playerElement.addEventListener('touchend', onTouchEnd, {capture: true, passive: false});

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({title});
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        player.currentTime(Math.max(0, getCurrentTime() - SHORT_SKIP));
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        player.currentTime(Math.min(getDuration() || Infinity, getCurrentTime() + SHORT_SKIP));
      });
    }

    if (loadSource) {
      if (hls) {
        const stream = hls;
        // Video.js clears errors when the media element starts loading the MediaSource.
        stream.once(Hls.Events.MEDIA_ATTACHED, () => stream.loadSource(url));
        stream.attachMedia(player.tech(true).el() as HTMLMediaElement);
      } else {
        player.src(url);
      }
    }

    return () => {
      flushPosition();
      playbackToggle.current = null;
      playlistControlsRef.current?.dispose();
      playlistControlsRef.current = undefined;
      setSettingsAnchorEl(null);
      setSettingsControls(undefined);
      document.removeEventListener('keydown', onKeydown, true);
      playerElement.removeEventListener('wheel', onVolumeWheel);
      playerElement.removeEventListener('touchstart', onTouchStart, true);
      playerElement.removeEventListener('touchend', onTouchEnd, true);
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
  }, [
    autoplay,
    hasPlaylistControls,
    isPlaylist,
    loadSource,
    metadata,
    persistPosition,
    poster,
    setStorage,
    title,
    toggleUrlDialog,
    url,
  ]);

  return (
    <>
      <PlayerContainer ref={containerRef} />
      <SettingsMenu
        anchorEl={settingsAnchorEl}
        container={settingsControls?.container ?? null}
        onClose={() => setSettingsAnchorEl(null)}
        player={settingsControls?.player}
        trackController={settingsControls?.trackController}
      />
    </>
  );
};

export default Video2;

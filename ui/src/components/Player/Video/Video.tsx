import * as React from 'react';
import {memo, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {styled} from '@mui/material';
import Path from 'path-browserify';
import addEvent from '../../../tools/addEvent';
import UrlFormContext from '../UrlForm/UrlFormContext';
import Storage from '../../../tools/storage';
import {TITLE} from '../constants';

interface PlayerProps {
  url: string,
  starTime: number,
}

const VideoTag = styled('video')(() => {
  return {
    width: '100%',
    height: '100%',

    outline: 'none',
  };
});

type StorageValue = number;

const Video = memo(({url, starTime}: PlayerProps) => {
  const showUrlForm = useContext(UrlFormContext);
  const refVideo = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setPlaying] = useState(false);

  const [scope] = useState(() => {
    return {starTime, metadataLoaded: false};
  });

  useMemo(() => {
    scope.starTime = starTime;
  }, [scope, starTime]);

  const oldSid = useMemo(() => {
    const m = /\/\/[^\/]+(.+)$/.exec(url);
    if (m) {
      return m[1];
    }
    return url;
  }, [url]);

  const sid = useMemo(() => {
    const m = /\/\/[^\/]+(.+?)(?:\.[a-z0-9]+)?$/i.exec(url);
    if (m) {
      return m[1];
    }
    return url;
  }, [url]);

  useEffect(() => {
    let uri;
    try {
      uri = url && new URL(url);
    } catch (err) {}
    if (uri) {
      const name = Path.basename(uri.pathname);
      document.title = `[${isPlaying ? '>' : '||'}] ${decodeURIComponent(name)}`;
    }
    return () => {
      document.title = TITLE;
    };
  }, [url, isPlaying]);

  useEffect(() => {
    let unmount = false;
    Storage.get<Partial<Record<string, StorageValue>>>([sid, oldSid]).then((result) => {
      if (unmount) return;
      const value = result[sid] || result[oldSid];
      if (typeof value === 'number') {
        scope.starTime = value;
        if (refVideo.current && scope.metadataLoaded) {
          refVideo.current.currentTime = value;
        }
      }
    }).catch((err) => {
      console.error('Storage.get error: %O', err);
    });

    return () => {
      unmount = true;
    };
  }, [oldSid, scope, sid, url]);

  useEffect(() => {
    if (!url || !refVideo.current) return;

    const video = refVideo.current;

    const disposers: Array<() => void> = [];

    let isFullscreen = false;
    addEvent(video, (on) => on('fullscreenchange', () => {
      isFullscreen = document.fullscreenElement === video;
    }), disposers);

    let lastKey = '';
    addEvent(window, (on) => on('keyup', (e: KeyboardEvent) => {
      // console.log('keyup: %s', e.code);
      lastKey = '';
    }, true), disposers);

    addEvent(window, (on) => on('keydown', (e: KeyboardEvent) => {
      // console.log('keydown: %s', e.code);
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'INPUT') return;

      const {code} = e;
      const isRepeat = e.code === lastKey;

      // Bail if a modifier key is set
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        return;
      }

      // showUrlForm(true);

      switch (code) {
        case 'Space': {
          if (isRepeat) return;
          e.preventDefault();
          if (video.paused) {
            video.play().catch((err) => {
              console.log('play error: %O', err);
            });
          } else {
            video.pause();
          }
          break;
        }
        /* case 'ArrowUp': {
          break;
        }
        case 'ArrowDown': {
          break;
        } */
        case 'ArrowLeft': {
          e.preventDefault();
          const offset = e.altKey ? 3 : 10;
          video.currentTime -= offset;
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          const offset = e.altKey ? 3 : 10;
          video.currentTime += offset;
          break;
        }
        case 'KeyF': {
          if (isRepeat) return;
          if (isFullscreen) {
            document.exitFullscreen().catch((err) => {
              console.error('exitFullscreen error: %O', err);
            });
          } else {
            video.requestFullscreen({
              navigationUI: 'auto',
            }).catch((err) => {
              console.error('requestFullscreen error: %O', err);
            });
          }
          break;
        }
        case 'KeyN': {
          if (isRepeat) return;
          e.preventDefault();
          showUrlForm();
          break;
        }
      }

      lastKey = code;
    }, true), disposers);

    addEvent(video, (on) => on('click', (e: MouseEvent) => {
      e.preventDefault();
      if (video.paused) {
        video.play().catch((err) => {
          console.log('play error: %O', err);
        });
      } else {
        video.pause();
      }
    }), disposers);

    let lastSyncAt = 0;
    addEvent(video, (on) => on('timeupdate', (e: Event) => {
      const now = Date.now();
      if (!lastSyncAt) {
        lastSyncAt = now;
      } else
      if (lastSyncAt < now - 5 * 1000) {
        lastSyncAt = now;
        Storage.set<StorageValue>({
          [sid]: video.currentTime,
        }).catch((err) => {
          console.error('Storage.set error: %O', err);
        });
      }
    }), disposers);

    addEvent(video, (on) => {
      on('play', (e: Event) => {
        setPlaying(!video.paused);
      });
      on('pause', (e: Event) => {
        setPlaying(!video.paused);
      });
    });

    /* [
      'abort', 'canplay', 'canplaythrough', 'durationchange', 'emptied', 'ended',
      'error', 'loadeddata', 'loadedmetadata', 'loadstart', 'pause', 'play',
      'playing', 'progress', 'ratechange', 'seeked', 'seeking', 'stalled',
      'suspend', 'timeupdate', 'volumechange', 'waiting',
    ].forEach((type) => {
      addEvent(video, on => on(type, (e: Event) => {
        console.log('Event %s: %O', type, e);
      }));
    }); */

    const disposeLoadedMetadata = addEvent(video, (on) => on('loadedmetadata', () => {
      disposeLoadedMetadata();
      scope.metadataLoaded = true;
      if (scope.starTime > 0) {
        video.currentTime = scope.starTime;
      }
      video.play().catch((err) => {
        console.error('auto play error: %O', err);
      });
    }), disposers);

    video.src = url;
    video.focus();

    return () => {
      disposers.splice(0).forEach((disposer) => disposer());

      video.src = '';
      scope.metadataLoaded = false;
    };
  }, [scope, showUrlForm, sid, url]);

  return (
    <VideoTag ref={refVideo} controls={true} />
  );
});

export default Video;

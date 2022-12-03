import * as React from 'react';
import {FC, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {styled} from '@mui/material';
import Path from 'path-browserify';
import addEvent from '../../../../tools/addEvent';
import UrlDialogCtx from '../UrlDialog/UrlDialogCtx';
import {TITLE} from '../../constants';
import {VideoMetadata} from '../../types';
import {getSidV2} from '../../utils';
import {api} from '../../../../tools/api';

interface VideoProps {
  url: string,
  metadata?: VideoMetadata;
}

const VideoTag = styled('video')(() => {
  return {
    width: '100%',
    height: '100%',

    outline: 'none',
  };
});

const Video: FC<VideoProps> = ({url, metadata}) => {
  const toggleUrlDialog = useContext(UrlDialogCtx);
  const refVideo = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setPlaying] = useState(false);

  const startTime = useMemo(() => {
    let time = 0;
    if (typeof metadata === 'number') {
      time = metadata;
    }
    return time;
  }, [metadata]);
  const refStartTime = useRef(startTime);

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
    const video = refVideo.current;
    if (!url || !video) return;

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
          toggleUrlDialog();
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

    const sid = getSidV2(url);
    let lastSyncAt = 0;
    addEvent(video, (on) => on('timeupdate', async (e: Event) => {
      const now = Date.now();

      if (!lastSyncAt) {
        lastSyncAt = now;
      }

      if (lastSyncAt < now - 5 * 1000) {
        lastSyncAt = now;
        try {
          await api.storageSet({
            [sid]: video.currentTime,
          });
        } catch (err) {
          console.error('Storage.set error: %O', err);
        }
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
      api.storageSet({
        [`${sid}.openAt`]: Math.trunc(Date.now() / 1000),
      });
      if (refStartTime.current > 0) {
        video.currentTime = refStartTime.current;
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
    };
  }, [toggleUrlDialog, url]);

  return (
    <VideoTag ref={refVideo} controls={true} />
  );
};

export default Video;
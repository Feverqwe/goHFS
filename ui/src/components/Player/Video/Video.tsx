import * as React from "react";
import {useRef} from "react";
import addEvent from "../../../tools/addEvent";
import UrlFormContext from "../UrlForm/UrlFormContext";
import Storage from "../../../tools/storage";
import {styled} from "@mui/material";

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

const Video = React.memo(({url, starTime}: PlayerProps) => {
  const showUrlForm = React.useContext(UrlFormContext);
  const refVideo = useRef<HTMLVideoElement | null>(null);
  const [isLock, setLock] = React.useState(false);
  const scope = React.useMemo(() => {
    return {isLock, starTime, metadataLoaded: false};
  }, []);

  scope.isLock = isLock;
  scope.starTime = starTime;

  const sid = React.useMemo(() => {
    const m = /\/\/[^\/]+(.+)$/.exec(url);
    if (m) {
      return m[1];
    }
    return url;
  }, [url]);

  React.useEffect(() => {
    const prevTitle = document.title;
    const m = /.*\/([^\/?#]+)/.exec(url);
    if (m) {
      document.title = '[>] ' + decodeURIComponent(m[1]);
    }
    return () => {
      document.title = prevTitle;
    };
  }, [url]);

  React.useEffect(() => {
    let unmount = false;
    Storage.get<Partial<Record<string, number>>>([sid]).then((result) => {
      if (unmount) return;
      const value = result[sid];
      if (typeof value === "number") {
        scope.starTime = value;
        if (scope.metadataLoaded) {
          refVideo.current!.currentTime = value;
        }
      }
    }).catch((err) => {
      console.error('Storage.get error: %O', err);
    });

    return () => {
      unmount = true;
    };
  }, [url]);

  React.useEffect(() => {
    if (!url) return;

    const video = refVideo.current!;

    const disposers: Array<() => void> = [];

    let isFullscreen = false;
    addEvent(video, on => on('fullscreenchange', () => {
      isFullscreen = document.fullscreenElement === video;
    }), disposers);

    let lastKey = '';
    addEvent(window, on => on('keyup', (e: KeyboardEvent) => {
      // console.log('keyup: %s', e.code);
      lastKey = '';
    }, true), disposers);

    addEvent(window, on => on('keydown', (e: KeyboardEvent) => {
      // console.log('keydown: %s', e.code);

      const code = e.code;
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
        /*case 'ArrowUp': {
          break;
        }
        case 'ArrowDown': {
          break;
        }*/
        case 'ArrowLeft': {
          if (scope.isLock) return;
          e.preventDefault();
          const offset = e.altKey ? 3 : 10;
          video.currentTime -= offset;
          break;
        }
        case 'ArrowRight': {
          if (scope.isLock) return;
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
              navigationUI: "auto",
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

    addEvent(video, on => on('click', (e: MouseEvent) => {
      if (!scope.isLock) return;
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
    addEvent(video, on => on('timeupdate', (e: Event) => {
      const now = Date.now();
      if (!lastSyncAt) {
        lastSyncAt = now;
      } else
      if (lastSyncAt < now - 5 * 1000) {
        lastSyncAt = now;
        Storage.set({
          [sid]: video.currentTime,
        }).catch((err) => {
          console.error('Storage.set error: %O', err);
        });
      }
    }), disposers);

    /*[
      'abort', 'canplay', 'canplaythrough', 'durationchange', 'emptied', 'ended',
      'error', 'loadeddata', 'loadedmetadata', 'loadstart', 'pause', 'play',
      'playing', 'progress', 'ratechange', 'seeked', 'seeking', 'stalled',
      'suspend', 'timeupdate', 'volumechange', 'waiting',
    ].forEach((type) => {
      video.addEvent(type, (e) => {
        console.log('Event %s: %O', type, e);
      });
    });*/

    const disposeLoadedMetadata = addEvent(video, on => on('loadedmetadata', () => {
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
      disposers.splice(0).forEach(disposer => disposer());

      video.src = '';
      scope.metadataLoaded = false;
    };
  }, [url]);

  const handleLockClick = React.useCallback(() => {
    setLock(v => !v);
  }, []);

  return (
    <>
      {/*<TouchLock onClick={handleLockClick} isLock={isLock}/>*/}
      <VideoTag ref={refVideo} controls={!isLock} />
    </>
  );
});

export default Video;
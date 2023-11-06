import React, {FC, useContext, useEffect, useRef, useState} from 'react';
import {Player} from '@oplayer/core';
import OUI from '@oplayer/ui';
import {styled} from '@mui/material';
import Path from 'path-browserify';
import Hls from 'hls.js';
import {api} from '../../../../tools/api';
import {getSidV2} from '../../utils';
import {VideoMetadata} from '../../types';
import {TITLE} from '../../constants';
import UrlDialogCtx from '../UrlDialog/UrlDialogCtx';

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

    let ui;
    player.use([ui = OUI({
      autoFocus: true,
      pictureInPicture: true,
      miniProgressBar: false,
      coverButton: false,
      theme: {
        primaryColor: '#90caf9',
      },
    })])
      .create();

    ui.keyboard?.unregister(['s', 'ArrowLeft', 'ArrowRight']);

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

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      console.log('keydown: %s', e.code);
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
          const offset = e.altKey ? 10 : 3;
          player.seek(player.currentTime - offset);
          emitTime();
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          const offset = e.altKey ? 10 : 3;
          player.seek(player.currentTime + offset);
          emitTime();
          break;
        }
        case 'KeyN': {
          e.preventDefault();
          toggleUrlDialog();
          break;
        }
      }
    });

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

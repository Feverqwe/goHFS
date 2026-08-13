import {Settings} from '@mui/icons-material';
import {Box, IconButton, Typography} from '@mui/material';
import type {Meta, StoryObj} from '@storybook/react-vite';
import React, {FC, useEffect, useMemo, useRef, useState} from 'react';
import type Player from 'video.js/dist/types/player';
import SettingsMenu from './SettingsMenu';
import type {TrackController, TrackOption} from './tracks';

const AUDIO_TRACKS = ['English · Original', 'Русский · Дубляж', '日本語 · Original'] as const;
const SUBTITLE_TRACKS = ['English', 'Русский', 'Español (Latinoamérica)'] as const;

interface SettingsMenuStoryProps {
  frameHeight: number;
  frameWidth: number;
  view: 'audio' | 'main' | 'subtitles';
}

const noopEventTarget = {
  off: () => undefined,
  on: () => undefined,
};

const SettingsMenuStory: FC<SettingsMenuStoryProps> = ({frameHeight, frameWidth, view}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [audioIndex, setAudioIndex] = useState(0);
  const [subtitleIndex, setSubtitleIndex] = useState<number | null>(1);

  const player = useMemo(
    () =>
      ({
        audioTracks: () => noopEventTarget,
        disablePictureInPicture: () => true,
        isInPictureInPicture: () => false,
        off: noopEventTarget.off,
        on: noopEventTarget.on,
        playbackRate: () => 1,
        textTracks: () => noopEventTarget,
      }) as unknown as Player,
    [],
  );
  const trackController = useMemo<TrackController>(
    () => ({
      cycleAudioTrack: () => undefined,
      cycleSubtitleTrack: () => undefined,
      dispose: () => undefined,
      getAudioTracks: () =>
        AUDIO_TRACKS.map<TrackOption>((label, index) => ({
          index,
          label,
          selected: index === audioIndex,
        })),
      getSubtitleTracks: () =>
        SUBTITLE_TRACKS.map<TrackOption>((label, index) => ({
          index,
          label,
          selected: index === subtitleIndex,
        })),
      selectAudioTrack: setAudioIndex,
      selectSubtitleTrack: setSubtitleIndex,
    }),
    [audioIndex, subtitleIndex],
  );

  useEffect(() => {
    if (!anchorEl || view === 'main') return undefined;

    const openSection = () => {
      const section = containerRef.current?.querySelector<HTMLElement>(
        `[data-settings-view="${view}"]`,
      );
      section?.click();
      return Boolean(section);
    };
    if (openSection()) return undefined;
    const interval = window.setInterval(() => {
      if (openSection()) window.clearInterval(interval);
    }, 50);
    return () => window.clearInterval(interval);
  }, [anchorEl, view]);

  return (
    <Box
      sx={{
        display: 'grid',
        minHeight: '100vh',
        placeItems: 'center',
        bgcolor: '#080a0d',
        p: 2,
      }}
    >
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: `min(${frameWidth}px, calc(100vw - 32px))`,
          height: `min(${frameHeight}px, calc(100vh - 32px))`,
          overflow: 'hidden',
          bgcolor: '#11151b',
          boxShadow: '0 28px 80px rgba(0, 0, 0, 0.55)',
        }}
      >
        <Box sx={{position: 'absolute', top: 24, left: 24}}>
          <Typography sx={{fontSize: 12, fontWeight: 700, letterSpacing: '0.18em'}}>
            NORTH RIDGE.MP4
          </Typography>
          <Typography color="text.secondary" sx={{mt: 0.5, fontSize: 11}}>
            Media settings
          </Typography>
        </Box>
        <Box
          sx={{
            position: 'absolute',
            right: 16,
            bottom: 18,
            left: 16,
            height: 3,
            bgcolor: 'rgba(255, 255, 255, 0.18)',
          }}
        />
        <IconButton
          ref={setAnchorEl}
          aria-label="Settings"
          sx={{position: 'absolute', right: 12, bottom: 28, color: 'common.white'}}
        >
          <Settings />
        </IconButton>
        <SettingsMenu
          anchorEl={anchorEl}
          container={containerRef.current}
          onClose={() => undefined}
          player={player}
          trackController={trackController}
        />
      </Box>
    </Box>
  );
};

const meta = {
  title: 'Player/SettingsMenu',
  component: SettingsMenuStory,
  args: {
    frameHeight: 540,
    frameWidth: 960,
    view: 'main',
  },
  argTypes: {
    frameHeight: {control: {max: 900, min: 240, step: 20, type: 'range'}},
    frameWidth: {control: {max: 1280, min: 320, step: 20, type: 'range'}},
    view: {control: 'select'},
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SettingsMenuStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Main: Story = {};

export const Subtitles: Story = {
  args: {view: 'subtitles'},
};

export const Audio: Story = {
  args: {view: 'audio'},
};

export const MobilePortraitSubtitles: Story = {
  args: {frameHeight: 780, frameWidth: 390, view: 'subtitles'},
};

export const MobilePortraitAudio: Story = {
  args: {frameHeight: 780, frameWidth: 390, view: 'audio'},
};

import {Box} from '@mui/material';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import type {Meta, StoryObj} from '@storybook/react-vite';
import React, {FC, useEffect, useRef} from 'react';
import UrlDialogCtx from '../UrlDialog/UrlDialogCtx';
import Video2 from './Video2';

const DEMO_POSTER = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <rect width="1280" height="720" fill="#11151b"/>
    <path d="M0 562 272 264l152 156 189-228 163 173 183-111 321 281v185H0Z" fill="#252930"/>
    <path d="m0 626 244-207 153 125 194-210 146 137 188-114 355 269v94H0Z" fill="#30353d"/>
    <path d="M0 650h1280M0 674h1280M0 698h1280" stroke="#49515c" stroke-width="2"/>
    <circle cx="962" cy="185" r="74" fill="#d5dae0"/>
    <circle cx="962" cy="185" r="57" fill="#11151b"/>
    <path d="M932 185h60M962 155v60" stroke="#d5dae0" stroke-width="3"/>
    <g fill="#f2f4f7" font-family="Roboto, Helvetica, Arial, sans-serif">
      <text x="64" y="82" font-size="20" letter-spacing="5">GOHFS / MEDIA ARCHIVE</text>
      <text x="64" y="128" font-size="15" fill="#b2b9c2" letter-spacing="2">NORTH RIDGE · CAMERA 04 · 18:42</text>
    </g>
    <path d="M64 154h248" stroke="#d5dae0" stroke-width="3"/>
  </svg>
`)}`;

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {retry: false},
    queries: {retry: false},
  },
});

interface PlayerStoryProps {
  aspectRatio: number;
  currentTime: string;
  duration: string;
  frameWidth: number;
  showSettings: boolean;
}

const PlayerStory: FC<PlayerStoryProps> = ({
  aspectRatio,
  currentTime,
  duration,
  frameWidth,
  showSettings,
}) => {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let settingsOpened = false;
    const preparePlayer = () => {
      const player = frameRef.current?.querySelector<HTMLElement>('.video-js');
      if (!player) return;

      player.classList.add('vjs-paused', 'vjs-user-active');
      player.classList.remove('vjs-has-started', 'vjs-user-inactive');
      const currentTimeDisplay = player.querySelector('.vjs-current-time-display');
      const durationDisplay = player.querySelector('.vjs-duration-display');
      if (currentTimeDisplay?.lastChild) currentTimeDisplay.lastChild.textContent = currentTime;
      if (durationDisplay?.lastChild) durationDisplay.lastChild.textContent = duration;
      player
        .querySelector<HTMLElement>('.vjs-play-progress')
        ?.style.setProperty('width', currentTime === '1:00:00' ? '50%' : '0%');
      if (!showSettings || settingsOpened) return;

      const settingsButton = player.querySelector<HTMLElement>('.vjs-settings-button');
      if (!settingsButton) return;
      settingsOpened = true;
      settingsButton.click();
    };

    preparePlayer();
    const interval = window.setInterval(preparePlayer, 50);
    return () => window.clearInterval(interval);
  }, [currentTime, duration, showSettings]);

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
        ref={frameRef}
        sx={{
          width: `min(${frameWidth}px, calc(100vw - 32px))`,
          aspectRatio,
          overflow: 'hidden',
          bgcolor: 'common.black',
          boxShadow: '0 28px 80px rgba(0, 0, 0, 0.55)',
          '.video-js .vjs-control-bar': {
            display: 'flex',
            visibility: 'visible',
            opacity: 1,
          },
        }}
      >
        <UrlDialogCtx.Provider value={() => undefined}>
          <QueryClientProvider client={queryClient}>
            <Video2
              autoplay={false}
              loadSource={false}
              poster={DEMO_POSTER}
              url="/media/archive/north-ridge.mp4"
            />
          </QueryClientProvider>
        </UrlDialogCtx.Provider>
      </Box>
    </Box>
  );
};

const meta = {
  title: 'Player/Video2',
  component: PlayerStory,
  args: {
    aspectRatio: 16 / 9,
    currentTime: '0:00',
    duration: '0:00',
    frameWidth: 960,
    showSettings: false,
  },
  argTypes: {
    aspectRatio: {control: false},
    frameWidth: {control: {max: 1280, min: 320, step: 20, type: 'range'}},
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PlayerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Paused: Story = {};

export const SettingsOpen: Story = {
  args: {showSettings: true},
};

export const Narrow: Story = {
  args: {frameWidth: 360},
};

export const NarrowSettingsOpen: Story = {
  args: {frameWidth: 360, showSettings: true},
};

export const VerticalTwoHours: Story = {
  args: {
    aspectRatio: 9 / 16,
    currentTime: '1:00:00',
    duration: '2:00:00',
    frameWidth: 390,
  },
};

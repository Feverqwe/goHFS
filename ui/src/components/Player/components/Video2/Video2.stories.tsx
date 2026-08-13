import {Box} from '@mui/material';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import type {Meta, StoryObj} from '@storybook/react-vite';
import React, {FC, useEffect, useRef} from 'react';
import videojs from 'video.js';
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

const DEMO_VERTICAL_POSTER = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
    <rect width="720" height="1280" fill="#11151b"/>
    <path d="M0 1010 172 610l132 174 158-314 119 232 139-118v696H0Z" fill="#252930"/>
    <path d="m0 1100 154-280 130 152 174-276 112 190 150-116v510H0Z" fill="#30353d"/>
    <path d="M0 1178h720M0 1218h720M0 1258h720" stroke="#49515c" stroke-width="2"/>
    <circle cx="530" cy="226" r="64" fill="#d5dae0"/>
    <circle cx="530" cy="226" r="49" fill="#11151b"/>
    <path d="M504 226h52M530 200v52" stroke="#d5dae0" stroke-width="3"/>
    <g fill="#f2f4f7" font-family="Roboto, Helvetica, Arial, sans-serif">
      <text x="48" y="76" font-size="17" letter-spacing="4">GOHFS / VERTICAL ARCHIVE</text>
      <text x="48" y="112" font-size="13" fill="#b2b9c2" letter-spacing="2">NORTH RIDGE · CAMERA 07</text>
    </g>
    <path d="M48 136h212" stroke="#d5dae0" stroke-width="3"/>
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
  fillViewport: boolean;
  frameWidth: number;
  mediaOrientation: 'landscape' | 'portrait';
  mobileTouch: boolean;
  progressTooltipPercent: number;
  showSettings: boolean;
  subtitleText: string;
  timelineDuration: number;
  volumeExpanded: boolean;
}

const formatTimelineTime = (time: number) => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const prepareTimeline = (
  player: HTMLElement,
  timelineDuration: number,
  progressTooltipPercent: number,
) => {
  const playerApi = videojs.getPlayer(player.id);
  if (playerApi && timelineDuration > 0) playerApi.duration(timelineDuration);

  const mouseDisplay = player.querySelector<HTMLElement>(
    '.vjs-progress-control .vjs-mouse-display',
  );
  const timeTooltip = mouseDisplay?.querySelector<HTMLElement>('.vjs-time-tooltip');
  if (!mouseDisplay || !timeTooltip) return;

  if (progressTooltipPercent < 0) {
    mouseDisplay.style.removeProperty('display');
    mouseDisplay.style.removeProperty('left');
    timeTooltip.style.removeProperty('display');
    timeTooltip.style.removeProperty('transform');
    timeTooltip.style.removeProperty('visibility');
    return;
  }

  mouseDisplay.style.display = 'block';
  mouseDisplay.style.left = `${progressTooltipPercent * 100}%`;
  timeTooltip.style.display = 'block';
  timeTooltip.style.transform = 'translateX(-50%)';
  timeTooltip.style.visibility = 'visible';
  timeTooltip.textContent = formatTimelineTime(timelineDuration * progressTooltipPercent);
};

const PlayerStory: FC<PlayerStoryProps> = ({
  aspectRatio,
  currentTime,
  duration,
  fillViewport,
  frameWidth,
  mediaOrientation,
  mobileTouch,
  progressTooltipPercent,
  showSettings,
  subtitleText,
  timelineDuration,
  volumeExpanded,
}) => {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let settingsOpened = false;
    const preparePlayer = () => {
      const player = frameRef.current?.querySelector<HTMLElement>('.video-js');
      if (!player) return;

      player.classList.add('vjs-paused', 'vjs-user-active');
      player.classList.remove('vjs-has-started', 'vjs-user-inactive');
      player.classList.toggle('vjs-mobile-touch', mobileTouch);
      player.classList.toggle('vjs-show-big-play-button-on-pause', mobileTouch);
      prepareTimeline(player, timelineDuration, progressTooltipPercent);
      player.querySelector('.vjs-volume-panel')?.classList.toggle('vjs-hover', volumeExpanded);
      const subtitleElement = player.querySelector<HTMLElement>('.vjs-custom-subtitles');
      if (subtitleElement && subtitleElement.textContent !== subtitleText) {
        subtitleElement.replaceChildren();
        subtitleText.split('\n').forEach((line) => {
          const paragraph = document.createElement('p');
          const text = document.createElement('span');
          text.textContent = line;
          paragraph.appendChild(text);
          subtitleElement.appendChild(paragraph);
        });
      }
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
  }, [
    currentTime,
    duration,
    mobileTouch,
    progressTooltipPercent,
    showSettings,
    subtitleText,
    timelineDuration,
    volumeExpanded,
  ]);

  return (
    <Box
      sx={{
        display: 'grid',
        minHeight: '100vh',
        placeItems: 'center',
        bgcolor: '#080a0d',
        p: fillViewport ? 0 : 2,
      }}
    >
      <Box
        ref={frameRef}
        sx={{
          width: fillViewport ? '100vw' : `min(${frameWidth}px, calc(100vw - 32px))`,
          height: fillViewport ? '100vh' : undefined,
          aspectRatio: fillViewport ? undefined : aspectRatio,
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
              poster={mediaOrientation === 'portrait' ? DEMO_VERTICAL_POSTER : DEMO_POSTER}
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
    fillViewport: false,
    frameWidth: 960,
    mediaOrientation: 'landscape',
    mobileTouch: false,
    progressTooltipPercent: -1,
    showSettings: false,
    subtitleText: '',
    timelineDuration: 0,
    volumeExpanded: false,
  },
  argTypes: {
    aspectRatio: {control: false},
    fillViewport: {control: false},
    frameWidth: {control: {max: 1280, min: 320, step: 20, type: 'range'}},
    mobileTouch: {control: false},
    progressTooltipPercent: {control: false},
    subtitleText: {control: false},
    timelineDuration: {control: false},
    volumeExpanded: {control: false},
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

export const VolumeExpanded: Story = {
  args: {duration: '2:00:00', timelineDuration: 2 * 60 * 60, volumeExpanded: true},
};

export const ProgressTooltip: Story = {
  args: {
    currentTime: '1:00:00',
    duration: '2:00:00',
    progressTooltipPercent: 0.5,
    timelineDuration: 2 * 60 * 60,
  },
};

export const VerticalMediaTwoHours: Story = {
  args: {
    currentTime: '1:00:00',
    duration: '2:00:00',
    fillViewport: true,
    mediaOrientation: 'portrait',
    mobileTouch: true,
    subtitleText: 'Ветер стихает\nThe wind is settling',
    timelineDuration: 2 * 60 * 60,
  },
};

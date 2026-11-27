import React from 'react';
import {Box} from '@mui/material';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import type {Meta, StoryObj} from '@storybook/react-vite';
import UrlDialogCtx from '../UrlDialog/UrlDialogCtx';
import PlaylistPlayer from './PlaylistPlayer';

const client = new QueryClient();
const ignore = () => undefined;
const clipUrl = new URL('./playlist-demo.mp4', import.meta.url).href;
const demoUrl = (file: string) => `${clipUrl}?${new URLSearchParams({file})}`;
const playlist = [
  {name: '03 North Ridge — Evening.mp4', url: demoUrl('03')},
  {name: '01 Railyard — Arrival.mp4', url: demoUrl('01')},
  {name: '02 The station at dawn with field recordings and commentary.mp4', url: demoUrl('02')},
  {name: 'Field notes, take 10.mp4', url: demoUrl('10')},
  {name: 'Field notes, take 2.mp4', url: demoUrl('take2')},
  {name: 'Night signal.mp4', url: demoUrl('night')},
];

const meta = {
  title: 'Player/Playlist',
  component: PlaylistPlayer,
  parameters: {layout: 'fullscreen'},
  decorators: [
    (Story) => (
      <UrlDialogCtx.Provider value={ignore}>
        <QueryClientProvider client={client}>
          <Box sx={{height: '100dvh'}}>
            <Story />
          </Box>
        </QueryClientProvider>
      </UrlDialogCtx.Provider>
    ),
  ],
  args: {
    playlist,
    initialPositions: {[demoUrl('03')]: 2, [demoUrl('02')]: 7, [demoUrl('take2')]: 5},
    autoplay: false,
    persistPosition: false,
  },
} satisfies Meta<typeof PlaylistPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FolderOrder: Story = {};
export const Empty: Story = {args: {playlist: []}};

export const UnavailableFile: Story = {
  args: {
    playlist: [{name: 'Unavailable clip.mp4', url: 'data:video/mp4,'}, playlist[0]],
  },
};

export const AllUnavailable: Story = {
  args: {
    playlist: [
      {name: 'Unavailable clip 1.mp4', url: 'data:video/mp4,one'},
      {name: 'Unavailable clip 2.mp4', url: 'data:video/mp4,two'},
    ],
    initialSettings: {sort: 'original', repeat: 'all', shuffle: false, resume: false},
  },
};

export const UnavailableHls: Story = {
  args: {
    playlist: [
      {
        name: 'Invalid stream.m3u8',
        url: 'data:application/vnd.apple.mpegurl,Invalid%20manifest#broken.m3u8',
      },
    ],
  },
};

export const RestoredControls: Story = {
  args: {
    initialSettings: {sort: 'nameDescending', repeat: 'one', shuffle: true, resume: false},
    initialPositions: {[demoUrl('night')]: 7},
  },
};

export const LinkedTrack: Story = {args: {initialTrack: demoUrl('02')}};

export const RepeatSingleFile: Story = {
  args: {
    playlist: [playlist[0]],
    initialSettings: {sort: 'original', repeat: 'all', shuffle: false, resume: false},
  },
};

import {Box} from '@mui/material';
import {QueryClientProvider} from '@tanstack/react-query';
import type {Meta, StoryObj} from '@storybook/react-vite';
import React, {ComponentProps, useCallback, useState} from 'react';
import {RootStoreCtx} from '../../../RootStore/RootStoreCtx';
import {queryClient} from '../../../../tools/queryClient';
import {
  ChangeSelectedCallback,
  SelectChangeSelectedCtx,
  SelectModeCtx,
  SelectSelectedCtx,
} from '../SelectProvider/SelectCtx';
import File from './File';

const folder = {
  name: 'Summer archive',
  size: 0,
  ctime: Date.UTC(2026, 7, 12, 9, 30),
  isDir: true,
  progress: 0,
  hasPreview: false,
};

const video = {
  name: 'Northern lights — final cut.mkv',
  size: 2_764_512_256,
  ctime: Date.UTC(2026, 7, 11, 21, 14),
  isDir: false,
  progress: 0,
  hasPreview: false,
};

const longName = {
  ...video,
  name: 'Family trip to the northern coast — restored camera original — 2026-08-11.mkv',
};

const SelectableFile = (props: ComponentProps<typeof File>) => {
  const [selected, setSelected] = useState([props.file.name]);
  const changeSelected = useCallback(
    (callback: ChangeSelectedCallback) => setSelected((value) => callback(value, [props.file])),
    [props.file],
  );

  return (
    <SelectSelectedCtx.Provider value={selected}>
      <SelectChangeSelectedCtx.Provider value={changeSelected}>
        <SelectModeCtx.Provider value>
          <File {...props} />
        </SelectModeCtx.Provider>
      </SelectChangeSelectedCtx.Provider>
    </SelectSelectedCtx.Provider>
  );
};

const meta = {
  title: 'Folder/File',
  component: File,
  decorators: [
    (Story, context) => (
      <QueryClientProvider client={queryClient}>
        <RootStoreCtx.Provider
          value={{
            dir: '/Shared media',
            isRoot: false,
            isWritable: true,
            files: [context.args.file],
            extHandle: {'.mkv': 'video'},
            extActions: {
              '.mkv': [
                {name: 'Open in media player', url: '', newPage: true},
                {name: 'Download original', url: ''},
              ],
            },
            dirSort: null,
            viewMode: context.args.viewMode,
            gridPreviewSize: 220,
          }}
        >
          <Box
            sx={{
              width: context.args.viewMode === 'grid' ? 220 : 640,
              maxWidth: 'calc(100vw - 32px)',
            }}
          >
            <Story />
          </Box>
        </RootStoreCtx.Provider>
      </QueryClientProvider>
    ),
  ],
  args: {
    dir: '/Shared media',
    writable: false,
    viewMode: 'grid',
    onReload: async () => {},
    file: folder,
  },
  argTypes: {
    onReload: {control: false},
  },
} satisfies Meta<typeof File>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GridFolder: Story = {};

export const GridMedia: Story = {
  args: {
    file: video,
  },
};

export const GridLongName: Story = {
  args: {
    file: longName,
  },
};

export const GridTransfer: Story = {
  args: {
    file: {
      ...video,
      name: 'Uploading concert recording.mp4',
      progress: 64,
    },
  },
};

export const GridSelected: Story = {
  args: {
    file: video,
    writable: true,
  },
  render: (args) => <SelectableFile {...args} />,
};

export const ListMedia: Story = {
  args: {
    file: video,
    viewMode: 'list',
  },
};

export const ListLongName: Story = {
  args: {
    file: longName,
    viewMode: 'list',
  },
};

export const ListSelected: Story = {
  args: {
    file: video,
    viewMode: 'list',
    writable: true,
  },
  render: (args) => <SelectableFile {...args} />,
};

import {Box} from '@mui/material';
import {QueryClientProvider} from '@tanstack/react-query';
import type {Meta, StoryObj} from '@storybook/react-vite';
import React from 'react';
import File from './File';
import {queryClient} from '../../../../tools/queryClient';

const meta = {
  title: 'Folder/File',
  component: File,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Box sx={{width: {xs: 180, sm: 220}}}>
          <Story />
        </Box>
      </QueryClientProvider>
    ),
  ],
  args: {
    dir: '/',
    writable: false,
    viewMode: 'grid',
    onReload: async () => {},
    file: {
      name: 'Summer archive',
      size: 0,
      ctime: Date.UTC(2026, 7, 12, 9, 30),
      isDir: true,
      progress: 0,
      hasPreview: false,
    },
  },
  argTypes: {
    onReload: {control: false},
  },
} satisfies Meta<typeof File>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {};

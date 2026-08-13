import {Box} from '@mui/material';
import type {Meta, StoryObj} from '@storybook/react-vite';
import React from 'react';
import Report from './Report';

const meta = {
  title: 'Folder/Report',
  component: Report,
  decorators: [
    (Story) => (
      <Box sx={{width: {xs: 300, sm: 560}, maxWidth: 'calc(100vw - 32px)'}}>
        <Story />
      </Box>
    ),
  ],
  args: {
    report: [
      {filename: 'holiday-photo.jpg', ok: true, error: ''},
      {filename: 'project-notes.txt', ok: true, error: ''},
    ],
  },
} satisfies Meta<typeof Report>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Successful: Story = {};

export const MixedResults: Story = {
  args: {
    report: [
      {filename: 'holiday-photo.jpg', ok: true, error: ''},
      {
        filename: 'project-backup.zip',
        ok: false,
        error: 'The server rejected this file because the destination is read only.',
      },
      {filename: 'project-notes.txt', ok: true, error: ''},
    ],
  },
};

export const LongContent: Story = {
  args: {
    report: [
      {
        filename: 'quarterly-archive-with-a-very-long-descriptive-filename-2026-08-13.tar.gz',
        ok: false,
        error:
          'Upload failed after several attempts because the remote destination stopped accepting data.',
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    report: [],
  },
};

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
      {kind: 'file', path: 'holiday-photo.jpg', error: ''},
      {kind: 'folder', path: 'Project assets', uploadedFiles: 12_450, errorCount: 0, errors: []},
      {kind: 'folder', path: 'Empty folder', uploadedFiles: 0, errorCount: 0, errors: []},
    ],
  },
} satisfies Meta<typeof Report>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Successful: Story = {};

export const MixedResults: Story = {
  args: {
    report: [
      {kind: 'file', path: 'holiday-photo.jpg', error: ''},
      {
        kind: 'folder',
        path: 'Project assets',
        uploadedFiles: 127,
        errorCount: 2,
        errors: [
          {path: 'Project assets/Exports/cover.png', message: 'File exists'},
          {path: 'Project assets/Exports/title.png', message: 'File exists'},
        ],
      },
      {kind: 'file', path: 'project-notes.txt', error: 'File exists'},
    ],
  },
};

export const LongContent: Story = {
  args: {
    report: [
      {
        kind: 'folder',
        path: 'Project assets',
        uploadedFiles: 0,
        errorCount: 25,
        errors: [
          {
            path: 'Project assets/Exports/quarterly-archive-with-a-very-long-filename.tar.gz',
            message: 'File exists',
          },
        ],
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    report: [],
  },
};

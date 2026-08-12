import React from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {Button, Typography} from '@mui/material';
import AsyncDataDialog from './AsyncDataDialog';

const meta = {
  title: 'Folder/AsyncDataDialog',
  component: AsyncDataDialog,
  args: {
    actions: <Button>Update</Button>,
    children: <Typography>Loaded data appears here.</Typography>,
    error: null,
    loading: false,
    onClose: () => {},
  },
  argTypes: {
    actions: {control: false},
    children: {control: false},
    error: {control: false},
    onClose: {control: false},
  },
} satisfies Meta<typeof AsyncDataDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Error: Story = {
  args: {
    error: new globalThis.Error('Failed to load data.'),
  },
};

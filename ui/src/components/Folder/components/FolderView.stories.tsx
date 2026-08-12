import {QueryClientProvider} from '@tanstack/react-query';
import type {Meta, StoryObj} from '@storybook/react-vite';
import React from 'react';
import {RootStoreCtx} from '../../RootStore/RootStoreCtx';
import {queryClient} from '../../../tools/queryClient';
import FolderView from './FolderView';

const meta = {
  title: 'Folder/FolderView',
  component: FolderView,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <RootStoreCtx.Provider
          value={{
            dir: '/Shared media',
            isRoot: false,
            isWritable: false,
            files: [],
            extHandle: {},
            extActions: {},
            dirSort: null,
            viewMode: 'grid',
            gridPreviewSize: 180,
          }}
        >
          <Story />
        </RootStoreCtx.Provider>
      </QueryClientProvider>
    ),
  ],
  args: {
    files: [],
    onShowSortDialog: () => {},
    viewMode: 'grid',
    onChangeViewMode: async () => {},
    gridPreviewSize: 180,
    onChangeGridPreviewSize: async () => {},
    activeSearch: null,
    searching: false,
    searchError: null,
    onSearch: async () => {},
    onClearSearch: () => {},
  },
  argTypes: {
    onShowSortDialog: {control: false},
    onChangeViewMode: {control: false},
    onChangeGridPreviewSize: {control: false},
    onSearch: {control: false},
    onClearSearch: {control: false},
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof FolderView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Navigation: Story = {};

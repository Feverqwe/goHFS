import {CacheProvider} from '@emotion/react';
import {CssBaseline, ThemeProvider} from '@mui/material';
import type {Preview} from '@storybook/react-vite';
import React from 'react';
import cache from '../src/tools/muiCache';
import theme from '../src/tools/muiTheme';

const preview: Preview = {
  decorators: [
    (Story) => (
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Story />
        </ThemeProvider>
      </CacheProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
};

export default preview;

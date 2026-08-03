import * as React from 'react';
import {CacheProvider} from '@emotion/react';
import {CssBaseline, ThemeProvider} from '@mui/material';
import {createRoot} from 'react-dom/client';
import {QueryClientProvider} from '@tanstack/react-query';
import Player from './components/Player/Player';
import cache from './tools/muiCache';
import theme from './tools/muiTheme';
import {queryClient} from './tools/queryClient';

const root = createRoot(document.getElementById('root')!);

root.render(
  <CacheProvider value={cache}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Player />
      </ThemeProvider>
    </QueryClientProvider>
  </CacheProvider>,
);

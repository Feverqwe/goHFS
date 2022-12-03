import * as React from 'react';
import {CacheProvider} from '@emotion/react';
import {CssBaseline, ThemeProvider} from '@mui/material';
import {createRoot} from 'react-dom/client';
import Player from './components/Player/Player';
import cache from './tools/muiCache';
import theme from './tools/muiTheme';

const root = createRoot(document.getElementById('root')!);

root.render(
  <CacheProvider value={cache}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Player />
    </ThemeProvider>
  </CacheProvider>,
);

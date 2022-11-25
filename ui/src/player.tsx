import * as React from 'react';
import {CacheProvider} from '@emotion/react';
import {CssBaseline, ThemeProvider} from '@mui/material';
import {createRoot} from 'react-dom/client';
import Root from './components/Player/Root/Root';
import cache from './tools/muiCache';
import theme from './tools/muiTheme';

const root = createRoot(document.getElementById('root')!);

root.render(
  <CacheProvider value={cache}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Root />
    </ThemeProvider>
  </CacheProvider>,
);

import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {CssBaseline, ThemeProvider} from '@mui/material';
import {CacheProvider} from '@emotion/react';
import {QueryClientProvider} from '@tanstack/react-query';
import Folder from './components/Folder/Folder';
import theme from './tools/muiTheme';
import cache from './tools/muiCache';
import RootStoreProvider from './components/RootStore/RootStoreProvider';
import DialogProvider from './components/Folder/components/DialogProvider/DialogProvider';
import {queryClient} from './tools/queryClient';

const root = createRoot(document.getElementById('root')!);

root.render(
  <CacheProvider value={cache}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RootStoreProvider>
          <DialogProvider>
            <Folder />
          </DialogProvider>
        </RootStoreProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </CacheProvider>,
);

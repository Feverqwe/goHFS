import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {CssBaseline, ThemeProvider} from '@mui/material';
import {CacheProvider} from '@emotion/react';
import Folder from './components/Folder/Folder';
import theme from './tools/muiTheme';
import cache from './tools/muiCache';
import RootStoreProvider from './components/RootStore/RootStoreProvider';
import SelectProvider from './components/Folder/components/SelectProvider/SelectProvider';
import DialogProvider from './components/Folder/components/DialogProvider/DialogProvider';

const root = createRoot(document.getElementById('root')!);

root.render(
  <CacheProvider value={cache}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RootStoreProvider>
        <DialogProvider>
          <SelectProvider>
            <Folder />
          </SelectProvider>
        </DialogProvider>
      </RootStoreProvider>
    </ThemeProvider>
  </CacheProvider>,
);

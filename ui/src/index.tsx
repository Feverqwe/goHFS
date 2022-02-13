import * as React from "react";
import * as ReactDOM from "react-dom";
import Folder from "./components/Folder";
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import {CacheProvider} from '@emotion/react';
import createCache from '@emotion/cache';

export interface FileInfo {
  size: number,
  ctime: number,
  name: string,
  isDir: boolean,
  handleUrl: string,
}

export interface RootStore {
  dir: string,
  isRoot: boolean,
  isRemovable: boolean,
  files: FileInfo[]
}

declare const ROOT_STORE: RootStore | undefined;

const rootStore = ('ROOT_STORE' in window && ROOT_STORE) || {
  dir: '/',
  isRoot: true,
  isRemovable: true,
  files: [
    {
      name: 'test',
      isDir: true,
      ctime: Date.now(),
      size: 0,
      handleUrl: '',
    },
    {
      name: 'text.txt',
      isDir: false,
      ctime: Date.now(),
      size: 10,
      handleUrl: '',
    },
    {
      name: 'audio.mp3',
      isDir: false,
      ctime: Date.now(),
      size: 5 * 1024 * 1024,
      handleUrl: '',
    },
    {
      name: 'image.png',
      isDir: false,
      ctime: Date.now(),
      size: 256 * 1024,
      handleUrl: '',
    },
    {
      name: 'test.mp4',
      isDir: false,
      ctime: Date.now(),
      size: 550 * 1024 * 1024,
      handleUrl: '',
    },
    {
      name: 'test2.mp4',
      isDir: false,
      ctime: Date.now(),
      size: 1545 * 1024 * 1024,
      handleUrl: '',
    },
    {
      name: 'playable.mp4',
      isDir: false,
      ctime: Date.now(),
      size: 1545 * 1024 * 1024,
      handleUrl: 'http://192.168.1.9/Player/player.html?url={url}',
    },
  ],
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    ...{
      text: {
        primary: '#fff',
        secondary: 'rgba(255, 255, 255, 0.7)',
        disabled: 'rgba(255, 255, 255, 0.5)',
      },
      action: {
        active: '#fff',
        hover: 'rgba(255, 255, 255, 0.08)',
        selected: 'rgba(255, 255, 255, 0.16)',
        disabled: 'rgba(255, 255, 255, 0.3)',
        disabledBackground: 'rgba(255, 255, 255, 0.12)',
      },
      background: {
        default: '#303030',
        paper: '#424242',
      },
      divider: 'rgba(255, 255, 255, 0.12)',
    },
  }
});

const Favicon = () => {
  return ReactDOM.createPortal(<>
    <link rel="icon" type="image/png" href={require('./assets/icons/16.png').default} sizes="16x16"/>
    <link rel="icon" type="image/png" href={require('./assets/icons/32.png').default} sizes="32x32"/>
    <link rel="icon" type="image/png" href={require('./assets/icons/96.png').default} sizes="96x96"/>
  </>, document.head);
};

const cache = createCache({
    key: 'css',
    prepend: true,
});

ReactDOM.render(
  <CacheProvider value={cache}>
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <Favicon/>
      <Folder store={rootStore}/>
    </ThemeProvider>
  </CacheProvider>,
  document.getElementById('root')
);
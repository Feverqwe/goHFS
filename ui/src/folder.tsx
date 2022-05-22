import * as React from "react";
import {createRoot} from 'react-dom/client';
import Folder from "./components/Folder/Folder";
import {CssBaseline, ThemeProvider} from "@mui/material";
import {CacheProvider} from '@emotion/react';
import theme from "./tools/muiTheme";
import cache from "./tools/muiCache";

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
  isWritable: boolean,
  files: FileInfo[]
}

declare const ROOT_STORE: RootStore | undefined;

const rootStore = ('ROOT_STORE' in window && ROOT_STORE) || {
  dir: '/',
  isRoot: true,
  isWritable: true,
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
      handleUrl: '/~/www/player.html?url={url}',
    },
  ],
};

const root = createRoot(document.getElementById('root')!);

root.render(
  <CacheProvider value={cache}>
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <Folder store={rootStore}/>
    </ThemeProvider>
  </CacheProvider>
);
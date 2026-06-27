import {createContext} from 'react';
import {RootStore} from '../../types';

const defaultStore = {
  dir: '/',
  isRoot: true,
  isWritable: true,
  files: [],
  extHandle: {},
  extActions: {},
  dirSort: null,
  viewMode: null,
  gridPreviewSize: null,
} satisfies RootStore;

export const RootStoreCtx = createContext<RootStore>(defaultStore);

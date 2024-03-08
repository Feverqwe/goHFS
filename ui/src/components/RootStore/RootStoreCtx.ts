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
};

export const RootStoreCtx = createContext<RootStore>(defaultStore);

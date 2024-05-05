import React, {FC, ReactNode, useCallback, useMemo, useState} from 'react';
import {RootStoreCtx} from './RootStoreCtx';
import {RootStore} from '../../types';
import {RootStoreUpdateCtx} from './RootStoreUpdateCtx';
import {api} from '../../tools/api';
import {RootStoreStateCtx} from "./RootStoreStateCtx";

declare const ROOT_STORE: RootStore | undefined;

const rootStore = ('ROOT_STORE' in window && ROOT_STORE) as RootStore;

interface RootStoreProviderProps {
  children: ReactNode;
}

const RootStoreProvider: FC<RootStoreProviderProps> = ({children}) => {
  const [currentStore, setCurrentStore] = useState<RootStore>(rootStore);
  const [isUpdate, setUpdate] = useState(false);
  const place = useMemo(() => currentStore.dir, [currentStore.dir]);

  const handleUpdate = useCallback(async () => {
    try {
      setUpdate(true);
      const store = await api.getStore({
        place,
      });
      setCurrentStore(store);
    } finally {
      setUpdate(false);
    }
  }, [place]);

  return (
    <RootStoreUpdateCtx.Provider value={handleUpdate}>
      <RootStoreStateCtx.Provider value={isUpdate}>
        <RootStoreCtx.Provider value={currentStore}>{children}</RootStoreCtx.Provider>
      </RootStoreStateCtx.Provider>
    </RootStoreUpdateCtx.Provider>
  );
};

export default RootStoreProvider;

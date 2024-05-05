import React, {FC, ReactNode, useCallback, useMemo, useState} from 'react';
import {RootStoreCtx} from './RootStoreCtx';
import {RootStore} from '../../types';
import {RootStoreUpdateCtx} from './RootStoreUpdateCtx';
import {api} from '../../tools/api';

declare const ROOT_STORE: RootStore | undefined;

const rootStore = ('ROOT_STORE' in window && ROOT_STORE) as RootStore;

interface RootStoreProviderProps {
  children: ReactNode;
}

const RootStoreProvider: FC<RootStoreProviderProps> = ({children}) => {
  const [currentStore, setCurrentStore] = useState<RootStore>(rootStore);
  const place = useMemo(() => currentStore.dir, [currentStore.dir]);

  const handleUpdate = useCallback(async () => {
    const store = await api.getStore({
      place,
    });
    setCurrentStore(store);
  }, [place]);

  return (
    <RootStoreUpdateCtx.Provider value={handleUpdate}>
      <RootStoreCtx.Provider value={currentStore}>{children}</RootStoreCtx.Provider>
    </RootStoreUpdateCtx.Provider>
  );
};

export default RootStoreProvider;

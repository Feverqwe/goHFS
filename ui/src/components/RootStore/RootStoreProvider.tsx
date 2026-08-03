import React, {FC, ReactNode, useCallback} from 'react';
import {useQuery} from '@tanstack/react-query';
import {RootStoreCtx} from './RootStoreCtx';
import {RootStore} from '../../types';
import {RootStoreUpdateCtx} from './RootStoreUpdateCtx';
import {api} from '../../tools/api';
import {queryKeys} from '../../tools/queryClient';

declare const ROOT_STORE: RootStore | undefined;

const rootStore = ('ROOT_STORE' in window && ROOT_STORE) as RootStore;

interface RootStoreProviderProps {
  children: ReactNode;
}

const RootStoreProvider: FC<RootStoreProviderProps> = ({children}) => {
  const place = rootStore.dir;
  const {data: currentStore, refetch} = useQuery({
    queryKey: queryKeys.rootStore(place),
    queryFn: () => api.getStore({place}),
    initialData: rootStore,
  });

  const handleUpdate = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <RootStoreUpdateCtx.Provider value={handleUpdate}>
      <RootStoreCtx.Provider value={currentStore}>{children}</RootStoreCtx.Provider>
    </RootStoreUpdateCtx.Provider>
  );
};

export default RootStoreProvider;

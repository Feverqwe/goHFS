import {createContext} from 'react';

export const RootStoreUpdateCtx = createContext<() => Promise<void>>(async () => {});

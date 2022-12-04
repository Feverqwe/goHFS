import {createContext} from 'react';
import {DialogData} from './types';

export const DialogSetDataCtx = createContext<(data: DialogData) => void>(() => {});

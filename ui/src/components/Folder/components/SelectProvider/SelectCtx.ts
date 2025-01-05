import {createContext} from 'react';
import {FileInfo} from '../../../../types';

export type ChangeSelectedCallback = (selected: string[], files: FileInfo[]) => string[];

export const SelectSelectedCtx = createContext<string[]>([]);
export const SelectChangeSelectedCtx = createContext<(callback: ChangeSelectedCallback) => void>(
  () => {},
);

export const SelectModeCtx = createContext<boolean>(false);

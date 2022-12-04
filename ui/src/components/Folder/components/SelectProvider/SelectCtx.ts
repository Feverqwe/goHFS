import {createContext, Dispatch, SetStateAction} from "react";

export const SelectSelectedCtx = createContext<string[]>([]);
export const SelectChangeSelectedCtx = createContext<Dispatch<SetStateAction<string[]>>>(() => {});

export const SelectModeCtx = createContext<boolean>(false);
export const SelectChangeModeCtx = createContext<(enabled: boolean) => void>(() => {});

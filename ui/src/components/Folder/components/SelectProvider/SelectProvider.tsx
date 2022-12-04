import React, {FC, ReactNode, useCallback, useState} from 'react';
import {SelectChangeModeCtx, SelectChangeSelectedCtx, SelectModeCtx, SelectSelectedCtx} from './SelectCtx';

interface SelectProviderProps {
  children: ReactNode;
}

const SelectProvider: FC<SelectProviderProps> = ({children}) => {
  const [selectMode, setSelectMode] = useState<boolean>(false);
  const [selected, setSelected] = useState<string[]>([]);

  const handleChangeSelected = useCallback((enabled: boolean) => {
    setSelectMode(enabled);
    setSelected([]);
  }, []);

  return (
    <SelectSelectedCtx.Provider value={selected}>
      <SelectChangeSelectedCtx.Provider value={setSelected}>
        <SelectModeCtx.Provider value={selectMode}>
          <SelectChangeModeCtx.Provider value={handleChangeSelected}>
            {children}
          </SelectChangeModeCtx.Provider>
        </SelectModeCtx.Provider>
      </SelectChangeSelectedCtx.Provider>
    </SelectSelectedCtx.Provider>
  );
};

export default SelectProvider;

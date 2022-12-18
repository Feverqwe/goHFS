import React, {FC, ReactNode, useCallback, useRef, useState} from 'react';
import {ChangeSelectedCallback, SelectChangeSelectedCtx, SelectModeCtx, SelectSelectedCtx} from './SelectCtx';
import {FileInfo} from '../../../../types';

interface SelectProviderProps {
  files: FileInfo[];
  children: ReactNode;
}

const SelectProvider: FC<SelectProviderProps> = ({children, files}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const refSelected = useRef(selected);
  const refFiles = useRef(files);
  refFiles.current = files;
  refSelected.current = selected;

  const handleChangeSelected = useCallback((callback: ChangeSelectedCallback) => {
    setSelected(callback(refSelected.current, refFiles.current));
  }, []);

  return (
    <SelectSelectedCtx.Provider value={selected}>
      <SelectChangeSelectedCtx.Provider value={handleChangeSelected}>
        <SelectModeCtx.Provider value={Boolean(selected.length)}>
          {children}
        </SelectModeCtx.Provider>
      </SelectChangeSelectedCtx.Provider>
    </SelectSelectedCtx.Provider>
  );
};

export default SelectProvider;

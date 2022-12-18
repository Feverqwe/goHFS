import * as React from 'react';
import {FC, memo, useCallback, useContext, useMemo, useState} from 'react';
import SelectProvider from './components/SelectProvider/SelectProvider';
import FolderView from './components/FolderView';
import {FileInfo} from '../../types';
import {getOption, setOption} from './utils';
import {RootStoreCtx} from '../RootStore/RootStoreCtx';
import SortChooseDialog from './components/SortChooseDialog';

const Folder: FC = () => {
  const store = useContext(RootStoreCtx);
  const [files] = useState(store.files);
  const [showSortDialog, setShowSortDialog] = useState(false);
  const [sortKey, setSortKey] = useState(() => {
    return getOption<[keyof FileInfo, boolean]>('sort', ['ctime', false]);
  });

  const handleSortBtn = useCallback(() => {
    setShowSortDialog(true);
  }, []);

  const changeSort = useCallback((keyDir: [string, boolean]) => {
    setSortKey(keyDir as [keyof FileInfo, boolean]);
    setOption('sort', keyDir);
  }, []);

  const handleCloseSortDialog = useCallback(() => {
    setShowSortDialog(false);
  }, []);

  const sortedFiles = useMemo(() => {
    const [key, d] = sortKey;
    const [r1, r2] = d ? [1, -1] : [-1, 1];
    const result = files.slice(0);
    result.sort(({[key]: a}, {[key]: b}) => {
      return a === b ? 0 : a > b ? r1 : r2;
    });
    result.sort(({isDir: a}, {isDir: b}) => {
      return a === b ? 0 : a ? -1 : 1;
    });
    return result;
  }, [files, sortKey]);

  return (
    <SelectProvider files={sortedFiles}>
      <FolderView files={sortedFiles} onShowSortDialog={handleSortBtn} />
      {showSortDialog && (
        <SortChooseDialog sortKey={sortKey} changeSort={changeSort} onClose={handleCloseSortDialog} />
      )}
    </SelectProvider>
  );
};

export default memo(Folder);

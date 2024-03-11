import * as React from 'react';
import {FC, memo, useCallback, useContext, useMemo, useState} from 'react';
import SelectProvider from './components/SelectProvider/SelectProvider';
import FolderView from './components/FolderView';
import {DirSort, FileInfo} from '../../types';
import {prepDirSort, shuffle} from './utils';
import {RootStoreCtx} from '../RootStore/RootStoreCtx';
import SortDialog from './components/SortDialog/SortDialog';
import {api} from '../../tools/api';

const Folder: FC = () => {
  const store = useContext(RootStoreCtx);
  const [files] = useState(store.files);
  const [showSortDialog, setShowSortDialog] = useState(false);
  const [sortKey, setSortKey] = useState(() => {
    return prepDirSort(store.dirSort) ?? {key: 'ctime', revers: true};
  });

  const handleSortBtn = useCallback(() => {
    setShowSortDialog(true);
  }, []);

  const changeSort = useCallback(
    async (dirSort: DirSort) => {
      setSortKey(dirSort);
      await api.storageSet<Record<string, DirSort>>({
        [`dirSort-${store.dir}`]: dirSort,
      });
    },
    [store.dir],
  );

  const handleCloseSortDialog = useCallback(() => {
    setShowSortDialog(false);
  }, []);

  const sortedFiles = useMemo(() => {
    const {key, revers: d} = sortKey;
    const field = key;
    const [r1, r2] = d ? [-1, 1] : [1, -1];
    const result = files.slice(0);
    if (field === 'random') {
      shuffle(result);
    } else {
      result.sort(({[field as keyof FileInfo]: a}, {[field as keyof FileInfo]: b}) => {
        return a === b ? 0 : a > b ? r1 : r2;
      });
    }
    result.sort(({isDir: a}, {isDir: b}) => {
      return a === b ? 0 : a ? -1 : 1;
    });
    return result;
  }, [files, sortKey]);

  return (
    <SelectProvider files={sortedFiles}>
      <FolderView files={sortedFiles} onShowSortDialog={handleSortBtn} />
      {showSortDialog && (
        <SortDialog sortKey={sortKey} changeSort={changeSort} onClose={handleCloseSortDialog} />
      )}
    </SelectProvider>
  );
};

export default memo(Folder);

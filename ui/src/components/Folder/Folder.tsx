import * as React from 'react';
import {FC, memo, useCallback, useContext, useMemo, useState, useEffect} from 'react';
import {useMutation} from '@tanstack/react-query';
import SelectProvider from './components/SelectProvider/SelectProvider';
import FolderView from './components/FolderView';
import {DirSort, FileInfo, ViewMode} from '../../types';
import {prepDirSort, shuffle} from './utils';
import {RootStoreCtx} from '../RootStore/RootStoreCtx';
import SortDialog from './components/SortDialog/SortDialog';
import {api} from '../../tools/api';

const Folder: FC = () => {
  const store = useContext(RootStoreCtx);
  const [showSortDialog, setShowSortDialog] = useState(false);
  const {mutateAsync: setStorage} = useMutation({mutationFn: api.storageSet});

  const [sortKey, setSortKey] = useState(() => {
    return prepDirSort(store.dirSort) ?? {key: 'ctime', revers: true};
  });

  // Инициализируем viewMode из серверного хранилища (по умолчанию 'list')
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (store.viewMode as ViewMode) ?? 'list';
  });

  const [gridPreviewSize, setGridPreviewSize] = useState<number>(() => {
    return store.gridPreviewSize ?? 160;
  });

  // Синхронизируем локальный стейт, если папка изменилась в RootStore
  useEffect(() => {
    setViewMode((store.viewMode as ViewMode) ?? 'list');
    setGridPreviewSize(store.gridPreviewSize ?? 160);
  }, [store.dir, store.gridPreviewSize, store.viewMode]);

  const files = useMemo(() => store.files, [store.files]);

  const handleSortBtn = useCallback(() => {
    setShowSortDialog(true);
  }, []);

  const changeSort = useCallback(
    async (dirSort: DirSort) => {
      setSortKey(dirSort);
      await setStorage({
        [`dirSort-${store.dir}`]: dirSort,
      });
    },
    [setStorage, store.dir],
  );

  const changeGridPreviewSize = useCallback(
    async (size: number) => {
      const boundedSize = Math.max(100, Math.min(400, size));
      setGridPreviewSize(boundedSize);
      await setStorage({
        gridPreviewSize: boundedSize,
      });
    },
    [setStorage],
  );

  const changeViewMode = useCallback(
    async (mode: ViewMode) => {
      setViewMode(mode);
      await setStorage({
        [`viewMode-${store.dir}`]: mode,
      });
    },
    [setStorage, store.dir],
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
      <FolderView
        files={sortedFiles}
        onShowSortDialog={handleSortBtn}
        viewMode={viewMode}
        onChangeViewMode={changeViewMode}
        gridPreviewSize={gridPreviewSize}
        onChangeGridPreviewSize={changeGridPreviewSize}
      />
      {showSortDialog && (
        <SortDialog sortKey={sortKey} changeSort={changeSort} onClose={handleCloseSortDialog} />
      )}
    </SelectProvider>
  );
};

export default memo(Folder);

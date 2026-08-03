import * as React from 'react';
import {FC, memo, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {useMutation, useQuery} from '@tanstack/react-query';
import SelectProvider from './components/SelectProvider/SelectProvider';
import FolderView from './components/FolderView';
import {DirSort, ViewMode} from '../../types';
import {prepDirSort, shuffle} from './utils';
import {RootStoreCtx} from '../RootStore/RootStoreCtx';
import SortDialog from './components/SortDialog/SortDialog';
import {api} from '../../tools/api';
import {queryKeys} from '../../tools/queryClient';

function getSearchPatternFromUrl() {
  if (location.pathname !== '/~/search') return null;
  return new URLSearchParams(location.search).get('pattern')?.trim() || null;
}

function getDirectoryUrl(place: string) {
  return (
    place
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/') || '/'
  );
}

const Folder: FC = () => {
  const store = useContext(RootStoreCtx);
  const [showSortDialog, setShowSortDialog] = useState(false);
  const [activeSearch] = useState<string | null>(getSearchPatternFromUrl);
  const {mutateAsync: setStorage} = useMutation({mutationFn: api.storageSet});
  const {
    data: searchResults,
    error: searchQueryError,
    isFetching: searching,
    refetch: refetchSearch,
  } = useQuery({
    queryKey: queryKeys.search(store.dir, activeSearch ?? ''),
    queryFn: () => api.search({place: store.dir, pattern: activeSearch ?? ''}),
    enabled: activeSearch !== null,
  });

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

  const files = useMemo(
    () => (activeSearch ? (searchResults ?? []) : store.files),
    [activeSearch, searchResults, store.files],
  );
  const searchError = activeSearch && searchQueryError ? searchQueryError.message : null;

  const handleSearch = useCallback(
    async (rawPattern: string) => {
      const pattern = rawPattern.trim();
      if (!pattern) {
        location.assign(getDirectoryUrl(store.dir));
        return;
      }

      if (pattern === activeSearch) {
        await refetchSearch();
        return;
      }

      const searchUrl = new URL('/~/search', location.origin);
      searchUrl.searchParams.set('place', store.dir);
      searchUrl.searchParams.set('pattern', pattern);
      location.assign(searchUrl);
    },
    [activeSearch, refetchSearch, store.dir],
  );

  const handleClearSearch = useCallback(() => {
    location.assign(getDirectoryUrl(store.dir));
  }, [store.dir]);

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
      const sortableField = field as 'ctime' | 'name' | 'size';
      result.sort(({[sortableField]: a}, {[sortableField]: b}) => {
        return a === b ? 0 : a > b ? r1 : r2;
      });
    }
    result.sort(({isDir: a}, {isDir: b}) => {
      return a === b ? 0 : a ? -1 : 1;
    });
    return result;
  }, [files, sortKey]);

  return (
    <SelectProvider key={activeSearch ?? 'directory'} files={sortedFiles}>
      <FolderView
        files={sortedFiles}
        onShowSortDialog={handleSortBtn}
        viewMode={viewMode}
        onChangeViewMode={changeViewMode}
        gridPreviewSize={gridPreviewSize}
        onChangeGridPreviewSize={changeGridPreviewSize}
        activeSearch={activeSearch}
        searching={searching}
        searchError={searchError}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
      />
      {showSortDialog && (
        <SortDialog sortKey={sortKey} changeSort={changeSort} onClose={handleCloseSortDialog} />
      )}
    </SelectProvider>
  );
};

export default memo(Folder);

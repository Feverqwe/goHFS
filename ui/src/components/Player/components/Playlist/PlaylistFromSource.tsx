import React, {useEffect, useMemo, useState} from 'react';
import {Alert, LinearProgress} from '@mui/material';
import {useQuery} from '@tanstack/react-query';
import {api} from '../../../../tools/api';
import {queryKeys} from '../../../../tools/queryClient';
import {prepDirSort, sortDirectoryFiles} from '../../../Folder/utils';
import {
  clearPlaylistTransfer,
  directoryPlaylist,
  getPlaylistKey,
  parsePlaylistSource,
  playablePlaylist,
  readPlaylist,
} from '../../playlist';
import LoadPlaylistPlayer from './LoadPlaylistPlayer';

export default function PlaylistFromSource({source}: {source: string}) {
  const input = parsePlaylistSource(source);
  const [transfer] = useState(readPlaylist);
  const place = input?.place ?? '/';
  const pattern = input?.pattern ?? '';
  const key = getPlaylistKey(place, pattern);
  const fromMenu = input && transfer.key === key;
  const loadSource = Boolean(input) && !fromMenu;

  useEffect(() => {
    if (fromMenu) clearPlaylistTransfer();
  }, [fromMenu]);

  const folder = useQuery({
    queryKey: queryKeys.rootStore(place),
    queryFn: () => api.getStore({place}),
    enabled: loadSource,
    staleTime: Infinity,
  });
  const search = useQuery({
    queryKey: queryKeys.search(place, pattern),
    queryFn: () => api.search({place, pattern}),
    enabled: loadSource && Boolean(pattern),
    staleTime: Infinity,
  });

  const store = folder.data;
  const files = pattern ? search.data : store?.files;
  const playlist = useMemo(() => {
    if (!store || !files) return undefined;
    const sort = prepDirSort(store.dirSort) ?? {key: 'ctime', revers: true};
    const sortedFiles = sortDirectoryFiles(files, sort);
    const entries = playablePlaylist(directoryPlaylist(sortedFiles, store.dir));
    return {key: getPlaylistKey(store.dir, pattern), entries};
  }, [files, pattern, store]);

  if (fromMenu || (source === '1' && transfer.entries.length)) {
    return <LoadPlaylistPlayer playlist={transfer} />;
  }
  if (!input) return <Alert severity="error">Invalid playlist source.</Alert>;

  const error = folder.error ?? (pattern ? search.error : null);
  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (!playlist) return <LinearProgress aria-label="Loading playlist" />;
  return <LoadPlaylistPlayer playlist={playlist} />;
}

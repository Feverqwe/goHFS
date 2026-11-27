import React, {useMemo, useState} from 'react';
import {Alert, Box, LinearProgress} from '@mui/material';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {api} from '../../../../tools/api';
import {queryKeys} from '../../../../tools/queryClient';
import {
  parsePlaylistSettings,
  readPlaylistTrack,
  updatePlaylistTrackUrl,
  type PlaylistSettings,
  type PlaylistSnapshot,
} from '../../playlist';
import {getPlaybackPositionKeys, readPlaybackPosition} from '../../utils';
import PlaylistPlayer from './PlaylistPlayer';

export default function LoadPlaylistPlayer({
  playlist: {key, entries},
}: {
  playlist: PlaylistSnapshot;
}) {
  const [initialTrack] = useState(readPlaylistTrack);
  const settingsKey = key === undefined ? undefined : `playlist-settings-${key}`;
  const positionKeys = useMemo(
    () => entries.map(({url}) => ({url, keys: getPlaybackPositionKeys(url)})),
    [entries],
  );
  const storageKeys = [...new Set(positionKeys.flatMap((entry) => entry.keys))];
  if (settingsKey) storageKeys.push(settingsKey);
  const queryKey = queryKeys.playlistData(storageKeys);
  const queryClient = useQueryClient();
  const {mutate: saveSettings, isError: settingsSaveFailed} = useMutation({
    mutationFn: (update: Record<string, PlaylistSettings>) => api.storageSet(update),
    scope: {id: settingsKey ?? 'playlist-settings'},
    retry: 1,
    onSuccess: (_, update) => {
      queryClient.setQueryData<Record<string, unknown>>(queryKey, (saved) =>
        saved ? {...saved, ...update} : undefined,
      );
    },
  });
  const {data, error, isPending} = useQuery({
    queryKey,
    queryFn: () => api.storageGet(storageKeys),
    enabled: entries.length > 0,
    gcTime: 0,
  });

  if (!entries.length) {
    return <PlaylistPlayer playlist={entries} />;
  }

  if (isPending) {
    return <LinearProgress aria-label="Loading playlist settings and playback positions" />;
  }

  const initialPositions = Object.fromEntries(
    positionKeys.map(({url, keys}) => [url, readPlaybackPosition(data, keys) ?? 0]),
  );

  return (
    <Box sx={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      {error && (
        <Alert severity="warning">
          Playlist settings and playback positions could not be loaded.
        </Alert>
      )}
      {settingsSaveFailed && (
        <Alert severity="warning">Playlist settings could not be saved.</Alert>
      )}
      <Box sx={{flex: 1, minHeight: 0}}>
        <PlaylistPlayer
          key={key}
          playlist={entries}
          initialPositions={initialPositions}
          initialTrack={initialTrack}
          onTrackChange={updatePlaylistTrackUrl}
          initialSettings={parsePlaylistSettings(settingsKey ? data?.[settingsKey] : undefined)}
          onSettingsChange={
            settingsKey ? (settings) => saveSettings({[settingsKey]: settings}) : undefined
          }
        />
      </Box>
    </Box>
  );
}

import React from 'react';
import {Alert, Box, LinearProgress} from '@mui/material';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {api} from '../../../../tools/api';
import {queryKeys} from '../../../../tools/queryClient';
import {parsePlaylistSettings, type PlaylistSettings, type PlaylistSnapshot} from '../../playlist';
import {getSidV1, getSidV2} from '../../utils';
import PlaylistPlayer from './PlaylistPlayer';

export default function LoadPlaylistPlayer({
  playlist: {key, entries},
}: {
  playlist: PlaylistSnapshot;
}) {
  const settingsKey = key === undefined ? undefined : `playlist-settings-${key}`;
  const keys = new Set(entries.flatMap(({url}) => [getSidV2(url), getSidV1(url)]));
  if (settingsKey) keys.add(settingsKey);
  const storageKeys = [...keys];
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
    entries.map(({url}) => {
      const position = data?.[getSidV2(url)] ?? data?.[getSidV1(url)];
      return [
        url,
        typeof position === 'number' && Number.isFinite(position) && position > 0 ? position : 0,
      ];
    }),
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
          initialSettings={parsePlaylistSettings(settingsKey ? data?.[settingsKey] : undefined)}
          onSettingsChange={
            settingsKey ? (settings) => saveSettings({[settingsKey]: settings}) : undefined
          }
        />
      </Box>
    </Box>
  );
}

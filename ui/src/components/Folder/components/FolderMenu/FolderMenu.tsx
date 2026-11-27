import * as React from 'react';
import {FC, useContext, useMemo} from 'react';
import {Alert, ListItemIcon, ListItemText, Menu, MenuItem, Snackbar} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import CachedIcon from '@mui/icons-material/Cached';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {QrCode2 as QrCode2Icon} from '@mui/icons-material';
import Path from 'path-browserify';
import RefreshIcon from '@mui/icons-material/Refresh';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {RootStoreCtx} from '../../../RootStore/RootStoreCtx';
import {FileInfo} from '../../../../types';
import {api} from '../../../../tools/api';
import {RootStoreUpdateCtx} from '../../../RootStore/RootStoreUpdateCtx';
import {queryKeys} from '../../../../tools/queryClient';
import {
  directoryPlaylist,
  getPlaylistKey,
  getPlaylistUrl,
  playablePlaylist,
  PLAYLIST_STORAGE_KEY,
  type PlaylistSnapshot,
} from '../../../Player/playlist';

interface FolderMenuProps {
  anchorEl: Element;
  onClose: () => void;
  sortedFiles: FileInfo[];
  activeSearch: string | null;
  onAddressesClick: () => void;
  onMkdirClick: () => void;
  onUploadFolderClick: () => void;
  onDirSizeClick: () => void;
  onDiskUsageClick: () => void;
}

const FolderMenu: FC<FolderMenuProps> = ({
  anchorEl,
  sortedFiles,
  activeSearch,
  onMkdirClick,
  onUploadFolderClick,
  onAddressesClick,
  onDirSizeClick,
  onDiskUsageClick,
  onClose,
}) => {
  const store = useContext(RootStoreCtx);
  const updateStore = useContext(RootStoreUpdateCtx);
  const queryClient = useQueryClient();
  const [playlistError, setPlaylistError] = React.useState(false);
  const playlist = useMemo(
    () => directoryPlaylist(sortedFiles, store.dir),
    [sortedFiles, store.dir],
  );
  const playableFiles = useMemo(() => playablePlaylist(playlist), [playlist]);
  const {mutateAsync: reloadConfig} = useMutation({mutationFn: api.reloadConfig});
  const {mutateAsync: setStorage} = useMutation({mutationFn: api.storageSet});
  const {mutateAsync: cleanupPreviews} = useMutation({
    mutationFn: api.previewCleanup,
    onSuccess: () => queryClient.invalidateQueries({queryKey: queryKeys.previews}),
  });
  const {mutateAsync: resetFailedPreviews} = useMutation({
    mutationFn: api.previewResetFailed,
    onSuccess: () => queryClient.invalidateQueries({queryKey: queryKeys.previews}),
  });

  const menu = useMemo(
    () => [
      {
        id: 'mkdir',
        title: 'Create directory',
        icon: <CreateNewFolderIcon />,
        onClick: () => {
          onMkdirClick();

          onClose();
        },
      },
      {
        id: 'refresh',
        title: 'Refresh',
        icon: <RefreshIcon />,
        onClick: async () => {
          await updateStore();

          onClose();
        },
      },
      {
        id: 'openPlaylist',
        title: 'Play playlist',
        icon: <PlaylistPlayIcon />,
        disabled: playableFiles.length === 0,
        onClick: () => {
          const playerWindow = window.open('about:blank', '_blank');
          if (!playerWindow) {
            setPlaylistError(true);
            return;
          }

          try {
            const snapshot: PlaylistSnapshot = {
              key: getPlaylistKey(store.dir, activeSearch),
              entries: playableFiles,
            };
            playerWindow.sessionStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(snapshot));
          } catch {
            // The player can rebuild the list from the source URL.
          }

          playerWindow.opener = null;
          playerWindow.location.replace(getPlaylistUrl(store.dir, activeSearch));
          onClose();
        },
      },
      {
        id: 'playlist',
        title: 'Get playlist',
        icon: <DownloadIcon />,
        onClick: () => {
          const lines = ['#EXTM3U'];
          const exportEntries = activeSearch ? directoryPlaylist(store.files, store.dir) : playlist;
          exportEntries.forEach(({name, url}) => {
            lines.push(`#EXTINF:-1,${name.replace(/[\r\n]/g, ' ')}`);
            lines.push(new URL(url, location.href).href);
          });

          const dirname = store.isRoot ? 'root' : Path.basename(store.dir);

          const blob = new Blob([lines.join('\n')], {type: 'application/mpegurl'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${dirname}.m3u8`;
          a.click();
          URL.revokeObjectURL(url);

          onClose();
        },
      },
      {
        id: 'dirSize',
        title: 'Directory info',
        icon: <TimelapseIcon />,
        onClick: () => {
          onDirSizeClick();

          onClose();
        },
      },
      {
        id: 'diskUsage',
        title: 'Disk usage',
        icon: <DataUsageIcon />,
        onClick: () => {
          onDiskUsageClick();

          onClose();
        },
      },
      {
        id: 'addresses',
        title: 'Open addresses',
        icon: <QrCode2Icon />,
        onClick: () => {
          onAddressesClick();

          onClose();
        },
      },
      {
        id: 'reloadConfig',
        title: 'Reload config',
        icon: <CachedIcon />,
        onClick: async () => {
          await reloadConfig();

          onClose();
        },
      },
      {
        id: 'showHidden',
        title: store.showHidden ? 'Hide hidden' : 'Show hidden',
        icon: store.showHidden ? <VisibilityOffIcon /> : <VisibilityIcon />,
        onClick: async () => {
          await setStorage({
            showHidden: !store.showHidden,
          });

          await updateStore();

          onClose();
        },
      },
      {
        id: 'cleanPreviews',
        title: 'Clean expired previews',
        icon: <DeleteSweepIcon />,
        onClick: async () => {
          try {
            await cleanupPreviews();
          } catch (err) {
            console.error('Failed to clear previews:', err);
          }
          onClose();
        },
      },
      {
        id: 'resetFailedPreviews',
        title: 'Reset failed previews',
        icon: <RestartAltIcon />,
        onClick: async () => {
          try {
            await resetFailedPreviews();
            await updateStore();
          } catch (err) {
            console.error('Failed to reset preview failure states:', err);
          }
          onClose();
        },
      },
    ],
    [
      store.showHidden,
      store.isRoot,
      store.dir,
      store.files,
      activeSearch,
      onMkdirClick,
      onClose,
      updateStore,
      playlist,
      playableFiles,
      onDirSizeClick,
      onDiskUsageClick,
      onAddressesClick,
      cleanupPreviews,
      reloadConfig,
      resetFailedPreviews,
      setStorage,
    ],
  );

  return (
    <>
      <Menu anchorEl={anchorEl} open onClose={onClose}>
        {store.isWritable && (
          <MenuItem
            onClick={() => {
              onClose();
              onUploadFolderClick();
            }}
          >
            <ListItemIcon>
              <DriveFolderUploadIcon />
            </ListItemIcon>
            <ListItemText>Upload folder</ListItemText>
          </MenuItem>
        )}
        {store.isWritable && (
          <MenuItem
            component="a"
            href={`/~/agent.md?${new URLSearchParams({place: store.dir})}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
          >
            <ListItemIcon>
              <DescriptionIcon />
            </ListItemIcon>
            <ListItemText>Agent upload instructions</ListItemText>
          </MenuItem>
        )}
        {menu.map(({id, title, icon, onClick, disabled}) => {
          return (
            <MenuItem key={id} onClick={onClick} disabled={disabled}>
              {icon && <ListItemIcon>{icon}</ListItemIcon>}
              <ListItemText>{title}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
      <Snackbar
        open={playlistError}
        onClose={() => setPlaylistError(false)}
        autoHideDuration={5000}
      >
        <Alert severity="error" onClose={() => setPlaylistError(false)}>
          Could not open the playlist in a new tab.
        </Alert>
      </Snackbar>
    </>
  );
};

export default FolderMenu;

import * as React from 'react';
import {FC, useContext, useMemo} from 'react';
import {ListItemIcon, ListItemText, Menu, MenuItem} from '@mui/material';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import CachedIcon from '@mui/icons-material/Cached';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {QrCode2 as QrCode2Icon} from '@mui/icons-material';
import Path from 'path-browserify';
import RefreshIcon from '@mui/icons-material/Refresh';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
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

interface FolderMenuProps {
  anchorEl: Element;
  onClose: () => void;
  sortedFiles: FileInfo[];
  onAddressesClick: () => void;
  onMkdirClick: () => void;
  onDirSizeClick: () => void;
  onDiskUsageClick: () => void;
}

const FolderMenu: FC<FolderMenuProps> = ({
  anchorEl,
  sortedFiles,
  onMkdirClick,
  onAddressesClick,
  onDirSizeClick,
  onDiskUsageClick,
  onClose,
}) => {
  const store = useContext(RootStoreCtx);
  const updateStore = useContext(RootStoreUpdateCtx);
  const queryClient = useQueryClient();
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
        id: 'playlist',
        title: 'Get playlist',
        icon: <PlaylistPlayIcon />,
        onClick: () => {
          const lines = [];
          lines.push('#EXTM3U');
          sortedFiles.forEach((file) => {
            if (!file.isDir) {
              const url = new URL(Path.join(store.dir, file.name), location.href).toString();
              const {name} = file;
              lines.push(`#EXTINF:-1,${name}`);
              lines.push(url);
            }
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
      onMkdirClick,
      onClose,
      updateStore,
      sortedFiles,
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
    <Menu anchorEl={anchorEl} open onClose={onClose}>
      {menu.map(({id, title, icon, onClick}) => {
        return (
          <MenuItem key={id} onClick={onClick}>
            {icon && <ListItemIcon>{icon}</ListItemIcon>}
            <ListItemText>{title}</ListItemText>
          </MenuItem>
        );
      })}
    </Menu>
  );
};

export default FolderMenu;

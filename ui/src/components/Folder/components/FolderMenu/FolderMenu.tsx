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
import {RootStoreCtx} from '../../../RootStore/RootStoreCtx';
import {DirSort, FileInfo} from '../../../../types';
import {api} from '../../../../tools/api';
import {RootStoreUpdateCtx} from '../../../RootStore/RootStoreUpdateCtx';

interface FolderMenuProps {
  anchorEl: Element;
  onClose: () => void;
  sortedFiles: FileInfo[];
  onAddressesClick: () => void;
  onMkdirClick: () => void;
}

const FolderMenu: FC<FolderMenuProps> = ({
  anchorEl,
  sortedFiles,
  onMkdirClick,
  onAddressesClick,
  onClose,
}) => {
  const store = useContext(RootStoreCtx);
  const updateStore = useContext(RootStoreUpdateCtx);

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
          await api.reloadConfig<Record<string, DirSort>>();

          onClose();
        },
      },
      {
        id: 'showHidden',
        title: store.showHidden ? 'Hide hidden' : 'Show hidden',
        icon: store.showHidden ? <VisibilityOffIcon /> : <VisibilityIcon />,
        onClick: async () => {
          await api.showHidden({
            show: !store.showHidden,
          });

          await updateStore();

          onClose();
        },
      },
    ],
    [onClose, store, sortedFiles, onAddressesClick, updateStore, onMkdirClick],
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

import * as React from 'react';
import {FC, useContext, useMemo} from 'react';
import {ListItemIcon, ListItemText, Menu, MenuItem} from '@mui/material';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import {QrCode2 as QrCode2Icon} from '@mui/icons-material';
import Path from 'path-browserify';
import {RootStoreCtx} from '../../../RootStore/RootStoreCtx';
import {FileInfo} from '../../../../types';

interface FolderMenuProps {
  anchorEl: Element,
  onClose: () => void;
  sortedFiles: FileInfo[];
  onAddressesClick: () => void;
}

const FolderMenu: FC<FolderMenuProps> = ({anchorEl, sortedFiles, onAddressesClick, onClose}) => {
  const store = useContext(RootStoreCtx);

  const menu = useMemo(() => [
    {
      type: 'playlist',
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
      type: 'addresses',
      title: 'Open addresses',
      icon: <QrCode2Icon />,
      onClick: () => {
        onAddressesClick();

        onClose();
      },
    },
  ], [store, sortedFiles, onAddressesClick]);

  return (
    <Menu anchorEl={anchorEl} open onClose={onClose}>
      {menu.map(({type, title, icon, onClick}) => {
        return (
          <MenuItem key={type} onClick={onClick}>
            {icon && (
            <ListItemIcon>
              {icon}
            </ListItemIcon>
            )}
            <ListItemText>{title}</ListItemText>
          </MenuItem>
        );
      })}
    </Menu>
  );
};

export default FolderMenu;

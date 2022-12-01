import * as React from 'react';
import {SyntheticEvent, useContext, useMemo} from 'react';
import {
  Audiotrack as AudiotrackIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Movie as MovieIcon,
} from '@mui/icons-material';
import {Box, CardActionArea, IconButton, ListItemText, styled} from '@mui/material';
import Path from 'path-browserify';
import {filesize} from 'filesize';
import FileMenu from '../FileMenu';
import RenameDialog from '../RenameDialog';
import {FileInfo} from '../../../../types';
import {RootStoreCtx} from '../../../RootStore/RootStoreCtx';

const mime = require('mime');

const NameSx = {
  wordBreak: 'break-word',
};

interface FileProps {
  file: FileInfo,
  dir: string,
  writable: boolean,
}

const SubLine = styled('div')(() => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
  };
});

const File = React.memo(({file, dir, writable}: FileProps) => {
  const store = useContext(RootStoreCtx);
  const {size, ctime, name, isDir} = file;
  const [removed, setRemoved] = React.useState(false);
  const [renameDialog, setRenameDialog] = React.useState(false);
  const handleUrl = useMemo(() => {
    const ext = Path.extname(name).toLowerCase();
    return store.extHandle[ext];
  }, [store, name]);

  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | Element>(null);

  const sizeStr = React.useMemo(() => {
    let hSize = null;
    try {
      if (!isDir) {
        const [value, symbol] = filesize(size, {
          output: 'array',
        }) as any[];
        hSize = `${Math.trunc(value * 10) / 10} ${symbol}`;
      }
    } catch (err) {
      // pass
    }
    return hSize;
  }, [size, isDir]);

  const dateStr = React.useMemo(() => {
    return dateToStr(new Date(ctime));
  }, [ctime]);

  const Icon = React.useMemo(() => {
    if (isDir) {
      return FolderIcon;
    }

    const mimeType = mime.getType(name);
    const m = /^([^\/]+)/.exec(mimeType);
    const generalType = m && m[1];
    switch (generalType) {
      case 'video': {
        return MovieIcon;
      }
      case 'audio': {
        return AudiotrackIcon;
      }
      case 'image': {
        return ImageIcon;
      }
      case 'text': {
        return DescriptionIcon;
      }
      default: {
        return InsertDriveFileIcon;
      }
    }
  }, [name, isDir]);

  const handleHandleClick = React.useCallback((e: SyntheticEvent) => {
    if (!handleUrl) return;
    e.preventDefault();
    const a = document.createElement('a');
    a.href = Path.join(dir, encodeURIComponent(name));
    const fileUrl = a.href;
    const url = handleUrl.replace('{url}', encodeURIComponent(fileUrl));
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  }, [dir, handleUrl, name]);

  const handleMenuClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
  }, []);

  const handleMenuClose = React.useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const handleRemoved = React.useCallback(() => {
    setRemoved(true);
  }, []);

  const handleRename = React.useCallback(() => {
    setMenuAnchorEl(null);
    setRenameDialog(true);
  }, []);

  const handleCloseDialog = React.useCallback(() => {
    setRenameDialog(false);
  }, []);

  const handleCtxMenu = writable && handleMenuClick || undefined;
  const href = Path.join(dir, encodeURIComponent(name));

  if (removed) {
    return null;
  }

  return (
    <>
      <Box display="flex" alignItems="stretch">
        <Box pl={1} display="flex" alignItems="center">
          {handleUrl ? (
            <IconButton color="primary" onClick={handleHandleClick} onContextMenu={handleCtxMenu}>
              <Icon />
            </IconButton>
          ) : (
            <IconButton href={href} onContextMenu={handleCtxMenu}>
              <Icon />
            </IconButton>
          )}
        </Box>
        <Box flexGrow={1}>
          <CardActionArea sx={{p: 1}} href={href}>
            <ListItemText
              primary={name}
              secondary={(
                <SubLine>
                  <div>{dateStr}</div>
                  <div>{sizeStr}</div>
                </SubLine>
              )}
              secondaryTypographyProps={{component: 'div'}}
              sx={NameSx}
            />
          </CardActionArea>
        </Box>
      </Box>
      {menuAnchorEl ? (
        <FileMenu
          anchorEl={menuAnchorEl}
          onRename={handleRename}
          onRemoved={handleRemoved}
          onClose={handleMenuClose}
          file={file}
          dir={dir}
        />
      ) : null}
      {renameDialog ? (
        <RenameDialog onClose={handleCloseDialog} dir={dir} file={file} />
      ) : null}
    </>
  );
});

function dateToStr(date: Date) {
  const dateStr = [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((v) => (v < 10 ? '0' : '') + v).join('-');
  const timeStr = [date.getHours(), date.getMinutes(), date.getSeconds()].map((v) => (v < 10 ? '0' : '') + v).join(':');
  return `${dateStr} ${timeStr}`;
}

export default File;

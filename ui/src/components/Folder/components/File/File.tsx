import * as React from 'react';
import {FC, memo, SyntheticEvent, useContext, useMemo} from 'react';
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
import {SelectModeCtx} from '../SelectProvider/SelectCtx';
import SelectBox from './components/SelectBox';

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

const File: FC<FileProps> = ({file, dir, writable}) => {
  const store = useContext(RootStoreCtx);
  const {size, ctime, name, isDir} = file;
  const selectMode = useContext(SelectModeCtx);
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
        }) as [number, string];
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

  const href = useMemo(() => {
    return Path.join(dir.split('/').map(encodeURIComponent).join('/'), encodeURIComponent(name));
  }, [dir, name]);

  const handleHandleClick = React.useCallback((e: SyntheticEvent) => {
    if (!handleUrl) return;
    e.preventDefault();
    const url = handleUrl.replace('{url}', encodeURIComponent(href));
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  }, [href, handleUrl]);

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
    setRenameDialog(true);
  }, []);

  const handleCloseDialog = React.useCallback(() => {
    setRenameDialog(false);
  }, []);

  const handleCtxMenu = writable && handleMenuClick || undefined;

  const body = useMemo(() => {
    return (
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
    );
  }, [dateStr, name, sizeStr]);

  if (removed) {
    return null;
  }

  return (
    <>
      {handleUrl ? (
        <Box display="flex" alignItems="stretch">
          {selectMode && (
            <SelectBox name={name} />
          )}
          <Box pl={selectMode ? 0 : 1} display="flex" alignItems="center">
            <IconButton color="primary" onClick={handleHandleClick} onContextMenu={handleCtxMenu}>
              <Icon />
            </IconButton>
          </Box>
          <Box flexGrow={1}>
            <CardActionArea sx={{p: 1}} href={href}>
              {body}
            </CardActionArea>
          </Box>
        </Box>
      ) : (
        <Box display="flex" alignItems="stretch">
          {selectMode && (
            <SelectBox name={name} />
          )}
          <CardActionArea sx={{display: 'flex', alignItems: 'stretch'}} href={href}>
            <Box pl={selectMode ? 0 : 1} display="flex" alignItems="center">
              <Box p={1} display="flex" alignItems="center" onContextMenu={handleCtxMenu}>
                <Icon />
              </Box>
            </Box>
            <Box flexGrow={1} sx={{p: 1}}>
              {body}
            </Box>
          </CardActionArea>
        </Box>
      )}
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
};

function dateToStr(date: Date) {
  const dateStr = [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((v) => (v < 10 ? '0' : '') + v).join('-');
  const timeStr = [date.getHours(), date.getMinutes(), date.getSeconds()].map((v) => (v < 10 ? '0' : '') + v).join(':');
  return `${dateStr} ${timeStr}`;
}

export default memo(File);

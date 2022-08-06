import * as React from "react";
import {SyntheticEvent, useMemo} from "react";
import {
  Audiotrack as AudiotrackIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Movie as MovieIcon
} from "@mui/icons-material";
import {IconButton, ListItem, ListItemIcon, ListItemText, styled} from "@mui/material";
import {FileInfo, RootStore} from "../../../folder";
import FileMenu from "../FileMenu";
import RenameDialog from "../RenameDialog";
import Path from "path-browserify";

const mime = require('mime');
const filesize = require('filesize');

const iconStyle = {
  minWidth: '42px',
};

const NameSx = {
  wordBreak: 'break-word',
};

interface FileProps {
  store: RootStore,
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

const File = React.memo(({store, file, dir, writable}: FileProps) => {
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
          output: 'array'
        });
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
  }, [handleUrl]);

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

  if (removed) {
    return null;
  }

  return (
    <>
      <ListItem button component={'a'} href={Path.join(dir, encodeURIComponent(name))}>
        <ListItemIcon className={'no-click'} style={iconStyle} onContextMenu={writable && handleMenuClick || undefined}>
          {handleUrl ? (
            <MyIconButton color="primary" onClick={handleHandleClick}>
              <Icon/>
            </MyIconButton>
          ) : (
            <Icon/>
          )}
        </ListItemIcon>
        <ListItemText primary={name} secondary={<SubLine>
          <div>{dateStr}</div>
          <div>{sizeStr}</div>
        </SubLine>} secondaryTypographyProps={{component: 'div'}} sx={NameSx}/>
      </ListItem>
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
        <RenameDialog onClose={handleCloseDialog} dir={dir} file={file}/>
      ) : null}
    </>
  );
});

const MyIconButton = styled(IconButton)(() => {
  return {
    padding: 0,
  };
});

function dateToStr(date: Date) {
  const dateStr = [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(v => (v < 10 ? '0' : '') + v).join('-');
  const timeStr = [date.getHours(), date.getMinutes(), date.getSeconds()].map(v => (v < 10 ? '0' : '') + v).join(':');
  return `${dateStr} ${timeStr}`;
}

export default File;
import * as React from "react";
import {
  Audiotrack as AudiotrackIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Movie as MovieIcon
} from "@mui/icons-material";
import {IconButton, ListItem, ListItemIcon, ListItemText} from "@mui/material";
import {makeStyles, styled} from "@mui/styles";
import {FileInfo} from "../index";

const mime = require('mime');
const filesize = require('filesize');

const iconStyle = {
  minWidth: '42px',
};

const useStylesFile = makeStyles(() => ({
  name: {
    wordBreak: 'break-word',
  },
  subLine: {
    display: 'flex',
    justifyContent: 'space-between',
  },
}));

interface FileProps {
  file: FileInfo,
  dir: string,
  removable: boolean,
  onFileMenu: (file: FileInfo) => void,
}

const File = React.memo(({file, dir, removable, onFileMenu}: FileProps) => {
  const {size, ctime, name, isDir, handleUrl} = file;
  const classes = useStylesFile();

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

  const handleHandleClick = React.useCallback((e) => {
    e.preventDefault();
    const a = document.createElement('a');
    a.href = dir + encodeURIComponent(name);
    const fileUrl = a.href;
    const url = handleUrl.replace('{url}', encodeURIComponent(fileUrl));
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  }, [handleUrl]);

  const handleMenuClick = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onFileMenu(file);
  }, [onFileMenu]);

  return (
    <ListItem button component={'a'} href={encodeURIComponent(name)}>
      <ListItemIcon className={'no-click'} style={iconStyle} onContextMenu={removable && handleMenuClick || undefined}>
        {handleUrl ? (
          <MyIconButton color="primary" onClick={handleHandleClick}>
            <Icon/>
          </MyIconButton>
        ) : (
          <Icon/>
        )}
      </ListItemIcon>
      <ListItemText primary={name} secondary={<div className={classes.subLine}>
        <div>{dateStr}</div>
        <div>{sizeStr}</div>
      </div>} secondaryTypographyProps={{component: 'div'}} className={classes.name}/>
    </ListItem>
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
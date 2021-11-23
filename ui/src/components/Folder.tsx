import * as React from "react";
import SortChooseDialog from "./SortChooseDialog";
import {Box, IconButton, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Theme} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Audiotrack as AudiotrackIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Movie as MovieIcon,
  Sort as SortIcon
} from "@mui/icons-material";
import {makeStyles} from "@mui/styles";
import {FileInfo, RootStore} from "../index";

const mime = require('mime');
const filesize = require('filesize');

const useStyles = makeStyles<Theme>((theme) => ({
  root: {
    width: '100%',
  },
  pathLine: {
    display: 'flex',
    alignItems: 'center',
    lineHeight: 'normal',
    wordBreak: 'break-all',
    padding: '6px',
    backgroundColor: theme.palette.background.paper,
  },
  pathLinePath: {
    flexGrow: 1,
    lineHeight: 'normal',
  }
}));

const iconStyle = {
  minWidth: '42px',
};

interface FolderProps {
  store: RootStore,
}

const Folder = React.memo(({store}: FolderProps) => {
  const classes = useStyles();
  const [files] = React.useState(store.files);
  const [sortKey, setSortKey] = React.useState(getOption<[keyof FileInfo, boolean]>('sort', ['ctime', false]));
  const [showSortDialog, setShowSortDialog] = React.useState(false);

  const changeSort = React.useCallback((keyDir) => {
    setSortKey(keyDir);
    setOption('sort', keyDir);
  }, []);

  const sortedFiles = React.useMemo(() => {
    const [key, d] = sortKey;
    const [r1, r2] = d ? [1, -1] : [-1, 1];
    const result = files.slice(0);
    result.sort(({[key]: a}, {[key]: b}) => {
      return a === b ? 0 : a > b ? r1 : r2;
    });
    result.sort(({isDir: a}, {isDir: b}) => {
      return a === b ? 0 : a ? -1 : 1;
    });
    return result;
  }, [files, sortKey]);

  const handleSortBtn = React.useCallback((e) => {
    e.preventDefault();
    setShowSortDialog(true);
  }, []);

  const handleCloseSortDialog = React.useCallback(() => {
    setShowSortDialog(false);
  }, []);

  return (
    <>
      <List
        component="nav"
        subheader={
          <ListSubheader component="div" className={classes.pathLine}>
            <Box className={classes.pathLinePath}>
              {store.dir}
            </Box>
            <IconButton onClick={handleSortBtn} size="small">
              <SortIcon fontSize="inherit" />
            </IconButton>
          </ListSubheader>
        }
        className={classes.root}
      >
        {!store.isRoot && (
          <ListItem button component={'a'} href={'../'}>
            <ListItemIcon style={iconStyle}>
              <ArrowBackIcon/>
            </ListItemIcon>
            <ListItemText primary="Back"/>
          </ListItem>
        )}
        {sortedFiles.map((file) => {
          return <File key={file.isDir + '_' + file.name} file={file}/>
        })}
      </List>
      {showSortDialog && (
        <SortChooseDialog sortKey={sortKey} changeSort={changeSort} onClose={handleCloseSortDialog} />
      )}
    </>
  );
});

const useStylesFile = makeStyles(() => ({
  name: {
    wordBreak: 'break-word',
  },
  subLine: {
    display: 'flex',
    justifyContent: 'space-between',
  }
}));

interface FileProps {
  file: FileInfo,
}

const File = React.memo(({file: {size, ctime, name, isDir}}: FileProps) => {
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
      return (
        <FolderIcon/>
      );
    }

    const mimeType = mime.getType(name);
    const m = /^([^\/]+)/.exec(mimeType);
    const generalType = m && m[1];
    switch (generalType) {
      case 'video': {
        return (
          <MovieIcon/>
        );
      }
      case 'audio': {
        return (
          <AudiotrackIcon/>
        );
      }
      case 'image': {
        return (
          <ImageIcon/>
        );
      }
      case 'text': {
        return (
          <DescriptionIcon/>
        );
      }
      default: {
        return (
          <InsertDriveFileIcon/>
        );
      }
    }
  }, [name, isDir]);

  return (
    <ListItem button component={'a'} href={encodeURIComponent(name)}>
      <ListItemIcon style={iconStyle}>
        {Icon}
      </ListItemIcon>
      <ListItemText primary={name} secondary={<div className={classes.subLine}>
        <div>{dateStr}</div>
        <div>{sizeStr}</div>
      </div>} secondaryTypographyProps={{component: 'div'}} className={classes.name}/>
    </ListItem>
  );
});

function dateToStr(date: Date) {
  const dateStr = [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(v => (v < 10 ? '0' : '') + v).join('-');
  const timeStr = [date.getHours(), date.getMinutes(), date.getSeconds()].map(v => (v < 10 ? '0' : '') + v).join(':');
  return `${dateStr} ${timeStr}`;
}

function getOption<T>(key: string, defaultValue: T) {
  let value: T | null = null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      throw new Error('Value is empty');
    }
    value = JSON.parse(raw);
  } catch (err) {}
  if (value === null) {
    value = defaultValue;
  }
  return value;
}

function setOption<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default Folder;
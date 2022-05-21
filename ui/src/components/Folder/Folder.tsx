import * as React from "react";
import {SyntheticEvent} from "react";
import SortChooseDialog from "./SortChooseDialog";
import {Box, IconButton, List, ListItem, ListItemIcon, ListItemText, ListSubheader, styled} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  QrCode2 as QrCode2Icon,
  Sort as SortIcon,
  Upload as UploadIcon
} from "@mui/icons-material";
import {FileInfo, RootStore} from "../../folder";
import UploadDialog from "./UploadDialog";
import AddressesDialog from "./AddressesDialog";
import File from "./File/File";
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';

const RootSx = {
  width: '100%',
};

const PathLinePathSx = {
  flexGrow: 1,
};

const ListSubheaderMy = styled<any>(ListSubheader)(({theme}) => {
  return {
    display: 'flex',
    alignItems: 'center',
    lineHeight: 'normal',
    wordBreak: 'break-all',
    padding: '6px',
    backgroundColor: theme.palette.background.paper,
  };
});

const iconStyle = {
  minWidth: '42px',
};

interface FolderProps {
  store: RootStore,
}

const Folder = React.memo(({store}: FolderProps) => {
  const [files] = React.useState(store.files);
  const [sortKey, setSortKey] = React.useState(() => {
    return getOption<[keyof FileInfo, boolean]>('sort', ['ctime', false]);
  });
  const [showSortDialog, setShowSortDialog] = React.useState(false);
  const [showUploadDialog, setShowUploadDialog] = React.useState(false);
  const [showAddressesDialog, setShowAddressesDialog] = React.useState(false);

  const changeSort = React.useCallback((keyDir: [string, boolean]) => {
    setSortKey(keyDir as [keyof FileInfo, boolean]);
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

  const handleSortBtn = React.useCallback((e: SyntheticEvent) => {
    e.preventDefault();
    setShowSortDialog(true);
  }, []);

  const handleAddressesBtn = React.useCallback((e: SyntheticEvent) => {
    e.preventDefault();
    setShowAddressesDialog(true);
  }, []);

  const handleUploadBtn = React.useCallback((e: SyntheticEvent) => {
    setShowUploadDialog(true);
  }, []);

  const handleCloseUploadDialog = React.useCallback(() => {
    setShowUploadDialog(false);
  }, []);

  const handleCloseSortDialog = React.useCallback(() => {
    setShowSortDialog(false);
  }, []);

  const handleCloseAddressesDialog = React.useCallback(() => {
    setShowAddressesDialog(false);
  }, []);

  const handlePlaylistBtn = React.useCallback(() => {
    const lines = [];
    lines.push('#EXTM3U');
    sortedFiles.forEach((file) => {
      if (!file.isDir) {
        const url = new URL(store.dir + file.name, location.href).toString();
        const name = file.name;
        lines.push(`#EXTINF:-1,${name}`);
        lines.push(url);
      }
    });

    const m = /([^\/]+)\/$/.exec(store.dir);
    const dirname = m && m[1] || 'root';
    const blob = new Blob([lines.join('\n')], {type: "application/mpegurl"});
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dirname}.m3u8`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sortedFiles, store]);

  return (
    <>
      <List
        component="nav"
        subheader={
          <ListSubheaderMy component="div">
            <Box sx={PathLinePathSx}>
              {store.dir}
            </Box>
            {store.isWritable ? (
              <IconButton onClick={handleUploadBtn} size="small">
                <UploadIcon fontSize="inherit" />
              </IconButton>
            ) : null}
            <IconButton onClick={handlePlaylistBtn} size="small">
              <PlaylistPlayIcon fontSize="inherit" />
            </IconButton>
            <IconButton onClick={handleSortBtn} size="small">
              <SortIcon fontSize="inherit" />
            </IconButton>
            <IconButton onClick={handleAddressesBtn} size="small">
              <QrCode2Icon fontSize="inherit" />
            </IconButton>
          </ListSubheaderMy>
        }
        sx={RootSx}
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
          return <File key={file.isDir + '_' + file.name} dir={store.dir} file={file} writable={store.isWritable}/>
        })}
      </List>
      {showSortDialog && (
        <SortChooseDialog sortKey={sortKey} changeSort={changeSort} onClose={handleCloseSortDialog} />
      )}
      {showUploadDialog && (
        <UploadDialog dir={store.dir} onClose={handleCloseUploadDialog} />
      )}
      {showAddressesDialog && (
        <AddressesDialog onClose={handleCloseAddressesDialog} />
      )}
    </>
  );
});

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
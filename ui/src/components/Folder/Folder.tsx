import * as React from 'react';
import {FC, memo, useCallback, useContext, useMemo, useState} from 'react';
import {Box, IconButton, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader, styled} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  QrCode2 as QrCode2Icon,
  Sort as SortIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import Path from 'path-browserify';
import SortChooseDialog from './components/SortChooseDialog';
import AddressesDialog from './components/AddressesDialog';
import File from './components/File/File';
import DropZone from './components/DropZone';
import useUpload from './components/hooks/useUpload';
import {FileInfo} from '../../types';
import {RootStoreCtx} from '../RootStore/RootStoreCtx';
import {getOption, setOption} from './utils';
import {SelectChangeModeCtx, SelectModeCtx} from "./components/SelectProvider/SelectCtx";
import SelectHeader from "./components/SelectHeader";
import SelectAllIcon from '@mui/icons-material/SelectAll';

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

const Folder: FC = () => {
  const store = useContext(RootStoreCtx);
  const selectMode = useContext(SelectModeCtx);
  const changeSelect = useContext(SelectChangeModeCtx);
  const [files] = useState(store.files);
  const [sortKey, setSortKey] = useState(() => {
    return getOption<[keyof FileInfo, boolean]>('sort', ['ctime', false]);
  });
  const [showSortDialog, setShowSortDialog] = useState(false);
  const [showAddressesDialog, setShowAddressesDialog] = useState(false);
  const {dialog, handleUpload} = useUpload(store.dir);

  const changeSort = useCallback((keyDir: [string, boolean]) => {
    setSortKey(keyDir as [keyof FileInfo, boolean]);
    setOption('sort', keyDir);
  }, []);

  const sortedFiles = useMemo(() => {
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

  const handleSortBtn = useCallback(() => {
    setShowSortDialog(true);
  }, []);

  const handleAddressesBtn = useCallback(() => {
    setShowAddressesDialog(true);
  }, []);

  const handleSelect = useCallback(() => {
    changeSelect(true);
  }, []);

  const handleUploadBtn = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.addEventListener('change', (e: Event) => {
      if (!input.files?.length) return;
      const files = Array.from(input.files);
      handleUpload(files);
    });
    input.dispatchEvent(new MouseEvent('click'));
  }, [handleUpload]);

  const handleCloseSortDialog = useCallback(() => {
    setShowSortDialog(false);
  }, []);

  const handleCloseAddressesDialog = useCallback(() => {
    setShowAddressesDialog(false);
  }, []);

  const handlePlaylistBtn = useCallback(() => {
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
  }, [sortedFiles, store]);

  return (
    <>
      <List
        component="nav"
        subheader={(
          <ListSubheaderMy component="div">
            <Box sx={PathLinePathSx}>
              {store.dir}
            </Box>
            {store.isWritable ? (
              <IconButton title={"Upload"} onClick={handleUploadBtn} size="small">
                <UploadIcon fontSize="inherit" />
              </IconButton>
            ) : null}
            <IconButton title={"Get playlist"} onClick={handlePlaylistBtn} size="small">
              <PlaylistPlayIcon fontSize="inherit" />
            </IconButton>
            <IconButton title={"Sort"} onClick={handleSortBtn} size="small">
              <SortIcon fontSize="inherit" />
            </IconButton>
            <IconButton title={"Select"} onClick={handleSelect} size="small">
              <SelectAllIcon fontSize="inherit" />
            </IconButton>
            <IconButton title={"Open addresses"} onClick={handleAddressesBtn} size="small">
              <QrCode2Icon fontSize="inherit" />
            </IconButton>
          </ListSubheaderMy>
        )}
        sx={RootSx}
      >
        {!store.isRoot && (
          <ListItemButton component="a" href={Path.join(store.dir, '/', '..')}>
            <ListItemIcon style={iconStyle}>
              <ArrowBackIcon />
            </ListItemIcon>
            <ListItemText primary="Back" />
          </ListItemButton>
        )}
        {sortedFiles.map((file) => (
          <File key={`${file.isDir}_${file.name}`} dir={store.dir} file={file} writable={store.isWritable} />
        ))}
      </List>
      {store.isWritable && (
        <DropZone onUpload={handleUpload} />
      )}
      {showSortDialog && (
        <SortChooseDialog sortKey={sortKey} changeSort={changeSort} onClose={handleCloseSortDialog} />
      )}
      {showAddressesDialog && (
        <AddressesDialog onClose={handleCloseAddressesDialog} />
      )}
      {dialog}
      {selectMode && (
        <SelectHeader/>
      )}
    </>
  );
};

export default memo(Folder);

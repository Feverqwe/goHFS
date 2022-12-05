import * as React from 'react';
import {FC, memo, SyntheticEvent, useCallback, useContext, useMemo, useState} from 'react';
import {Box, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Paper, Typography} from '@mui/material';
import {ArrowBack as ArrowBackIcon, Sort as SortIcon, Upload as UploadIcon} from '@mui/icons-material';
import Path from 'path-browserify';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import MenuIcon from '@mui/icons-material/Menu';
import SortChooseDialog from './components/SortChooseDialog';
import AddressesDialog from './components/AddressesDialog';
import File from './components/File/File';
import DropZone from './components/DropZone';
import useUpload from './components/hooks/useUpload';
import {FileInfo} from '../../types';
import {RootStoreCtx} from '../RootStore/RootStoreCtx';
import {getOption, setOption} from './utils';
import {SelectChangeModeCtx, SelectModeCtx} from './components/SelectProvider/SelectCtx';
import SelectHeader from './components/SelectHeader';
import FolderMenu from './components/FolderMenu/FolderMenu';

const RootSx = {
  width: '100%',
};

const PathLinePathSx = {
  flexGrow: 1,
  wordBreak: 'break-all',
  lineHeight: 'normal',
  color: 'text.secondary',
};

/* const ListSubheaderMy = styled<unknown>(ListSubheader)(({theme}) => {
  return {
    display: 'flex',
    alignItems: 'center',
    lineHeight: 'normal',
    wordBreak: 'break-all',
    padding: '6px',
    backgroundColor: theme.palette.background.paper,
  };
}); */

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
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | Element>(null);

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
  }, [changeSelect]);

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

  const handleCloseMenu = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const handleShowMenu = useCallback((e: SyntheticEvent) => {
    setMenuAnchorEl(e.currentTarget);
  }, []);

  return (
    <>
      <List
        component="nav"
        subheader={(
          <Paper elevation={0} square={true}>
            <Box p={1} py={0.5} display="flex" alignItems="center">
              <Typography component={Box} sx={PathLinePathSx} variant="body2">
                {store.dir}
              </Typography>
              {store.isWritable ? (
                <IconButton title="Upload" onClick={handleUploadBtn} size="small">
                  <UploadIcon fontSize="inherit" />
                </IconButton>
              ) : null}
              <IconButton title="Sort" onClick={handleSortBtn} size="small">
                <SortIcon fontSize="inherit" />
              </IconButton>
              <IconButton title="Select" onClick={handleSelect} size="small">
                <SelectAllIcon fontSize="inherit" />
              </IconButton>
              <IconButton title="Menu" onClick={handleShowMenu} size="small">
                <MenuIcon fontSize="inherit" />
              </IconButton>
            </Box>
          </Paper>
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
        <SelectHeader />
      )}
      {menuAnchorEl ? (
        <FolderMenu
          anchorEl={menuAnchorEl}
          onClose={handleCloseMenu}
          sortedFiles={sortedFiles}
          onAddressesClick={handleAddressesBtn}
        />
      ) : null}
    </>
  );
};

export default memo(Folder);

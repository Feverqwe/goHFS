import * as React from 'react';
import {FC, memo, SyntheticEvent, useCallback, useContext, useMemo, useState} from 'react';
import {Box, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Paper, Typography} from '@mui/material';
import {ArrowBack as ArrowBackIcon, Sort as SortIcon, Upload as UploadIcon} from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import {RootStoreCtx} from '../../RootStore/RootStoreCtx';
import {SelectModeCtx} from './SelectProvider/SelectCtx';
import {FileInfo} from '../../../types';
import useUpload from './hooks/useUpload';
import File from './File/File';
import DropZone from './DropZone';
import AddressesDialog from './AddressesDialog';
import SelectHeader from './SelectHeader';
import FolderMenu from './FolderMenu/FolderMenu';

const RootSx = {
  width: '100%',
};

const PathLinePathSx = {
  flexGrow: 1,
  wordBreak: 'break-all',
  lineHeight: 'normal',
  color: 'text.secondary',
};

const iconStyle = {
  minWidth: '42px',
};

interface FolderViewProps {
  files: FileInfo[];
  onShowSortDialog: () => void;
}

const FolderView: FC<FolderViewProps> = ({files, onShowSortDialog}) => {
  const store = useContext(RootStoreCtx);
  const selectMode = useContext(SelectModeCtx);
  const [showAddressesDialog, setShowAddressesDialog] = useState(false);
  const {dialog, handleUpload} = useUpload(store.dir);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | Element>(null);

  const handleAddressesBtn = useCallback(() => {
    setShowAddressesDialog(true);
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

  const handleCloseAddressesDialog = useCallback(() => {
    setShowAddressesDialog(false);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const handleShowMenu = useCallback((e: SyntheticEvent) => {
    setMenuAnchorEl(e.currentTarget);
  }, []);

  const backLink = useMemo(() => {
    const parts = store.dir.split('/');
    parts.pop();
    return parts.map((p) => encodeURIComponent(p)).join('/') || '/';
  }, [store]);

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
                  <UploadIcon fontSize="small" />
                </IconButton>
              ) : null}
              <IconButton title="Sort" onClick={onShowSortDialog} size="small">
                <SortIcon fontSize="small" />
              </IconButton>
              <IconButton title="Menu" onClick={handleShowMenu} size="small">
                <MenuIcon fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        )}
        sx={RootSx}
      >
        {!store.isRoot && (
          <ListItemButton component="a" href={backLink}>
            <ListItemIcon style={iconStyle}>
              <ArrowBackIcon />
            </ListItemIcon>
            <ListItemText primary="Back" />
          </ListItemButton>
        )}
        {files.map((file) => (
          <File key={`${file.isDir}_${file.name}`} dir={store.dir} file={file} writable={store.isWritable} />
        ))}
      </List>
      {store.isWritable && (
        <DropZone onUpload={handleUpload} />
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
          sortedFiles={files}
          onAddressesClick={handleAddressesBtn}
        />
      ) : null}
    </>
  );
};

export default memo(FolderView);

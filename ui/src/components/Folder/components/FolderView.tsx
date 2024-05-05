import * as React from 'react';
import {FC, memo, SyntheticEvent, useCallback, useContext, useMemo, useState} from 'react';
import {
  Box, CircularProgress,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Sort as SortIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
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
import {RootStoreUpdateCtx} from '../../RootStore/RootStoreUpdateCtx';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import MkdirDialog from "./MkdirDialog";
import RefreshIcon from '@mui/icons-material/Refresh';
import {RootStoreStateCtx} from "../../RootStore/RootStoreStateCtx";

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
  const updateStore = useContext(RootStoreUpdateCtx);
  const isUpdateState = useContext(RootStoreStateCtx);
  const [showMkdirDialog, setShowMkdirDialog] = useState(false);

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

  const handleMkdirDialogBtn = useCallback(() => {
    setShowMkdirDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setShowAddressesDialog(false);
    setShowMkdirDialog(false);
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

  const handleReload = useCallback(async () => {
    await updateStore();
  }, [updateStore]);

  return (
    <>
      <List
        component="nav"
        subheader={
          <Paper elevation={0} square={true}>
            <Box p={1} py={0.5} display="flex" alignItems="center">
              <Typography component={Box} sx={PathLinePathSx} variant="body2">
                {store.dir}
              </Typography>
              {store.isWritable ? (
                <>
                  <IconButton title="Upload" onClick={handleUploadBtn} size="small">
                    <UploadIcon fontSize="small" />
                  </IconButton>
                  <IconButton title="Create directory" onClick={handleMkdirDialogBtn} size="small">
                    <CreateNewFolderIcon fontSize="small" />
                  </IconButton>
                </>
              ) : null}
              <IconButton title="Refresh" onClick={handleReload} size="small">
                {isUpdateState ? <CircularProgress size={20}/> : <RefreshIcon fontSize="small" />}
              </IconButton>
              <IconButton title="Sort" onClick={onShowSortDialog} size="small">
                <SortIcon fontSize="small" />
              </IconButton>
              <IconButton title="Menu" onClick={handleShowMenu} size="small">
                <MenuIcon fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        }
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
          <File
            key={`${file.isDir}_${file.name}`}
            dir={store.dir}
            file={file}
            writable={store.isWritable}
            onReload={handleReload}
          />
        ))}
      </List>
      {store.isWritable && <DropZone onUpload={handleUpload} />}
      {showAddressesDialog && <AddressesDialog onClose={handleCloseDialog} />}
      {dialog}
      {selectMode && <SelectHeader />}
      {menuAnchorEl ? (
        <FolderMenu
          anchorEl={menuAnchorEl}
          onClose={handleCloseMenu}
          sortedFiles={files}
          onAddressesClick={handleAddressesBtn}
        />
      ) : null}
      {showMkdirDialog && <MkdirDialog onClose={handleCloseDialog} dir={store.dir}/>}
    </>
  );
};

export default memo(FolderView);

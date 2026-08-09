import * as React from 'react';
import {FC, memo, SyntheticEvent, useCallback, useContext, useMemo, useState} from 'react';
import {
  Box,
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
  Clear as ClearIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  Upload as UploadIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import {RootStoreCtx} from '../../RootStore/RootStoreCtx';
import {SelectModeCtx} from './SelectProvider/SelectCtx';
import {FileInfo, ViewMode} from '../../../types';
import useUpload from './hooks/useUpload';
import File from './File/File';
import DropZone from './DropZone';
import AddressesDialog from './AddressesDialog';
import SelectHeader from './SelectHeader';
import FolderMenu from './FolderMenu/FolderMenu';
import {RootStoreUpdateCtx} from '../../RootStore/RootStoreUpdateCtx';
import MkdirDialog from './MkdirDialog';
import DiskUsageDialog from './DiskUsageDialog/DiskUsageDialog';
import DirSizeDialog from './DirSizeDialog/DirSizeDialog';
import SearchDialog from './SearchDialog';

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
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => Promise<void>;
  gridPreviewSize: number;
  onChangeGridPreviewSize: (size: number) => Promise<void>;
  activeSearch: string | null;
  searching: boolean;
  searchError: string | null;
  onSearch: (pattern: string) => Promise<void>;
  onClearSearch: () => void;
}

const FolderView: FC<FolderViewProps> = ({
  files,
  onShowSortDialog,
  viewMode,
  onChangeViewMode,
  gridPreviewSize,
  onChangeGridPreviewSize,
  activeSearch,
  searching,
  searchError,
  onSearch,
  onClearSearch,
}) => {
  const store = useContext(RootStoreCtx);
  const selectMode = useContext(SelectModeCtx);
  const [showAddressesDialog, setShowAddressesDialog] = useState(false);
  const {dialog, handleUpload} = useUpload(store.dir);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | Element>(null);
  const updateStore = useContext(RootStoreUpdateCtx);
  const [showMkdirDialog, setShowMkdirDialog] = useState(false);
  const [showDiskUsageDialog, setShowDiskUsageDialog] = useState(false);
  const [showDirSizeDialog, setShowDirSizeDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);

  const toggleViewMode = useCallback(async () => {
    const nextMode = viewMode === 'list' ? 'grid' : 'list';
    await onChangeViewMode(nextMode);
  }, [viewMode, onChangeViewMode]);

  const handleZoomIn = useCallback(async () => {
    await onChangeGridPreviewSize(gridPreviewSize + 30);
  }, [gridPreviewSize, onChangeGridPreviewSize]);

  const handleZoomOut = useCallback(async () => {
    await onChangeGridPreviewSize(gridPreviewSize - 30);
  }, [gridPreviewSize, onChangeGridPreviewSize]);

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

  const handleDiskUsageDialogBtn = useCallback(() => {
    setShowDiskUsageDialog(true);
  }, []);

  const handleDirSizeDialogBtn = useCallback(() => {
    setShowDirSizeDialog(true);
  }, []);

  const handleSearchDialogBtn = useCallback(() => {
    setShowSearchDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setShowAddressesDialog(false);
    setShowMkdirDialog(false);
    setShowDiskUsageDialog(false);
    setShowDirSizeDialog(false);
    setShowSearchDialog(false);
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
            <Box
              sx={{
                p: 1,
                py: 0.5,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography component={Box} sx={PathLinePathSx} variant="body2">
                {store.dir}
              </Typography>
              {store.isWritable ? (
                <IconButton title="Upload" onClick={handleUploadBtn} size="small">
                  <UploadIcon fontSize="small" />
                </IconButton>
              ) : null}
              {viewMode === 'grid' && (
                <>
                  <IconButton
                    title="Zoom out"
                    onClick={handleZoomOut}
                    size="small"
                    disabled={gridPreviewSize <= 100}
                  >
                    <ZoomOutIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    title="Zoom in"
                    onClick={handleZoomIn}
                    size="small"
                    disabled={gridPreviewSize >= 400}
                  >
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </>
              )}
              <IconButton
                title={viewMode === 'list' ? 'Grid view' : 'List view'}
                onClick={toggleViewMode}
                size="small"
              >
                {viewMode === 'list' ? (
                  <ViewModuleIcon fontSize="small" />
                ) : (
                  <ViewListIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton title="Sort" onClick={onShowSortDialog} size="small">
                <SortIcon fontSize="small" />
              </IconButton>
              <IconButton
                title="Search"
                onClick={handleSearchDialogBtn}
                size="small"
                color={activeSearch ? 'primary' : undefined}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
              <IconButton title="Menu" onClick={handleShowMenu} size="small">
                <MenuIcon fontSize="small" />
              </IconButton>
            </Box>
            {searchError && (
              <Typography
                color="error"
                variant="caption"
                component={Box}
                sx={{
                  px: 1,
                  pb: 0.5,
                }}
              >
                {searchError}
              </Typography>
            )}
            {activeSearch && !searchError && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 1,
                  pb: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    flexGrow: 1,
                  }}
                >
                  {searching ? 'Searching…' : `${files.length} result(s) for ${activeSearch}`}
                </Typography>
                <IconButton title="Clear search" onClick={onClearSearch} size="small">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
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

        {/* Рендеринг файлов с учетом выбранной сетки */}
        {viewMode === 'grid' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(min(${gridPreviewSize}px, 100%), 1fr))`,
              gap: 2,
              px: 1,
              pt: 1,
            }}
          >
            {files.map((file) => (
              <File
                key={`${file.isDir}_${file.dir ?? store.dir}_${file.name}`}
                dir={file.dir ?? store.dir}
                file={file}
                writable={!activeSearch && store.isWritable}
                onReload={handleReload}
                viewMode={viewMode}
                displayName={file.relativePath}
              />
            ))}
          </Box>
        ) : (
          files.map((file) => (
            <File
              key={`${file.isDir}_${file.dir ?? store.dir}_${file.name}`}
              dir={file.dir ?? store.dir}
              file={file}
              writable={!activeSearch && store.isWritable}
              onReload={handleReload}
              viewMode={viewMode}
              displayName={file.relativePath}
            />
          ))
        )}
      </List>
      {store.isWritable && <DropZone onUpload={handleUpload} />}
      {showAddressesDialog && <AddressesDialog onClose={handleCloseDialog} />}
      {showDiskUsageDialog && <DiskUsageDialog onClose={handleCloseDialog} />}
      {showDirSizeDialog && <DirSizeDialog onClose={handleCloseDialog} />}
      {showSearchDialog && (
        <SearchDialog
          initialPattern={activeSearch ?? ''}
          searching={searching}
          error={searchError}
          onSearch={onSearch}
          onClear={onClearSearch}
          onClose={handleCloseDialog}
        />
      )}
      {dialog}
      {selectMode && <SelectHeader />}
      {menuAnchorEl ? (
        <FolderMenu
          anchorEl={menuAnchorEl}
          onClose={handleCloseMenu}
          sortedFiles={activeSearch ? store.files : files}
          onAddressesClick={handleAddressesBtn}
          onMkdirClick={handleMkdirDialogBtn}
          onDiskUsageClick={handleDiskUsageDialogBtn}
          onDirSizeClick={handleDirSizeDialogBtn}
        />
      ) : null}
      {showMkdirDialog && <MkdirDialog onClose={handleCloseDialog} dir={store.dir} />}
    </>
  );
};

export default memo(FolderView);

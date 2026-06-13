import * as React from 'react';
import {FC, memo, MouseEvent, useCallback, useContext, useMemo} from 'react';
import {
  Audiotrack as AudiotrackIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Movie as MovieIcon,
} from '@mui/icons-material';
import {Box, CardActionArea, IconButton, LinearProgress, ListItemText, styled} from '@mui/material';
import Path from 'path-browserify';
import {filesize} from 'filesize';
import mime from 'mime';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FileMenu from '../FileMenu';
import RenameDialog from '../RenameDialog';
import {FileInfo, ViewMode} from '../../../../types';
import {RootStoreCtx} from '../../../RootStore/RootStoreCtx';
import {SelectModeCtx} from '../SelectProvider/SelectCtx';
import SelectBox from './components/SelectBox';
import {dateToStr, getExtHandler} from './utils';
import {apiUrl} from '../../../../tools/api';
import FilePreview from './components/FilePreview';

const NameSx = {
  wordBreak: 'break-word',
};

interface FileProps {
  file: FileInfo;
  dir: string;
  writable: boolean;
  onReload: () => Promise<void> | void;
  viewMode: ViewMode;
}

const SubLine = styled('div')(() => {
  return {
    display: 'flex',
    justifyContent: 'space-between',
  };
});

const ProgressCtr = styled('div')(() => {
  return {
    marginBottom: '-4px',
  };
});

const MyIconButton = styled(IconButton)(() => ({
  '.file-icon': {
    display: 'block',
  },
  '.menu-icon': {
    display: 'none',
  },
  '&:hover, &.menu-opened': {
    '.file-icon': {
      display: 'none',
    },
    '.menu-icon': {
      display: 'block',
    },
  },
}));

const IconBox = styled(Box)(() => ({
  cursor: 'default',
  display: 'flex',
  alignItems: 'center',
}));

const File: FC<FileProps> = ({file, dir, writable, onReload, viewMode}) => {
  const store = useContext(RootStoreCtx);
  const {size, ctime, name, isDir, progress} = file;
  const selectMode = useContext(SelectModeCtx);
  const [renameDialog, setRenameDialog] = React.useState(false);

  const extNames = useMemo(() => {
    const extname = Path.extname(name).toLowerCase();
    if (isDir) {
      return [`dir${extname}`, 'dir'];
    }
    return [extname];
  }, [isDir, name]);

  const handleUrl = useMemo(
    () => getExtHandler(extNames, store.extHandle),
    [extNames, store.extHandle],
  );

  const customActions = useMemo(
    () => getExtHandler(extNames, store.extActions) ?? [],
    [extNames, store.extActions],
  );

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

  const RawIcon = React.useMemo(() => {
    if (isDir) {
      return <FolderIcon fontSize={viewMode === 'grid' ? 'large' : 'medium'} className="file-icon" />;
    }
    const mimeType = mime.getType(name);
    const m = /^([^\/]+)/.exec(mimeType || '');
    const generalType = m && m[1];
    const iconProps = {fontSize: viewMode === 'grid' ? 'large' as const : 'medium' as const, className: 'file-icon'};
    switch (generalType) {
      case 'video':
        return <MovieIcon {...iconProps} />;
      case 'audio':
        return <AudiotrackIcon {...iconProps} />;
      case 'image':
        return <ImageIcon {...iconProps} />;
      case 'text':
        return <DescriptionIcon {...iconProps} />;
      default:
        return <InsertDriveFileIcon {...iconProps} />;
    }
  }, [name, isDir, viewMode]);

  const fileUrl = useMemo(() => {
    return Path.join(dir.split('/').map(encodeURIComponent).join('/'), encodeURIComponent(name));
  }, [dir, name]);

  const launchUrl = useMemo(() => {
    return handleUrl
      ? apiUrl.extHandle({place: dir, name: file.name, isDir: file.isDir})
      : undefined;
  }, [handleUrl, dir, file.name, file.isDir]);

  const handleMenuClick = React.useCallback((e: React.MouseEvent) => {
    setMenuAnchorEl(e.currentTarget);
  }, []);

  const handleMenuClose = React.useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const handleRename = React.useCallback(() => {
    setRenameDialog(true);
  }, []);

  const handleCloseDialog = React.useCallback(() => {
    setRenameDialog(false);
  }, []);

  const body = useMemo(() => {
    return (
      <ListItemText
        primary={name}
        slotProps={{
          primary: {
            noWrap: viewMode === 'grid',
            variant: viewMode === 'grid' ? 'body2' : 'body1',
            title: name,
          },
          secondary: {
            component: 'div',
          },
        }}
        secondary={(
          <>
            <SubLine
              style={viewMode === 'grid' ? {flexDirection: 'column', fontSize: '12px'} : undefined}
            >
              <div>{dateToStr(new Date(ctime))}</div>
              <div>{sizeStr}</div>
            </SubLine>
            {progress > 0 && (
              <ProgressCtr>
                <LinearProgress variant="determinate" value={progress} />
              </ProgressCtr>
            )}
          </>
        )}
        sx={NameSx}
      />
    );
  }, [name, ctime, sizeStr, progress, viewMode]);

  const handleIconBoxClick = useCallback((e: MouseEvent<unknown>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  if (viewMode === 'grid') {
    return (
      <Box
        position="relative"
        width="160px"
        display="flex"
        flexDirection="column"
        alignItems="stretch"
        m={1}
        border="1px solid"
        borderColor="divider"
        borderRadius="8px"
        overflow="hidden"
        bgcolor="background.paper"
      >
        {selectMode && (
          <Box
            position="absolute"
            top={2}
            left={2}
            zIndex={2}
            bgcolor="rgba(0,0,0,0.4)"
            borderRadius="4px"
          >
            <SelectBox name={name} />
          </Box>
        )}
        <Box position="absolute" top={4} right={4} zIndex={2}>
          <MyIconButton
            size="small"
            className={menuAnchorEl ? 'menu-opened' : undefined}
            color={handleUrl ? 'primary' : undefined}
            onClick={handleMenuClick}
          >
            <MoreHorizIcon />
          </MyIconButton>
        </Box>
        <CardActionArea
          sx={{display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'stretch'}}
          href={launchUrl ?? fileUrl}
        >
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            pt={2}
            height="130px"
            position="relative"
          >
            <FilePreview
              name={name}
              dir={dir}
              defaultIcon={RawIcon}
              viewMode="grid"
              hasPreview={file.hasPreview}
            />
          </Box>
          <Box p={1} flexGrow={1} width="100%" boxSizing="border-box">
            {body}
          </Box>
        </CardActionArea>
        {menuAnchorEl ? (
          <FileMenu
            anchorEl={menuAnchorEl}
            onRename={handleRename}
            onClose={handleMenuClose}
            file={file}
            dir={dir}
            customActions={customActions}
            writable={writable}
            fileUrl={fileUrl}
            launchUrl={launchUrl}
          />
        ) : null}
        {renameDialog ? (
          <RenameDialog onClose={handleCloseDialog} dir={dir} file={file} onSuccess={onReload} />
        ) : null}
      </Box>
    );
  }

  // Стандартный List View вид
  return (
    <>
      <Box display="flex" alignItems="stretch">
        {selectMode && <SelectBox name={name} />}
        <CardActionArea sx={{display: 'flex', alignItems: 'stretch'}} href={launchUrl ?? fileUrl}>
          <IconBox pl={selectMode ? 0 : 1} onClick={handleIconBoxClick}>
            <MyIconButton
              className={menuAnchorEl ? 'menu-opened' : undefined}
              color={handleUrl ? 'primary' : undefined}
              onClick={handleMenuClick}
            >
              {RawIcon}
              <MoreHorizIcon className="menu-icon" />
            </MyIconButton>
          </IconBox>
          <Box flexGrow={1} sx={{p: 1}}>
            {body}
          </Box>
        </CardActionArea>
      </Box>
      {menuAnchorEl ? (
        <FileMenu
          anchorEl={menuAnchorEl}
          onRename={handleRename}
          onClose={handleMenuClose}
          file={file}
          dir={dir}
          customActions={customActions}
          writable={writable}
          fileUrl={fileUrl}
          launchUrl={launchUrl}
        />
      ) : null}
      {renameDialog ? (
        <RenameDialog onClose={handleCloseDialog} dir={dir} file={file} onSuccess={onReload} />
      ) : null}
    </>
  );
};

export default memo(File);

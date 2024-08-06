import * as React from 'react';
import {FC, memo, useContext, useMemo} from 'react';
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
import FileMenu from '../FileMenu';
import RenameDialog from '../RenameDialog';
import {FileInfo} from '../../../../types';
import {RootStoreCtx} from '../../../RootStore/RootStoreCtx';
import {SelectModeCtx} from '../SelectProvider/SelectCtx';
import SelectBox from './components/SelectBox';
import {formatUrl} from '../../utils';

const NameSx = {
  wordBreak: 'break-word',
};

interface FileProps {
  file: FileInfo;
  dir: string;
  writable: boolean;
  onReload: () => Promise<void> | void;
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

const File: FC<FileProps> = ({file, dir, writable, onReload}) => {
  const store = useContext(RootStoreCtx);
  const {size, ctime, name, isDir, progress} = file;
  const selectMode = useContext(SelectModeCtx);
  const [renameDialog, setRenameDialog] = React.useState(false);

  const ext = useMemo(() => Path.extname(name).toLowerCase(), [name]);
  const handleUrl = useMemo(() => store.extHandle[ext], [store, ext]);
  const customActions = useMemo(() => store.extActions[ext] ?? [], [store, ext]);

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

  const dateStr = React.useMemo(() => {
    return dateToStr(new Date(ctime));
  }, [ctime]);

  const Icon = React.useMemo(() => {
    if (isDir) {
      return FolderIcon;
    }

    const mimeType = mime.getType(name);
    const m = /^([^\/]+)/.exec(mimeType || '');
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

  const fileUrl = useMemo(() => {
    return Path.join(dir.split('/').map(encodeURIComponent).join('/'), encodeURIComponent(name));
  }, [dir, name]);

  const handledFileUrl = useMemo(() => {
    return handleUrl ? formatUrl(handleUrl, {dir, name: file.name}) : undefined;
  }, [file.name, dir, handleUrl]);

  const handleMenuClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
        secondary={
          <>
            <SubLine>
              <div>{dateStr}</div>
              <div>{sizeStr}</div>
            </SubLine>
            {progress > 0 && (
              <ProgressCtr>
                <LinearProgress variant="determinate" value={progress} />
              </ProgressCtr>
            )}
          </>
        }
        secondaryTypographyProps={{component: 'div'}}
        sx={NameSx}
      />
    );
  }, [progress, dateStr, name, sizeStr]);

  const linkProps = useMemo(() => {
    return handledFileUrl ? {href: handledFileUrl, target: '_blank'} : {href: fileUrl};
  }, [handledFileUrl, fileUrl]);

  return (
    <>
      <Box display="flex" alignItems="stretch">
        {selectMode && <SelectBox name={name} />}
        <CardActionArea sx={{display: 'flex', alignItems: 'stretch'}} {...linkProps}>
          <Box pl={selectMode ? 0 : 1} display="flex" alignItems="center">
            <IconButton color={handleUrl ? 'primary' : undefined} onClick={handleMenuClick}>
              <Icon />
            </IconButton>
          </Box>
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
        />
      ) : null}
      {renameDialog ? (
        <RenameDialog onClose={handleCloseDialog} dir={dir} file={file} onSuccess={onReload} />
      ) : null}
    </>
  );
};

function dateToStr(date: Date) {
  const dateStr = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((v) => (v < 10 ? '0' : '') + v)
    .join('-');
  const timeStr = [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((v) => (v < 10 ? '0' : '') + v)
    .join(':');
  return `${dateStr} ${timeStr}`;
}

export default memo(File);

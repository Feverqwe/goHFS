import * as React from 'react';
import {SyntheticEvent} from 'react';
import {CircularProgress, ListItemIcon, ListItemText, Menu, MenuItem, styled, Tooltip} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import ErrorIcon from '@mui/icons-material/Error';
import DoneIcon from '@mui/icons-material/Done';
import {FileInfo} from '../../../types';
import {api} from '../../../tools/api';

const MyListItemIcon = styled(ListItemIcon)(({theme}) => {
  return {
    justifyContent: 'flex-end',
  };
});

interface FileDialogProps {
  file: FileInfo,
  dir: string,
  onClose: () => void,
  onRemoved: () => void,
  onRename: () => void,
  anchorEl: Element,
}

const FileMenu = React.memo(({anchorEl, file, dir, onRemoved, onRename, onClose}: FileDialogProps) => {
  return (
    <Menu anchorEl={anchorEl} open onClose={onClose}>
      {['rename', 'remove'].map((type) => {
        let onSuccess;
        if (type === 'remove') {
          onSuccess = onRemoved;
        } else
        if (type === 'rename') {
          onSuccess = onRename;
        }

        return (
          <ActionBtn
            key={type}
            action={type}
            file={file}
            dir={dir}
            onSuccess={onSuccess}
          />
        );
      })}
    </Menu>
  );
});

interface ActionBtnProps {
  action: string,
  file: FileInfo,
  dir: string,
  onSuccess?: () => void,
}

const ActionBtn = React.memo(({action, file, dir, onSuccess}: ActionBtnProps) => {
  const [isLoading, setLoading] = React.useState(false);
  const [isDone, setDone] = React.useState(false);
  const [error, setError] = React.useState<null | Error>(null);

  const [Icon, label, reqFn] = React.useMemo(() => {
    let icon;
    let label;
    let reqFn;
    switch (action) {
      case 'remove': {
        label = 'Delete';
        icon = DeleteForeverIcon;
        reqFn = api.remove.bind(null, {
          place: dir,
          name: file.name,
          isDir: file.isDir,
        });
        break;
      }
      case 'rename': {
        label = 'Rename';
        icon = DriveFileRenameOutlineIcon;
        break;
      }
      default: {
        throw new Error('Action not found');
      }
    }

    return [icon, label, reqFn];
  }, [action, dir, file.isDir, file.name]);

  const handleClick = React.useCallback((e: SyntheticEvent) => {
    e.preventDefault();
    if (reqFn) {
      setLoading(true);
      reqFn().then(() => {
        onSuccess?.();
      }, (err) => {
        setError(err);
      }).finally(() => {
        setLoading(false);
        setDone(true);
      });
    } else {
      onSuccess?.();
    }
  }, [reqFn, onSuccess]);

  return (
    <MenuItem onClick={handleClick} disabled={isLoading}>
      <ListItemIcon>
        <Icon />
      </ListItemIcon>
      <ListItemText>{label}</ListItemText>
      <MyListItemIcon>
        {isLoading ? (
          <CircularProgress size={20} />
        ) : error ? (
          <Tooltip title={error.message}>
            <ErrorIcon color="error" />
          </Tooltip>
        ) : isDone ? (
          <DoneIcon />
        ) : null}
      </MyListItemIcon>
    </MenuItem>
  );
});

export default FileMenu;

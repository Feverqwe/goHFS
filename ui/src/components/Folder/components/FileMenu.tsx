import * as React from "react";
import {SyntheticEvent} from "react";
import {CircularProgress, ListItemIcon, ListItemText, Menu, MenuItem, styled, Tooltip} from "@mui/material";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import ErrorIcon from '@mui/icons-material/Error';
import DoneIcon from '@mui/icons-material/Done';
import {FileInfo} from "../../../folder";
import {doReq} from "../../../tools/apiRequest";

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

  const scope = React.useMemo(() => ({} as Record<string, any>), []);
  scope.isLoading = isLoading;
  scope.isDone = isDone;

  const [Icon, label, url, payload] = React.useMemo(() => {
    let icon;
    let label;
    let url;
    let payload;
    switch (action) {
      case 'remove': {
        label = 'Delete';
        icon = DeleteForeverIcon;
        url = '/~/remove';
        payload = {
          place: dir,
          name: file.name,
          isDir: file.isDir,
        };
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

    return [icon, label, url, payload];
  }, [file]);

  const handleClick = React.useCallback((e: SyntheticEvent) => {
    e.preventDefault();
    if (scope.isLoading) return;
    if (payload && url) {
      setLoading(true);
      doReq(url, payload).then(() => {
        onSuccess && onSuccess();
      }, (err) => {
        setError(err);
      }).finally(() => {
        setLoading(false);
        setDone(true);
      });
    } else {
      onSuccess && onSuccess();
    }
  }, [onSuccess, url, payload]);

  return (
    <MenuItem onClick={handleClick}>
      <ListItemIcon>
        <Icon/>
      </ListItemIcon>
      <ListItemText>{label}</ListItemText>
      <MyListItemIcon>
        {isLoading ? (
          <CircularProgress size={20}/>
        ) : error ? (
          <Tooltip title={error.message}>
            <ErrorIcon color="error"/>
          </Tooltip>
        ) : isDone ? (
          <DoneIcon/>
        ) : null}
      </MyListItemIcon>
    </MenuItem>
  );
});

export default FileMenu;
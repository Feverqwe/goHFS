import * as React from "react";
import {CircularProgress, ListItemIcon, ListItemText, Menu, MenuItem, styled, Tooltip} from "@mui/material";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ErrorIcon from '@mui/icons-material/Error';
import DoneIcon from '@mui/icons-material/Done';
import {FileInfo} from "../index";

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
  anchorEl: Element,
}

const FileMenu = React.memo(({anchorEl, file, dir, onRemoved, onClose}: FileDialogProps) => {
  return (
    <Menu anchorEl={anchorEl} open onClose={onClose}>
      {['remove'].map((type) => {
        return (
          <ActionBtn
            key={type}
            action={type}
            file={file}
            dir={dir}
            onSuccess={type === 'remove' && onRemoved || undefined}
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
    const {isDir} = file;

    let icon;
    let label;
    let url;
    let payload;
    switch (action) {
      case 'remove': {
        if (isDir) {
          label = 'Remove directory';
        } else {
          label = 'Remove file';
        }
        icon = DeleteForeverIcon;
        url = '/~/remove';
        payload = {
          place: dir,
          name: file.name,
          isDir: file.isDir,
        };
        break;
      }
      default: {
        throw new Error('Action not found');
      }
    }

    return [icon, label, url, payload];
  }, [file]);

  const handleClick = React.useCallback((e) => {
    e.preventDefault();
    if (scope.isLoading) return;
    setLoading(true);
    doReq(url, payload).then(() => {
      onSuccess && onSuccess();
    }, (err) => {
      setError(err);
    }).finally(() => {
      setLoading(false);
      setDone(true);
    });
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
            <ErrorIcon/>
          </Tooltip>
        ) : isDone ? (
          <DoneIcon/>
        ) : null}
      </MyListItemIcon>
    </MenuItem>
  );
});

function doReq<T>(url: string, data: Record<string, any>) {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then((response) => {
    if (!response.ok) {
      throw new Error('Incorrect status code: ' + response.status + '(' + response.statusText + ')');
    }
    return response.json();
  }).then((body: {error: string} | {result: T}) => {
    if ('error' in body) {
      throw new Error(body.error);
    }
    return body.result;
  });
}

export default FileMenu;
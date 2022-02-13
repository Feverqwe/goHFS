import * as React from "react";
import {Button, ButtonGroup, CircularProgress, Dialog, DialogContent, styled, Tooltip} from "@mui/material";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ErrorIcon from '@mui/icons-material/Error';
import DoneIcon from '@mui/icons-material/Done';
import {FileInfo} from "../index";

const MyDialog = styled(Dialog)(({theme}) => {
  return {
    '.MuiPaper-root': {
      backgroundImage: 'none',
    }
  };
});

interface FileDialogProps {
  file: FileInfo,
  dir: string,
  onClose: () => void,
}

const FileDialog = React.memo(({file, dir, onClose}: FileDialogProps) => {
  const handleClose = React.useCallback((e, key) => {
    onClose();
  }, []);

  return (
    <MyDialog onClose={handleClose} open={true}>
      <DialogContent>
        <ButtonGroup orientation="vertical">
          {['remove'].map((type) => {
            return (
              <ActionBtn
                key={type}
                action={type}
                file={file}
                dir={dir}
              />
            );
          })}
        </ButtonGroup>
      </DialogContent>
    </MyDialog>
  );
});

interface ActionBtnProps {
  action: string,
  file: FileInfo,
  dir: string,
}

const ActionBtn = React.memo(({action, file, dir}: ActionBtnProps) => {
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
    doReq(url, payload).catch((err) => {
      setError(err);
    }).finally(() => {
      setLoading(false);
      setDone(true);
    });
  }, [url, payload]);

  return (
    <Button
      onClick={handleClick}
      variant={'outlined'}
      startIcon={<Icon/>}
      endIcon={isLoading ? (
        <CircularProgress size={20}/>
      ) : error ? (
        <Tooltip title={error.message}>
          <ErrorIcon/>
        </Tooltip>
      ) : isDone ? (
        <DoneIcon/>
      ) : null}
    >{label}</Button>
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

export default FileDialog;
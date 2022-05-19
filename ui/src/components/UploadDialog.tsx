import * as React from "react";
import {SyntheticEvent} from "react";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Input,
  LinearProgress,
  styled,
  Table,
  TableBody,
  TableCell,
  TableRow
} from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import MyDialog from "./MyDialog";

const UploadBox = styled(Button)(({theme}) => {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderColor: theme.palette.grey.A700,
    backgroundColor: theme.palette.background.paper,
    outline: 'none',
    ...theme.shape,
    ...theme.typography.body1,
    width: '100%',
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
    '&.dragover': {
      borderColor: theme.palette.primary.main,
    },
  };
});

interface UploadResponse {
  error?: string,
  result?: {
    ok: boolean,
    filename: string,
    error: string,
  }[],
}

interface UploadDialogProps {
  dir: string;
  onClose: () => void,
}

const UploadDialog = React.memo(({dir, onClose}: UploadDialogProps) => {
  const [isSubmit, setSubmit] = React.useState(false);
  const [ok, setOk] = React.useState(false);
  const [report, setReport] = React.useState<Required<UploadResponse>["result"] | null>(null);
  const [error, setError] = React.useState<null | Error>(null);

  const handleUpload = React.useCallback((files: FileList) => {
    const data = new FormData();
    for (let i = 0, file; file = files[i]; i++) {
      data.append('file', files[i])
    }

    setSubmit(true);
    fetch('/~/upload?' + new URLSearchParams({
      place: dir,
    }).toString(), {
      method: 'POST',
      body: data,
    }).then(async (response) => {
      const body: null | UploadResponse = await response.json().catch(err => null);
      if (!response.ok) {
        console.error('Incorrect upload status: %s (%s)', response.status, response.statusText);
        let error;
        if (body && body.error) {
          error = new Error(body.error);
        } else {
          error = new Error(`Response code ${response.status} (${response.statusText})`);
        }
        setError(error);
        return;
      }

      if (!body || body.error) {
        setError(new Error(!body ? 'Empty body' : body.error));
      } else {
        setOk(body.result!.every(file => file.ok));
        setReport(body.result!);
      }
    }, (err) => {
      console.error('Upload error: %O', err);
      setError(err);
    });
  }, [dir]);

  const handleClose = React.useCallback((e: SyntheticEvent, reason?: string) => {
    e.preventDefault();
    if ((isSubmit && !ok) && reason === 'backdropClick') return;
    onClose();
  }, [isSubmit, ok]);

  return (
    <MyDialog fullWidth={true} onClose={handleClose} open={true}>
      {error || report ? (
        <DialogTitle>
          <Box alignItems="center" display="flex">
            Upload {ok ? 'complete' : 'error'}
            <Box alignItems="center" display="flex" p={1}>
              {ok ? <CheckIcon color="primary"/> : <ErrorOutlineIcon color="error"/>}
            </Box>
          </Box>
        </DialogTitle>
      ) : null}
      <DialogContent>
        {!isSubmit ? (
          <DropZone onUpload={handleUpload}/>
        ) : report ? (
          <Report report={report}/>
        ) : error ? (
          <Input fullWidth={true} value={error.message} readOnly/>
        ) : (
          <LinearProgress/>
        )}
      </DialogContent>
      {error || report ? (
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      ) : null}
    </MyDialog>
  );
});

interface DropZoneProps {
  onUpload: (files: FileList) => void;
}

const DropZone: React.FC<DropZoneProps> = ({onUpload}) => {
  const refDropZone = React.useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [scope] = React.useState({dragOver});
  scope.dragOver = dragOver;

  React.useEffect(() => {
    let dragTimeout: NodeJS.Timeout | null = null;

    const div = refDropZone.current!;
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleDrop);

    function handleDragOver(e: DragEvent) {
      e.preventDefault();
      if (!scope.dragOver) {
        setDragOver(true);
      }
      dragTimeout && clearTimeout(dragTimeout);
      dragTimeout = setTimeout(() => {
        setDragOver(false);
      }, 150);
    }

    function handleDrop(e: DragEvent) {
      e.stopPropagation();
      e.preventDefault();
      if (e.dataTransfer) {
        const files = e.dataTransfer.files;
        if (files.length) {
          onUpload(files);
        }
      }
    }

    return () => {
      dragTimeout && clearTimeout(dragTimeout);
      div.removeEventListener('dragover', handleDragOver);
      div.removeEventListener('drop', handleDrop);
    };
  }, []);

  const handleUploadBtn = React.useCallback((e: SyntheticEvent) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.addEventListener('change', (e) => {
      const files = input.files!;
      onUpload(files);
    });
    input.dispatchEvent(new MouseEvent('click'));
  }, []);

  return (
    <div ref={refDropZone}>
      <UploadBox className={dragOver && 'dragover' || ''} onClick={handleUploadBtn}>
        <Box alignItems="center" display="flex">
          <Box alignItems="center" display="flex" p={1}>
            <UploadFileIcon color="primary"/>
          </Box>
          Upload
        </Box>
      </UploadBox>
    </div>
  );
};

interface ReportProps {
  report: Required<UploadResponse>["result"];
}

const Report: React.FC<ReportProps> = ({report}) => {
  return (
    <Table>
      <TableBody>
        {report.map((file) => (
          <TableRow key={file.filename}>
            <TableCell>
              {file.filename}
              {!file.ok ? (
                <Input fullWidth={true} value={file.error} readOnly/>
              ) : null}
            </TableCell>
            <TableCell padding="none" align="right">
              <Box textAlign="center">
                {file.ok ? <CheckIcon /> : <ErrorOutlineIcon />}
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UploadDialog;
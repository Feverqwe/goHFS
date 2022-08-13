import * as React from "react";
import {SyntheticEvent, useCallback, useState} from "react";
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
import {ApiError, doReq, handleApiResponse} from "../../tools/apiRequest";

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

interface UploadFileResult {
  ok: boolean,
  filename: string,
  error: string,
}

interface UploadResponse {
  error?: string,
  result?: UploadFileResult[],
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
  const [progress, setProgress] = useState(0);
  const [isRetry, setRetry] = useState(false);

  const upload = useCallback(async (files: File[]) => {
    const sumBytes = files.reduce((r, file) => r += file.size, 0);
    let uploadedBytes = 0;
    const updateProgress = (bytes: number) => {
      uploadedBytes += bytes;
      setProgress(100 / sumBytes * uploadedBytes);
    };

    const sendChunk = async (key: string, chunk: Blob, pos: number) => {
      const data = new FormData();
      data.append("key", key);
      data.append("pos", String(pos));
      data.append("size", String(chunk.size));
      data.append("chunk", chunk);

      await fetch('/~/upload/chunk', {
        method: 'POST',
        body: data,
      }).then(handleApiResponse);

      updateProgress(chunk.size);
    };

    const uploadFile = async (file: File) => {
      const {key, chunkSize} = await doReq<{key: string, chunkSize: number}>('/~/upload/init', {
        fileName: file.name,
        size: file.size,
        place: dir,
      });

      const blob = new Blob([file]);
      let pos = 0;
      while (pos < blob.size) {
        const chunk = blob.slice(pos, pos + chunkSize);

        while (true) {
          try {
            await sendChunk(key, chunk, pos);

            break;
          } catch (error) {
            const err = error as Error | ApiError;
            if (['ApiError', 'HTTPError'].includes(err.name)) {
              throw err;
            }
            setRetry(true);
            await new Promise(r => setTimeout(r, 5 * 1000));
          }
        }
        setRetry(false);

        pos += chunkSize;
      }
    };

    const results: UploadFileResult[] = [];

    for (let i = 0, file; file = files[i]; i++) {
      let error = '';
      try {
        await uploadFile(file);
      } catch (err) {
        error = (err as Error).message;
      }

      results.push({
        ok: !error,
        filename: file.name,
        error: error,
      });
    }

    return results;
  }, [dir]);

  const handleUpload = React.useCallback((files: File[]) => {
    setSubmit(true);
    upload(files).then((results) => {
      setOk(results.every(file => file.ok));
      setReport(results);
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
          <LinearProgress color={isRetry ? "warning" : "primary"} variant={"determinate"} value={progress}/>
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
  onUpload: (files: File[]) => void;
}

const DropZone: React.FC<DropZoneProps> = ({onUpload}) => {
  const refDropZone = React.useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [scope] = React.useState({dragOver});
  scope.dragOver = dragOver;

  React.useEffect(() => {
    let dragTimeout: NodeJS.Timeout | null = null;

    const {body} = document;
    body.addEventListener('dragover', handleDragOver);
    body.addEventListener('drop', handleDrop);

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
          onUpload(Array.from(files));
        }
      }
    }

    return () => {
      dragTimeout && clearTimeout(dragTimeout);
      body.removeEventListener('dragover', handleDragOver);
      body.removeEventListener('drop', handleDrop);
    };
  }, []);

  const handleUploadBtn = React.useCallback((e: SyntheticEvent) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.addEventListener('change', (e) => {
      const files = Array.from(input.files!);
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
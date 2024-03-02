import * as React from 'react';
import {SyntheticEvent, useCallback, useState} from 'react';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {ApiError} from '../../../../tools/apiRequest';
import MyDialog from '../MyDialog';
import Report from '../Report';
import {api} from '../../../../tools/api';

export interface UploadFileResult {
  ok: boolean;
  filename: string;
  error: string;
}

export interface UploadResponse {
  error?: string;
  result?: UploadFileResult[];
}

const useUpload = (dir: string) => {
  const [queueFiles] = useState<File[]>([]);
  const [ok, setOk] = useState(false);
  const [isDone, setDone] = useState(false);
  const [report, setReport] = useState<UploadFileResult[] | null>(null);
  const [isRetry, setRetry] = useState(false);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const resetState = useCallback(() => {
    setReport(null);
    setProgress(0);
    setRetry(false);
    setOk(false);
  }, []);

  const handleUpload = useCallback(
    async (files: File[]) => {
      queueFiles.push(...files);

      if (queueFiles.length > files.length) return;

      setVisible(true);
      setDone(false);

      const newReport = await upload(dir, queueFiles, setProgress, setRetry);
      queueFiles.splice(0);

      setReport((prevReport) => {
        const sumReport = (prevReport || []).concat(newReport);
        setOk(sumReport.every((file) => file.ok));
        setDone(true);
        return sumReport;
      });
    },
    [dir, queueFiles],
  );

  const handleClose = useCallback(
    (e: SyntheticEvent, reason?: string) => {
      e.preventDefault();
      if (!ok && reason === 'backdropClick') return;
      setVisible(false);
      resetState();
    },
    [ok, resetState],
  );

  let dialog = null;
  if (visible) {
    dialog = (
      <MyDialog fullWidth={true} onClose={handleClose} open={true}>
        {isDone ? (
          <DialogTitle>
            <Box alignItems="center" display="flex">
              Upload {ok ? 'complete' : 'error'}
              <Box alignItems="center" display="flex" p={1}>
                {ok ? <CheckIcon color="primary" /> : <ErrorOutlineIcon color="error" />}
              </Box>
            </Box>
          </DialogTitle>
        ) : null}
        <DialogContent>
          {!isDone ? (
            <LinearProgress
              color={isRetry ? 'warning' : 'primary'}
              variant="determinate"
              value={progress}
            />
          ) : report ? (
            <Report report={report} />
          ) : null}
        </DialogContent>
        {isDone ? (
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
          </DialogActions>
        ) : null}
      </MyDialog>
    );
  }

  return {handleUpload, dialog};
};

const upload = async (
  dir: string,
  files: File[],
  setProgress: (val: number) => void,
  setRetry: (bool: boolean) => void,
) => {
  let sumBytesLen = 0;
  let sumBytes = 0;

  let uploadedBytes = 0;
  const updateProgress = (bytes: number) => {
    if (sumBytesLen !== files.length) {
      sumBytes = files.slice(sumBytesLen).reduce((r, file) => (r += file.size), sumBytes);
      sumBytesLen = files.length;
    }

    uploadedBytes += bytes;
    setProgress((100 / sumBytes) * uploadedBytes);
  };

  const sendChunk = async (key: string, chunk: Blob, pos: number) => {
    const data = new FormData();
    data.append('key', key);
    data.append('pos', String(pos));
    data.append('size', String(chunk.size));
    data.append('chunk', chunk);

    await api.uploadChunk(data);

    updateProgress(chunk.size);
  };

  const uploadFile = async (file: File) => {
    const {key, chunkSize} = await api.uploadInit({
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
          await new Promise((r) => window.setTimeout(r, 5 * 1000));
        }
      }
      setRetry(false);

      pos += chunkSize;
    }
  };

  const results: UploadFileResult[] = [];

  for (let i = 0, file; (file = files[i]); i++) {
    let error = '';
    try {
      await uploadFile(file);
    } catch (err) {
      error = (err as Error).message;
    }

    results.push({
      ok: !error,
      filename: file.name,
      error,
    });
  }

  return results;
};

export default useUpload;

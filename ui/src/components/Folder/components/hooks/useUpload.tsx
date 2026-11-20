import * as React from 'react';
import {SyntheticEvent, useCallback, useContext, useState} from 'react';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import {useMutation} from '@tanstack/react-query';
import {ApiError} from '../../../../tools/apiRequest';
import Report from '../Report';
import {api} from '../../../../tools/api';
import {RootStoreUpdateCtx} from '../../../RootStore/RootStoreUpdateCtx';
import ActionButton from '../ActionButton/ActionButton';

export interface UploadEntry {
  path: string;
  file?: File;
  error?: string;
}

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
  const [queue] = useState<UploadEntry[]>([]);
  const [ok, setOk] = useState(false);
  const [isDone, setDone] = useState(false);
  const [report, setReport] = useState<UploadFileResult[] | null>(null);
  const [isRetry, setRetry] = useState(false);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const updateStore = useContext(RootStoreUpdateCtx);
  const {mutateAsync: initUpload} = useMutation({mutationFn: api.uploadInit});
  const {mutateAsync: uploadChunk} = useMutation({mutationFn: api.uploadChunk});
  const {mutateAsync: makeDirectory} = useMutation({mutationFn: api.uploadMkdir});

  const resetState = useCallback(() => {
    setReport(null);
    setProgress(0);
    setRetry(false);
    setOk(false);
  }, []);

  const handleUpload = useCallback(
    async (entries: UploadEntry[]) => {
      if (!entries.length) return;
      const busy = queue.length > 0;
      for (const entry of entries) queue.push(entry);
      if (busy) return;

      setVisible(true);
      setDone(false);
      setProgress(0);

      const newReport = await upload(
        dir,
        queue,
        setProgress,
        setRetry,
        initUpload,
        uploadChunk,
        makeDirectory,
      );
      queue.length = 0;

      setReport((prevReport) => {
        const sumReport = (prevReport || []).concat(newReport);
        setOk(sumReport.every((file) => file.ok));
        setDone(true);
        return sumReport;
      });
    },
    [dir, initUpload, makeDirectory, queue, uploadChunk],
  );

  const handleClose = useCallback(
    async (e: SyntheticEvent, reason?: string) => {
      e.preventDefault();
      if (!isDone || (!ok && reason === 'backdropClick')) return;
      await updateStore();
      setVisible(false);
      resetState();
    },
    [isDone, ok, resetState, updateStore],
  );

  let dialog = null;
  if (visible) {
    dialog = (
      <Dialog fullWidth={true} onClose={handleClose} open={true}>
        {isDone ? (
          <DialogTitle>
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
              }}
            >
              Upload {ok ? 'complete' : 'error'}
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  p: 1,
                }}
              >
                {ok ? <CheckIcon color="primary" /> : <ErrorOutlinedIcon color="error" />}
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
            <ActionButton onSubmit={handleClose}>Close</ActionButton>
          </DialogActions>
        ) : null}
      </Dialog>
    );
  }

  return {handleUpload, dialog};
};

const upload = async (
  dir: string,
  entries: UploadEntry[],
  setProgress: (val: number) => void,
  setRetry: (bool: boolean) => void,
  initUpload: typeof api.uploadInit,
  uploadChunk: typeof api.uploadChunk,
  makeDirectory: typeof api.uploadMkdir,
) => {
  let countedEntries = 0;
  let sumBytes = 0;

  let uploadedBytes = 0;
  const updateProgress = (bytes: number) => {
    for (; countedEntries < entries.length; countedEntries++) {
      sumBytes += entries[countedEntries].file?.size ?? 0;
    }

    uploadedBytes += bytes;
    if (sumBytes > 0) setProgress((100 * uploadedBytes) / sumBytes);
  };

  const sendChunk = async (key: string, chunk: Blob, pos: number) => {
    const data = new FormData();
    data.append('key', key);
    data.append('pos', String(pos));
    data.append('size', String(chunk.size));
    data.append('chunk', chunk);

    await uploadChunk(data);

    updateProgress(chunk.size);
  };

  const uploadFile = async (file: File, place: string) => {
    const {key, chunkSize} = await initUpload({
      fileName: file.name,
      size: file.size,
      place,
    });

    let pos = 0;
    do {
      const chunk = file.slice(pos, pos + chunkSize);

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
    } while (pos < file.size);
  };

  const results: UploadFileResult[] = [];
  const failedDirectories = new Set<string>();

  for (const entry of entries) {
    const separator = entry.path.lastIndexOf('/');
    const parent = separator < 0 ? '' : entry.path.slice(0, separator);
    const place = parent ? `${dir === '/' ? '' : dir}/${parent}` : dir;
    let error = entry.error ?? '';
    if (!error) {
      try {
        if (failedDirectories.has(parent)) {
          throw new Error('Could not upload the parent folder.');
        }
        if (entry.file) {
          await uploadFile(entry.file, place);
        } else {
          await makeDirectory({place, name: entry.path.slice(separator + 1)});
        }
      } catch (err) {
        error = (err as Error).message;
      }
    }
    if (!entry.file && error) failedDirectories.add(entry.path);

    results.push({
      ok: !error,
      filename: entry.path,
      error,
    });
  }

  return results;
};

export default useUpload;

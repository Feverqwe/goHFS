import * as React from "react";
import {SyntheticEvent, useCallback, useState} from "react";
import {ApiError, doReq, handleApiResponse} from "../../../../tools/apiRequest";
import {Box, Button, DialogActions, DialogContent, DialogTitle, Input, LinearProgress} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import MyDialog from "../MyDialog";
import Report from "../Report";

export interface UploadFileResult {
  ok: boolean,
  filename: string,
  error: string,
}

export interface UploadResponse {
  error?: string,
  result?: UploadFileResult[],
}

const useUpload = (dir: string) => {
  const [visible, setVisible] = useState(false);
  const [report, setReport] = React.useState<Required<UploadResponse>["result"] | null>(null);
  const [error, setError] = React.useState<null | Error>(null);
  const [progress, setProgress] = useState(0);
  const [isRetry, setRetry] = useState(false);
  const [ok, setOk] = React.useState(false);

  const upload = useCallback(async (dir: string, files: File[]) => {
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
  }, []);

  const handleUpload = React.useCallback(async (files: File[]) => {
    setVisible(true);
    try {
      const results = await upload(dir, files);
      setOk(results.every(file => file.ok));
      setReport(results);
    } catch (err) {
      console.error('Upload error: %O', err);
      setError(err as Error);
    }
  }, [dir, upload]);

  const handleClose = React.useCallback((e: SyntheticEvent, reason?: string) => {
    e.preventDefault();
    if (!ok && reason === 'backdropClick') return;
    setVisible(false);
    setReport(null);
    setError(null);
    setProgress(0);
    setRetry(false);
    setOk(false);
  }, [ok]);

  let dialog = null;
  if (visible) {
    dialog = (
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
          {report ? (
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
  }

  return {handleUpload, dialog};
};

export default useUpload;
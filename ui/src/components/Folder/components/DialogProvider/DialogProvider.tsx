import React, {FC, ReactNode, SyntheticEvent, useCallback, useState} from 'react';
import {Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Tooltip} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import {DialogData} from './types';
import {DialogSetDataCtx} from './DialogSetDataCtx';

const DialogProvider: FC<{children: ReactNode}> = ({children}) => {
  const [dialogData, setDialogData] = useState<DialogData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | Error>(null);

  const handleSetDialog = useCallback((data: DialogData) => {
    setDialogData(data);
  }, []);

  const close = useCallback(() => {
    setDialogData(null);
  }, []);

  const handleSubmit = useCallback(async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await dialogData?.onSubmit();
      close();
    } catch (err) {
      console.error('Submit error: $O', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [dialogData, close]);

  const handleCancel = useCallback(() => {
    dialogData?.onCancel();
    close();
  }, [dialogData, close]);

  return (
    <DialogSetDataCtx.Provider value={handleSetDialog}>
      {children}
      {dialogData && (
        <Dialog
          open={true}
          onClose={handleCancel}
        >
          <Box component="form" onSubmit={handleSubmit}>
            {dialogData.title && (
            <DialogTitle>
              {dialogData.title}
            </DialogTitle>
            )}
            {dialogData.content && (
            <DialogContent>
              {dialogData.content}
            </DialogContent>
            )}
            <DialogActions>
              <Button onClick={handleCancel}>
                {dialogData.cancelText || 'Cancel'}
              </Button>
              <Button type="submit" disabled={loading}>
                {dialogData.okText || 'OK'}
                {loading && (
                <Box display="flex" alignItems="center" ml={1}>
                  <CircularProgress size={20} />
                </Box>
                )}
              </Button>
              {error && (
              <Box display="flex" alignItems="center" ml={1}>
                <Tooltip title={error.message}>
                  <ErrorIcon color="error" />
                </Tooltip>
              </Box>
              )}
            </DialogActions>
          </Box>
        </Dialog>
      )}
    </DialogSetDataCtx.Provider>
  );
};

export default DialogProvider;

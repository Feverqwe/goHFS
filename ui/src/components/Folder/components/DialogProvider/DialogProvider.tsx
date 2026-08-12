import React, {FC, ReactNode, SyntheticEvent, useCallback, useState} from 'react';
import {Box, Button, Dialog, DialogActions, DialogContent, DialogTitle} from '@mui/material';
import {DialogData} from './types';
import {DialogSetDataCtx} from './DialogSetDataCtx';
import useActionButton from '../../hooks/useActionButton';

const DialogProvider: FC<{children: ReactNode}> = ({children}) => {
  const [dialogData, setDialogData] = useState<DialogData | null>(null);

  const close = useCallback(() => {
    setDialogData(null);
  }, []);

  const submit = useCallback(
    async (e: SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      await dialogData?.onSubmit();
      close();
    },
    [dialogData, close],
  );

  const {isLoading, handleSubmit, reset, stateNode} = useActionButton({onSubmit: submit});

  const handleSetDialog = useCallback(
    (data: DialogData) => {
      reset();
      setDialogData(data);
    },
    [reset],
  );

  const handleCancel = useCallback(() => {
    reset();
    dialogData?.onCancel();
    close();
  }, [dialogData, close, reset]);

  return (
    <DialogSetDataCtx.Provider value={handleSetDialog}>
      {children}
      {dialogData && (
        <Dialog open={true} onClose={handleCancel}>
          <Box component="form" onSubmit={handleSubmit}>
            {dialogData.title && <DialogTitle>{dialogData.title}</DialogTitle>}
            {dialogData.content && <DialogContent>{dialogData.content}</DialogContent>}
            <DialogActions>
              <Button onClick={handleCancel}>{dialogData.cancelText || 'Cancel'}</Button>
              <Button type="submit" disabled={isLoading}>
                {dialogData.okText || 'OK'}
                {stateNode}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      )}
    </DialogSetDataCtx.Provider>
  );
};

export default DialogProvider;

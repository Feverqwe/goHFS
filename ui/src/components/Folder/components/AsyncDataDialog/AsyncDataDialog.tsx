import React, {FC, ReactNode, SyntheticEvent, useCallback} from 'react';
import {Button, Dialog, DialogActions, DialogContent, Input, LinearProgress} from '@mui/material';

interface AsyncDataDialogProps {
  actions?: ReactNode;
  children?: ReactNode;
  error: Error | null;
  loading: boolean;
  onClose: () => void;
}

const AsyncDataDialog: FC<AsyncDataDialogProps> = ({
  actions,
  children,
  error,
  loading,
  onClose,
}) => {
  const handleClose = useCallback(
    (event: SyntheticEvent) => {
      event.preventDefault();
      onClose();
    },
    [onClose],
  );

  let content = children;
  if (loading) {
    content = <LinearProgress />;
  } else if (error) {
    content = (
      <>
        <p>Error:</p>
        <Input fullWidth={true} value={error.message} readOnly={true} />
      </>
    );
  }

  return (
    <Dialog fullWidth={true} onClose={handleClose} open={true}>
      <DialogContent>
        {content}
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          {actions}
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export default AsyncDataDialog;

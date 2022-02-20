import * as React from "react";
import {Button, Dialog, DialogActions, DialogContent, Input, LinearProgress, styled} from "@mui/material";

const MyDialog = styled(Dialog)(({theme}) => {
  return {
    '.MuiPaper-root': {
      backgroundImage: 'none',
    }
  };
});

interface UploadDialogProps {
  error: null | Error | Error[],
  onClose: () => void,
}

const UploadDialog = React.memo(({error, onClose}: UploadDialogProps) => {
  const handleClose = React.useCallback((e, reason?: string) => {
    e.preventDefault();
    if (reason === 'backdropClick') return;
    onClose();
  }, []);

  return (
    <MyDialog fullWidth={true} onClose={handleClose} open={true}>
      <DialogContent>
        {error ? (
          <>
            <p>Upload error:</p>
            {Array.isArray(error) ? (
              <Input fullWidth={true} value={error.map(err => err.message).join('\n')} readOnly multiline/>
            ) : (
              <Input fullWidth={true} value={error.message} readOnly/>
            )}
          </>
        ) : (
          <LinearProgress />
        )}
        {error ? (
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
          </DialogActions>
        ) : null}
      </DialogContent>
    </MyDialog>
  );
});

export default UploadDialog;
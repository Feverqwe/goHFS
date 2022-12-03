import * as React from 'react';
import {FC, SyntheticEvent, useCallback} from 'react';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, TextField} from '@mui/material';

interface UrlFormProps {
  onClose: () => void,
  onSubmit: (url: string) => void,
}

const UrlDialog: FC<UrlFormProps> = ({onClose, onSubmit}) => {
  const handleSubmit = useCallback(async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const urlInput = e.currentTarget.elements['url' as keyof HTMLFormControlsCollection] as HTMLInputElement;
    const url = urlInput.value;
    await onSubmit(url);
    onClose();
  }, [onSubmit, onClose]);

  return (
    <Dialog
      open={true}
      onClose={onClose}
      fullWidth
    >
      <Paper component="form" method="GET" onSubmit={handleSubmit}>
        <DialogTitle>
          Enter url:
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" name="url" type="text" required autoFocus />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" type="button" onClick={onClose}>Close</Button>
          <Button variant="contained" type="submit">Open</Button>
        </DialogActions>
      </Paper>
    </Dialog>
  );
};

export default UrlDialog;

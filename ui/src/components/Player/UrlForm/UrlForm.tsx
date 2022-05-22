import * as React from "react";
import {SyntheticEvent} from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, TextField} from "@mui/material";

interface UrlFormProps {
  onCancel?: () => void,
  onSubmit?: (url: string) => void,
}

const UrlForm = React.memo(({onCancel, onSubmit}: UrlFormProps) => {
  const handleSubmit = React.useCallback((e: SyntheticEvent<HTMLFormElement>) => {
    if (onSubmit) {
      e.preventDefault();
      const urlInput = e.currentTarget.elements['url' as keyof HTMLFormControlsCollection] as HTMLInputElement;
      const url = urlInput.value;
      onSubmit(url);
    }
  }, [onSubmit]);

  const handleCancel = React.useCallback(() => {
    onCancel && onCancel()
  }, [onCancel]);

  return (
    <Dialog
      open={true}
      onClose={handleCancel}
      fullWidth
    >
      <Paper component={'form'} method={"GET"} onSubmit={handleSubmit}>
        <DialogTitle>
          Enter url:
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" name={"url"} type="text" required autoFocus/>
        </DialogContent>
        <DialogActions>
          {onCancel && (
            <Button variant="outlined" type="button" onClick={handleCancel}>Close</Button>
          )}
          <Button variant="contained" type="submit">Open</Button>
        </DialogActions>
      </Paper>
    </Dialog>
  );
});

export default UrlForm;
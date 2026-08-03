import * as React from 'react';
import {FormEvent, SyntheticEvent} from 'react';
import {
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Tooltip,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import {useMutation} from '@tanstack/react-query';
import MyDialog from './MyDialog';
import {FileInfo} from '../../../types';
import {api} from '../../../tools/api';

interface RenameDialogProps {
  dir: string;
  file: FileInfo;
  onSuccess: () => Promise<void> | void;
  onClose: () => void;
}

const RenameDialog: React.FC<RenameDialogProps> = ({dir, file, onSuccess, onClose}) => {
  const {
    mutateAsync: rename,
    isPending: isLoading,
    error,
    reset,
  } = useMutation({
    mutationFn: api.rename,
  });

  const handleClose = React.useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault();
      onClose();
    },
    [onClose],
  );

  const handleRename = React.useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const {elements} = e.currentTarget;
      const newName = (elements as HTMLFormControlsCollection & {new_name: HTMLInputElement})
        .new_name.value;
      try {
        await rename({
          place: dir,
          name: file.name,
          newName,
        });
        await onSuccess();
        onClose();
      } catch {
        // The mutation exposes the error next to the submit button.
      }
    },
    [dir, file.name, onSuccess, onClose, rename],
  );

  return (
    <MyDialog fullWidth={true} onClose={handleClose} open={true}>
      <form onSubmit={handleRename}>
        <DialogTitle>Rename</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="new_name"
            fullWidth={true}
            defaultValue={file.name}
            InputProps={{readOnly: isLoading}}
            label="New name"
            variant="standard"
            required={true}
            autoFocus={true}
            onChange={reset}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button type="submit">
            Rename
            {isLoading ? (
              <Box display="flex" alignItems="center" ml={1}>
                <CircularProgress size={20} />
              </Box>
            ) : error ? (
              <Box display="flex" alignItems="center" ml={1}>
                <Tooltip title={error.message}>
                  <ErrorIcon color="error" />
                </Tooltip>
              </Box>
            ) : null}
          </Button>
        </DialogActions>
      </form>
    </MyDialog>
  );
};

export default RenameDialog;

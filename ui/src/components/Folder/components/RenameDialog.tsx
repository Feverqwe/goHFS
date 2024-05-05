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
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<null | Error>(null);

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
      setLoading(true);
      try {
        await api.rename({
          place: dir,
          name: file.name,
          newName,
        });
        await onSuccess();
        onClose();
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [dir, file.name, onSuccess, onClose],
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

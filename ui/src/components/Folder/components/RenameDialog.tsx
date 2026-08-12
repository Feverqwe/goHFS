import * as React from 'react';
import {FormEvent, SyntheticEvent} from 'react';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField} from '@mui/material';
import {useMutation} from '@tanstack/react-query';
import {FileInfo} from '../../../types';
import {api} from '../../../tools/api';
import useActionButton from '../hooks/useActionButton';

interface RenameDialogProps {
  dir: string;
  file: FileInfo;
  onSuccess: () => Promise<void> | void;
  onClose: () => void;
}

const RenameDialog: React.FC<RenameDialogProps> = ({dir, file, onSuccess, onClose}) => {
  const {mutateAsync: rename} = useMutation({
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
      await rename({
        place: dir,
        name: file.name,
        newName,
      });
      await onSuccess();
      onClose();
    },
    [dir, file.name, onSuccess, onClose, rename],
  );

  const {isLoading, handleSubmit, reset, stateNode} = useActionButton({
    onSubmit: handleRename,
    iconSize: 20,
  });

  return (
    <Dialog fullWidth={true} onClose={handleClose} open={true}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Rename</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="new_name"
            fullWidth={true}
            defaultValue={file.name}
            label="New name"
            variant="standard"
            required={true}
            autoFocus={true}
            onChange={reset}
            slotProps={{
              input: {readOnly: isLoading},
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button type="submit">
            Rename
            {stateNode}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RenameDialog;

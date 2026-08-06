import * as React from 'react';
import {SyntheticEvent, useContext} from 'react';
import {Button, DialogActions, DialogContent, DialogTitle, TextField} from '@mui/material';
import {useMutation} from '@tanstack/react-query';
import MyDialog from './MyDialog';
import {api} from '../../../tools/api';
import useActionButton from '../hooks/useActionButton';
import {RootStoreUpdateCtx} from '../../RootStore/RootStoreUpdateCtx';

interface MkdirDialogProps {
  dir: string;
  onClose: () => void;
}

const MkdirDialog: React.FC<MkdirDialogProps> = ({dir, onClose}) => {
  const updateStore = useContext(RootStoreUpdateCtx);
  const {mutateAsync: mkdir} = useMutation({mutationFn: api.mkdir});

  const handleClose = React.useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault();
      onClose();
    },
    [onClose],
  );

  const onSubmit = React.useCallback(
    async (e: SyntheticEvent<HTMLFormElement, Event>) => {
      e.preventDefault();
      const {elements} = e.currentTarget;
      const name = (elements as HTMLFormControlsCollection & {name: HTMLInputElement}).name.value;
      await mkdir({
        place: dir,
        name,
      });
      await updateStore();
      onClose();
    },
    [dir, mkdir, updateStore, onClose],
  );

  const {isLoading, handleSubmit, stateNode} = useActionButton({onSubmit});

  return (
    <MyDialog fullWidth={true} onClose={handleClose} open={true}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create directory</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="name"
            fullWidth={true}
            label="Name"
            variant="standard"
            required={true}
            autoFocus={true}
            slotProps={{
              input: {readOnly: isLoading},
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button type="submit" disabled={isLoading}>
            Create {stateNode}
          </Button>
        </DialogActions>
      </form>
    </MyDialog>
  );
};

export default MkdirDialog;

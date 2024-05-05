import * as React from 'react';
import {FormEvent, SyntheticEvent, useContext} from 'react';
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
import ActionButton from './ActionButton/ActionButton';
import useActionButton from '../hooks/useActionButton';
import {RootStoreUpdateCtx} from "../../RootStore/RootStoreUpdateCtx";

interface MkdirDialogProps {
  dir: string;
  onClose: () => void;
}

const MkdirDialog: React.FC<MkdirDialogProps> = ({dir, onClose}) => {
  const updateStore = useContext(RootStoreUpdateCtx);

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
      await api.mkdir({
        place: dir,
        name,
      });
      await updateStore();
      onClose();
    },
    [dir, updateStore, onClose],
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
            InputProps={{readOnly: isLoading}}
            label="Name"
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button type={'submit'} disabled={isLoading}>
            Create {stateNode}
          </Button>
        </DialogActions>
      </form>
    </MyDialog>
  );
};

export default MkdirDialog;

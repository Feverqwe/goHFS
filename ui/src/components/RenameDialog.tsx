import {FileInfo} from "../index";
import MyDialog from "./MyDialog";
import * as React from "react";
import {FormEvent, SyntheticEvent} from "react";
import {
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Tooltip
} from "@mui/material";
import {doReq} from "../tools/apiRequest";
import ErrorIcon from "@mui/icons-material/Error";

interface RenameDialogProps {
  dir: string;
  file: FileInfo;
  onClose: () => void;
}

const RenameDialog: React.FC<RenameDialogProps> = ({dir, file, onClose}) => {
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<null | Error>(null);

  const handleClose = React.useCallback((e: SyntheticEvent) => {
    e.preventDefault();
    onClose();
  }, []);

  const handleRename = React.useCallback((e: FormEvent) => {
    e.preventDefault();
    const newName = (e.currentTarget as any).elements.new_name.value;
    setLoading(true);
    doReq('/~/rename', {
      place: dir,
      name: file.name,
      newName: newName,
    }).finally(() => {
      setLoading(false);
    }).then(() => {
      onClose();
    }, (err) => {
      setError(err);
    });
  }, []);

  return (
    <MyDialog fullWidth={true} onClose={handleClose} open={true}>
      <form onSubmit={handleRename}>
        <DialogTitle>
          Rename
        </DialogTitle>
        <DialogContent>
          <TextField
            margin={"dense"}
            name={'name'}
            fullWidth={true}
            defaultValue={file.name}
            InputProps={{readOnly: true}}
            label={'Original name'}
            variant="standard"
          />
          <TextField
            margin={"dense"}
            name={'new_name'}
            fullWidth={true}
            defaultValue={file.name}
            InputProps={{readOnly: isLoading}}
            label={'New name'}
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button type="submit">
            Rename
            {isLoading ? (
              <Box display="flex" alignItems="center" ml={1}>
                <CircularProgress size={20}/>
              </Box>
            ) : error ? (
              <Box display="flex" alignItems="center" ml={1}>
                <Tooltip title={error.message}>
                  <ErrorIcon color="error"/>
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
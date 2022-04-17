import {FileInfo} from "../index";
import MyDialog from "./MyDialog";
import * as React from "react";
import {Box, Button, CircularProgress, DialogActions, DialogContent, DialogTitle, Input, Tooltip} from "@mui/material";
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
  const refInput = React.useRef<null | HTMLInputElement>(null);

  const handleClose = React.useCallback((e) => {
    e.preventDefault();
    onClose();
  }, []);

  const handleRename = React.useCallback((e) => {
    e.preventDefault();
    setLoading(true);
    const newName = refInput.current?.value;
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
      <DialogTitle>
        Rename `{file.name}`
      </DialogTitle>
      <DialogContent>
        <Input inputRef={refInput} fullWidth={true} value={file.name} readOnly={isLoading}/>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button onClick={handleRename}>
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
    </MyDialog>
  );
};

export default RenameDialog;
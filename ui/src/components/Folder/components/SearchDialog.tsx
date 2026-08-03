import * as React from 'react';
import {FC, FormEvent, useCallback, useState} from 'react';
import {Button, DialogActions, DialogContent, DialogTitle, TextField} from '@mui/material';
import MyDialog from './MyDialog';

interface SearchDialogProps {
  initialPattern: string;
  searching: boolean;
  error: string | null;
  onSearch: (pattern: string) => Promise<void>;
  onClear: () => void;
  onClose: () => void;
}

const SearchDialog: FC<SearchDialogProps> = ({
  initialPattern,
  searching,
  error,
  onSearch,
  onClear,
  onClose,
}) => {
  const [pattern, setPattern] = useState(initialPattern);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await onSearch(pattern);
      onClose();
    },
    [onClose, onSearch, pattern],
  );

  const handleClear = useCallback(() => {
    onClear();
    onClose();
  }, [onClear, onClose]);

  return (
    <MyDialog fullWidth={true} maxWidth="sm" open={true} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Search files</DialogTitle>
        <DialogContent>
          <TextField
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            margin="dense"
            label="File mask"
            placeholder="*.mp4"
            helperText={error ?? 'Searches this directory and all nested directories'}
            error={Boolean(error)}
            fullWidth={true}
            autoFocus={true}
            required={true}
            slotProps={{inputLabel: {shrink: true}}}
          />
        </DialogContent>
        <DialogActions>
          {initialPattern && <Button onClick={handleClear}>Clear search</Button>}
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={searching || !pattern.trim()}>
            Search
          </Button>
        </DialogActions>
      </form>
    </MyDialog>
  );
};

export default SearchDialog;

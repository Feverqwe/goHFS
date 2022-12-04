import React, {ChangeEvent, FC, useCallback, useContext} from 'react';
import {Box, Checkbox, IconButton, Paper} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import {SelectChangeModeCtx, SelectChangeSelectedCtx, SelectSelectedCtx} from './SelectProvider/SelectCtx';
import {RootStoreCtx} from '../../RootStore/RootStoreCtx';
import {api} from '../../../tools/api';

const SelectHeader: FC = () => {
  const {dir, files} = useContext(RootStoreCtx);
  const selected = useContext(SelectSelectedCtx);
  const changeSelected = useContext(SelectChangeSelectedCtx);
  const changeMode = useContext(SelectChangeModeCtx);

  const handleSelectAll = useCallback((e: ChangeEvent, checked: boolean) => {
    changeSelected(() => {
      if (!checked) {
        return [];
      }
      return files.map((f) => f.name);
    });
  }, [files, changeSelected]);

  const handleClose = useCallback(() => {
    changeMode(false);
  }, [changeMode]);

  const handleDelete = useCallback(async () => {
    await api.removeAll({
      place: dir,
      names: selected,
    });

    location.reload();
  }, [dir, selected]);

  return (
    <Paper sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1 }}>
      <Box display="flex" alignItems="center">
        <Box px={1}>
          <Checkbox checked={selected.length === files.length} onChange={handleSelectAll} />
        </Box>
        <Box flexGrow={1}>
          Selected: {selected.length}
        </Box>
        <Box>
          <IconButton title="Delete" sx={{pl: 1}} size="small" onClick={handleDelete} disabled={selected.length === 0}>
            <DeleteIcon />
          </IconButton>
          <IconButton title="Cancel" sx={{pl: 1}} size="small" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default SelectHeader;

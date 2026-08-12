import React, {ChangeEvent, FC, useCallback, useContext} from 'react';
import {
  Box,
  Checkbox,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import {useMutation} from '@tanstack/react-query';
import {SelectChangeSelectedCtx, SelectSelectedCtx} from './SelectProvider/SelectCtx';
import {RootStoreCtx} from '../../RootStore/RootStoreCtx';
import {api} from '../../../tools/api';
import {DialogSetDataCtx} from './DialogProvider/DialogSetDataCtx';
import {DialogType} from './DialogProvider/types';
import {RootStoreUpdateCtx} from '../../RootStore/RootStoreUpdateCtx';

const SelectHeader: FC = () => {
  const {dir, files} = useContext(RootStoreCtx);
  const selected = useContext(SelectSelectedCtx);
  const changeSelected = useContext(SelectChangeSelectedCtx);
  const setDialog = useContext(DialogSetDataCtx);
  const updateStore = useContext(RootStoreUpdateCtx);
  const {mutateAsync: removeAll} = useMutation({mutationFn: api.removeAll});

  const handleSelectAll = useCallback(
    (e: ChangeEvent, checked: boolean) => {
      changeSelected((_, files) => {
        if (!checked) {
          return [];
        }
        return files.map((f) => f.name);
      });
    },
    [changeSelected],
  );

  const handleClose = useCallback(() => {
    changeSelected(() => []);
  }, [changeSelected]);

  const handleDelete = useCallback(async () => {
    setDialog({
      type: DialogType.Confirm,
      title: 'Delete selected files?',
      content: (
        <Table sx={{wordBreak: 'break-all'}}>
          <TableBody>
            {selected.map((name, index) => (
              <TableRow key={index}>
                <TableCell sx={{px: 0}} size="small">
                  {name}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ),
      okText: 'Yes',
      onSubmit: async () => {
        await removeAll({
          place: dir,
          names: selected,
        });

        await updateStore();

        handleClose();
      },
      onCancel: () => {
        handleClose();
      },
    });
  }, [dir, selected, setDialog, handleClose, removeAll, updateStore]);

  return (
    <Paper
      square={true}
      sx={{position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1, border: 0, boxShadow: 'none'}}
    >
      <Box
        sx={{
          p: 1,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            pr: 1,
          }}
        >
          <Checkbox
            sx={{m: -1}}
            size="small"
            checked={selected.length === files.length}
            onChange={handleSelectAll}
          />
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            pr: 1,
          }}
        >
          Selected: {selected.length}
        </Box>
        <Box
          sx={{
            pr: 1,
          }}
        >
          <IconButton
            title="Delete"
            size="small"
            onClick={handleDelete}
            disabled={selected.length === 0}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box>
          <IconButton title="Cancel" size="small" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default SelectHeader;

import * as React from 'react';
import {memo, ReactNode, SyntheticEvent, useCallback, useContext, useMemo} from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Input,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import {capitalize, lowerCase} from 'lodash';
import {filesize} from 'filesize';
import {useQuery} from '@tanstack/react-query';
import {api} from '../../../../tools/api';
import {DirSize} from '../../../../types';
import {RootStoreCtx} from '../../../RootStore/RootStoreCtx';
import ActionButton from '../ActionButton/ActionButton';
import {queryKeys} from '../../../../tools/queryClient';

interface DirSizeDialogProps {
  onClose: () => void;
}

const DirSizeDialog = memo(({onClose}: DirSizeDialogProps) => {
  const store = useContext(RootStoreCtx);

  const {
    data: dirSize,
    isPending: isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.dirSize(store.dir),
    queryFn: () => api.dirSize({place: store.dir}),
  });

  const handleUpdate = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleClose = useCallback(
    (e: SyntheticEvent, reason?: string) => {
      e.preventDefault();
      onClose();
    },
    [onClose],
  );

  const rows = useMemo(() => {
    if (!dirSize) return null;

    type Item = {key: keyof DirSize; field?: string; format?: (v: string | number) => ReactNode};

    const numberFormat = new Intl.NumberFormat();

    return (
      [
        {key: 'dirCount', format: (v) => numberFormat.format(v as number)},
        {key: 'fileCount', format: (v) => numberFormat.format(v as number)},
        {key: 'totalSize', format: (v) => filesize(v)},
      ] satisfies Item[]
    ).map(({key, field, format}: Item) => {
      const value = dirSize[key];
      return (
        <TableRow key={key}>
          <TableCell component="th" scope="row">
            {field ?? capitalize(lowerCase(key))}:
          </TableCell>
          <TableCell>{format ? format(value) : value}</TableCell>
        </TableRow>
      );
    });
  }, [dirSize]);

  return (
    <Dialog fullWidth={true} onClose={handleClose} open={true}>
      <DialogContent>
        {isLoading ? (
          <LinearProgress />
        ) : error ? (
          <>
            <p>Error:</p>
            <Input fullWidth={true} value={error.message} readOnly />
          </>
        ) : (
          dirSize && (
            <Box
              sx={{
                justifyContent: 'space-around',
                display: 'flex',
                flexWrap: 'wrap',
              }}
            >
              <Table>
                <TableBody>{rows}</TableBody>
              </Table>
            </Box>
          )
        )}
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <ActionButton onSubmit={handleUpdate}>Update</ActionButton>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
});

export default DirSizeDialog;

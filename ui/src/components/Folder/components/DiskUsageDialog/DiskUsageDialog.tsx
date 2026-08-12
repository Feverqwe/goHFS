import * as React from 'react';
import {memo, ReactNode, useCallback, useContext, useMemo} from 'react';
import {Box, LinearProgress, Table, TableBody, TableCell, TableRow} from '@mui/material';
import {capitalize, lowerCase} from 'lodash';
import {filesize} from 'filesize';
import {useQuery} from '@tanstack/react-query';
import {api} from '../../../../tools/api';
import {DiskUsage} from '../../../../types';
import {RootStoreCtx} from '../../../RootStore/RootStoreCtx';
import ActionButton from '../ActionButton/ActionButton';
import AsyncDataDialog from '../AsyncDataDialog/AsyncDataDialog';
import {queryKeys} from '../../../../tools/queryClient';

interface DiskUsageDialogProps {
  onClose: () => void;
}

const DiskUsageDialog = memo(({onClose}: DiskUsageDialogProps) => {
  const store = useContext(RootStoreCtx);

  const {
    data: diskUsage,
    isPending: isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.diskUsage(store.dir),
    queryFn: () => api.diskUsage({place: store.dir}),
  });

  const handleUpdate = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const rows = useMemo(() => {
    if (!diskUsage) return null;

    type Item = {key: keyof DiskUsage; field?: string; format?: (v: string | number) => ReactNode};

    const numberFormat = new Intl.NumberFormat();
    const percentFormat = new Intl.NumberFormat(undefined, {style: 'percent'});

    return (
      [
        {key: 'path', field: 'Place'},
        {key: 'fstype', field: 'FS type'},
        {key: 'total', format: (v) => filesize(v)},
        {key: 'free', format: (v) => filesize(v)},
        {key: 'used', format: (v) => filesize(v)},
        {
          key: 'usedPercent',
          field: 'Used percent',
          format: (v) => (
            <>
              {percentFormat.format((v as number) / 100)}
              <LinearProgress variant="determinate" value={v as number} />
            </>
          ),
        },
        {key: 'inodesTotal', format: (v) => numberFormat.format(v as number)},
        {key: 'inodesUsed', format: (v) => numberFormat.format(v as number)},
        {key: 'inodesFree', format: (v) => numberFormat.format(v as number)},
        {
          key: 'inodesUsedPercent',
          format: (v) => (
            <>
              {percentFormat.format((v as number) / 100)}
              <LinearProgress variant="determinate" value={v as number} />
            </>
          ),
        },
      ] satisfies Item[]
    ).map(({key, field, format}: Item) => {
      const value = diskUsage[key];
      return (
        <TableRow key={key}>
          <TableCell component="th" scope="row">
            {field ?? capitalize(lowerCase(key))}:
          </TableCell>
          <TableCell>{format ? format(value) : value}</TableCell>
        </TableRow>
      );
    });
  }, [diskUsage]);

  return (
    <AsyncDataDialog
      actions={<ActionButton onSubmit={handleUpdate}>Update</ActionButton>}
      error={error}
      loading={isLoading}
      onClose={onClose}
    >
      {diskUsage && (
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
      )}
    </AsyncDataDialog>
  );
});

export default DiskUsageDialog;

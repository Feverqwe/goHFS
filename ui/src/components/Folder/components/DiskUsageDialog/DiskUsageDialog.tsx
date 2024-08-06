import * as React from 'react';
import {ReactNode, SyntheticEvent, useContext, useMemo} from 'react';
import {
  Box,
  Button,
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
import MyDialog from '../MyDialog';
import {api} from '../../../../tools/api';
import {DiskUsage} from '../../../../types';
import {RootStoreCtx} from '../../../RootStore/RootStoreCtx';

interface DiskUsageDialogProps {
  onClose: () => void;
}

const DiskUsageDialog = React.memo(({onClose}: DiskUsageDialogProps) => {
  const store = useContext(RootStoreCtx);

  const [isLoading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<null | Error>(null);
  const [diskUsage, setDiskUsage] = React.useState<null | DiskUsage>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const diskUsage = await api.diskUsage({place: store.dir});
        setDiskUsage(diskUsage);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    })();
  }, [store.dir]);

  const handleClose = React.useCallback(
    (e: SyntheticEvent, reason?: string) => {
      e.preventDefault();
      onClose();
    },
    [onClose],
  );

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
    <MyDialog fullWidth={true} onClose={handleClose} open={true}>
      <DialogContent>
        {isLoading ? (
          <LinearProgress />
        ) : error ? (
          <>
            <p>Error:</p>
            <Input fullWidth={true} value={error.message} readOnly />
          </>
        ) : (
          diskUsage && (
            <Box justifyContent="space-around" display="flex" flexWrap="wrap">
              <Table>
                <TableBody>{rows}</TableBody>
              </Table>
            </Box>
          )
        )}
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </DialogContent>
    </MyDialog>
  );
});

export default DiskUsageDialog;

import * as React from 'react';
import {SyntheticEvent} from 'react';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Input,
  LinearProgress,
  Typography,
} from '@mui/material';
import MyDialog from './MyDialog';
import {api} from '../../../tools/api';

const QRCode = require('qrcode');

interface AddressesDialogProps {
  onClose: () => void;
}

const AddressesDialog = React.memo(({onClose}: AddressesDialogProps) => {
  const [isLoading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<null | Error>(null);
  const [addresses, setAddresses] = React.useState<null | string[]>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const addresses = await api.addresses();
        setAddresses(addresses);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleClose = React.useCallback(
    (e: SyntheticEvent, reason?: string) => {
      e.preventDefault();
      onClose();
    },
    [onClose],
  );

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
          <Box justifyContent="space-around" display="flex" flexWrap="wrap">
            {addresses!.map((address) => {
              return <AddressItem key={address} address={address} />;
            })}
          </Box>
        )}
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </DialogContent>
    </MyDialog>
  );
});

interface AddressItemProps {
  address: string;
}

const QR_CODE_SIZE = 196;

const AddressItem = React.memo(({address}: AddressItemProps) => {
  const refCanvas = React.useRef<null | HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = refCanvas.current!;

    QRCode.toCanvas(
      canvas,
      address,
      {
        version: 2,
        width: QR_CODE_SIZE,
      },
      (err: Error) => {
        if (err) {
          console.error('Create QRCode error: %O', err);
        }
      },
    );
  }, [address]);

  return (
    <Box>
      <Typography align="center" fontSize={14} color="text.secondary" gutterBottom>
        {address}
      </Typography>
      <Box>
        <canvas ref={refCanvas} width={QR_CODE_SIZE} height={QR_CODE_SIZE} />
      </Box>
    </Box>
  );
});

export default AddressesDialog;

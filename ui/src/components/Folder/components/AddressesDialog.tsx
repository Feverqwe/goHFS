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
import QRCode from 'qrcode';
import {useQuery} from '@tanstack/react-query';
import MyDialog from './MyDialog';
import {api} from '../../../tools/api';
import {queryKeys} from '../../../tools/queryClient';

interface AddressesDialogProps {
  onClose: () => void;
}

const AddressesDialog = React.memo(({onClose}: AddressesDialogProps) => {
  const {
    data: addresses,
    isPending: isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.addresses,
    queryFn: () => api.addresses(),
  });

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
          <Box
            sx={{
              justifyContent: 'space-around',
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            {addresses?.map((address) => {
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
      (err) => {
        if (err) {
          console.error('Create QRCode error: %O', err);
        }
      },
    );
  }, [address]);

  return (
    <Box>
      <Typography
        align="center"
        gutterBottom
        sx={{
          fontSize: 14,
          color: 'text.secondary',
        }}
      >
        {address}
      </Typography>
      <Box>
        <canvas ref={refCanvas} width={QR_CODE_SIZE} height={QR_CODE_SIZE} />
      </Box>
    </Box>
  );
});

export default AddressesDialog;

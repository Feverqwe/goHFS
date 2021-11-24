import * as React from "react";
import {Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, Input, LinearProgress, styled, Typography} from "@mui/material";

const QRCode = require("qrcode");

const MyDialog = styled(Dialog)(({theme}) => {
  return {
    '.MuiPaper-root': {
      backgroundImage: 'none',
    }
  };
});

interface AddressesDialogProps {
  onClose: () => void,
}

const AddressesDialog = React.memo(({onClose}: AddressesDialogProps) => {
  const [isLoading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<null | Error>(null);
  const [addresses, setAddresses] = React.useState<null | string[]>(null);

  React.useEffect(() => {
    let mounted = true;

    fetch('/~/addresses').then(async (response) => {
      if (!response.ok) {
        throw new Error(`Response code ${response.status} (${response.statusText})`);
      }

      const body: {result: string[]} = await response.json();

      if (!body.result.length) {
        throw new Error('Addresses is empty');
      }

      return body.result;
    }).then((addresses) => {
      if (!mounted) return;
      setAddresses(addresses);
    }, (err) => {
      if (!mounted) return;
      setError(err);
    }).finally(() => {
      if (!mounted) return;
      setLoading(false);
    });

    return () => {
      mounted = false;
    }
  }, []);

  const handleClose = React.useCallback((e, reason?: string) => {
    e.preventDefault();
    onClose();
  }, []);

  return (
    <MyDialog fullWidth={true} onClose={handleClose} open={true}>
      <DialogContent>
        {isLoading ? (
          <LinearProgress />
        ) : error ? (
          <>
            <p>Error:</p>
            <Input fullWidth={true} value={error.message} readOnly/>
          </>
        ) : (
          <Box justifyContent="space-around" display="flex" flexWrap="wrap">
          {addresses!.map((address) => {
            return (
              <AddressItem key={address} address={address} />
            );
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
  address: string,
}

const QR_CODE_SIZE = 196;

const AddressItem = React.memo(({address}: AddressItemProps) => {
  const refCanvas = React.useRef<null | HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = refCanvas.current!;

    QRCode.toCanvas(canvas, address, {
      version: 2,
      width: QR_CODE_SIZE,
    }, (err: Error) => {
      if (err) {
        console.error('Create QRCode error: %O', err);
      }
    })
  }, []);

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
import * as React from 'react';
import {Box, Input, Table, TableBody, TableCell, TableRow} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import {UploadResponse} from './hooks/useUpload';

interface ReportProps {
  report: Required<UploadResponse>['result'];
}

const Report: React.FC<ReportProps> = ({report}) => {
  return (
    <Table>
      <TableBody>
        {report.map((file) => (
          <TableRow key={file.filename}>
            <TableCell>
              {file.filename}
              {!file.ok ? <Input fullWidth={true} value={file.error} readOnly /> : null}
            </TableCell>
            <TableCell padding="none" align="right">
              <Box
                sx={{
                  textAlign: 'center',
                }}
              >
                {file.ok ? <CheckIcon /> : <ErrorOutlinedIcon />}
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default Report;

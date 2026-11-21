import * as React from 'react';
import {Box, Table, TableBody, TableCell, TableRow, Typography} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import type {UploadResult} from './hooks/useUpload';

interface ReportProps {
  report: UploadResult[];
}

const formatCount = (count: number, label: string) =>
  `${count.toLocaleString()} ${label}${count === 1 ? '' : 's'}`;

const Report: React.FC<ReportProps> = ({report}) => {
  return (
    <Table>
      <TableBody>
        {report.map((entry, index) => {
          const hasError = entry.kind === 'folder' ? entry.errorCount > 0 : Boolean(entry.error);
          return (
            <TableRow key={`${entry.path}:${index}`}>
              <TableCell sx={{overflowWrap: 'anywhere'}}>
                {entry.path}
                {entry.kind === 'folder' ? (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {formatCount(entry.uploadedFiles, 'file')} uploaded
                      {hasError && ` · ${formatCount(entry.errorCount, 'error')}`}
                    </Typography>
                    {hasError && (
                      <Box component="ul" sx={{m: 0, mt: 1, pl: 2.5}}>
                        {entry.errors.map(({path, message}, detailIndex) => (
                          <li key={`${path}:${detailIndex}`}>
                            {path} — {message}
                          </li>
                        ))}
                        {entry.errorCount > entry.errors.length && (
                          <li>
                            {formatCount(entry.errorCount - entry.errors.length, 'more error')}
                          </li>
                        )}
                      </Box>
                    )}
                  </>
                ) : (
                  entry.error && <Typography variant="body2">{entry.error}</Typography>
                )}
              </TableCell>
              <TableCell padding="none" sx={{textAlign: 'center', verticalAlign: 'top', pt: 2}}>
                {hasError ? <ErrorOutlinedIcon color="error" /> : <CheckIcon />}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default Report;

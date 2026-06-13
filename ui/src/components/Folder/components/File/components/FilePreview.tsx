import React, {FC, memo, useEffect, useState, useRef, useContext} from 'react';
import {Box, CircularProgress} from '@mui/material';
import {RootStoreCtx} from '../../../../RootStore/RootStoreCtx'; // Импортируем контекст стора

interface FilePreviewProps {
  name: string;
  dir: string;
  defaultIcon: React.ReactNode;
  viewMode: 'list' | 'grid';
  hasPreview: boolean;
}

const FilePreview: FC<FilePreviewProps> = ({name, dir, defaultIcon, viewMode, hasPreview}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const refTimer = useRef<number | null>(null);

  const wSize = viewMode === 'grid' ? 150 : 40;
  const hSize = viewMode === 'grid' ? 140 : 40;

  const checkPreview = React.useCallback(async () => {
    const targetPlace = dir === '/' ? `/${name}` : `${dir}/${name}`;
    const url = `/~/preview?place=${encodeURIComponent(targetPlace)}`;

    try {
      const res = await fetch(url);
      if (res.status === 200) {
        setPreviewUrl(url);
        setLoading(false);
        if (refTimer.current) window.clearTimeout(refTimer.current);
      } else if (res.status === 202) {
        setLoading(true);
        refTimer.current = window.setTimeout(checkPreview, 2000);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
    }
  }, [dir, name]);

  useEffect(() => {
    if (hasPreview) {
      checkPreview();
    }

    return () => {
      if (refTimer.current) window.clearTimeout(refTimer.current);
    };
  }, [checkPreview, hasPreview]); // Добавили зависимости

  if (previewUrl) {
    return (
      <Box
        component="img"
        src={previewUrl}
        alt={name}
        sx={{
          width: wSize,
          height: hSize,
          objectFit: 'contain',
          borderRadius: '4px',
        }}
      />
    );
  }

  return (
    <Box
      position="relative"
      display="flex"
      alignItems="center"
      justifyContent="center"
      width={wSize}
      height={hSize}
    >
      {defaultIcon}
      {loading && (
        <CircularProgress
          size={wSize * 0.6}
          sx={{
            position: 'absolute',
            color: 'primary.main',
          }}
        />
      )}
    </Box>
  );
};

export default memo(FilePreview);

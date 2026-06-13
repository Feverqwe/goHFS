import React, {FC, memo, useEffect, useRef, useState} from 'react';
import {Box, CircularProgress} from '@mui/material';

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
  const [isIntersecting, setIsIntersecting] = useState(false); // Visibility tracking status

  const refContainer = useRef<HTMLDivElement | null>(null);
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

  // Phase 1: Set up intersection tracker
  useEffect(() => {
    if (!hasPreview || previewUrl || !refContainer.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect(); // Stop tracking once it becomes visible
        }
      },
      {
        rootMargin: '100px', // Pre-load 100px before the element rolls onto screen
      },
    );

    observer.observe(refContainer.current);

    return () => {
      observer.disconnect();
    };
  }, [hasPreview, previewUrl]);

  // Phase 2: Fire checking queues ONLY when inside view boundaries
  useEffect(() => {
    if (hasPreview && isIntersecting) {
      checkPreview();
    }

    return () => {
      if (refTimer.current) window.clearTimeout(refTimer.current);
    };
  }, [checkPreview, hasPreview, isIntersecting]);

  return (
    <div ref={refContainer} style={{ width: wSize, height: hSize }}>
      {previewUrl ? (
        <Box
          component="img"
          src={previewUrl}
          alt={name}
          sx={{
            width: wSize,
            height: hSize,
            objectFit: 'cover',
            borderRadius: '4px',
          }}
        />
      ) : (
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
              size={hSize * 0.6}
              sx={{
                position: 'absolute',
                color: 'primary.main',
              }}
            />
          )}
        </Box>
      )}
    </div>
  );
};

export default memo(FilePreview);

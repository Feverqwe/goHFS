import React, {FC, memo, useEffect, useRef, useState} from 'react';
import {Box, CircularProgress} from '@mui/material';
import {useQuery} from '@tanstack/react-query';
import {queryKeys} from '../../../../../tools/queryClient';

interface FilePreviewProps {
  name: string;
  dir: string;
  defaultIcon: React.ReactNode;
  viewMode: 'list' | 'grid';
  hasPreview: boolean;
  gridPreviewSize?: number;
}

const FilePreview: FC<FilePreviewProps> = ({
  name,
  dir,
  defaultIcon,
  viewMode,
  hasPreview,
  gridPreviewSize,
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false); // Visibility tracking status

  const refContainer = useRef<HTMLDivElement | null>(null);

  const baseWidth = gridPreviewSize ?? 160;
  const baseHeight = Math.round(baseWidth * (100 / 160));

  const wSize = viewMode === 'grid' ? baseWidth : 40;
  const hSize = viewMode === 'grid' ? baseHeight : 40;

  const targetPlace = dir === '/' ? `/${name}` : `${dir}/${name}`;
  const previewUrl = `/~/preview?place=${encodeURIComponent(targetPlace)}`;
  const {data: previewStatus, isFetching} = useQuery({
    queryKey: queryKeys.preview(targetPlace),
    queryFn: async () => {
      const url = `/~/preview?place=${encodeURIComponent(targetPlace)}`;
      const res = await fetch(url);
      return res.status === 200 ? 'ready' : res.status === 202 ? 'pending' : 'unavailable';
    },
    enabled: hasPreview && isIntersecting,
    refetchInterval: ({state}) => (state.data === 'pending' ? 2000 : false),
    retry: false,
    staleTime: ({state}) => (state.data === 'ready' ? Infinity : 0),
  });

  // Phase 1: Set up intersection tracker
  useEffect(() => {
    if (!hasPreview || previewStatus === 'ready' || !refContainer.current) return;

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
  }, [hasPreview, previewStatus]);

  return (
    <div ref={refContainer} style={{width: wSize, height: hSize}}>
      {previewStatus === 'ready' ? (
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
      ) : (
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: wSize,
            height: hSize,
          }}
        >
          {defaultIcon}
          {(isFetching || previewStatus === 'pending') && (
            <CircularProgress
              size={48}
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

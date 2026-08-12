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
}

const FilePreview: FC<FilePreviewProps> = ({name, dir, defaultIcon, viewMode, hasPreview}) => {
  const [isIntersecting, setIsIntersecting] = useState(false); // Visibility tracking status

  const refContainer = useRef<HTMLDivElement | null>(null);

  const previewSize = viewMode === 'grid' ? '100%' : 40;
  const containerStyle: React.CSSProperties = {
    width: previewSize,
    height: previewSize,
    ...(viewMode === 'grid' ? {position: 'absolute', inset: 0} : {}),
  };

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
    <div ref={refContainer} style={containerStyle}>
      {previewStatus === 'ready' ? (
        <Box
          component="img"
          src={previewUrl}
          alt={name}
          sx={{
            width: previewSize,
            height: previewSize,
            objectFit: 'contain',
            borderRadius: '4px',
            display: 'block',
          }}
        />
      ) : (
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: previewSize,
            height: previewSize,
          }}
        >
          {defaultIcon}
          {(isFetching || previewStatus === 'pending') && (
            <CircularProgress size={48} sx={{position: 'absolute'}} />
          )}
        </Box>
      )}
    </div>
  );
};

export default memo(FilePreview);

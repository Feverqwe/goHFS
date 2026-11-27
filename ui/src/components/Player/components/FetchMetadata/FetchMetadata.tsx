import React, {FC, ReactNode} from 'react';
import {useQuery} from '@tanstack/react-query';
import {api} from '../../../../tools/api';
import {queryKeys} from '../../../../tools/queryClient';
import type {VideoMetadata} from '../../types';
import {getPlaybackPositionKeys, readPlaybackPosition} from '../../utils';

interface FetchMetadataProps {
  url: string;
  children: (data: VideoMetadata | undefined) => ReactNode;
}

const FetchMetadata: FC<FetchMetadataProps> = ({url, children}) => {
  const keys = getPlaybackPositionKeys(url);
  const {data, isPending} = useQuery({
    queryKey: queryKeys.storage(keys),
    queryFn: async () => {
      const result = await api.storageGet(keys);
      return readPlaybackPosition(result, keys) ?? null;
    },
    staleTime: Infinity,
    gcTime: 0,
  });

  if (isPending) return null;

  return <>{children(data ?? undefined)}</>;
};

export default FetchMetadata;

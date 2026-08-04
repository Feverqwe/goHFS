import React, {FC, ReactNode} from 'react';
import {useQuery} from '@tanstack/react-query';
import {api} from '../../../../tools/api';
import {queryKeys} from '../../../../tools/queryClient';
import {getSidV1, getSidV2} from '../../utils';

interface FetchMetadataProps {
  url: string;
  children: (data: unknown) => ReactNode | undefined;
}

const FetchMetadata: FC<FetchMetadataProps> = ({url, children}) => {
  const keys = [getSidV2(url), getSidV1(url)];
  const {data, isPending} = useQuery({
    queryKey: queryKeys.storage(keys),
    queryFn: async () => {
      const result = await api.storageGet(keys);
      return keys.map((key) => result[key]).find((value) => value !== undefined);
    },
    staleTime: Infinity,
    gcTime: 0,
  });

  if (isPending) return null;

  return <>{children(data)}</>;
};

export default FetchMetadata;

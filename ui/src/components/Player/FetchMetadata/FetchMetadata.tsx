import React, {FC, Fragment, ReactNode, useEffect, useState} from 'react';
import {api} from '../../../tools/api';
import {getSidV1, getSidV2} from '../utils';

interface FetchMetadataProps {
  url: string;
  children: (data: unknown) => ReactNode | undefined;
}

const FetchMetadata: FC<FetchMetadataProps> = ({url, children}) => {
  const [isDone, setDone] = useState(false);
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    (async () => {
      setData(null);
      setDone(false);

      let data;
      try {
        const keys = [getSidV2(url), getSidV1(url)];
        const result = await api.storageGet<Record<string, number>>(keys);
        keys.some((key) => {
          const value = result[key];
          if (value !== undefined) {
            data = value;
            return true;
          }
          return false;
        });
      } catch (err) {
        console.error('storageGet error: %O', err);
      }

      setData(data);
      setDone(true);
    })();
  }, [url]);

  if (!isDone) return null;

  return (
    <>
      {children(data)}
    </>
  );
};

export default FetchMetadata;

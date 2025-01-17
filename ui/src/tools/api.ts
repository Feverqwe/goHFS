import {handleApiResponse} from './apiRequest';
import {DirSize, DiskUsage, RootStore} from '../types';

interface ActionParams {
  method?: 'GET' | 'POST';
  path: string;
}

function action<RequestParams = unknown, ResponseData = unknown>({
  method = 'GET',
  path,
}: ActionParams) {
  return async <T = ResponseData>(params: RequestParams): Promise<T> => {
    let query = '';
    let body;
    if (params) {
      if (method === 'POST') {
        if (params instanceof FormData) {
          body = params;
        } else {
          body = JSON.stringify(params);
        }
      } else {
        query = new URLSearchParams(params).toString();
      }
    }

    return fetch(path + (query ? `?${query}` : ''), {
      method,
      body,
    }).then(handleApiResponse<T>);
  };
}

export const api = {
  storageGet: action<string[], Record<string, unknown>>({
    method: 'POST',
    path: '/~/storage/get',
  }),
  storageSet: action<unknown, string>({
    method: 'POST',
    path: '/~/storage/set',
  }),
  storageDel: action<string[], string>({
    method: 'POST',
    path: '/~/storage/del',
  }),
  remove: action<{place: string; name: string; isDir: boolean}, string>({
    method: 'POST',
    path: '/~/remove',
  }),
  removeAll: action<{place: string; names: string[]}, string>({
    method: 'POST',
    path: '/~/removeAll',
  }),
  rename: action<{place: string; name: string; newName: string}, string>({
    method: 'POST',
    path: '/~/rename',
  }),
  mkdir: action<{place: string; name: string}, string>({
    method: 'POST',
    path: '/~/mkdir',
  }),
  uploadInit: action<
    {fileName: string; size: number; place: string},
    {key: string; chunkSize: number}
  >({
    method: 'POST',
    path: '/~/upload/init',
  }),
  uploadChunk: action<FormData, boolean>({
    method: 'POST',
    path: '/~/upload/chunk',
  }),
  addresses: action<void, string[]>({
    method: 'GET',
    path: '/~/addresses',
  }),
  diskUsage: action<{place: string}, DiskUsage>({
    method: 'GET',
    path: '/~/diskUsage',
  }),
  dirSize: action<{place: string}, DirSize>({
    method: 'GET',
    path: '/~/dirSize',
  }),
  reloadConfig: action<void, string>({
    method: 'POST',
    path: '/~/reloadConfig',
  }),
  showHidden: action<{show: boolean}, boolean>({
    method: 'POST',
    path: '/~/showHidden',
  }),
  getStore: action<{place: string}, RootStore>({
    method: 'GET',
    path: '/~/getStore',
  }),
};

export const apiUrl = {
  extHandle: (params: {place: string; name: string; isDir: boolean}) => {
    return `/~/extHandle?${new URLSearchParams({
      ...params,
      isDir: String(params.isDir || ''),
      hostname: location.hostname,
    }).toString()}`;
  },
  extAction: (params: {place: string; name: string; action: string; isDir: boolean}) => {
    return `/~/extAction?${new URLSearchParams({
      ...params,
      isDir: String(params.isDir || ''),
      hostname: location.hostname,
    }).toString()}`;
  },
};

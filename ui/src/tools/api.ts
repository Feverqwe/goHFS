import {handleApiResponse} from './apiRequest';

interface ActionParams {
  method?: 'GET' | 'POST',
  path: string,
}

function action<RequestParams = unknown, ResponseData = unknown>({method = 'GET', path}: ActionParams) {
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
  rename: action<{place: string, name: string, newName: string}, string>({
    method: 'POST',
    path: '/~/rename',
  }),
  uploadInit: action<{fileName: string, size: number, place: string}, {key: string, chunkSize: number}>({
    method: 'POST',
    path: '/~/upload/init',
  }),
  uploadChunk: action<FormData, boolean>({
    method: 'POST',
    path: '/~/upload/chunk',
  }),
  remove: action<{place: string, name: string, isDir: boolean}, string>({
    method: 'POST',
    path: '/~/remove',
  }),
  addresses: action<void, string[]>({
    method: 'GET',
    path: '/~/addresses',
  }),
};

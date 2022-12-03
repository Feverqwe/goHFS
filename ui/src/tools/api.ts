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
        body = JSON.stringify(params);
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
};

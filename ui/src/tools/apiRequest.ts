export function doReq<T>(url: string, data: string[] | Record<string, any>) {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then((response) => {
    if (!response.ok) {
      throw new Error('Incorrect status code: ' + response.status + '(' + response.statusText + ')');
    }
    return response.json();
  }).then((body: {error: string} | {result: T}) => {
    if ('error' in body) {
      throw new Error(body.error);
    }
    return body.result;
  });
}
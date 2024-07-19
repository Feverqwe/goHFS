import {getUrlParams} from '../../tools/urlParams';

export {getSidV2} from '../../tools/common';

export function getParamsFromUrl() {
  const {url: rawUrl} = getUrlParams();
  const url = typeof rawUrl === 'string' ? rawUrl : '';
  return {url};
}

export function getSidV1(url: string) {
  const m = /\/\/[^\/]+(.+)$/.exec(url);
  if (m) {
    return m[1];
  }
  return url;
}

export const isSafari = 'safari' in window;

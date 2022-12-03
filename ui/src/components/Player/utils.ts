import {getUrlParams} from '../../tools/urlParams';

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

export function getSidV2(url: string) {
  let m = /\/\/[^\/]+(.+?)(?:\.[a-z0-9]+)?$/i.exec(url);
  if (!m) {
    m = /(.+?)(?:\.[a-z0-9]+)?$/i.exec(url);
  }
  if (m) {
    return m[1];
  }
  return url;
}

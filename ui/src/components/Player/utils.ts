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
  try {
    const path = new URL(url, location.href).pathname;
    const m = /(.+?)(?:\.[a-z0-9]+)?$/i.exec(url);
    if (m) {
      return m[1];
    }
    return path;
  } catch (err) {
    // pass
  }
  return url;
}

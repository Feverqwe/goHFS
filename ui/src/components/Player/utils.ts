import {getUrlParams} from '../../tools/urlParams';
import {getProgressKey, getSidV2} from '../../tools/common';

export function getParamsFromUrl() {
  const {url: rawUrl} = getUrlParams();
  const url = typeof rawUrl === 'string' ? rawUrl : '';
  return {url};
}

function getSidV1(url: string) {
  const m = /\/\/[^\/]+(.+)$/.exec(url);
  if (m) {
    return m[1];
  }
  return url;
}

function decodePath(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

export function getPlaybackPositionKeys(url: string): string[] {
  return [getSidV2(url), getSidV1(url)];
}

export function getPlaybackProgressKey(url: string): string {
  return getProgressKey(decodePath(getSidV2(url)));
}

export function readPlaybackPosition(
  values: Record<string, unknown> | undefined,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    const position = values?.[key];
    if (typeof position === 'number' && Number.isFinite(position) && position >= 0) {
      return position;
    }
  }
  return undefined;
}

export const isSafari = 'safari' in window;

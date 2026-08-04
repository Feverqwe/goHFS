import Path from 'path-browserify';

const BROKEN_ANDROID_EDGE_RE = /Mozilla.+Android.+AppleWebKit.+Chrome.+Mobile.+Safari.+EdgA/;

export function formatTime(duration: number): string {
  if (!isFinite(duration)) return '--:--';
  const h = Math.floor(duration / 3600);
  const m = Math.floor((duration % 3600) / 60);
  const s = Math.floor((duration % 3600) % 60);
  return `${h > 0 ? `${padZero(h)}:` : ''}${padZero(m)}:${padZero(s)}`;
}

export function getMediaTitle(url: string): string {
  try {
    const uri = url && new URL(url, location.href);
    return uri ? decodeURIComponent(Path.basename(uri.pathname)) : '';
  } catch (err) {
    return '';
  }
}

export function isBrokenAndroidEdge(userAgent: string): boolean {
  return BROKEN_ANDROID_EDGE_RE.test(userAgent);
}

export function isHlsUrl(url: string): boolean {
  return /\.m3u8(?:$|[?#])/i.test(url);
}

function padZero(time: number): string {
  return time < 10 ? `0${time}` : `${time}`;
}

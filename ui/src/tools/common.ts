export function getSidV2(url: string) {
  try {
    const path = new URL(url, location.href).pathname;
    const m = /(.+?)(?:\.[a-z0-9]+)?$/i.exec(path);
    if (m) {
      return m[1];
    }
    return path;
  } catch (err) {
    // pass
  }
  return url;
}

export function getProgressKey(path: string) {
  return `progress-${path}`;
}

import Path from 'path-browserify';
import mime from 'mime';
import type {FileInfo} from '../../types';

export interface PlaylistEntry {
  name: string;
  url: string;
}

export interface PlaylistSnapshot {
  key?: string;
  entries: PlaylistEntry[];
}

export type PlaylistSort = 'original' | 'name' | 'nameDescending';
export type PlaylistRepeat = 'off' | 'all' | 'one';

export interface PlaylistSettings {
  sort: PlaylistSort;
  repeat: PlaylistRepeat;
  shuffle: boolean;
  resume: boolean;
}

export const defaultPlaylistSettings: PlaylistSettings = {
  sort: 'original',
  repeat: 'off',
  shuffle: false,
  resume: true,
};

export function parsePlaylistSettings(value: unknown): PlaylistSettings {
  if (!value || typeof value !== 'object') return defaultPlaylistSettings;
  const {sort, repeat, shuffle, resume} = value as Partial<PlaylistSettings>;
  return {
    sort: sort === 'name' || sort === 'nameDescending' ? sort : defaultPlaylistSettings.sort,
    repeat: repeat === 'all' || repeat === 'one' ? repeat : defaultPlaylistSettings.repeat,
    shuffle: typeof shuffle === 'boolean' ? shuffle : defaultPlaylistSettings.shuffle,
    resume: typeof resume === 'boolean' ? resume : defaultPlaylistSettings.resume,
  };
}

export const PLAYLIST_STORAGE_KEY = 'goHFS.playlist';

export function getPlaylistKey(dir: string, search: string | null): string {
  return search ? `search:${new URLSearchParams({place: dir, pattern: search})}` : dir;
}

export function getPlaylistUrl(place: string, pattern: string | null): string {
  const source = pattern
    ? `/~/search?${new URLSearchParams({place, pattern})}`
    : place.split('/').map(encodeURIComponent).join('/') || '/';
  return `/~/www/player.html?${new URLSearchParams({playlist: source})}`;
}

export function readPlaylistTrack(): string | undefined {
  return new URLSearchParams(location.search).get('track') ?? undefined;
}

export function updatePlaylistTrackUrl(track: string): void {
  const url = new URL(location.href);
  if (url.searchParams.get('track') === track && !url.searchParams.has('t')) return;

  url.searchParams.set('track', track);
  url.searchParams.delete('t');
  history.replaceState(history.state, '', url);
}

export function parsePlaylistSource(source: string) {
  if (!source.startsWith('/')) return undefined;

  try {
    const url = new URL(source, location.origin);
    if (url.origin !== location.origin) return undefined;
    if (url.pathname === '/~/search') {
      const place = url.searchParams.get('place') ?? '/';
      const pattern = url.searchParams.get('pattern')?.trim();
      return pattern ? {place, pattern} : undefined;
    }
    return {place: decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/', pattern: null};
  } catch {
    return undefined;
  }
}

export function directoryPlaylist(files: FileInfo[], dir: string): PlaylistEntry[] {
  return files
    .filter((file) => !file.isDir)
    .map((file) => ({
      name: file.relativePath ?? file.name,
      url: Path.join(
        (file.dir ?? dir).split('/').map(encodeURIComponent).join('/'),
        encodeURIComponent(file.name),
      ),
    }));
}

export function playablePlaylist(entries: PlaylistEntry[]): PlaylistEntry[] {
  return entries.filter(({name}) => {
    const type = mime.getType(name);
    return /\.m3u8$/i.test(name) || /^(audio|video)\//.test(type ?? '');
  });
}

export function clearPlaylistTransfer(): void {
  try {
    sessionStorage.removeItem(PLAYLIST_STORAGE_KEY);
  } catch {
    // The source URL can load the playlist when session storage is unavailable.
  }
}

export function readPlaylist(): PlaylistSnapshot {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(PLAYLIST_STORAGE_KEY) ?? 'null');
    const snapshot: Partial<PlaylistSnapshot> | null = Array.isArray(saved)
      ? {entries: saved}
      : (saved as Partial<PlaylistSnapshot> | null);
    const key = typeof snapshot?.key === 'string' ? snapshot.key : undefined;
    const entries = Array.isArray(snapshot?.entries) ? snapshot.entries : [];
    return {
      key,
      entries: entries.filter(
        (entry): entry is PlaylistEntry =>
          typeof entry?.name === 'string' &&
          typeof entry.url === 'string' &&
          entry.url.startsWith('/') &&
          !entry.url.startsWith('//'),
      ),
    };
  } catch {
    return {entries: []};
  }
}

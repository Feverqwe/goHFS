import {DirSort} from '../../types';

export function getOption<T>(key: string, defaultValue: T) {
  let value: T | null = null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      throw new Error('Value is empty');
    }
    value = JSON.parse(raw);
  } catch (err) {
    // pass
  }
  if (value === null) {
    value = defaultValue;
  }
  return value;
}

export function setOption<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function unicLast<T>(list: T[]): T[] {
  return list.filter((n, i, arr) => arr.lastIndexOf(n) === i);
}

export function prepDirSort(value: unknown): DirSort {
  if (typeof value !== 'object') {
    value = null;
  }
  return value as DirSort;
}

export function shuffle<T>(array: T[]) {
  let currentIndex = array.length;
  let randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

export function isIOS() {
  return (
    ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(
      navigator.platform,
    )
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  );
}

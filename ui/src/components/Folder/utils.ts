import Path from 'path-browserify';

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

interface FormatUrlProps {
  dir: string;
  name: string;
}

export function formatUrl(str: string, {dir, name}: FormatUrlProps) {
  const {hostname} = location;
  const url = Path.join(dir.split('/').map(encodeURIComponent).join('/'), encodeURIComponent(name));
  const path = Path.join(dir, name);
  const props = {
    url,
    path,
    dir,
    name,
    hostname,
  };
  return str.replace(/\{(.+?)}/g, (text, key) => {
    if (key in props) {
      return encodeURIComponent(props[key as keyof typeof props]);
    }
    return text;
  });
}

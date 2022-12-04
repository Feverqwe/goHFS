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

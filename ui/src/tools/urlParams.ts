export function getUrlParams() {
  const params = new URLSearchParams(location.search.substr(1));
  const obj: Record<string, string | string[]> = {};
  params.forEach((value, name) => {
    if (name in obj) {
      let currentValue = obj[name];
      if (!Array.isArray(currentValue)) {
        currentValue = [currentValue];
        obj[name] = currentValue;
      }
      currentValue.push(value);
    } else {
      obj[name] = value;
    }
  });
  return obj;
}

export function changeUrlParams(changes: Record<string, string | string[]>) {
  const uri = new URL(location.href);
  const params = uri.searchParams;
  Object.entries(changes).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((value) => params.set(key, value));
    } else {
      params.set(key, value);
    }
  });
  history.replaceState(null, '', uri.toString());
}

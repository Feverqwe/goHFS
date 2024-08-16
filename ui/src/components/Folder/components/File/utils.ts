export function dateToStr(date: Date) {
  const dateStr = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((v) => (v < 10 ? '0' : '') + v)
    .join('-');
  const timeStr = [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((v) => (v < 10 ? '0' : '') + v)
    .join(':');
  return `${dateStr} ${timeStr}`;
}

export function getExtHandler<T>(extNames: string[], handlers: Record<string, T>) {
  for (let i = 0, len = extNames.length; i < len; i++) {
    const ext = extNames[i];
    const handler = handlers[ext];
    if (handler) {
      return handler;
    }
  }
}

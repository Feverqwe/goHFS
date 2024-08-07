export function dateToStr(date: Date) {
  const dateStr = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((v) => (v < 10 ? '0' : '') + v)
    .join('-');
  const timeStr = [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((v) => (v < 10 ? '0' : '') + v)
    .join(':');
  return `${dateStr} ${timeStr}`;
}

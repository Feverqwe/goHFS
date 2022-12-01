function once<T extends() => unknown>(callback: T) {
  let cb: undefined | T = callback;
  return () => {
    if (!cb) return;
    const c = cb;
    cb = undefined;
    return c();
  };
}

export default once;

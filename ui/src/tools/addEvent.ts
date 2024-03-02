function addEvent<T extends HTMLElement | Window>(
  target: T,
  on: (target: T['addEventListener']) => void,
  disposers?: Array<() => void>,
) {
  const events: Parameters<T['addEventListener']>[] = [];
  const vOn = (...args: Parameters<T['addEventListener']>) => {
    events.push(args);
  };
  on(vOn as T['addEventListener']);
  if (!events.length) {
    throw new Error('Listener is not set!');
  }
  events.forEach(([type, listener, options]) => {
    target.addEventListener(type, listener, options);
  });
  const disposer = () => {
    events.splice(0).forEach(([type, listener, options]) => {
      target.removeEventListener(type, listener, options);
    });
  };
  if (disposers) {
    disposers.push(disposer);
  }
  return disposer;
}

export default addEvent;

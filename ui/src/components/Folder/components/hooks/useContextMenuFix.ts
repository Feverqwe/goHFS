import {isIOS} from "../../utils";
import React, {useCallback, useRef} from "react";

const useContextMenuFix = <T>(callback: (e: T) => unknown) => {
  const refTimeoutId = useRef<number>();

  const touchStart = useCallback((e: unknown) => {
    refTimeoutId.current = window.setTimeout(() => {
      callback(e as T);
    }, 610);
  }, [callback]);

  const touchClear = useCallback(() => {
    clearTimeout(refTimeoutId.current);
  }, []);

  if (!isIOS()) return undefined;

  return {
    onTouchStart: touchStart,
    onTouchMove: touchClear,
    onTouchEnd: touchClear,
  };
}

export default useContextMenuFix;

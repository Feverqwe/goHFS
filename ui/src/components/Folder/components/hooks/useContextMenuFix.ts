import {isIOS} from "../../utils";
import React, {useCallback, useRef} from "react";

const useContextMenuFix = (callback: (e: React.MouseEvent) => void) => {
  if (!isIOS()) return undefined;

  const refTimeoutId = useRef<NodeJS.Timeout>();

  const touchStart = useCallback((e: any) => {
    refTimeoutId.current = setTimeout(() => {
      callback(e);
    }, 610);
  }, [callback]);

  const touchClear = useCallback(() => {
    clearTimeout(refTimeoutId.current);
  }, []);

  return {
    onTouchStart: touchStart,
    onTouchMove: touchClear,
    onTouchEnd: touchClear,
  };
}

export default useContextMenuFix;

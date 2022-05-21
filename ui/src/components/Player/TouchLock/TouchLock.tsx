import * as React from "react";
import "./TouchLock.less";
import addEvent from "../../../tools/addEvent";

interface TouchLockProps {
  onClick: () => void,
  isLock: boolean,
}

const TouchLock = React.memo(({onClick, isLock}: TouchLockProps) => {
  const [isVisible, setVisible] = React.useState(false);

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const onMove = (e: Event) => {
      setVisible(true);
      resetTimeout();
    };

    const disposer = addEvent(window, on => {
      on('touchmove', onMove, true);
      on('touchstart', onMove, true);
      on('mousemove', onMove, true);
      on('mouseover', onMove, true);
    });

    const resetTimeout = () => {
      timeoutId && clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setVisible(false);
      }, 3 * 1000);
    };

    return () => {
      disposer();
      timeoutId && clearTimeout(timeoutId);
    }
  }, []);

  const handleClick = React.useCallback(() => {
    onClick();
  }, []);

  let className = "touch-lock";
  if (isLock) {
    className += ' locked';
  }
  if (!isVisible) {
    className += ' invisible'
  }

  return (
    <div className={className} onClick={handleClick}>L</div>
  );
});

export default TouchLock;
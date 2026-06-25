import * as React from "react";

export function useStopWheelPropagation<T extends HTMLElement>() {
  const cleanup = React.useRef<(() => void) | null>(null);
  return React.useCallback((node: T | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (node) {
      const onWheel = (e: WheelEvent) => e.stopPropagation();
      node.addEventListener("wheel", onWheel);
      cleanup.current = () => node.removeEventListener("wheel", onWheel);
    }
  }, []);
}

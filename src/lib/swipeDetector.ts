export type SwipeDirection = "up" | "down" | "left" | "right";

export type SwipeEvent = {
  direction: SwipeDirection;
  distance: number;
};

type SwipeCallback = (payload: SwipeEvent) => void;

type Options = {
  shouldBlockScroll?: () => boolean;
};

export function createSwipeDetector(
  element: HTMLElement,
  callback: SwipeCallback,
  options?: Options,
) {
  let startX = 0;
  let startY = 0;
  let tracking = false;

  const handleStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;

    startX = touch.clientX;
    startY = touch.clientY;
    tracking = true;
  };

  const handleMove = (event: TouchEvent) => {
    if (!tracking) return;
    if (options?.shouldBlockScroll?.()) {
      event.preventDefault();
    }
  };

  const handleEnd = (event: TouchEvent) => {
    if (!tracking) return;
    tracking = false;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const distance = Math.max(absX, absY);

    const direction: SwipeDirection =
      absX > absY ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";

    callback({ direction, distance });
  };

  element.addEventListener("touchstart", handleStart);
  element.addEventListener("touchmove", handleMove, { passive: false });
  element.addEventListener("touchend", handleEnd);

  return () => {
    element.removeEventListener("touchstart", handleStart);
    element.removeEventListener("touchmove", handleMove);
    element.removeEventListener("touchend", handleEnd);
  };
}

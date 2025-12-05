export type SwipeDirection = "up" | "down" | "left" | "right";

export type SwipeEvent = {
  direction: SwipeDirection;
  distance: number;
};

type SwipeCallback = (payload: SwipeEvent) => void;

type Options = {
  shouldBlockScroll?: () => boolean;
  shouldHandleStart?: (event: TouchEvent | PointerEvent) => boolean;
};

export function createSwipeDetector(
  element: HTMLElement,
  callback: SwipeCallback,
  options?: Options,
) {
  let startX = 0;
  let startY = 0;
  let tracking = false;
  let activePointerId: number | null = null;

  const supportsPointer =
    typeof window !== "undefined" && "PointerEvent" in window;

  const handleStart = (event: TouchEvent) => {
    if (options?.shouldHandleStart && !options.shouldHandleStart(event)) {
      return;
    }
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

  const handlePointerStart = (event: PointerEvent) => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
    if (options?.shouldHandleStart && !options.shouldHandleStart(event)) {
      return;
    }
    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    tracking = true;
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (event.pointerId !== activePointerId) return;
    if (options?.shouldBlockScroll?.()) {
      event.preventDefault();
    }
  };

  const handlePointerEnd = (event: PointerEvent) => {
    if (event.pointerId !== activePointerId) return;
    activePointerId = null;
    if (!tracking) return;
    tracking = false;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const distance = Math.max(absX, absY);

    const direction: SwipeDirection =
      absX > absY ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";

    callback({ direction, distance });
  };

  // Attach both pointer and touch to survive iOS WebView quirks.
  element.addEventListener("touchstart", handleStart, { passive: true });
  element.addEventListener("touchmove", handleMove, { passive: false });
  element.addEventListener("touchend", handleEnd, { passive: true });
  element.addEventListener("touchcancel", handleEnd, { passive: true });

  if (supportsPointer) {
    element.addEventListener("pointerdown", handlePointerStart, {
      passive: true,
    });
    element.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    element.addEventListener("pointerup", handlePointerEnd, { passive: true });
    element.addEventListener("pointercancel", handlePointerEnd, {
      passive: true,
    });
  }

  return () => {
    element.removeEventListener("touchstart", handleStart);
    element.removeEventListener("touchmove", handleMove);
    element.removeEventListener("touchend", handleEnd);
    element.removeEventListener("touchcancel", handleEnd);
    if (supportsPointer) {
      element.removeEventListener("pointerdown", handlePointerStart);
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerup", handlePointerEnd);
      element.removeEventListener("pointercancel", handlePointerEnd);
    }
  };
}

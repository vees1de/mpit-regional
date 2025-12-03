import { directions, inBounds } from "./utils.js";
import { attemptSwap } from "./logic.js";

export function recordTouch(runtime, event) {
  const touch =
    event.touches?.[0] ??
    event.changedTouches?.[0] ??
    (event.pointerType === "touch" || event.pointerType === "pen"
      ? event
      : null);
  if (!touch) return;
  runtime.lastTouch = {
    clientX: touch.clientX,
    clientY: touch.clientY,
  };
}

export function handleSwipe(runtime, direction) {
  const delta = directions[direction];
  if (!delta) return false;
  if (!runtime.lastTouch) return false;

  const origin = pickCell(runtime, runtime.lastTouch);
  if (!origin) return false;

  return attemptSwap(runtime.state, origin, delta, runtime.settings);
}

function pickCell(runtime, point) {
  const { canvas, state } = runtime;
  const view = state.view;
  if (!canvas || !view) return null;

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const localX = (point.clientX - rect.left) * dpr;
  const localY = (point.clientY - rect.top) * dpr;

  const xOnBoard = (localX - view.offsetX) / view.cellSize;
  const yOnBoard = (localY - view.offsetY) / view.cellSize;

  const cellX = Math.floor(xOnBoard);
  const cellY = Math.floor(yOnBoard);

  if (!inBounds(cellX, cellY, view.boardSize)) return null;

  return { x: cellX, y: cellY };
}

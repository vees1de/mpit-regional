export const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function inBounds(x, y, size) {
  return x >= 0 && y >= 0 && x < size && y < size;
}

export function createRng(seed = Date.now()) {
  let t = seed >>> 0;
  return {
    next() {
      t += 0x6d2b79f5;
      let x = t;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    },
    seed,
  };
}

export function randomInt(rng, max) {
  return Math.floor(rng.next() * max);
}

export function createEmptyBoard(size, fill = -1) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => fill),
  );
}

export function cloneBoard(board) {
  return board.map((row) => row.slice());
}

export function computeView(canvas, size) {
  const width = canvas.width;
  const height = canvas.height;
  const boardPixels = Math.min(width, height);
  const offsetX = (width - boardPixels) / 2;
  const offsetY = (height - boardPixels) / 2;
  const cellSize = boardPixels / size;

  return {
    width,
    height,
    boardPixels,
    offsetX,
    offsetY,
    cellSize,
    boardSize: size,
  };
}

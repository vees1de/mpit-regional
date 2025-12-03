import {
  createEmptyBoard,
  createRng,
  inBounds,
  randomInt,
} from "./utils.js";

export function createInitialState(settings) {
  const rng = createRng(settings.seed ?? Date.now());
  const board = createBoard(settings.boardSize, settings.gemTypes, rng);

  return {
    board,
    score: 0,
    combo: 0,
    selectedCell: null,
    moving: false,
    animations: [],
    rng,
    view: null,
    lastTouch: null,
  };
}

export function createBoard(size, gemTypes, rng) {
  const board = createEmptyBoard(size, 0);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      board[y][x] = pickSafeGem(board, x, y, gemTypes, rng);
    }
  }

  return board;
}

function pickSafeGem(board, x, y, gemTypes, rng) {
  let candidate = 0;
  while (true) {
    candidate = randomInt(rng, gemTypes);
    if (formsMatch(board, x, y, candidate)) continue;
    return candidate;
  }
}

function formsMatch(board, x, y, value) {
  // Check horizontal left-left
  if (
    x >= 2 &&
    board[y][x - 1] === value &&
    board[y][x - 2] === value
  ) {
    return true;
  }

  // Check vertical up-up
  if (
    y >= 2 &&
    board[y - 1][x] === value &&
    board[y - 2][x] === value
  ) {
    return true;
  }

  return false;
}

export function swapCells(board, a, b) {
  const temp = board[a.y][a.x];
  board[a.y][a.x] = board[b.y][b.x];
  board[b.y][b.x] = temp;
}

export function setCell(board, x, y, value) {
  board[y][x] = value;
}

export function getCell(board, x, y) {
  return board[y][x];
}

export function withinBoard(point, size) {
  return inBounds(point.x, point.y, size);
}

import { inBounds, randomInt } from "./utils.js";
import { swapCells } from "./core.js";

export function findMatches(board) {
  const size = board.length;
  const matches = [];

  // Horizontal
  for (let y = 0; y < size; y++) {
    let x = 0;
    while (x < size) {
      const value = board[y][x];
      let run = 1;
      while (x + run < size && board[y][x + run] === value) {
        run++;
      }
      if (value >= 0 && run >= 3) {
        const cells = [];
        for (let i = 0; i < run; i++) {
          cells.push({ x: x + i, y });
        }
        matches.push({ cells, length: run });
      }
      x += run;
    }
  }

  // Vertical
  for (let x = 0; x < size; x++) {
    let y = 0;
    while (y < size) {
      const value = board[y][x];
      let run = 1;
      while (y + run < size && board[y + run][x] === value) {
        run++;
      }
      if (value >= 0 && run >= 3) {
        const cells = [];
        for (let i = 0; i < run; i++) {
          cells.push({ x, y: y + i });
        }
        matches.push({ cells, length: run });
      }
      y += run;
    }
  }

  return matches;
}

export function removeMatches(board, matches) {
  for (const match of matches) {
    for (const cell of match.cells) {
      board[cell.y][cell.x] = -1;
    }
  }
}

export function collapseBoard(board, gemTypes, rng) {
  const size = board.length;

  for (let x = 0; x < size; x++) {
    let writeRow = size - 1;

    for (let y = size - 1; y >= 0; y--) {
      const value = board[y][x];
      if (value >= 0) {
        board[writeRow][x] = value;
        if (writeRow !== y) {
          board[y][x] = -1;
        }
        writeRow--;
      }
    }

    for (let y = writeRow; y >= 0; y--) {
      board[y][x] = randomInt(rng, gemTypes);
    }
  }
}

export function scoreForMatch(length, scoreValues) {
  if (length >= 5) return scoreValues[5] ?? 50;
  if (length === 4) return scoreValues[4] ?? 20;
  return scoreValues[3] ?? 10;
}

export function scoreMatches(matches, scoreValues) {
  return matches.reduce(
    (sum, match) => sum + scoreForMatch(match.length, scoreValues),
    0,
  );
}

export function resolveBoard(state, settings) {
  const { board, rng } = state;
  let totalScore = 0;
  let chain = 0;
  let matched = false;

  while (true) {
    const matches = findMatches(board);
    if (!matches.length) break;

    matched = true;

    const baseScore = scoreMatches(matches, settings.scoreValues);
    const multiplier = 1 + chain * settings.comboStep;
    totalScore += Math.floor(baseScore * multiplier);

    removeMatches(board, matches);
    collapseBoard(board, settings.gemTypes, rng);
    chain++;
  }

  state.score += totalScore;
  state.combo = chain > 0 ? chain - 1 : 0;

  return { matched, totalScore, chain };
}

export function attemptSwap(state, source, delta, settings) {
  const size = state.board.length;
  const target = { x: source.x + delta.x, y: source.y + delta.y };

  if (!inBounds(target.x, target.y, size)) return false;
  if (state.moving) return false;

  state.moving = true;
  swapCells(state.board, source, target);

  const result = resolveBoard(state, settings);

  if (!result.matched) {
    swapCells(state.board, source, target);
    state.combo = 0;
    state.moving = false;
    return false;
  }

  state.moving = false;
  return true;
}

import { gameConfig, gameSettings } from "./config.js";

const PALETTE = [
  [0.91, 0.27, 0.34],
  [0.23, 0.59, 0.85],
  [0.99, 0.76, 0.36],
  [0.42, 0.85, 0.6],
  [0.74, 0.54, 0.92],
];

let runtime = null;

export function start(container, options = {}) {
  stop(container);

  const settings = { ...gameSettings, ...(options.settings ?? {}) };
  const state = createInitialState(settings);

  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  wrapper.style.width = "100%";
  wrapper.style.height = "100%";
  wrapper.style.background = "#0a0d12";
  wrapper.style.overflow = "hidden";

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  canvas.style.touchAction = "none";

  const hud = document.createElement("div");
  hud.style.position = "absolute";
  hud.style.top = "12px";
  hud.style.left = "12px";
  hud.style.padding = "8px 12px";
  hud.style.background = "rgba(0,0,0,0.35)";
  hud.style.color = "#f7f9fb";
  hud.style.fontFamily = "system-ui, -apple-system, sans-serif";
  hud.style.fontSize = "14px";
  hud.style.borderRadius = "10px";
  hud.style.backdropFilter = "blur(6px)";
  hud.style.pointerEvents = "none";
  hud.textContent = "Score: 0";

  wrapper.appendChild(canvas);
  wrapper.appendChild(hud);
  container.innerHTML = "";
  container.appendChild(wrapper);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    hud.textContent = "Canvas не поддерживается";
    return;
  }

  const animationResolvers = new Map();

  runtime = {
    container,
    wrapper,
    canvas,
    ctx,
    hud,
    settings,
    state,
    view: null,
    animations: [],
    animationResolvers,
    animId: 0,
    lastTime: performance.now(),
    frameId: null,
    lastTouch: null,
    busy: false,
    resizeHandler: null,
    pointerHandler: null,
  };

  const resize = () => resizeCanvas(runtime);
  runtime.resizeHandler = resize;
  window.addEventListener("resize", resize);
  resize();

  const onPointerDown = (event) => recordTouch(runtime, event);
  canvas.addEventListener("pointerdown", onPointerDown, { passive: true });
  runtime.pointerHandler = onPointerDown;

  const loop = (now) => {
    if (!runtime) return;
    runtime.lastTime = now;
    updateAnimations(runtime, now);
    render(runtime, now);
    runtime.frameId = requestAnimationFrame(loop);
  };

  render(runtime, performance.now());
  runtime.frameId = requestAnimationFrame(loop);
}

export function stop(container) {
  if (!runtime) return;

  if (runtime.frameId !== null) {
    cancelAnimationFrame(runtime.frameId);
  }

  window.removeEventListener("resize", runtime.resizeHandler);
  runtime.canvas.removeEventListener("pointerdown", runtime.pointerHandler);

  const host = container ?? runtime.container;
  if (host && runtime.wrapper && host.contains(runtime.wrapper)) {
    host.removeChild(runtime.wrapper);
  }

  runtime = null;
}

export function onSwipe(direction) {
  if (!runtime || runtime.busy) return;
  const delta = directionVectors[direction];
  if (!delta) return;

  const origin = runtime.lastTouch ? pickCell(runtime, runtime.lastTouch) : null;
  if (!origin) return;

  runtime.busy = true;
  void handleSwap(runtime, origin, delta).finally(() => {
    if (runtime) runtime.busy = false;
  });
}

export function getScore() {
  return runtime?.state?.score ?? 0;
}

async function handleSwap(rt, origin, delta) {
  const target = { x: origin.x + delta.x, y: origin.y + delta.y };
  if (!inBounds(target.x, target.y, rt.state.board.length)) return;
  if (rt.state.moving) return;

  rt.state.moving = true;

  try {
    const board = rt.state.board;

    swapCells(board, origin, target);
    await playAnimation(rt, createSwapAnimation(origin, target));

    let matches = findMatches(board);
    if (!matches.length) {
      swapCells(board, origin, target);
      await playAnimation(rt, createSwapAnimation(origin, target));
      rt.state.combo = 0;
      return;
    }

    rt.state.chain = 0;
    await resolveMatches(rt, matches);
  } finally {
    rt.state.moving = false;
  }
}

async function resolveMatches(rt, matches) {
  const { state, settings } = rt;

  await playAnimation(rt, createClearAnimation(matches));

  const baseScore = scoreMatches(matches, settings.scoreValues);
  const multiplier = 1 + (state.chain ?? 0) * settings.comboStep;
  state.score += Math.floor(baseScore * multiplier);
  state.combo = state.chain ?? 0;
  state.chain = (state.chain ?? 0) + 1;

  removeMatches(state.board, matches);
  const moves = collapseBoardWithMoves(state.board, settings.gemTypes, state.rng);
  if (moves.length) {
    await playAnimation(rt, createFallAnimation(moves));
  }

  matches = findMatches(state.board);
  if (matches.length) {
    await resolveMatches(rt, matches);
  } else {
    state.chain = 0;
  }
}

function createSwapAnimation(a, b) {
  return {
    type: "swap",
    duration: 200,
    cells: [
      { x: a.x, y: a.y, from: { x: b.x, y: b.y } },
      { x: b.x, y: b.y, from: { x: a.x, y: a.y } },
    ],
  };
}

function createClearAnimation(matches) {
  const cells = matches.flatMap((m) => m.cells.map((c) => ({ ...c })));
  return {
    type: "clear",
    duration: 220,
    cells,
  };
}

function createFallAnimation(moves) {
  let maxDelay = 0;
  return {
    type: "fall",
    duration: 400,
    entries: moves.map((move) => {
      const delay = Math.max(0, (move.to.y - move.from.y) * 18);
      maxDelay = Math.max(maxDelay, delay);
      return {
        x: move.to.x,
        y: move.to.y,
        fromY: move.from.y,
        delay,
      };
    }),
    extraTime: maxDelay,
  };
}

function playAnimation(rt, animation) {
  const id = ++rt.animId;
  const full = { ...animation, id, start: performance.now() };
  rt.animations.push(full);
  return new Promise((resolve) => {
    rt.animationResolvers.set(id, resolve);
  });
}

function updateAnimations(rt, now) {
  const keep = [];
  for (const anim of rt.animations) {
    const elapsed = now - anim.start;
    if (elapsed >= anim.duration + (anim.extraTime ?? 0)) {
      const resolver = rt.animationResolvers.get(anim.id);
      if (resolver) resolver();
      rt.animationResolvers.delete(anim.id);
      continue;
    }
    keep.push(anim);
  }
  rt.animations = keep;
}

function render(rt, now) {
  const { canvas, ctx, state } = rt;
  const view = computeView(canvas, state.board.length);
  rt.view = view;
  state.view = view;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0b1221");
  gradient.addColorStop(1, "#081019");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawBoard(ctx, state.board, view, rt.animations, now);
  updateHud(rt);
}

function drawBoard(ctx, board, view, animations, now) {
  const padding = view.cellSize * 0.12;
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);

  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const value = board[y][x];
      if (value < 0) continue;

      const transform = getTransform(x, y, view.cellSize, animations, now);
      const px = x * view.cellSize + padding + transform.offsetX;
      const py = y * view.cellSize + padding + transform.offsetY;
      const size = view.cellSize - padding * 2;

      ctx.save();
      ctx.translate(px + size / 2, py + size / 2);
      ctx.scale(transform.scale, transform.scale);
      ctx.globalAlpha = transform.alpha;
      ctx.translate(-size / 2, -size / 2);

      const color = PALETTE[value % PALETTE.length];
      const gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, toRgb(color, 0.95));
      gradient.addColorStop(1, toRgb(color, 0.75));
      ctx.fillStyle = gradient;

      drawRoundedRect(ctx, 0, 0, size, size, size * 0.22);

      ctx.globalAlpha = 0.25 * transform.alpha;
      ctx.fillStyle = "#ffffff";
      drawRoundedRect(ctx, size * 0.16, size * 0.14, size * 0.7, size * 0.25, size * 0.14);

      ctx.restore();
    }
  }

  ctx.restore();
}

function getTransform(x, y, cellSize, animations, now) {
  let offsetX = 0;
  let offsetY = 0;
  let alpha = 1;
  let scale = 1;

  for (const anim of animations) {
    const elapsed = now - anim.start;
    const t = Math.min(1, Math.max(0, elapsed / anim.duration));
    const ease = easeOutCubic(t);

    if (anim.type === "swap") {
      const cell = anim.cells.find((c) => c.x === x && c.y === y);
      if (cell) {
        offsetX += (cell.from.x - cell.x) * cellSize * (1 - ease);
        offsetY += (cell.from.y - cell.y) * cellSize * (1 - ease);
      }
    } else if (anim.type === "clear") {
      const cell = anim.cells.find((c) => c.x === x && c.y === y);
      if (cell) {
        alpha *= 1 - ease;
        scale *= 1 - 0.4 * ease;
      }
    } else if (anim.type === "fall") {
      const entry = anim.entries.find((c) => c.x === x && c.y === y);
      if (entry) {
        const localElapsed = Math.max(0, elapsed - (entry.delay ?? 0));
        const localT = Math.min(1, localElapsed / anim.duration);
        const localEase = easeOutCubic(localT);
        offsetY += (entry.fromY - entry.y) * cellSize * (1 - localEase);
      }
    }
  }

  return { offsetX, offsetY, alpha, scale };
}

function updateHud(rt) {
  const { hud, state } = rt;
  const comboText = state.combo ? ` · Комбо x${state.combo + 1}` : "";
  hud.textContent = `Score: ${state.score}${comboText}`;
}

function resizeCanvas(rt) {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rt.canvas.clientWidth * dpr));
  const height = Math.max(1, Math.floor(rt.canvas.clientHeight * dpr));
  if (rt.canvas.width !== width || rt.canvas.height !== height) {
    rt.canvas.width = width;
    rt.canvas.height = height;
  }
}

function recordTouch(rt, event) {
  const point =
    event.touches?.[0] ??
    event.changedTouches?.[0] ??
    (event.pointerType === "touch" || event.pointerType === "pen" ? event : null);
  if (!point) return;
  rt.lastTouch = { clientX: point.clientX, clientY: point.clientY };
}

function pickCell(rt, point) {
  const view = rt.view;
  if (!view) return null;

  const rect = rt.canvas.getBoundingClientRect();
  const localX = point.clientX - rect.left - view.offsetX;
  const localY = point.clientY - rect.top - view.offsetY;

  const xOnBoard = localX / view.cellSize;
  const yOnBoard = localY / view.cellSize;

  const cellX = Math.floor(xOnBoard);
  const cellY = Math.floor(yOnBoard);

  if (!inBounds(cellX, cellY, view.boardSize)) return null;
  return { x: cellX, y: cellY };
}

function computeView(canvas, size) {
  const width = canvas.width;
  const height = canvas.height;
  const boardPixels = Math.min(width, height) * 0.9;
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

function createInitialState(settings) {
  const rng = createRng(settings.seed ?? Date.now());
  const board = createBoard(settings.boardSize, settings.gemTypes, rng);

  return {
    board,
    score: 0,
    combo: 0,
    chain: 0,
    rng,
    moving: false,
    view: null,
  };
}

function createBoard(size, gemTypes, rng) {
  const board = Array.from({ length: size }, () => Array.from({ length: size }, () => -1));

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
  if (
    x >= 2 &&
    board[y][x - 1] === value &&
    board[y][x - 2] === value
  ) {
    return true;
  }

  if (
    y >= 2 &&
    board[y - 1][x] === value &&
    board[y - 2][x] === value
  ) {
    return true;
  }

  return false;
}

function findMatches(board) {
  const size = board.length;
  const matches = [];

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

function removeMatches(board, matches) {
  for (const match of matches) {
    for (const cell of match.cells) {
      board[cell.y][cell.x] = -1;
    }
  }
}

function collapseBoardWithMoves(board, gemTypes, rng) {
  const size = board.length;
  const moves = [];

  for (let x = 0; x < size; x++) {
    let writeRow = size - 1;

    for (let y = size - 1; y >= 0; y--) {
      const value = board[y][x];
      if (value >= 0) {
        if (writeRow !== y) {
          moves.push({
            from: { x, y },
            to: { x, y: writeRow },
            value,
            spawn: false,
          });
        }
        board[writeRow][x] = value;
        if (writeRow !== y) {
          board[y][x] = -1;
        }
        writeRow--;
      }
    }

    let spawnFrom = 1;
    for (let y = writeRow; y >= 0; y--) {
      const value = randomInt(rng, gemTypes);
      board[y][x] = value;
      moves.push({
        from: { x, y: -spawnFrom },
        to: { x, y },
        value,
        spawn: true,
      });
      spawnFrom++;
    }
  }

  return moves;
}

function scoreForMatch(length, scoreValues) {
  if (length >= 5) return scoreValues[5] ?? 50;
  if (length === 4) return scoreValues[4] ?? 20;
  return scoreValues[3] ?? 10;
}

function scoreMatches(matches, scoreValues) {
  return matches.reduce(
    (sum, match) => sum + scoreForMatch(match.length, scoreValues),
    0,
  );
}

function createRng(seed = Date.now()) {
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

function randomInt(rng, max) {
  return Math.floor(rng.next() * max);
}

function swapCells(board, a, b) {
  const temp = board[a.y][a.x];
  board[a.y][a.x] = board[b.y][b.x];
  board[b.y][b.x] = temp;
}

function inBounds(x, y, size) {
  return x >= 0 && y >= 0 && x < size && y < size;
}

function easeOutCubic(t) {
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

function toRgb(color, multiplier = 1) {
  const r = Math.min(255, Math.round(color[0] * 255 * multiplier));
  const g = Math.min(255, Math.round(color[1] * 255 * multiplier));
  const b = Math.min(255, Math.round(color[2] * 255 * multiplier));
  return `rgb(${r}, ${g}, ${b})`;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, Math.min(width, height) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

const directionVectors = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export { gameConfig };

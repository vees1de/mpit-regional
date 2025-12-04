const GRID_SIZE = 4;
const SPAWN_VALUES = [2, 2, 2, 4];

export const gameConfig = {
  id: "mini-2048",
  name: "Mini 2048",
  handlesSwipe: true,
  swipeDirections: ["left", "right", "up", "down"],
};

let runtime = null;

export function start(container) {
  stop(container);

  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  wrapper.style.width = "100%";
  wrapper.style.height = "100%";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "flex-start";
  wrapper.style.background =
    "radial-gradient(circle at 20% 20%, #243447, #0c0f14)";
  wrapper.style.color = "#f7f7f7";
  wrapper.style.padding = "18px 14px";
  wrapper.style.boxSizing = "border-box";
  wrapper.style.gap = "12px";
  wrapper.style.fontFamily = "system-ui, -apple-system, sans-serif";

  const title = document.createElement("div");
  title.textContent = "Mini 2048";
  title.style.fontSize = "20px";
  title.style.fontWeight = "700";
  title.style.letterSpacing = "0.02em";

  const subtitle = document.createElement("div");
  subtitle.textContent = "Собери плитки свайпами или стрелками";
  subtitle.style.opacity = "0.85";
  subtitle.style.fontSize = "14px";
  subtitle.style.textAlign = "center";

  const board = document.createElement("div");
  board.style.width = "min(340px, 92vw)";
  board.style.aspectRatio = "1 / 1";
  board.style.display = "grid";
  board.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
  board.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;
  board.style.gap = "10px";
  board.style.background = "#1a222d";
  board.style.padding = "12px";
  board.style.borderRadius = "18px";
  board.style.boxShadow = "0 12px 50px rgba(0,0,0,0.35) inset";
  board.style.touchAction = "none";

  const status = document.createElement("div");
  status.style.display = "flex";
  status.style.gap = "12px";
  status.style.alignItems = "center";
  status.style.justifyContent = "center";

  const scoreBox = document.createElement("div");
  scoreBox.style.background = "rgba(255,255,255,0.08)";
  scoreBox.style.padding = "10px 12px";
  scoreBox.style.borderRadius = "12px";
  scoreBox.style.minWidth = "110px";
  scoreBox.style.textAlign = "center";
  scoreBox.style.fontWeight = "700";
  scoreBox.style.fontSize = "16px";
  scoreBox.textContent = "Счёт: 0";

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.textContent = "Заново";
  resetButton.style.background = "#1f8efa";
  resetButton.style.color = "white";
  resetButton.style.border = "none";
  resetButton.style.borderRadius = "10px";
  resetButton.style.padding = "10px 14px";
  resetButton.style.fontWeight = "700";
  resetButton.style.fontSize = "14px";
  resetButton.style.cursor = "pointer";

  status.appendChild(scoreBox);
  status.appendChild(resetButton);

  const controlsHint = document.createElement("div");
  controlsHint.textContent = "Свайпы или ← ↑ → ↓";
  controlsHint.style.fontSize = "13px";
  controlsHint.style.opacity = "0.8";

  const cells = [];
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const cell = document.createElement("div");
    cell.style.display = "flex";
    cell.style.alignItems = "center";
    cell.style.justifyContent = "center";
    cell.style.borderRadius = "12px";
    cell.style.background = "rgba(255,255,255,0.04)";
    cell.style.fontWeight = "800";
    cell.style.fontSize = "20px";
    cell.style.transition = "all 0.14s ease";
    cell.style.userSelect = "none";
    cells.push(cell);
    board.appendChild(cell);
  }

  container.innerHTML = "";
  container.appendChild(wrapper);
  wrapper.appendChild(title);
  wrapper.appendChild(subtitle);
  wrapper.appendChild(board);
  wrapper.appendChild(status);
  wrapper.appendChild(controlsHint);

  const keyHandler = (event) => {
    const map = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      a: "left",
      d: "right",
      w: "up",
      s: "down",
    };
    const direction = map[event.key];
    if (!direction) return;
    event.preventDefault();
    handleMove(direction);
  };

  const grid = createEmptyGrid();
  addRandomTile(grid);
  addRandomTile(grid);

  runtime = {
    container,
    wrapper,
    board,
    cells,
    grid,
    score: 0,
    scoreBox,
    keyHandler,
  };

  resetButton.onclick = () => resetGame();
  window.addEventListener("keydown", keyHandler);

  render();
}

export function stop(container) {
  if (runtime) {
    window.removeEventListener("keydown", runtime.keyHandler);
    if (runtime.wrapper && runtime.container.contains(runtime.wrapper)) {
      runtime.container.removeChild(runtime.wrapper);
    }
    runtime = null;
  }

  if (container) {
    container.innerHTML = "";
  }
}

export function onSwipe(direction) {
  handleMove(direction);
}

function resetGame() {
  if (!runtime) return;
  const overlay = runtime.wrapper.querySelector(".mini-2048-overlay");
  if (overlay) overlay.remove();
  runtime.grid = createEmptyGrid();
  runtime.score = 0;
  addRandomTile(runtime.grid);
  addRandomTile(runtime.grid);
  render();
}

function handleMove(direction) {
  if (!runtime) return;

  const result = performMove(runtime.grid, direction);
  if (!result.moved) return;

  runtime.grid = result.grid;
  runtime.score += result.scoreGain;
  addRandomTile(runtime.grid);
  render();

  if (isGameOver(runtime.grid)) {
    showGameOver();
  }
}

function render() {
  if (!runtime) return;
  runtime.scoreBox.textContent = `Счёт: ${runtime.score}`;

  runtime.grid.flat().forEach((value, index) => {
    const cell = runtime.cells[index];
    cell.textContent = value ? String(value) : "";
    const intensity = value ? Math.min(Math.log2(value) / 11, 1) : 0;
    const hue = 35 + Math.min(Math.log2(value || 2) * 12, 120);
    cell.style.background = value
      ? `linear-gradient(135deg, hsla(${hue}, 80%, ${70 - intensity * 25}%, 0.95), hsla(${hue + 12}, 90%, ${60 - intensity * 22}%, 0.9))`
      : "rgba(255,255,255,0.04)";
    cell.style.color = value ? "#0a0a0a" : "#cbd5e1";
    cell.style.transform = value ? "scale(1.04)" : "scale(1)";
  });
}

function showGameOver() {
  if (!runtime) return;
  const overlay = document.createElement("div");
  overlay.className = "mini-2048-overlay";
  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.background = "rgba(0,0,0,0.65)";
  overlay.style.color = "#fff";
  overlay.style.fontSize = "20px";
  overlay.style.fontWeight = "800";
  overlay.style.backdropFilter = "blur(4px)";
  overlay.style.gap = "8px";
  overlay.textContent = "Игра окончена";

  const retry = document.createElement("button");
  retry.type = "button";
  retry.textContent = "Попробовать снова";
  retry.style.background = "#0bcf83";
  retry.style.color = "#0b1c0f";
  retry.style.border = "none";
  retry.style.borderRadius = "12px";
  retry.style.padding = "12px 16px";
  retry.style.fontWeight = "800";
  retry.style.cursor = "pointer";

  retry.onclick = () => {
    if (!runtime) return;
    runtime.wrapper.removeChild(overlay);
    resetGame();
  };

  overlay.appendChild(retry);
  runtime.wrapper.appendChild(overlay);
}

function createEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function addRandomTile(grid) {
  const empty = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] === 0) empty.push({ x, y });
    }
  }
  if (!empty.length) return;
  const spot = empty[Math.floor(Math.random() * empty.length)];
  const value = SPAWN_VALUES[Math.floor(Math.random() * SPAWN_VALUES.length)];
  grid[spot.y][spot.x] = value;
}

function performMove(grid, direction) {
  let moved = false;
  let scoreGain = 0;
  const nextGrid = createEmptyGrid();

  const applyLine = (line, setter) => {
    const { line: merged, score } = mergeLine(line);
    scoreGain += score;
    setter(merged);
    if (!moved && !arraysEqual(line, merged)) {
      moved = true;
    }
  };

  if (direction === "left" || direction === "right") {
    for (let y = 0; y < GRID_SIZE; y++) {
      const row = [...grid[y]];
      const line = direction === "left" ? row : [...row].reverse();
      applyLine(line, (merged) => {
        nextGrid[y] = direction === "left" ? merged : [...merged].reverse();
      });
    }
  } else if (direction === "up" || direction === "down") {
    for (let x = 0; x < GRID_SIZE; x++) {
      const column = [];
      for (let y = 0; y < GRID_SIZE; y++) column.push(grid[y][x]);
      const line = direction === "up" ? column : [...column].reverse();
      applyLine(line, (merged) => {
        for (let y = 0; y < GRID_SIZE; y++) {
          nextGrid[y][x] =
            direction === "up" ? merged[y] : merged[GRID_SIZE - y - 1];
        }
      });
    }
  }

  return { moved, scoreGain, grid: moved ? nextGrid : grid };
}

function mergeLine(line) {
  const filtered = line.filter((v) => v !== 0);
  const merged = [];
  let score = 0;

  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      const value = filtered[i] * 2;
      merged.push(value);
      score += value;
      i++;
    } else {
      merged.push(filtered[i]);
    }
  }

  while (merged.length < GRID_SIZE) merged.push(0);
  return { line: merged, score };
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function isGameOver(grid) {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] === 0) return false;
      if (x < GRID_SIZE - 1 && grid[y][x] === grid[y][x + 1]) return false;
      if (y < GRID_SIZE - 1 && grid[y][x] === grid[y + 1][x]) return false;
    }
  }
  return true;
}

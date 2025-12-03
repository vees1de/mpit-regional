import { gameConfig, gameSettings } from "./config.js";
import { createInitialState } from "./engine/core.js";
import { createRenderer } from "./engine/render.js";
import { handleSwipe, recordTouch } from "./engine/input.js";

let runtime = null;

export function start(container, options = {}) {
  stop(container);

  const settings = { ...gameSettings, ...(options.settings ?? {}) };
  const onScoreChange =
    typeof options.onScoreChange === "function" ? options.onScoreChange : null;
  const state = createInitialState(settings);

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";

  const hud = document.createElement("div");
  hud.style.position = "absolute";
  hud.style.top = "12px";
  hud.style.left = "12px";
  hud.style.padding = "8px 12px";
  hud.style.background = "rgba(0,0,0,0.35)";
  hud.style.color = "white";
  hud.style.fontFamily = "system-ui, -apple-system, sans-serif";
  hud.style.fontSize = "14px";
  hud.style.borderRadius = "10px";
  hud.style.backdropFilter = "blur(6px)";
  hud.style.pointerEvents = "none";
  hud.textContent = "Score: 0";

  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  wrapper.style.width = "100%";
  wrapper.style.height = "100%";
  wrapper.style.touchAction = "none";
  wrapper.appendChild(canvas);
  wrapper.appendChild(hud);

  container.innerHTML = "";
  container.appendChild(wrapper);

  const renderer = createRenderer(canvas, state, settings, hud);

  runtime = {
    container,
    wrapper,
    canvas,
    hud,
    renderer,
    state,
    settings,
    frameId: null,
    lastTouch: null,
    lastScore: state.score,
    onScoreChange,
    animState: {
      start: performance.now(),
      duration: 420,
      delayPerRow: 35,
    },
    listeners: { onResize: null, onTouchStart: null },
  };

  const onResize = () => {
    renderer.render();
  };

  const onTouchStart = (event) => {
    recordTouch(runtime, event);
  };

  runtime.listeners.onResize = onResize;
  runtime.listeners.onTouchStart = onTouchStart;

  window.addEventListener("resize", onResize);
  wrapper.addEventListener("touchstart", onTouchStart, { passive: true });

  // Initial render to compute view
  renderer.render();
  if (runtime.onScoreChange) {
    runtime.onScoreChange(state.score);
  }

  const loop = (timestamp) => {
    if (!runtime) return;
    renderer.render(timestamp, undefined, runtime.animState);
    if (
      runtime.animState &&
      timestamp - runtime.animState.start >
        (runtime.animState.duration ?? 420) +
          settings.boardSize * (runtime.animState.delayPerRow ?? 35)
    ) {
      runtime.animState = null;
    }
    if (
      runtime.onScoreChange &&
      runtime.state.score !== runtime.lastScore
    ) {
      runtime.lastScore = runtime.state.score;
      runtime.onScoreChange(runtime.state.score);
    }
    runtime.frameId = requestAnimationFrame(loop);
  };
  runtime.frameId = requestAnimationFrame(loop);
}

export function stop(container) {
  if (!runtime) return;

  if (runtime.frameId !== null) {
    cancelAnimationFrame(runtime.frameId);
  }

  window.removeEventListener("resize", runtime.listeners.onResize);
  runtime.wrapper.removeEventListener("touchstart", runtime.listeners.onTouchStart);

  const host = runtime.container;
  if (host?.contains(runtime.wrapper)) {
    host.removeChild(runtime.wrapper);
  }
  if (host) {
    host.innerHTML = "";
  }

  runtime = null;
}

export function onSwipe(direction) {
  if (!runtime) return;
  if (!runtime.state.view) {
    runtime.renderer.render();
  }
  const changed = handleSwipe(runtime, direction);
  if (changed) {
    runtime.animState = {
      start: performance.now(),
      duration: 420,
      delayPerRow: 35,
    };
  }
}

export function getScore() {
  return runtime?.state?.score ?? 0;
}

export { gameConfig };

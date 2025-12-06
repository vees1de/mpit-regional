// /public/games/knife-spin/index.js
// Ultra-casual Knife Hit-style mini game
// Contract: export start(canvasElement), stop(canvasElement)
// WebGL1, без сторонних библиотек

let state = null;

function createInitialState(
  canvas,
  gl,
  program,
  buffer,
  attribs,
  uniforms,
  loseExt
) {
  return {
    canvas,
    gl,
    program,
    buffer,
    attribs,
    uniforms,
    loseExt,
    rafId: null,

    // Game state
    running: true,
    lastTime: 0,
    logAngle: 0, // текущий угол бревна (рад)
    logRotationSpeed: 1.4, // рад/с
    logRadius: 0.35,
    logCenter: { x: 0.0, y: 0.1 },

    knivesToWin: 8,
    knivesHit: 0,
    minAngleGap: (15 * Math.PI) / 180, // минимальный угол между ножами

    // Ножи, уже зафиксированные в бревне (локальные углы относительно бревна)
    stuckKnives: [],

    // Препятствия на бревне (локальные углы + половина углового размера)
    obstacles: generateObstacles(),

    // Текущий летящий нож
    activeKnife: {
      y: -1.1,
      speed: 1.9, // скорость вверх
      flying: false,
    },

    // Состояние игры
    gameOver: false,
    gameOverTimer: 0,
    flashTimer: 0, // вспышка при успехе/ошибке (сек)

    // input
    pointerDown: false,
    touchStartPos: null,
    touchLastPos: null,

    // handlers чтобы потом удалить
    handlers: {},
  };
}

function generateObstacles() {
  // Простая схема: 2–3 препятствия вокруг бревна
  const count = 1 + (Math.random() < 0.5 ? 1 : 0); // 1 или 2
  const result = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const halfSize = (18 * Math.PI) / 180; // 18°
    result.push({ angle, halfSize });
  }
  return result;
}

function normalizeAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/* ---------- WebGL init ---------- */

function createShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vsSrc, fsSrc) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

function initWebGL(canvas) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: true,
    preserveDrawingBuffer: false,
  });
  if (!gl) {
    console.warn("WebGL not supported");
    return null;
  }

  const vsSrc = `
    attribute vec2 aPosition;
    attribute vec3 aColor;
    varying vec3 vColor;
    uniform float uAspect;
    void main() {
      vec2 p = aPosition;
      p.x *= uAspect;
      gl_Position = vec4(p, 0.0, 1.0);
      vColor = aColor;
    }
  `;

  const fsSrc = `
    precision mediump float;
    varying vec3 vColor;
    uniform float uFlash;
    void main() {
      vec3 c = vColor;
      c = mix(c, vec3(1.0, 1.0, 1.0), uFlash);
      gl_FragColor = vec4(c, 1.0);
    }
  `;

  const program = createProgram(gl, vsSrc, fsSrc);
  if (!program) return null;

  const buffer = gl.createBuffer();

  const attribs = {
    aPosition: gl.getAttribLocation(program, "aPosition"),
    aColor: gl.getAttribLocation(program, "aColor"),
  };

  const uniforms = {
    uAspect: gl.getUniformLocation(program, "uAspect"),
    uFlash: gl.getUniformLocation(program, "uFlash"),
  };

  const loseExt = gl.getExtension("WEBGL_lose_context") || null;

  return { gl, program, buffer, attribs, uniforms, loseExt };
}

/* ---------- Geometry helpers ---------- */

function pushRect(vertices, cx, cy, w, h, angle, color) {
  const hw = w / 2;
  const hh = h / 2;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  function rotate(x, y) {
    return {
      x: cx + x * cos - y * sin,
      y: cy + x * sin + y * cos,
    };
  }

  const c1 = rotate(-hw, -hh);
  const c2 = rotate(hw, -hh);
  const c3 = rotate(hw, hh);
  const c4 = rotate(-hw, hh);

  const { r, g, b } = color;

  // два треугольника
  vertices.push(
    c1.x,
    c1.y,
    r,
    g,
    b,
    c2.x,
    c2.y,
    r,
    g,
    b,
    c3.x,
    c3.y,
    r,
    g,
    b,

    c1.x,
    c1.y,
    r,
    g,
    b,
    c3.x,
    c3.y,
    r,
    g,
    b,
    c4.x,
    c4.y,
    r,
    g,
    b
  );
}

function pushCircle(vertices, cx, cy, radius, segments, color) {
  const { r, g, b } = color;
  let prevX = cx + radius;
  let prevY = cy;
  for (let i = 1; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = cx + Math.cos(theta) * radius;
    const y = cy + Math.sin(theta) * radius;

    vertices.push(cx, cy, r, g, b, prevX, prevY, r, g, b, x, y, r, g, b);

    prevX = x;
    prevY = y;
  }
}

/* ---------- Game update & render ---------- */

function updateGame(dt) {
  const s = state;
  if (!s || !s.running) return;

  if (s.gameOver) {
    s.gameOverTimer -= dt;
    s.flashTimer = Math.max(s.flashTimer - dt, 0);
    if (s.gameOverTimer <= 0) {
      resetGame();
    }
    return;
  }

  // вращаем бревно
  s.logAngle += s.logRotationSpeed * dt;
  s.logAngle = normalizeAngle(s.logAngle);

  // летящий нож
  const knife = s.activeKnife;
  if (knife.flying) {
    knife.y += knife.speed * dt;

    // достигли бревна?
    const hitY = s.logCenter.y - s.logRadius;
    if (knife.y >= hitY) {
      // проверка столкновения
      const impactWorldAngle = -Math.PI / 2; // снизу вверх
      const collide = checkCollision(impactWorldAngle);

      if (collide) {
        // проигрыш
        s.gameOver = true;
        s.gameOverTimer = 0.6;
        s.flashTimer = 0.25;
      } else {
        // успех — фиксируем нож
        const localAngle = normalizeAngle(impactWorldAngle - s.logAngle);
        s.stuckKnives.push({ angle: localAngle });
        s.knivesHit += 1;
        s.flashTimer = 0.15;

        // чуть ускоряем вращение
        s.logRotationSpeed *= Math.random() < 0.5 ? 1.05 : 1.08;
        if (Math.random() < 0.3) s.logRotationSpeed *= -1; // иногда меняем направление

        // новый летящий нож
        knife.y = -1.1;
        knife.flying = false;

        // победа?
        if (s.knivesHit >= s.knivesToWin) {
          s.gameOver = true;
          s.gameOverTimer = 0.6;
          s.flashTimer = 0.35;
        }
      }
    }
  }

  // гасим вспышку
  s.flashTimer = Math.max(s.flashTimer - dt, 0);
}

function checkCollision(impactWorldAngle) {
  const s = state;

  // проверка с уже вонзёнными ножами
  for (let i = 0; i < s.stuckKnives.length; i++) {
    const knife = s.stuckKnives[i];
    const worldAngle = normalizeAngle(knife.angle + s.logAngle);
    const diff = Math.abs(normalizeAngle(worldAngle - impactWorldAngle));
    if (diff < s.minAngleGap) return true;
  }

  // проверка с препятствиями
  for (let i = 0; i < s.obstacles.length; i++) {
    const obs = s.obstacles[i];
    const worldAngle = normalizeAngle(obs.angle + s.logAngle);
    const diff = Math.abs(normalizeAngle(worldAngle - impactWorldAngle));
    if (diff < obs.halfSize) return true;
  }

  return false;
}

function resetGame() {
  if (!state) return;

  state.logAngle = 0;
  state.logRotationSpeed = 1.4 + Math.random() * 0.5;
  state.knivesHit = 0;
  state.stuckKnives = [];
  state.obstacles = generateObstacles();
  state.activeKnife.y = -1.1;
  state.activeKnife.flying = false;
  state.gameOver = false;
  state.flashTimer = 0;
  state.gameOverTimer = 0;
}

function renderGame() {
  const s = state;
  if (!s) return;
  const { gl, program, buffer, attribs, uniforms } = s;
  const canvas = s.canvas;

  // resize под DPR
  const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
  const displayWidth = (canvas.clientWidth || canvas.width) * dpr;
  const displayHeight = (canvas.clientHeight || canvas.height) * dpr;
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.clearColor(0.04, 0.04, 0.07, 1.0); // фон
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  const aspect = canvas.height / canvas.width;
  gl.uniform1f(uniforms.uAspect, aspect);
  gl.uniform1f(
    uniforms.uFlash,
    s.flashTimer > 0 ? Math.min(s.flashTimer * 4.0, 1.0) : 0.0
  );

  gl.enableVertexAttribArray(attribs.aPosition);
  gl.enableVertexAttribArray(attribs.aColor);
  const stride = 5 * 4; // 5 float * 4 bytes
  gl.vertexAttribPointer(attribs.aPosition, 2, gl.FLOAT, false, stride, 0);
  gl.vertexAttribPointer(attribs.aColor, 3, gl.FLOAT, false, stride, 2 * 4);

  const vertices = [];

  // фон снизу как "пол"
  pushRect(vertices, 0, -1.1, 2.4, 0.4, 0, { r: 0.06, g: 0.06, b: 0.12 });

  // бревно
  pushCircle(vertices, s.logCenter.x, s.logCenter.y, s.logRadius, 32, {
    r: 0.45,
    g: 0.3,
    b: 0.15,
  });

  // препятствия на окружности
  const obsRadius = s.logRadius + 0.02;
  for (let i = 0; i < s.obstacles.length; i++) {
    const obs = s.obstacles[i];
    const worldAngle = obs.angle + s.logAngle;
    const cx = s.logCenter.x + Math.cos(worldAngle) * obsRadius;
    const cy = s.logCenter.y + Math.sin(worldAngle) * obsRadius;
    pushRect(vertices, cx, cy, 0.08, 0.04, worldAngle, {
      r: 0.9,
      g: 0.2,
      b: 0.2,
    });
  }

  // вонзённые ножи
  const knifeLen = 0.35;
  const knifeWidth = 0.04;
  const knifeRadius = s.logRadius + knifeLen * 0.5;
  for (let i = 0; i < s.stuckKnives.length; i++) {
    const kn = s.stuckKnives[i];
    const worldAngle = kn.angle + s.logAngle;
    const cx = s.logCenter.x + Math.cos(worldAngle) * knifeRadius;
    const cy = s.logCenter.y + Math.sin(worldAngle) * knifeRadius;
    pushRect(vertices, cx, cy, knifeWidth, knifeLen, worldAngle, {
      r: 0.95,
      g: 0.95,
      b: 0.95,
    });
  }

  // летящий нож
  const active = s.activeKnife;
  if (!s.gameOver) {
    pushRect(vertices, 0, active.y, knifeWidth, knifeLen, 0, {
      r: 0.95,
      g: 0.95,
      b: 0.95,
    });
  }

  // Информационная "полоска" сверху (простая HUD)
  // цель
  const barY = 0.95;
  const totalWidth = 1.2;
  const step = totalWidth / s.knivesToWin;
  const startX = -totalWidth / 2;
  for (let i = 0; i < s.knivesToWin; i++) {
    const filled = i < s.knivesHit;
    const cx = startX + step * (i + 0.5);
    const col = filled
      ? { r: 0.1, g: 0.8, b: 0.3 }
      : { r: 0.25, g: 0.25, b: 0.3 };
    pushRect(vertices, cx, barY, step * 0.8, 0.03, 0, col);
  }

  const data = new Float32Array(vertices);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.drawArrays(gl.TRIANGLES, 0, data.length / 5);
}

/* ---------- Input ---------- */

function onTap() {
  const s = state;
  if (!s || !s.running) return;

  if (s.gameOver) {
    // разрешаем тапом сразу рестартнуть, если проигрыш/победа
    resetGame();
    return;
  }

  if (!s.activeKnife.flying) {
    s.activeKnife.flying = true;
  }
}

function setupInput(canvas) {
  const handlers = {};

  handlers.pointerdown = (e) => {
    e.preventDefault();
    state.pointerDown = true;
    onTap();
  };

  handlers.pointerup = (e) => {
    e.preventDefault();
    state.pointerDown = false;
  };

  // swipe — базовая реализация, если захочешь использовать
  handlers.touchstart = (e) => {
    const t = e.changedTouches[0];
    state.touchStartPos = { x: t.clientX, y: t.clientY };
    state.touchLastPos = state.touchStartPos;
  };

  handlers.touchmove = (e) => {
    const t = e.changedTouches[0];
    state.touchLastPos = { x: t.clientX, y: t.clientY };
  };

  handlers.touchend = (e) => {
    const start = state.touchStartPos;
    const end = state.touchLastPos;
    if (!start || !end) return;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist2 = dx * dx + dy * dy;
    const threshold2 = 30 * 30;

    // если свайп маленький — считаем тапом
    if (dist2 < threshold2) {
      onTap();
    }
    state.touchStartPos = null;
    state.touchLastPos = null;
  };

  canvas.addEventListener("pointerdown", handlers.pointerdown);
  canvas.addEventListener("pointerup", handlers.pointerup);
  canvas.addEventListener("pointerleave", handlers.pointerup);

  canvas.addEventListener("touchstart", handlers.touchstart, { passive: true });
  canvas.addEventListener("touchmove", handlers.touchmove, { passive: true });
  canvas.addEventListener("touchend", handlers.touchend);

  state.handlers = handlers;
}

/* ---------- Game loop ---------- */

function loop(timestamp) {
  if (!state || !state.running) return;

  if (!state.lastTime) state.lastTime = timestamp;
  const dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
  state.lastTime = timestamp;

  updateGame(dt);
  renderGame();

  state.rafId = requestAnimationFrame(loop);
}

/* ---------- Public API ---------- */

export function start(canvasElement) {
  if (!canvasElement) return;

  // если уже запущено на этом же канвасе — не дублируем
  if (state && state.running && state.canvas === canvasElement) return;

  const init = initWebGL(canvasElement);
  if (!init) return;

  const { gl, program, buffer, attribs, uniforms, loseExt } = init;

  state = createInitialState(
    canvasElement,
    gl,
    program,
    buffer,
    attribs,
    uniforms,
    loseExt
  );

  setupInput(canvasElement);
  state.lastTime = 0;
  state.rafId = requestAnimationFrame(loop);
}

export function stop(canvasElement) {
  if (!state) return;
  if (canvasElement && state.canvas !== canvasElement) {
    // другой инстанс — игнор
    return;
  }

  state.running = false;

  if (state.rafId != null) {
    cancelAnimationFrame(state.rafId);
  }

  // remove events
  const canvas = state.canvas;
  const h = state.handlers || {};
  if (canvas) {
    if (h.pointerdown) canvas.removeEventListener("pointerdown", h.pointerdown);
    if (h.pointerup) {
      canvas.removeEventListener("pointerup", h.pointerup);
      canvas.removeEventListener("pointerleave", h.pointerup);
    }
    if (h.touchstart) canvas.removeEventListener("touchstart", h.touchstart);
    if (h.touchmove) canvas.removeEventListener("touchmove", h.touchmove);
    if (h.touchend) canvas.removeEventListener("touchend", h.touchend);
  }

  // освобождаем WebGL ресурсы
  const gl = state.gl;
  if (gl) {
    if (state.buffer) gl.deleteBuffer(state.buffer);
    if (state.program) gl.deleteProgram(state.program);
    if (state.loseExt) {
      // корректно отваливаем контекст
      try {
        state.loseExt.loseContext();
      } catch (_) {}
    }
  }

  state = null;
}

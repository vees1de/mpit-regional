import { computeView } from "./utils.js";

const PALETTE = [
  [0.91, 0.27, 0.34],
  [0.23, 0.59, 0.85],
  [0.99, 0.76, 0.36],
  [0.42, 0.85, 0.6],
  [0.74, 0.54, 0.92],
];

const VERT_SHADER = `
attribute vec2 aPosition;
attribute vec3 aColor;
attribute vec2 aUV;
varying vec3 vColor;
varying vec2 vUV;
void main() {
  vColor = aColor;
  vUV = aUV;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAG_SHADER = `
precision mediump float;
varying vec3 vColor;
varying vec2 vUV;
void main() {
  float radius = 0.14;
  float edge = 0.04;
  float dist = min(min(vUV.x, 1.0 - vUV.x), min(vUV.y, 1.0 - vUV.y));
  float alpha = smoothstep(0.0, edge, dist - radius);
  if (alpha <= 0.0) discard;
  gl_FragColor = vec4(vColor, alpha);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${info ?? ""}`);
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${info ?? ""}`);
  }
  return program;
}

function resizeCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}

export function createRenderer(canvas, state, settings, hudElement) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: true,
  });
  if (!gl) {
    throw new Error("WebGL not supported");
  }

  const program = createProgram(gl, VERT_SHADER, FRAG_SHADER);
  const positionAttrib = gl.getAttribLocation(program, "aPosition");
  const colorAttrib = gl.getAttribLocation(program, "aColor");
  const uvAttrib = gl.getAttribLocation(program, "aUV");

  const positionBuffer = gl.createBuffer();
  const colorBuffer = gl.createBuffer();
  const uvBuffer = gl.createBuffer();

  gl.useProgram(program);

  return {
    render(now = performance.now(), viewOverride, animState) {
      const didResize = resizeCanvas(canvas);
      const view = viewOverride ?? computeView(canvas, settings.boardSize);
      state.view = view;

      if (didResize) {
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.clearColor(0.05, 0.05, 0.08, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const geometry = buildGeometry(state.board, view, animState, now);
      if (!geometry.vertexCount) return view;

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(positionAttrib);
      gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.colors, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(colorAttrib);
      gl.vertexAttribPointer(colorAttrib, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.uvs, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(uvAttrib);
      gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, geometry.vertexCount);

      if (hudElement) {
        hudElement.textContent = `Score: ${state.score}`;
      }

      return view;
    },
  };
}

function buildGeometry(board, view, animState, now) {
  const size = board.length;
  const positions = [];
  const colors = [];
  const uvs = [];
  const padding = view.cellSize * 0.08;
  const dropDistance = view.cellSize * 1.1;
  const delayPerRow = animState?.delayPerRow ?? 35;
  const duration = animState?.duration ?? 420;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const value = board[y][x];
      if (value < 0) continue;

      const color = PALETTE[value % PALETTE.length];
      const t =
        animState?.start != null
          ? Math.max(
              0,
              Math.min(
                1,
                (now - animState.start - y * delayPerRow) / duration,
              ),
            )
          : 1;
      const ease = 1 - (1 - t) ** 3;
      const offset = (1 - ease) * dropDistance;

      const px0 = view.offsetX + x * view.cellSize + padding;
      const px1 =
        view.offsetX + (x + 1) * view.cellSize - padding;
      const py0 =
        view.offsetY + y * view.cellSize + padding - offset;
      const py1 =
        view.offsetY + (y + 1) * view.cellSize - padding - offset;

      const x0 = (px0 / view.width) * 2 - 1;
      const x1 = (px1 / view.width) * 2 - 1;
      const y0 = 1 - (py0 / view.height) * 2;
      const y1 = 1 - (py1 / view.height) * 2;

      // Two triangles per cell
      positions.push(
        x0,
        y0,
        x1,
        y0,
        x0,
        y1,
        x0,
        y1,
        x1,
        y0,
        x1,
        y1,
      );

      for (let i = 0; i < 6; i++) {
        colors.push(color[0], color[1], color[2]);
      }

      // UVs for rounded corners mask (0..1 in local quad)
      uvs.push(
        0,
        0,
        1,
        0,
        0,
        1,
        0,
        1,
        1,
        0,
        1,
        1,
      );
    }
  }

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    uvs: new Float32Array(uvs),
    vertexCount: positions.length / 2,
  };
}

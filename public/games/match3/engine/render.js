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
varying vec3 vColor;
void main() {
  vColor = aColor;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAG_SHADER = `
precision mediump float;
varying vec3 vColor;
void main() {
  gl_FragColor = vec4(vColor, 1.0);
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

  const positionBuffer = gl.createBuffer();
  const colorBuffer = gl.createBuffer();

  gl.useProgram(program);

  return {
    render(viewOverride) {
      const didResize = resizeCanvas(canvas);
      const view = viewOverride ?? computeView(canvas, settings.boardSize);
      state.view = view;

      if (didResize) {
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.clearColor(0.05, 0.05, 0.08, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const geometry = buildGeometry(state.board, view);
      if (!geometry.vertexCount) return view;

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(positionAttrib);
      gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.colors, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(colorAttrib);
      gl.vertexAttribPointer(colorAttrib, 3, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, geometry.vertexCount);

      if (hudElement) {
        hudElement.textContent = `Score: ${state.score}`;
      }

      return view;
    },
  };
}

function buildGeometry(board, view) {
  const size = board.length;
  const positions = [];
  const colors = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const value = board[y][x];
      if (value < 0) continue;

      const color = PALETTE[value % PALETTE.length];
      const x0 =
        ((view.offsetX + x * view.cellSize) / view.width) * 2 - 1;
      const x1 =
        ((view.offsetX + (x + 1) * view.cellSize) / view.width) * 2 - 1;
      const y0 =
        1 - ((view.offsetY + y * view.cellSize) / view.height) * 2;
      const y1 =
        1 - ((view.offsetY + (y + 1) * view.cellSize) / view.height) * 2;

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
    }
  }

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    vertexCount: positions.length / 2,
  };
}

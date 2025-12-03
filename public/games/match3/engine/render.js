import { computeView } from "./utils.js";

const PALETTE = [
  [0.91, 0.27, 0.34],
  [0.23, 0.59, 0.85],
  [0.99, 0.76, 0.36],
  [0.42, 0.85, 0.6],
  [0.74, 0.54, 0.92],
];

const VERT_SHADER = `
attribute vec3 aPosition;
attribute vec3 aColor;
attribute vec2 aUV;

uniform mat4 uMVP;
uniform mat3 uNormal;
uniform vec3 uLightDir;

varying vec3 vColor;
varying vec2 vUV;
varying float vLight;

void main() {
  vec3 worldNormal = normalize(uNormal * vec3(0.0, 0.0, 1.0));
  vLight = clamp(dot(worldNormal, normalize(uLightDir)), 0.2, 1.0);
  vColor = aColor;
  vUV = aUV;
  gl_Position = uMVP * vec4(aPosition, 1.0);
}
`;

const FRAG_SHADER = `
precision mediump float;
varying vec3 vColor;
varying vec2 vUV;
varying float vLight;
void main() {
  float radius = 0.14;
  float edge = 0.04;
  float dist = min(min(vUV.x, 1.0 - vUV.x), min(vUV.y, 1.0 - vUV.y));
  float alpha = smoothstep(0.0, edge, dist - radius);
  if (alpha <= 0.0) discard;

  float rim = smoothstep(0.0, 0.6, vUV.x * (1.0 - vUV.x) * vUV.y * (1.0 - vUV.y) * 4.0);
  vec3 base = vColor * (0.55 + 0.45 * vLight);
  vec3 finalColor = base + rim * 0.08;
  gl_FragColor = vec4(finalColor, alpha);
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

  const uMVP = gl.getUniformLocation(program, "uMVP");
  const uNormal = gl.getUniformLocation(program, "uNormal");
  const uLightDir = gl.getUniformLocation(program, "uLightDir");

  const positionBuffer = gl.createBuffer();
  const colorBuffer = gl.createBuffer();
  const uvBuffer = gl.createBuffer();

  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);

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

      const { mvp, normal } = buildMatrices(view, now);

      gl.uniformMatrix4fv(uMVP, false, mvp);
      gl.uniformMatrix3fv(uNormal, false, normal);
      gl.uniform3fv(uLightDir, [0.35, 0.65, 1.0]);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(positionAttrib);
      gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);

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
        x0, y0, 0,
        x1, y0, 0,
        x0, y1, 0,
        x0, y1, 0,
        x1, y0, 0,
        x1, y1, 0,
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
    vertexCount: positions.length / 3,
  };
}

function buildMatrices(view, now) {
  const aspect = view.width / view.height;
  const fov = (50 * Math.PI) / 180;
  const near = 0.1;
  const far = 100;
  const perspectiveMat = perspective(fov, aspect, near, far);

  const tilt =
    0.3 +
    0.08 * Math.sin((now / 1000) * 0.7) +
    0.06 * Math.sin((now / 1000) * 1.3);
  const rotX = rotationX(-0.9);
  const rotY = rotationY(tilt);
  const model = multiplyMat4(rotY, rotX);
  const viewMat = translation(0, -0.1, -3.2);
  const mv = multiplyMat4(viewMat, model);
  const mvp = multiplyMat4(perspectiveMat, mv);

  const normalMat = mat3FromMat4(mv);
  return { mvp, normal: normalMat };
}

function perspective(fov, aspect, near, far) {
  const f = 1.0 / Math.tan(fov / 2);
  const rangeInv = 1 / (near - far);

  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (near + far) * rangeInv,
    -1,
    0,
    0,
    near * far * rangeInv * 2,
    0,
  ]);
}

function translation(x, y, z) {
  return new Float32Array([
    1, 0, 0, 0, //
    0, 1, 0, 0, //
    0, 0, 1, 0, //
    x, y, z, 1,
  ]);
}

function rotationX(rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return new Float32Array([
    1, 0, 0, 0, //
    0, c, s, 0, //
    0, -s, c, 0, //
    0, 0, 0, 1,
  ]);
}

function rotationY(rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return new Float32Array([
    c, 0, -s, 0, //
    0, 1, 0, 0, //
    s, 0, c, 0, //
    0, 0, 0, 1,
  ]);
}

function multiplyMat4(a, b) {
  const out = new Float32Array(16);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      out[col + row * 4] =
        a[row * 4] * b[col] +
        a[row * 4 + 1] * b[col + 4] +
        a[row * 4 + 2] * b[col + 8] +
        a[row * 4 + 3] * b[col + 12];
    }
  }
  return out;
}

function mat3FromMat4(m) {
  return new Float32Array([
    m[0],
    m[1],
    m[2],
    m[4],
    m[5],
    m[6],
    m[8],
    m[9],
    m[10],
  ]);
}

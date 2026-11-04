import { createProgram, loadImage } from '@/lib/webgl';

/**
 * The sealed envelope, drawn with WebGL. Its flap folds up on a hinge above the
 * top of the picture, carrying the wax seal with it. Light then rises from
 * inside and gold butterflies flutter out from behind the pocket.
 *
 * Positions are fractions of the picture.
 */

const TALL = 1.823;
const HINGE = -0.06;
const CAMERA = 7;
const FLAP_TIP = [0.5, 0.475];
const SEAL_SIZE = 0.33;
const BUTTERFLY_SIZE = 0.15;

const BUTTERFLIES = [
  { from: [0.62, 0.64], to: [0.87, 0.2], start: 2.3, seconds: 2.3, drift: 0.05, beat: 15 },
  { from: [0.42, 0.64], to: [0.17, 0.27], start: 2.75, seconds: 2.1, drift: -0.04, beat: 13 },
  { from: [0.54, 0.66], to: [0.64, 0.09], start: 3.15, seconds: 1.9, drift: 0.03, beat: 17 },
];

const GRID = 18;

const COMMON = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
`;

const VERTEX = `
  attribute vec2 aPos;
  uniform float uKind;
  uniform float uAngle;
  uniform vec4 uRect;
  uniform vec3 uWings;
  varying vec2 vUv;

  const float TALL = ${TALL};
  const float HINGE = ${HINGE};
  const float CAMERA = ${CAMERA}.0;

  void main() {
    vec2 p = aPos;
    if (uKind > 0.5 && uKind < 1.5) {
      // The flap folds on its hinge and swings towards us.
      float reach = (aPos.y - HINGE) * TALL;
      float lift = reach * sin(uAngle);
      float s = CAMERA / (CAMERA - lift);
      float y = HINGE + reach * cos(uAngle) / TALL;
      p = vec2(0.5 + (aPos.x - 0.5) * s, 0.5 + (y - 0.5) * s);
    } else if (uKind > 1.5 && uKind < 2.5) {
      p = uRect.xy + (aPos - 0.5) * uRect.zw;
    } else if (uKind > 2.5) {
      // Wings fold along the body as they beat, and the insect turns as it flies.
      vec2 d = (aPos - 0.5) * uRect.zw;
      d.x *= uWings.x;
      d.y *= uWings.y;
      float c = cos(uWings.z);
      float s = sin(uWings.z);
      p = uRect.xy + vec2(c * d.x - s * d.y * ${1 / TALL}, s * d.x * ${TALL} + c * d.y);
    }
    vUv = aPos;
    gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
  }
`;

const FRAGMENT = `${COMMON}
  uniform sampler2D uTexture;
  uniform float uKind;
  uniform float uShadow;
  uniform float uBlur;
  uniform float uShade;
  varying vec2 vUv;

  void main() {
    if (uShadow > 0.0) {
      float a = texture2D(uTexture, vUv, uBlur).a;
      gl_FragColor = vec4(0.0, 0.0, 0.0, a * uShadow);
      return;
    }
    vec4 c = texture2D(uTexture, vUv);
    gl_FragColor = vec4(c.rgb * uShade, c.a);
  }
`;

/** Inside the envelope: dark at first, then filling with rays of light. */
const INSIDE_FRAGMENT = `${COMMON}
  uniform float uGlow;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec2 fromSource = (vUv - vec2(0.5, 0.56)) * vec2(1.0, 1.25);
    float dist = length(fromSource);
    vec2 dir = fromSource / max(dist, 0.001);

    vec3 shadow = vec3(0.22, 0.15, 0.11);
    vec3 paper = vec3(0.95, 0.87, 0.76);
    vec3 color = mix(shadow, paper, uGlow);

    float rays = noise(dir * 5.0 + uTime * 0.12) * noise(dir * 11.0 + 3.0 - uTime * 0.09);
    rays = smoothstep(0.12, 0.62, rays) * smoothstep(0.06, 0.34, dist);
    color += rays * uGlow * vec3(0.3, 0.26, 0.2);

    float heart = exp(-dist * dist * 7.0);
    color = mix(color, vec3(1.0, 0.98, 0.94), heart * uGlow);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const FULL_VERTEX = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos;
    gl_Position = vec4(aPos.x * 2.0 - 1.0, 1.0 - aPos.y * 2.0, 0.0, 1.0);
  }
`;

const clamp = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function createTexture(gl, image, unit, mipmap) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  if (mipmap) gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function buildMesh(gl) {
  const points = [];
  for (let y = 0; y <= GRID; y += 1) {
    for (let x = 0; x <= GRID; x += 1) points.push(x / GRID, y / GRID);
  }
  const indices = [];
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      const a = y * (GRID + 1) + x;
      const b = a + GRID + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const vertices = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
  const elements = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elements);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  return { vertices, elements, count: indices.length };
}

/** Where a point on the flap ends up on screen at a given fold. */
function foldedPoint([x, y], angle) {
  const reach = (y - HINGE) * TALL;
  const s = CAMERA / (CAMERA - reach * Math.sin(angle));
  const folded = HINGE + (reach * Math.cos(angle)) / TALL;
  return [0.5 + (x - 0.5) * s, 0.5 + (folded - 0.5) * s, s];
}

/** Sets up the canvas. Resolves to null if WebGL or the pictures are unavailable. */
export async function createEnvelopeScene(canvas) {
  if (!canvas.clientWidth) return null;
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) return null;

  let images;
  try {
    images = await Promise.all(
      ['envelope-pocket', 'envelope-flap', 'envelope-seal', 'butterfly'].map((name) => loadImage(`/opening/${name}.webp`)),
    );
  } catch {
    return null;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  gl.viewport(0, 0, canvas.width, canvas.height);

  const sprite = createProgram(gl, VERTEX, FRAGMENT);
  const inside = createProgram(gl, FULL_VERTEX, INSIDE_FRAGMENT);
  if (!sprite || !inside) return null;

  const mesh = buildMesh(gl);
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices);
  [sprite, inside].forEach((program) => {
    const position = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  });

  createTexture(gl, images[0], 0, false);
  createTexture(gl, images[1], 1, true);
  createTexture(gl, images[2], 2, true);
  createTexture(gl, images[3], 3, true);

  const u = {};
  ['uTexture', 'uKind', 'uAngle', 'uRect', 'uWings', 'uShadow', 'uBlur', 'uShade'].forEach((name) => {
    u[name] = gl.getUniformLocation(sprite, name);
  });
  const uGlow = gl.getUniformLocation(inside, 'uGlow');
  const uTime = gl.getUniformLocation(inside, 'uTime');
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const drawMesh = () => gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);

  const drawButterfly = (b, t) => {
    const age = (t - b.start) / b.seconds;
    if (age <= 0 || age >= 1.2) return;
    const x = b.from[0] + (b.to[0] - b.from[0]) * age + Math.sin(age * 9) * b.drift;
    const y = b.from[1] + (b.to[1] - b.from[1]) * age + Math.sin(age * 13) * 0.012;
    const heading = Math.atan2((b.to[1] - b.from[1]) * TALL, b.to[0] - b.from[0]) + Math.PI / 2;
    const open = 0.32 + 0.68 * Math.abs(Math.cos(t * b.beat));
    gl.uniform4f(u.uRect, x, y, BUTTERFLY_SIZE, BUTTERFLY_SIZE / TALL);
    gl.uniform3f(u.uWings, open, 1, heading + Math.sin(t * 3) * 0.2);
    drawMesh();
  };

  return {
    /** `t` is seconds since the envelope was tapped; negative while it waits. */
    draw(time, t) {
      const angle = smooth(0.25, 2.5, t) * 1.54;
      const glow = smooth(0.9, 2.5, t);

      gl.useProgram(inside);
      gl.uniform1f(uGlow, glow);
      gl.uniform1f(uTime, time);
      gl.disable(gl.BLEND);
      gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
      gl.enable(gl.BLEND);

      gl.useProgram(sprite);
      gl.uniform1f(u.uAngle, angle);
      gl.uniform1f(u.uShadow, 0);
      gl.uniform1f(u.uBlur, 0);
      gl.uniform1f(u.uShade, 1);

      gl.uniform1f(u.uKind, 3);
      gl.uniform1i(u.uTexture, 3);
      BUTTERFLIES.forEach((b) => drawButterfly(b, t));

      gl.uniform1f(u.uKind, 0);
      gl.uniform1i(u.uTexture, 0);
      drawMesh();

      if (angle < 1.53) {
        // The flap's soft shadow falls on the pocket, and slides away as it lifts.
        gl.uniform1f(u.uKind, 1);
        gl.uniform1i(u.uTexture, 1);
        gl.uniform1f(u.uAngle, Math.max(0, angle - 0.04));
        gl.uniform1f(u.uShadow, 0.34 * Math.cos(angle));
        gl.uniform1f(u.uBlur, 3.5);
        drawMesh();

        gl.uniform1f(u.uAngle, angle);
        gl.uniform1f(u.uShadow, 0);
        gl.uniform1f(u.uBlur, 0);
        gl.uniform1f(u.uShade, 1 - 0.3 * Math.sin(angle));
        drawMesh();

        const [x, y, s] = foldedPoint(FLAP_TIP, angle);
        const squash = 0.72 + 0.28 * Math.cos(angle);
        gl.uniform1f(u.uKind, 2);
        gl.uniform1i(u.uTexture, 2);
        gl.uniform1f(u.uShade, 1);
        gl.uniform4f(u.uRect, x, y, SEAL_SIZE * s, (SEAL_SIZE * s * squash) / TALL);
        drawMesh();
      }
    },
    /** Frees the graphics memory once the envelope has gone. */
    destroy() {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

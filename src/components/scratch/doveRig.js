/**
 * Flaps the dove illustration with WebGL. The picture is cut into three layers
 * (far wing, body, near wing). Each wing is a bendable mesh that folds along a
 * hinge line on the bird's back, and stays joined to the body where it meets
 * the hinge, so it moves like a wing rather than a rotating cut-out.
 *
 * Positions are fractions of the 1024 × 1024 layer images.
 */

import { createProgram, loadImage } from '@/lib/webgl';

const LAYERS = ['far', 'body', 'near'];

/** The hinge is where the wing folds; `axis` runs along it; `span` is the wing's reach. */
const WINGS = {
  far: { hinge: [0.369, 0.521], axis: [0.976, -0.22], span: 0.4, delay: 0.35 },
  near: { hinge: [0.4375, 0.4961], axis: [0.595, 0.804], span: 0.492, delay: 0 },
};

const GRID = 40;

const VERTEX_SHADER = `
  attribute vec2 aPos;
  uniform float uIsWing;
  uniform vec2 uHinge;
  uniform vec2 uAxis;
  uniform float uSpan;
  uniform float uFold;
  uniform float uSwing;
  uniform float uBeat;
  uniform float uTail;
  uniform float uBob;
  varying vec2 vUv;

  const float MARGIN = 0.25;

  // Fold along the hinge. The outer wing lags the inner wing, so the wing bends.
  vec2 foldWing(vec2 p) {
    vec2 normal = vec2(uAxis.y, -uAxis.x);
    vec2 d = p - uHinge;
    float along = dot(d, uAxis);
    float reach = dot(d, normal);
    if (reach <= 0.0) return p;
    float u = min(reach / uSpan, 1.0);
    float angle = uFold + uSwing * sin(uBeat - 0.9 * u);
    return uHinge + uAxis * (along + 0.07 * reach * sin(angle)) + normal * reach * cos(angle);
  }

  vec2 swayTail(vec2 p) {
    vec2 root = vec2(0.564, 0.688);
    vec2 d = p - root;
    float t = clamp(dot(d, vec2(0.75, 0.66)) / 0.3, 0.0, 1.0);
    float a = uTail * t * t;
    float c = cos(a);
    float s = sin(a);
    return root + vec2(c * d.x - s * d.y, s * d.x + c * d.y);
  }

  void main() {
    vec2 p = uIsWing > 0.5 ? foldWing(aPos) : swayTail(aPos);
    p.y += uBob;
    vUv = aPos;
    vec2 clip = (p + MARGIN) / (1.0 + 2.0 * MARGIN) * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D uTexture;
  varying vec2 vUv;
  void main() {
    gl_FragColor = texture2D(uTexture, vUv);
  }
`;

function buildGrid(gl, program) {
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
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  return indices.length;
}

function createTexture(gl, image) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

const lerp = (a, b, t) => a + (b - a) * t;

/** Sets up the canvas. Resolves to null if WebGL or the pictures are unavailable. */
export async function createDoveRig(canvas, basePath = '/dove') {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null;

  let images;
  try {
    images = await Promise.all(LAYERS.map((name) => loadImage(`${basePath}/${name}.webp`)));
  } catch {
    return null;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  gl.viewport(0, 0, canvas.width, canvas.height);

  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  if (!program) return null;

  const count = buildGrid(gl, program);
  const textures = images.map((image) => createTexture(gl, image));
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  const uniform = (name) => gl.getUniformLocation(program, name);
  const u = Object.fromEntries(
    ['uIsWing', 'uHinge', 'uAxis', 'uSpan', 'uFold', 'uSwing', 'uBeat', 'uTail', 'uBob'].map((n) => [n, uniform(n)]),
  );

  return {
    /** `phase` is the point in the wingbeat, `effort` runs from 0 (gliding) to 1 (full flapping). */
    draw(phase, effort) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(u.uFold, lerp(0.24, 0.85, effort));
      gl.uniform1f(u.uSwing, lerp(0.05, 0.92, effort));
      gl.uniform1f(u.uBob, Math.sin(phase + 0.6) * 0.004 * effort);
      gl.uniform1f(u.uTail, Math.sin(phase + 1.4) * 0.07 * effort);

      LAYERS.forEach((name, i) => {
        const wing = WINGS[name];
        gl.uniform1f(u.uIsWing, wing ? 1 : 0);
        if (wing) {
          gl.uniform2fv(u.uHinge, wing.hinge);
          gl.uniform2fv(u.uAxis, wing.axis);
          gl.uniform1f(u.uSpan, wing.span);
          gl.uniform1f(u.uBeat, phase - wing.delay);
        }
        gl.bindTexture(gl.TEXTURE_2D, textures[i]);
        gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
      });
    },
    /** Frees the graphics memory once the dove has gone. */
    destroy() {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

import { createProgram, loadImage } from '@/lib/webgl';

/**
 * Brings the garden picture to life with WebGL. A second, small picture says
 * where the wind blows (red) and where lights flicker (green), so leaves and
 * flowers stir while the stone path and sky stay still. Rays of light turn
 * slowly out of the doorway, and grow to fill the view as the couple walk in.
 */

const VERTEX_SHADER = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  uniform sampler2D uImage;
  uniform sampler2D uLight;
  uniform float uTime;
  uniform float uOpen;
  varying vec2 vUv;

  const vec2 DOORWAY = vec2(0.4848, 0.4082);
  const float TALL = 1.823;

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

  vec3 screen(vec3 a, vec3 b) {
    return 1.0 - (1.0 - a) * (1.0 - clamp(b, 0.0, 1.0));
  }

  void main() {
    vec4 mask = texture2D(uLight, vUv);

    // Slow gusts move whole branches; quick flutter moves single leaves.
    float gust = noise(vUv * vec2(3.0, 5.0) + vec2(uTime * 0.22, uTime * 0.07)) - 0.5;
    float flutter = noise(vUv * vec2(26.0, 40.0) + uTime * vec2(0.9, 0.6)) - 0.5;
    vec2 shift = vec2(gust * 0.012 + flutter * 0.0032, gust * 0.004 + flutter * 0.0042) * mask.r;
    vec3 color = texture2D(uImage, vUv + shift).rgb;

    float flicker = noise(vUv * 18.0 + vec2(uTime * 0.7, uTime * -0.5));
    color = screen(color, mask.g * flicker * vec3(1.0, 0.8, 0.5) * 0.55);

    vec2 fromDoor = (vUv - DOORWAY) * vec2(1.0, TALL);
    float dist = length(fromDoor);
    vec2 dir = fromDoor / max(dist, 0.001);
    float rays = noise(dir * 3.4 + uTime * 0.09) * noise(dir * 8.0 + 7.0 - uTime * 0.07);
    float reach = exp(-dist * mix(2.8, 1.1, uOpen));
    color = screen(color, rays * reach * (0.45 + uOpen * 1.6) * vec3(1.0, 0.88, 0.64));

    float breath = 0.5 + 0.5 * sin(uTime * 0.7);
    float glow = exp(-dist * dist * mix(24.0, 3.2, uOpen));
    color = screen(color, glow * (0.04 + 0.04 * breath + uOpen * 0.96) * vec3(1.0, 0.94, 0.82));

    gl_FragColor = vec4(color, 1.0);
  }
`;

function createTexture(gl, image, unit) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

/** Sets up the canvas. Resolves to null if WebGL or the pictures are unavailable. */
export async function createGardenScene(canvas) {
  if (!canvas.clientWidth) return null;
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) return null;

  let picture;
  let lightMap;
  try {
    [picture, lightMap] = await Promise.all([loadImage('/opening/garden.webp'), loadImage('/opening/garden-light.webp')]);
  } catch {
    return null;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  gl.viewport(0, 0, canvas.width, canvas.height);

  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  if (!program) return null;

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  createTexture(gl, picture, 0);
  createTexture(gl, lightMap, 1);
  gl.uniform1i(gl.getUniformLocation(program, 'uImage'), 0);
  gl.uniform1i(gl.getUniformLocation(program, 'uLight'), 1);
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uOpen = gl.getUniformLocation(program, 'uOpen');

  return {
    /** `open` runs from 0 (at rest) to 1 (the doorway's light fills the view). */
    draw(time, open) {
      gl.uniform1f(uTime, time);
      gl.uniform1f(uOpen, open);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    /** Frees the graphics memory once the opening scene has gone. */
    destroy() {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

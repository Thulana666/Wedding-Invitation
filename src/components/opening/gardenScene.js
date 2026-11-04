import { createProgram, loadImage } from '@/lib/webgl';

/**
 * The garden scene, drawn with WebGL in four layers: the garden, the two door
 * leaves, the couple, and the light that pours over them all. It starts at dusk,
 * with light showing around the closed door, and warms to golden hour as it opens.
 *
 * Everything sits in one perspective. The door leaves are real 3D planes that
 * swing on their hinges, and the couple walk along the path towards the same
 * vanishing point: legs step, the gown moves and light wraps around them.
 *
 * Positions are fractions of the garden picture.
 */

const VANISH = [0.4848, 0.36];
const DOOR = { left: 0.29576, top: 0.20213, width: 0.36848, height: 0.47872 };
const HINGE_LEFT = 0.3055;
const HINGE_RIGHT = 0.6545;
const SEAM = 0.4752;
const BRIDE = { left: 0.13333, top: 0.36303, width: 0.47152, height: 0.52726 };
const GROOM = { left: 0.46909, top: 0.35505, width: 0.20606, height: 0.42819 };

// The couple stand this far from the camera, compared with the door.
const COUPLE_NEARNESS = 0.757;
const WALK_DISTANCE = 0.62;

const GRID_X = 28;
const GRID_Y = 44;

const COMMON = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

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
`;

const FULL_VERTEX = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos;
    gl_Position = vec4(aPos.x * 2.0 - 1.0, 1.0 - aPos.y * 2.0, 0.0, 1.0);
  }
`;

/** The garden: wind in the leaves, flickering lights, and light spilling down the path. */
const GARDEN_FRAGMENT = `${COMMON}
  uniform sampler2D uImage;
  uniform sampler2D uMask;
  uniform float uTime;
  uniform float uLight;
  varying vec2 vUv;

  void main() {
    vec4 mask = texture2D(uMask, vUv);

    float gust = noise(vUv * vec2(3.0, 5.0) + vec2(uTime * 0.22, uTime * 0.07)) - 0.5;
    float flutter = noise(vUv * vec2(26.0, 40.0) + uTime * vec2(0.9, 0.6)) - 0.5;
    vec2 shift = vec2(gust * 0.012 + flutter * 0.0032, gust * 0.004 + flutter * 0.0042) * mask.r;
    vec3 color = texture2D(uImage, vUv + shift).rgb;

    // The glow around the doorway only belongs once the door stands open.
    color *= mix(vec3(1.0), vec3(0.52, 0.44, 0.37), mask.b * (1.0 - uLight));
    // Dusk: everything is dim but the lit flowers and the light behind the door.
    float keepsLight = max(uLight, max(mask.a, mask.g * 0.92));
    color *= mix(vec3(0.36, 0.32, 0.36), vec3(1.0), keepsLight);

    float flicker = noise(vUv * 18.0 + vec2(uTime * 0.7, uTime * -0.5));
    color = screen(color, mask.g * flicker * vec3(1.0, 0.8, 0.5) * 0.55);

    float below = vUv.y - 0.6755;
    if (below > 0.0) {
      float halfWidth = 0.17 + below * 0.5;
      float spill = 1.0 - smoothstep(halfWidth * 0.62, halfWidth, abs(vUv.x - 0.478));
      color = screen(color, spill * exp(-below * 3.4) * uLight * 0.8 * vec3(1.0, 0.86, 0.62));
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

/** Door leaves and figures share one mesh, bent differently for each. */
const SPRITE_VERTEX = `
  attribute vec2 aPos;
  uniform float uKind;
  uniform vec4 uRect;
  uniform vec3 uLeaf;
  uniform float uNear;
  uniform float uBeat;
  uniform float uWalk;
  uniform float uTime;
  uniform float uShadow;
  varying vec2 vUv;
  varying float vAcross;

  const vec2 VANISH = vec2(${VANISH[0]}, ${VANISH[1]});
  const float GROUND = 0.777;

  // Her weight shifts, and the gown swings and ripples behind her, gathering as she walks.
  vec2 brideMoves(vec2 uv, vec2 p) {
    float skirt = clamp((uv.y - 0.36) / 0.64, 0.0, 1.0);
    float trail = skirt * skirt;
    float breeze = sin(uTime * 1.3 + uv.y * 3.0) * trail * 0.0016;
    p.x += breeze;
    p.x += sin(uBeat) * 0.0048 * (1.0 - skirt) * uWalk;
    p.y -= abs(sin(uBeat)) * 0.0034 * uWalk;
    p.x = mix(p.x, 0.40 + (p.x - 0.40) * 0.66, trail * uWalk);
    p.x += trail * 0.017 * sin(uBeat - 1.6 - 2.4 * skirt) * uWalk;
    p.y += trail * (0.0036 * sin(uBeat * 2.0 + uv.x * 9.0) + 0.012) * uWalk;
    return p;
  }

  // His legs lift in turn, his free arm swings and his shoulders roll against his step.
  vec2 groomMoves(vec2 uv, vec2 p) {
    float beat = uBeat + 0.3;
    float leg = clamp((uv.y - 0.5) / 0.5, 0.0, 1.0);
    float left = 1.0 - smoothstep(0.46, 0.56, uv.x);
    float lift = left * max(0.0, sin(beat)) + (1.0 - left) * max(0.0, -sin(beat));
    p.y -= leg * lift * 0.034 * uWalk;
    p.x += leg * (left - 0.5) * lift * -0.006 * uWalk;
    float arm = smoothstep(0.7, 0.85, uv.x) * smoothstep(0.12, 0.3, uv.y) * (1.0 - smoothstep(0.46, 0.52, uv.y));
    p.x += arm * sin(beat) * 0.0045 * uWalk;
    float shoulders = 1.0 - smoothstep(0.1, 0.4, uv.y);
    p.y += shoulders * (uv.x - 0.5) * sin(beat) * 0.012 * uWalk;
    p.x += sin(beat) * 0.0036 * (1.0 - leg) * uWalk;
    p.y -= abs(sin(beat)) * 0.0034 * uWalk;
    return p;
  }

  void main() {
    vec2 p;
    if (uKind < 0.5) {
      float reach = (uLeaf.y - uLeaf.x) * aPos.x;
      float depth = abs(reach) * sin(uLeaf.z);
      vec2 flat_ = vec2(uLeaf.x + reach * cos(uLeaf.z), uRect.y + aPos.y * uRect.w);
      p = VANISH + (flat_ - VANISH) / (1.0 + depth);
      vUv = vec2((uLeaf.x + reach - uRect.x) / uRect.z, aPos.y);
      vAcross = aPos.x;
    } else {
      p = uRect.xy + aPos * uRect.zw;
      p = uKind < 1.5 ? brideMoves(aPos, p) : groomMoves(aPos, p);
      if (uShadow > 0.5) {
        // Cast towards us along the ground by the light of the doorway.
        float height = GROUND - p.y;
        p.x += (p.x - VANISH.x) * height * 1.3;
        p.y = GROUND + height * 0.55;
      }
      p = VANISH + (p - VANISH) * uNear;
      vUv = aPos;
      vAcross = 0.0;
    }
    gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
  }
`;

const SPRITE_FRAGMENT = `${COMMON}
  uniform sampler2D uTexture;
  uniform float uKind;
  uniform float uLight;
  uniform float uSwing;
  uniform float uShadow;
  uniform float uFade;
  varying vec2 vUv;
  varying float vAcross;

  void main() {
    vec4 c = texture2D(uTexture, vUv);
    if (uShadow > 0.5) {
      float soft = c.a;
      soft += texture2D(uTexture, vUv + vec2(0.024, 0.012)).a + texture2D(uTexture, vUv - vec2(0.024, 0.012)).a;
      soft += texture2D(uTexture, vUv + vec2(-0.024, 0.012)).a + texture2D(uTexture, vUv + vec2(0.024, -0.012)).a;
      gl_FragColor = vec4(0.0, 0.0, 0.0, soft * 0.2 * 0.36 * uLight * uFade);
    } else if (uKind < 0.5) {
      // Turning away from the sunset the door falls into shade; light catches its open edge.
      vec3 rgb = c.rgb * (1.0 - 0.52 * uSwing) * mix(vec3(0.36, 0.32, 0.35), vec3(1.0), uLight);
      rgb += c.a * vec3(1.0, 0.8, 0.5) * smoothstep(0.86, 1.0, vAcross) * uSwing * 0.55;
      gl_FragColor = vec4(rgb, c.a);
    } else {
      // Against the light the figures darken, and it wraps around their edges.
      float rim = 0.0;
      if (uLight > 0.01) {
        vec2 d = vec2(0.012, 0.0);
        vec2 e = vec2(0.03, 0.0);
        float close = min(texture2D(uTexture, vUv + d).a, texture2D(uTexture, vUv - d).a);
        float wide = min(texture2D(uTexture, vUv + e).a, texture2D(uTexture, vUv - e).a);
        rim = c.a * (0.6 * (1.0 - close) + 0.4 * (1.0 - wide));
      }
      vec3 dusk = vec3(0.5, 0.46, 0.49);
      // Rim light belongs on heads and shoulders, not along the hem on the ground.
      rim *= 1.0 - smoothstep(0.45, 0.7, vUv.y);
      vec3 rgb = c.rgb * mix(dusk, vec3(0.74), uLight) + rim * uLight * vec3(1.0, 0.86, 0.62) * 0.38;
      gl_FragColor = vec4(rgb, c.a) * uFade;
    }
  }
`;

/**
 * Light from the doorway. Its rays are drawn behind the couple, so they stand out
 * against them; the soft glow goes over the top and slowly swallows them.
 */
const LIGHT_FRAGMENT = `${COMMON}
  uniform float uTime;
  uniform float uLight;
  uniform float uFlood;
  uniform float uRays;
  varying vec2 vUv;

  const vec2 DOORWAY = vec2(0.478, 0.44);
  const float TALL = 1.823;

  void main() {
    vec2 fromDoor = (vUv - DOORWAY) * vec2(1.0, TALL);
    float dist = length(fromDoor);
    vec2 dir = fromDoor / max(dist, 0.001);

    vec3 light = vec3(0.0);
    if (uRays < 0.5) {
      float glow = exp(-dist * dist * mix(22.0, 2.0, uFlood));
      gl_FragColor = vec4(glow * (uLight * 0.2 + uFlood * 1.15) * vec3(1.0, 0.94, 0.82), 1.0);
      return;
    }

    float rays = noise(dir * 3.4 + uTime * 0.09) * noise(dir * 8.0 + 7.0 - uTime * 0.07);
    float reach = exp(-dist * mix(3.0, 1.0, uFlood)) * smoothstep(0.06, 0.3, dist);
    light += rays * reach * (uLight * 1.1 + uFlood * 0.9) * vec3(1.0, 0.88, 0.64);

    // A thin line of light escapes between the closed doors.
    float seam = exp(-pow((vUv.x - ${SEAM}) / 0.004, 2.0));
    float doorHeight = smoothstep(0.215, 0.24, vUv.y) * (1.0 - smoothstep(0.65, 0.68, vUv.y));
    float pulse = 0.8 + 0.2 * sin(uTime * 0.9);
    light += seam * doorHeight * pulse * (1.0 - uLight) * 0.34 * vec3(1.0, 0.9, 0.7);

    gl_FragColor = vec4(light, 1.0);
  }
`;

const clamp = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function createTexture(gl, image, unit, { premultiply = false, mipmap = false } = {}) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  if (mipmap) gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function buildMesh(gl) {
  const points = [];
  for (let y = 0; y <= GRID_Y; y += 1) {
    for (let x = 0; x <= GRID_X; x += 1) points.push(x / GRID_X, y / GRID_Y);
  }
  const indices = [];
  for (let y = 0; y < GRID_Y; y += 1) {
    for (let x = 0; x < GRID_X; x += 1) {
      const a = y * (GRID_X + 1) + x;
      const b = a + GRID_X + 1;
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

function uniforms(gl, program, names) {
  return Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)]));
}

function bindPosition(gl, program, buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const position = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
}

/** Sets up the canvas. Resolves to null if WebGL or the pictures are unavailable. */
export async function createGardenScene(canvas) {
  if (!canvas.clientWidth) return null;
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) return null;

  let images;
  try {
    images = await Promise.all(
      ['garden', 'garden-light', 'door', 'bride', 'groom'].map((name) => loadImage(`/opening/${name}.webp`)),
    );
  } catch {
    return null;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  gl.viewport(0, 0, canvas.width, canvas.height);

  const garden = createProgram(gl, FULL_VERTEX, GARDEN_FRAGMENT);
  const sprite = createProgram(gl, SPRITE_VERTEX, SPRITE_FRAGMENT);
  const light = createProgram(gl, FULL_VERTEX, LIGHT_FRAGMENT);
  if (!garden || !sprite || !light) return null;

  const screenQuad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, screenQuad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  const mesh = buildMesh(gl);

  createTexture(gl, images[0], 0);
  createTexture(gl, images[1], 1);
  createTexture(gl, images[2], 2, { premultiply: true, mipmap: true });
  createTexture(gl, images[3], 3, { premultiply: true });
  createTexture(gl, images[4], 4, { premultiply: true });

  const g = uniforms(gl, garden, ['uImage', 'uMask', 'uTime', 'uLight']);
  const s = uniforms(gl, sprite, ['uTexture', 'uKind', 'uRect', 'uLeaf', 'uNear', 'uBeat', 'uWalk', 'uTime', 'uShadow', 'uLight', 'uSwing', 'uFade']);
  const l = uniforms(gl, light, ['uTime', 'uLight', 'uFlood', 'uRays']);

  const drawLight = (rays) => {
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
    gl.useProgram(light);
    bindPosition(gl, light, screenQuad);
    gl.uniform1f(l.uRays, rays ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(sprite);
    bindPosition(gl, sprite, mesh.vertices);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.elements);
  };

  const drawLeaf = (hinge, angle) => {
    gl.uniform3f(s.uLeaf, hinge, SEAM, angle);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  };
  const drawFigure = (kind, unit, rect, shadow) => {
    gl.uniform1f(s.uKind, kind);
    gl.uniform1f(s.uShadow, shadow ? 1 : 0);
    gl.uniform1i(s.uTexture, unit);
    gl.uniform4f(s.uRect, rect.left, rect.top, rect.width, rect.height);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  };

  return {
    /** `time` runs always; `t` is seconds since the garden came into view, negative before it. */
    draw(time, t) {
      // The latch gives first, then the heavy doors swing.
      const crack = smooth(0.3, 0.7, t);
      const swing = smooth(0.9, 3, t);
      const angle = crack * 0.05 + swing * 1.38;
      const open = clamp(crack * 0.1 + swing * 0.9);
      const glow = smooth(0, 0.75, open);

      // They set off as the doors part and end up small in the bright doorway.
      const walking = smooth(1.4, 2, t) * (1 - smooth(4.8, 5.4, t));
      const near = COUPLE_NEARNESS / (COUPLE_NEARNESS + WALK_DISTANCE * smooth(1.4, 5.4, t));
      const beat = t > 1.4 ? (t - 1.4) * 5.2 : 0;
      const fade = 1;
      const flood = smooth(3.2, 5.4, t) * 0.26;

      gl.disable(gl.BLEND);
      gl.useProgram(garden);
      bindPosition(gl, garden, screenQuad);
      gl.uniform1i(g.uImage, 0);
      gl.uniform1i(g.uMask, 1);
      gl.uniform1f(g.uTime, time);
      gl.uniform1f(g.uLight, glow);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.useProgram(light);
      gl.uniform1f(l.uTime, time);
      gl.uniform1f(l.uLight, glow);
      gl.uniform1f(l.uFlood, flood);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(sprite);
      bindPosition(gl, sprite, mesh.vertices);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.elements);
      gl.uniform1f(s.uNear, near);
      gl.uniform1f(s.uBeat, beat);
      gl.uniform1f(s.uWalk, walking);
      gl.uniform1f(s.uTime, time);
      gl.uniform1f(s.uLight, glow);
      gl.uniform1f(s.uSwing, swing);
      gl.uniform1f(s.uFade, fade);

      if (glow > 0.01) {
        drawFigure(2, 4, GROOM, true);
        drawFigure(1, 3, BRIDE, true);
      }

      gl.uniform1f(s.uKind, 0);
      gl.uniform1f(s.uShadow, 0);
      gl.uniform1i(s.uTexture, 2);
      gl.uniform4f(s.uRect, DOOR.left, DOOR.top, DOOR.width, DOOR.height);
      drawLeaf(HINGE_LEFT, angle);
      drawLeaf(HINGE_RIGHT, angle);

      drawLight(true);

      drawFigure(2, 4, GROOM, false);
      drawFigure(1, 3, BRIDE, false);

      drawLight(false);
    },
    /** Frees the graphics memory once the opening scene has gone. */
    destroy() {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

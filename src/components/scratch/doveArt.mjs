/**
 * Vector artwork for the dove: a white bird in flight, facing left, built from
 * individually layered feathers. `doveMarkup` returns static SVG markup and
 * `applyWingPose` moves its wings, so the art can also be previewed on its own.
 *
 * Canvas: 600 × 420. The beak tip, where the ribbon is held, is at (108, 181).
 */

const round = (n) => Math.round(n * 100) / 100;
const lerp = (a, b, t) => a + (b - a) * t;

const OUTLINE = 'rgba(112, 98, 82, 0.5)';
const SHAFT = 'rgba(124, 108, 90, 0.46)';

/** One feather lying along +x with its base at (x, y). */
function feather(x, y, angle, length, width, fill, shaft = true) {
  const l = length;
  const w = width / 2;
  const blade = [
    'M0 0',
    `C${round(l * 0.16)} ${round(-w * 1.1)} ${round(l * 0.68)} ${round(-w * 1.2)} ${round(l * 0.95)} ${round(-w * 0.3)}`,
    `Q${round(l * 1.02)} ${round(w * 0.04)} ${round(l * 0.93)} ${round(w * 0.34)}`,
    `C${round(l * 0.66)} ${round(w * 1.02)} ${round(l * 0.2)} ${round(w * 0.86)} 0 0Z`,
  ].join('');
  const quill = shaft
    ? `<path d="M${round(l * 0.04)} 0Q${round(l * 0.5)} ${round(-w * 0.16)} ${round(l * 0.92)} ${round(-w * 0.04)}" fill="none" stroke="${SHAFT}" stroke-width=".7"/>`
    : '';
  return `<g transform="translate(${round(x)} ${round(y)}) rotate(${round(angle)})"><path d="${blade}" fill="url(#${fill})" stroke="${OUTLINE}" stroke-width=".7"/>${quill}</g>`;
}

/** A row of feathers spaced evenly between two points. */
function row(count, from, to, build) {
  let out = '';
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0 : i / (count - 1);
    out += build(lerp(from[0], to[0], t), lerp(from[1], to[1], t), t);
  }
  return out;
}

const WRIST = [96, -112];

/** The wing's origin is the shoulder. `data-part`s rotate at shoulder and wrist. */
function wing(side, fill, covert, edge) {
  const primaries = row(11, [30, -66], [0, 4], (x, y, t) =>
    feather(x, y, lerp(-106, -30, t), lerp(214, 164, t ** 1.5), lerp(28, 38, t), fill),
  );
  const primaryCoverts = row(8, [26, -62], [-2, 0], (x, y, t) =>
    feather(x, y, lerp(-102, -36, t), lerp(96, 78, t), 26, covert),
  );
  const secondaries = row(9, WRIST, [18, -14], (x, y, t) =>
    feather(x, y, lerp(-26, 14, t), lerp(170, 116, t), 42, fill),
  );
  const greater = row(9, [94, -116], [22, -22], (x, y, t) =>
    feather(x, y, lerp(-30, 8, t), lerp(96, 66, t), 30, covert),
  );
  const median = row(8, [90, -120], [30, -36], (x, y, t) =>
    feather(x, y, lerp(-36, 0, t), lerp(60, 44, t), 24, covert, false),
  );
  const lesser = row(8, [84, -120], [26, -44], (x, y, t) =>
    feather(x, y, lerp(-40, -8, t), lerp(42, 30, t), 19, covert, false),
  );
  const marginal = row(11, [100, -124], [-8, 8], (x, y, t) =>
    feather(x, y, lerp(-44, -28, t), lerp(30, 36, t), 17, edge, false),
  );

  return `<g data-part="${side}Arm">
    <g transform="translate(${WRIST[0]} ${WRIST[1]})"><g data-part="${side}Hand">${primaries}${primaryCoverts}</g></g>
    ${secondaries}${greater}${median}${lesser}${marginal}
  </g>`;
}

function tail() {
  const fan = [20, 16, 12, 8, 4, 0, -4, -8, -12];
  // Outer feathers first, so the central ones lie on top.
  const long = fan
    .map((angle, i) => ({ angle, rank: Math.abs(i - 4) }))
    .sort((a, b) => b.rank - a.rank)
    .map(({ angle, rank }) => feather(0, 0, angle + 4, 190 - rank * 6, 36, 'dv-tail'))
    .join('');
  return `<g transform="translate(404 250)">${long}</g>`;
}

const BODY =
  'M130 170C136 150 160 140 180 146C198 152 208 166 226 176C268 198 340 214 470 252C420 282 346 312 286 312C234 312 196 292 174 252C166 236 150 218 138 203C129 193 126 180 130 170Z';

function breastTexture() {
  let arcs = '';
  for (let r = 0; r < 6; r += 1) {
    for (let c = 0; c < 6 - Math.floor(r / 2); c += 1) {
      const x = 170 + c * 19 + (r % 2) * 9 + r * 5;
      const y = 196 + r * 15 + c * 3;
      arcs += `M${x} ${y}q8 8 16 1`;
    }
  }
  return `<path d="${arcs}" fill="none" stroke="rgba(120,108,92,.17)" stroke-width="1" stroke-linecap="round"/>`;
}

function body() {
  return `
    <path d="${BODY}" fill="url(#dv-body)" stroke="${OUTLINE}" stroke-width=".9"/>
    <g clip-path="url(#dv-body-clip)">
      ${breastTexture()}
      <ellipse cx="300" cy="232" rx="104" ry="30" transform="rotate(14 300 232)" fill="url(#dv-ao)"/>
      <path d="M146 204C166 214 176 232 180 256L150 240Z" fill="url(#dv-throat)"/>
    </g>`;
}

function head() {
  return `
    <path d="M132 167C122 169 113 175 106 181C114 180 123 181 132 183Z" fill="url(#dv-beak)"/>
    <path d="M132 183C123 181 115 181 108 182C114 186 123 189 134 188Z" fill="#8f6a4d"/>
    <path d="M125 171.5C129 166 136 166 137.5 171C134 174 129 175 125 171.5Z" fill="#f4efe7" stroke="rgba(120,108,92,.4)" stroke-width=".6"/>
    <circle cx="153" cy="166" r="5.8" fill="#efe8dd" stroke="rgba(120,108,92,.5)" stroke-width=".7"/>
    <circle cx="153" cy="166" r="4.3" fill="#1f1716"/>
    <circle cx="151.6" cy="164.6" r="1.35" fill="#ffffff"/>`;
}

/** Back feathers that overlap the root of the wing, hiding the joint as it moves. */
function scapulars() {
  return row(8, [228, 188], [298, 212], (x, y, t) =>
    feather(x, y, lerp(14, 20, t), lerp(40, 58, t), 19, 'dv-scapular', false),
  );
}

function defs() {
  return `<defs>
    <linearGradient id="dv-feather" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#faf7f2"/><stop offset="1" stop-color="#c8bdad"/>
    </linearGradient>
    <linearGradient id="dv-covert" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".66" stop-color="#fcfaf6"/><stop offset="1" stop-color="#d9d0c2"/>
    </linearGradient>
    <linearGradient id="dv-far" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f0ebe2"/><stop offset="1" stop-color="#c3baab"/>
    </linearGradient>
    <linearGradient id="dv-tail" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#f1ece4"/><stop offset="1" stop-color="#bfb4a4"/>
    </linearGradient>
    <linearGradient id="dv-scapular" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f1ece3"/>
    </linearGradient>
    <linearGradient id="dv-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#fdfbf8"/><stop offset=".82" stop-color="#e6ded2"/><stop offset="1" stop-color="#b6ab9b"/>
    </linearGradient>
    <radialGradient id="dv-ao">
      <stop offset="0" stop-color="#a59a89" stop-opacity=".3"/><stop offset="1" stop-color="#a59a89" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="dv-throat" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a59a89" stop-opacity=".22"/><stop offset="1" stop-color="#a59a89" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="dv-beak" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d6a97f"/><stop offset="1" stop-color="#8f6a4d"/>
    </linearGradient>
    <clipPath id="dv-body-clip"><path d="${BODY}"/></clipPath>
  </defs>`;
}

export function doveMarkup() {
  return `${defs()}
    <g data-part="bird">
      <g transform="translate(238 186) scale(.8) rotate(-12)">${wing('far', 'dv-far', 'dv-far', 'dv-far')}</g>
      ${tail()}
      ${body()}
      ${head()}
      <g transform="translate(250 192) scale(.94)">${wing('near', 'dv-feather', 'dv-covert', 'dv-covert')}</g>
      ${scapulars()}
    </g>`;
}

/**
 * Wing position at a point in the wingbeat. `phase` is in radians; the wing is
 * at the bottom of its stroke at π/2. `effort` runs from 0 (gliding, wings held
 * open) to 1 (full flapping). The wing opens wide on the way down and folds at
 * the wrist on the way back up.
 */
export function wingPose(phase, effort) {
  const swing = Math.sin(phase);
  const fold = -Math.cos(phase);
  return {
    arm: lerp(20, 10, effort) + swing * lerp(1.5, 27, effort),
    hand: lerp(-8, 8, effort) + fold * lerp(1, 22, effort),
    depth: 1 - Math.max(0, swing) * 0.08 * effort,
    bob: -Math.sin(phase + 0.6) * 3 * effort,
  };
}

export function findWingParts(svg) {
  const part = (name) => svg.querySelector(`[data-part="${name}"]`);
  return {
    bird: part('bird'),
    nearArm: part('nearArm'),
    nearHand: part('nearHand'),
    farArm: part('farArm'),
    farHand: part('farHand'),
  };
}

export function applyWingPose(parts, phase, effort) {
  const near = wingPose(phase, effort);
  const far = wingPose(phase - 0.25, effort);
  parts.bird.setAttribute('transform', `translate(0 ${round(near.bob)})`);
  parts.nearArm.setAttribute('transform', `rotate(${round(near.arm)}) scale(1 ${round(near.depth)})`);
  parts.nearHand.setAttribute('transform', `rotate(${round(near.hand)})`);
  parts.farArm.setAttribute('transform', `rotate(${round(far.arm)})`);
  parts.farHand.setAttribute('transform', `rotate(${round(far.hand)})`);
}

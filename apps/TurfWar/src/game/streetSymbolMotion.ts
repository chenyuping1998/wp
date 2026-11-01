/** Articulation measured on Turf War's own ink drawings. No character rig. */
export const ease = (x: number) => {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
};
export const bell = (u: number) =>
  u < 0 || u > 1 ? 0 : Math.sin(Math.PI * u) ** 2;
export const MESH_SYMBOLS = new Set(["H1", "H3", "H4", "H5", "S"]);
export const streetEnergy = (ms: number, u: number, win: boolean) =>
  win ? ease(ms / 120) * (1 - ease((ms - 650) / 320)) : bell(u);
export function streetPoint(
  name: string,
  u: number,
  v: number,
  ms: number,
  actU = -1,
  win = false,
): [number, number] {
  const a = streetEnergy(ms, actU, win);
  const beat = win ? bell((ms - 80) / 250) + 0.65 * bell((ms - 440) / 280) : a;
  if (name === "S") {
    // The gasket/outer case stay fixed; only the interior speaker cones breathe.
    let dx = 0,
      dy = 0;
    for (const [cx, cy, rx, ry] of [
      [0.31, 0.655, 0.15, 0.18],
      [0.812, 0.696, 0.116, 0.15],
    ]) {
      const x = (u - cx) / rx,
        y = (v - cy) / ry,
        r = Math.hypot(x, y);
      const k = 0.14 * beat * (1 - ease((r - 0.3) / 0.65));
      dx += (u - cx) * k;
      dy += (v - cy) * k;
    }
    return [u + dx, v + dy];
  }
  if (name === "H1") {
    // Both upper ends are pinned. Pendant follows with delayed angular momentum.
    const swing = win
      ? Math.sin((ms - 90) / 130) * a
      : Math.sin(Math.max(0, actU) * Math.PI * 3) * a;
    const angle = 0.095 * swing * ease((v - 0.35) / 0.3),
      x = u - 0.5,
      y = v - 0.63;
    return [
      0.5 + x * Math.cos(angle) - y * Math.sin(angle),
      0.63 + x * Math.sin(angle) + y * Math.cos(angle),
    ];
  }
  if (name === "H3") {
    // Free bill edges riffle; the paper bands remain undistorted.
    const edge = (1 - ease((u - 0.25) / 0.3)) * ease((v - 0.12) / 0.15);
    return [
      u + 0.012 * a * Math.sin((ms / 400) * Math.PI * 2 + v * 18) * edge,
      v + 0.006 * a * Math.sin((ms / 800) * Math.PI * 2 + u * 23) * edge,
    ];
  }
  if (name === "H4") {
    // Crinkled PET body flexes below its rigid cap, away from the label.
    const body = ease((v - 0.2) / 0.14) * (1 - ease((v - 0.72) / 0.17));
    const label = 1 - 0.85 * bell((v - 0.34) / 0.29);
    return [
      u +
        (u - 0.5) *
          0.065 *
          Math.sin((ms / 800) * Math.PI * 2) *
          a *
          body *
          label,
      v,
    ];
  }
  if (name === "H5") {
    // Suspension lifts the bonnet/body relative to planted tires, not a squash.
    let body = 1 - ease((v - 0.49) / 0.22);
    for (const [cx, cy, rx, ry] of [
      [0.143, 0.582, 0.038, 0.064],
      [0.362, 0.622, 0.063, 0.09],
    ]) {
      const d = Math.hypot((u - cx) / rx, (v - cy) / ry);
      body *= ease((d - 0.85) / 0.5);
    }
    const front = ease((u - 0.17) / 0.65);
    const lift = win
      ? bell((ms - 80) / 340) + 0.45 * bell((ms - 480) / 300)
      : a;
    return [u, v - body * lift * (0.008 + 0.022 * front)];
  }
  return [u, v];
}
export type InkPath = [number, number][];
const circle = (x: number, y: number, r: number): InkPath =>
  Array.from({ length: 33 }, (_, i) => [
    x + r * Math.cos((i / 32) * Math.PI * 2),
    y + r * Math.sin((i / 32) * Math.PI * 2),
  ]);
// Centre-lines match the existing grey paint icons; no displaced duplicate ink.
export const TAG_PATHS: Record<string, InkPath[]> = {
  L1: [
    [
      [0.158, 0.35],
      [0.38, 0.475],
      [0.5, 0.268],
      [0.628, 0.475],
      [0.866, 0.35],
      [0.82, 0.684],
      [0.214, 0.684],
      [0.158, 0.35],
    ],
    [
      [0.25, 0.765],
      [0.785, 0.765],
    ],
  ],
  L2: [
    [
      [0.31, 0.214],
      [0.62, 0.214],
      [0.74, 0.27],
      [0.803, 0.421],
      [0.78, 0.578],
      [0.703, 0.65],
      [0.703, 0.745],
      [0.62, 0.785],
      [0.408, 0.785],
      [0.305, 0.738],
      [0.305, 0.651],
      [0.221, 0.57],
      [0.201, 0.416],
      [0.265, 0.27],
      [0.31, 0.214],
    ],
    circle(0.38, 0.456, 0.052),
    circle(0.637, 0.456, 0.052),
    [
      [0.474, 0.597],
      [0.511, 0.554],
      [0.548, 0.597],
    ],
    [
      [0.464, 0.724],
      [0.464, 0.78],
    ],
    [
      [0.565, 0.724],
      [0.565, 0.78],
    ],
  ],
  L3: [
    [
      [0.5, 0.195],
      [0.601, 0.397],
      [0.818, 0.43],
      [0.66, 0.584],
      [0.7, 0.802],
      [0.5, 0.7],
      [0.3, 0.802],
      [0.34, 0.584],
      [0.182, 0.43],
      [0.399, 0.397],
      [0.5, 0.195],
    ],
  ],
  L4: [
    [
      [0.676, 0.214],
      [0.355, 0.536],
      [0.574, 0.536],
      [0.404, 0.79],
      [0.795, 0.425],
      [0.582, 0.425],
      [0.676, 0.214],
    ],
  ],
};
export function tracePath(points: InkPath, p: number): InkPath {
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let remain = lengths.reduce((s, n) => s + n, 0) * Math.max(0, Math.min(1, p));
  const out: InkPath = [points[0]];
  for (let i = 0; i < lengths.length; i++) {
    const a = points[i],
      b = points[i + 1],
      d = lengths[i];
    if (remain >= d) {
      out.push(b);
      remain -= d;
    } else {
      const k = d ? remain / d : 0;
      out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
      break;
    }
  }
  return out;
}

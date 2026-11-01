import { streetPoint, MESH_SYMBOLS } from "../src/game/streetSymbolMotion.ts";
const area = (a, b, c) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
let min = Infinity,
  max = 0;
for (const name of MESH_SYMBOLS)
  for (const win of [false, true])
    for (let ms = 0; ms <= 970; ms += 16)
      for (let y = 0; y < 40; y++)
        for (let x = 0; x < 40; x++) {
          const a = [x / 40, y / 40],
            b = [(x + 1) / 40, y / 40],
            c = [x / 40, (y + 1) / 40],
            d = [(x + 1) / 40, (y + 1) / 40];
          for (const tri of [
            [a, b, c],
            [b, d, c],
          ]) {
            const q = tri.map(([u, v]) =>
              streetPoint(name, u, v, ms, ms / 970, win),
            );
            const r = area(...q) / area(...tri);
            min = Math.min(min, r);
            max = Math.max(max, r);
            if (!Number.isFinite(r) || r < 0.65 || r > 1.5)
              throw Error(`${name} ${win ? "win" : "idle"} ${ms}ms area ${r}`);
          }
        }
for (const name of MESH_SYMBOLS)
  for (const [u, v] of [
    [0.1, 0.1],
    [0.5, 0.5],
    [0.9, 0.9],
  ]) {
    const p = streetPoint(name, u, v, 970, -1, true);
    if (Math.hypot(p[0] - u, p[1] - v) > 1e-9)
      throw Error(`${name} does not settle`);
  }
console.log(
  `Street articulation OK: ${MESH_SYMBOLS.size} props, idle + win, 16ms sampling, 40x40 mesh; area ${(min * 100).toFixed(1)}–${(max * 100).toFixed(1)}%, zero inversions.`,
);

const { IDLE_SPECS } = await import("../src/game/symbolIdleMotion.ts");
const { SYMBOL_WIN_MOTION, HOLD_MS } = await import(
  "../src/game/symbolWinMotion.ts"
);
for (const [name, spec] of Object.entries(IDLE_SPECS)) {
  const rest = {
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    dx: 0,
    dy: 0,
    alpha: 1,
    ...spec.frame(-1, 0.2),
  };
  for (const u of [0, 1]) {
    const f = {
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      dx: 0,
      dy: 0,
      alpha: 1,
      ...spec.frame(u, 0.2),
    };
    for (const k of ["scaleX", "scaleY", "rotation", "dx", "dy", "alpha"])
      if (Math.abs(f[k] - rest[k]) > 1e-8)
        throw Error(`${name} idle seam ${u}: ${k}`);
  }
}
for (const [name, motion] of Object.entries(SYMBOL_WIN_MOTION))
  for (const t of [0, HOLD_MS, HOLD_MS + 16]) {
    const f = motion.frame(t);
    if (
      Math.abs(f.scaleX - 1) +
        Math.abs(f.scaleY - 1) +
        Math.abs(f.rotation) +
        Math.abs(f.dx) +
        Math.abs(f.dy) >
      1e-7
    )
      throw Error(`${name} win seam at ${t}`);
  }
console.log(
  "All 12 idle acts and win transforms start/end at their actual rest pose.",
);

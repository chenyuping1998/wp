// Sweep both triangles of the same 32x32 mesh used by RadioSymbolArt.
import { radioPoint } from "../src/game/radioSymbolMotion.ts";
const names = [
  "H1",
  "H2",
  "H3",
  "H4",
  "L1",
  "L2",
  "L3",
  "L4",
  "L5",
  "W",
  "S",
  "P",
];
let min = Infinity,
  max = 0;
const area = (a, b, c) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
for (const name of names)
  for (const win of [false, true])
    for (let ms = 0; ms <= 1400; ms += 16)
      for (let y = 0; y < 32; y++)
        for (let x = 0; x < 32; x++) {
          const a = [x / 32, y / 32],
            b = [(x + 1) / 32, y / 32],
            c = [x / 32, (y + 1) / 32],
            d = [(x + 1) / 32, (y + 1) / 32];
          for (const tri of [
            [a, b, c],
            [b, d, c],
          ]) {
            const q = tri.map(([u, v]) =>
              radioPoint(name, u, v, ms, ms / 1400, win),
            );
            const ratio = area(...q) / area(...tri);
            min = Math.min(min, ratio);
            max = Math.max(max, ratio);
            if (!Number.isFinite(ratio) || ratio < 0.65 || ratio > 1.5)
              throw Error(
                `${name} ${win ? "win" : "idle"} ${ms}ms area ${ratio}`,
              );
          }
        }
// New win articulation finishes at the exact resting drawing (except the steam,
// whose ambient loop intentionally continues).
for (const name of names.filter((n) => n !== "L1"))
  for (const [x, y] of [
    [0.1, 0.2],
    [0.5, 0.4],
    [0.9, 0.7],
  ]) {
    const q = radioPoint(name, x, y, 1400, -1, true);
    if (Math.hypot(q[0] - x, q[1] - y) > 1e-8)
      throw Error(`${name} does not settle`);
  }
console.log(
  `radio symbols OK: 12 symbols, idle + win, 16ms sampling; triangle area ${(min * 100).toFixed(1)}–${(max * 100).toFixed(1)}%, zero inversions`,
);

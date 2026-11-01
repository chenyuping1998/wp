/** Studio symbols: local articulation in the existing uncut ink artwork.
 * Texture coordinates stay continuous; hard cases never squash with the face.
 */
export const ease = (x: number) => {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
};
export const pulse = (u: number) =>
  u < 0 || u > 1 ? 0 : Math.sin(Math.PI * u) ** 2;
export const winEnvelope = (ms: number) =>
  ease((ms - 90) / 160) * (1 - ease((ms - 820) / 480));
export function radioPoint(
  name: string,
  u: number,
  v: number,
  ms: number,
  actU = -1,
  win = false,
): [number, number] {
  const a = win ? winEnvelope(ms) : pulse(actU);
  const beat = win
    ? Math.sin((ms - 210) / 115) * Math.exp(-Math.max(0, ms - 210) / 500) * a
    : Math.sin(actU * Math.PI * 4) * a;
  if (name.startsWith("H")) {
    const i = Number(name.slice(1));
    // Neck is a broad transition, while the face itself turns as a rigid region.
    const head = 1 - ease((v - 0.49) / 0.37);
    const angles = [0, 0.045, -0.065, 0.075, -0.04];
    const angle = (angles[i] * a + (i === 1 ? beat * 0.025 : 0)) * head;
    const x = u - 0.5,
      y = v - 0.73,
      c = Math.cos(angle),
      s = Math.sin(angle);
    let dx = x * c - y * s - x,
      dy = x * s + y * c - y;
    if (i === 1) dy += 0.018 * beat * head;
    if (i === 3) {
      dx += 0.018 * a * head;
      dy -= 0.02 * a * head;
    }
    if (i === 4) dy -= 0.022 * a * head;
    // Hair follows the head a fraction later, below the silhouette's fold limit.
    dx +=
      0.009 *
      Math.sin((ms / 1600) * Math.PI * 2 - 0.7) *
      a *
      (1 - ease(v / 0.27));
    return [u + dx, v + dy];
  }
  if (name === "L1") {
    // steam moves; ceramic cup keeps its shape
    const steam = 1 - ease((v - 0.21) / 0.18);
    return [
      u +
        steam *
          0.035 *
          Math.sin((ms / 2600) * Math.PI * 2 + v * 9) *
          (win ? 0.4 + 0.6 * a : 0.35 + 0.65 * a),
      v - steam * 0.012 * Math.sin((ms / 4000) * Math.PI * 2),
    ];
  }
  if (name === "L2") {
    // ear cups flex from the headband's crown
    const cup = ease((v - 0.22) / 0.43),
      side = Math.tanh((u - 0.5) / 0.15);
    return [u + side * cup * 0.026 * beat, v + cup * 0.01 * beat];
  }
  if (name === "L3") {
    // capsule rocks on its real hinge; handle stays planted
    const head = 1 - ease((v - 0.57) / 0.25),
      angle = 0.065 * beat * head;
    const x = u - 0.58,
      y = v - 0.72;
    return [
      0.58 + x * Math.cos(angle) - y * Math.sin(angle),
      0.72 + x * Math.sin(angle) + y * Math.cos(angle),
    ];
  }
  if (name === "L5") {
    // tongue/lace follow-through, sole planted
    const tongue = (1 - ease((v - 0.25) / 0.4)) * ease((u - 0.12) / 0.25);
    return [u + 0.017 * beat * tongue, v - 0.018 * a * tongue];
  }
  if (name === "W") {
    // mast flexes from its bolted base
    const tip = 1 - ease((v - 0.12) / 0.66);
    return [u + 0.02 * beat * tip * tip, v];
  }
  if (name === "P") {
    // only the free cable flexes, label/value stay rigid
    const cable = (1 - ease((u - 0.12) / 0.19)) * Math.sin(v * Math.PI);
    return [u - 0.012 * beat * cable, v];
  }
  return [u, v];
}

/** Reel centres/radii measured on these 500px source drawings, inside the rims. */
export const TAPE_REELS: Record<string, [number, number, number][]> = {
  S: [
    [0.356, 0.302, 0.188],
    [0.79, 0.314, 0.183],
  ],
  L4: [
    [0.329, 0.477, 0.061],
    [0.688, 0.353, 0.061],
  ],
};

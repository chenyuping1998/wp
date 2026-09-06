import type { Graphics as PixiGraphics } from 'pixi.js';

/**
 * The face of a sealed tablet — carved sandstone slab under a wax seal.
 *
 * PLACEHOLDER, and deliberately a vector one. There is no bespoke texture for M
 * yet; the alternative was leaving it pointed at `gbX`, the hold-and-spin blank,
 * which drew a plain X on the board and read as a missing symbol rather than as
 * something sealed. Vector costs nothing to ship, scales cleanly, and can be
 * thrown away wholesale the moment real art lands — it is only ever referenced
 * from the two places below.
 *
 * The palette is the one the game was specced in: sandstone and gold for the
 * slab, obsidian and lapis for the seal, matching the jackal-mask direction
 * agreed for Bananubis rather than inventing a third scheme.
 *
 * Go Bananas Boat has the same arrangement for its crates (crateArt.ts) and for
 * the same reason. If a reveal animation is added here later, it should draw the
 * lifting piece from THIS function so the frame before the seal breaks and the
 * frame after are the same shape — see MysteryReveal.svelte over there.
 */
export const TABLET_STONE = 0xc9b48c; // sandstone, sun-bleached
export const TABLET_STONE_INNER = 0xb09a72; // the carved-out panel, one step down
export const TABLET_GOLD = 0xffd75e; // gilt border
export const TABLET_SEAL = 0x241f1c; // obsidian wax seal
export const TABLET_LAPIS = 0x1f4e79; // the eye glyph struck into it

export const drawTabletFace = (g: PixiGraphics, size: number) => {
	const half = size / 2;
	const corner = size * 0.07;

	// the slab
	g.roundRect(-half, -half, size, size, corner);
	g.fill({ color: TABLET_STONE });

	// carved inner panel, inset — gives the flat fill an edge to catch light on
	// and stops the slab reading as a plain coloured square
	const inset = size * 0.11;
	g.roundRect(-half + inset, -half + inset, size - inset * 2, size - inset * 2, corner * 0.7);
	g.fill({ color: TABLET_STONE_INNER });
	g.roundRect(-half + inset, -half + inset, size - inset * 2, size - inset * 2, corner * 0.7);
	g.stroke({ width: size * 0.016, color: TABLET_GOLD, alpha: 0.55 });

	// the seal itself, struck over the middle of the panel
	g.circle(0, 0, size * 0.2);
	g.fill({ color: TABLET_SEAL });
	g.circle(0, 0, size * 0.2);
	g.stroke({ width: size * 0.022, color: TABLET_GOLD, alpha: 0.9 });

	// a jackal eye struck into the wax: almond outline, lapis iris, dark pupil.
	// Drawn small and central — it is the thing that cracks when the tablet
	// opens, so it wants to be the point the eye is already resting on.
	const eyeW = size * 0.13;
	const eyeH = size * 0.075;
	g.moveTo(-eyeW, 0);
	g.quadraticCurveTo(0, -eyeH, eyeW, 0);
	g.quadraticCurveTo(0, eyeH, -eyeW, 0);
	g.fill({ color: TABLET_LAPIS });
	g.circle(0, 0, size * 0.032);
	g.fill({ color: TABLET_SEAL });

	// two hairline scratches across the stone, so a board full of these does not
	// look like a board full of one repeated decal
	g.moveTo(-half * 0.55, -half * 0.72);
	g.lineTo(-half * 0.2, -half * 0.66);
	g.moveTo(half * 0.3, half * 0.68);
	g.lineTo(half * 0.62, half * 0.58);
	g.stroke({ width: size * 0.01, color: TABLET_STONE_INNER, alpha: 0.8 });
};

/**
 * Where the slab breaks, as x-offsets down its height — both halves read the
 * SAME profile, one mirrored, so they interlock exactly while they are still
 * sitting together and the fracture only becomes visible once they part.
 *
 * A straight split would read as the tablet being slid apart rather than
 * broken; the offsets are what make it stone.
 *
 * Entries are [y, x] as fractions of the slab's half-size.
 */
const FRACTURE: readonly (readonly [number, number])[] = [
	[-1, 0],
	[-0.64, 0.12],
	[-0.28, -0.08],
	[0.04, 0.14],
	[0.4, -0.06],
	[0.72, 0.1],
	[1, 0],
];

/**
 * One half of a broken tablet, for the moment after the seal gives.
 *
 * `side` is -1 for the left shard and 1 for the right. Drawn from the same
 * FRACTURE profile as its opposite number, so at rest the two are seamless and
 * the break only shows as they separate.
 *
 * Deliberately simpler than the intact face: no eye, no scratches, square
 * corners. These are on screen for about a fifth of a second, moving and
 * fading, and every detail added here is detail nobody can read — the
 * silhouette and the colour are the whole job.
 */
export const drawTabletShard = (g: PixiGraphics, size: number, side: -1 | 1) => {
	const half = size / 2;

	// down the fracture, then out around the outer edge and back
	g.moveTo(FRACTURE[0][1] * half, FRACTURE[0][0] * half);
	for (const [y, x] of FRACTURE.slice(1)) g.lineTo(x * half, y * half);
	g.lineTo(side * half, half);
	g.lineTo(side * half, -half);
	g.closePath();
	g.fill({ color: TABLET_STONE });

	// gilt border on the outer edge only — the fractured edge is raw stone,
	// which is what sells it as having just come apart
	g.moveTo(side * half, -half);
	g.lineTo(side * half, half);
	g.stroke({ width: size * 0.016, color: TABLET_GOLD, alpha: 0.55 });

	// half the wax seal, cut by the same break
	g.moveTo(0, -size * 0.2);
	g.arc(0, 0, size * 0.2, -Math.PI / 2, Math.PI / 2, side < 0);
	g.closePath();
	g.fill({ color: TABLET_SEAL });
};

/**
 * THE WIN BOUNCE, ON THE PICTURE — not on the tile.
 *
 * A capture of the live game showed the wins reading as symbols sitting still
 * under their frames, and the first answer (a bigger pop and hop on the whole
 * cell) was the wrong one: it bounced the slate plate and the ice frame too —
 * the BOARD jumping, not the picture. This puts the bounce where it belongs,
 * inside the mesh, layered over each symbol's own gesture:
 *
 *   CUT    (H1–H4) the subject, rigidly: it hops off its plate, squashes on
 *          each touchdown and stretches in the air, swells a little, and its
 *          drop shadow opens under it. The plate does not move. A rigid move
 *          distorts nothing, so it can be large.
 *   PANEL  (letters, W, S) the `panel` bone — everything inside the frame —
 *          the frame nailed down. The fade band round it is what stretches, so
 *          this is smaller, held to what check_mesh_wins lets it.
 *
 * Same rhythm in both: a hop per 2 x hitMs, decaying over a second, faded out
 * before the beat ends (meshRig.settled then lands it exactly on the drawing).
 */
import { flick, smoothstep, type MeshWinSpec, type Pose, type Rig } from './meshRig';

type Size = { hop: number; squash: number; pop: number; jelly: number };
/** canvas units (256 = the cell) and fractions */
const PANEL: Size = { hop: 7, squash: 0.05, pop: 0.035, jelly: 0.05 };
/** some panels have less room in their fade band than others: */
// swept against check_mesh_wins: each the largest that keeps every triangle
// over 55% of its area (S's fade band is the tightest — the bunch's corner)
const PANEL_SCALE: Record<string, number> = { L5: 0.6, W: 0.8, S: 0.3 };
const OUT_MS = 260;

// ── THE HIGHS: A TRICK IN THE AIR (after Go Boomana's highJump) ───────────────
//
// Each high pay already crouches, rises, lands and squashes on its own beats
// (h1Ushanka.ts ...) — but it rose 5-8 canvas units, 2-4px on screen, which
// the capture showed as nothing. Here its OWN jump is made big and each gets a
// trick at the top of it, so a line of highs is a little show and a player
// knows a high win before reading a number:
//
//   H1 ushanka  a backflip
//   H2 flare    no hop (it is stood on end) — it spins round on the spot like
//               a card being flipped, between its two tips
//   H3 sled     a spin the other way
//   H4 lantern  rocks nose-up / nose-down like something off a ramp
//
// All of it on the SUBJECT's rigid move: the plate stays where it is, and a
// rigid move distorts nothing — but it STAYS ON ITS CELL (Boom's lesson: a
// tile launched over its neighbour was asked to go), so the lift is modest
// and the size comes from the trick and the squash. Turns are about the
// picture's middle rather than its feet, so a flip turns over in place.
type Trick = {
	/** extra lift at the top of its own jump (canvas units), scaled by its air */
	lift: number;
	/** the trick's window, ms (its own rise to fall) */
	from: number;
	to: number;
	kind: 'flip' | 'card' | 'spin' | 'rock';
	/** how much bigger its own squash and stretch get */
	squash: number;
};
const TRICKS: Record<string, Trick> = {
	H1: { lift: 16, from: 300, to: 740, kind: 'flip', squash: 1.3 },
	H2: { lift: 0, from: 380, to: 720, kind: 'card', squash: 1.8 },
	H3: { lift: 16, from: 330, to: 800, kind: 'spin', squash: 1.6 },
	H4: { lift: 18, from: 300, to: 740, kind: 'rock', squash: 1.6 },
};
/** the swell toward the camera at the top of the jump */
const AIR_POP = 0.07;

const inOut = (v: number) => {
	const t = Math.max(0, Math.min(1, v));
	return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};

const bone = (rig: Rig, pose: Pose, name: string) => {
	const i = rig.bones.findIndex((b) => b.name === name);
	return i < 0 ? undefined : pose.bones[i];
};

export const envelope = (spec: MeshWinSpec, t: number) => {
	const period = 2 * Math.max(120, spec.hitMs);
	const phase = t <= 0 ? 0 : (t / period) % 1; // 0 at each touchdown
	const k =
		t <= 0
			? 0
			: Math.exp(-t / 1000) * smoothstep(t / 60) * (1 - smoothstep((t - (spec.durationMs - OUT_MS - 180)) / OUT_MS));
	return {
		/** 0..1, the height of the hop */
		air: Math.sin(Math.PI * phase) * k,
		/** 0..1, the flattening at each touchdown */
		contact: Math.exp(-((Math.min(phase, 1 - phase) / 0.14) ** 2)) * k,
		/** the swell: up on the first hit, easing down with the rest */
		pop: k,
	};
};

/** the high's trick layered onto its own rigid move */
const trick = (spec: MeshWinSpec, pose: Pose, t: number, tr: Trick) => {
	const r = pose.rigid;
	const air = pose.air;
	// its own squash and stretch, made bigger (deviation from 1, scaled)
	r.sx = 1 + (r.sx - 1) * tr.squash;
	r.sy = 1 + (r.sy - 1) * tr.squash;
	r.dy -= tr.lift * air;
	const p = inOut((t - tr.from) / (tr.to - tr.from));
	const on = t > tr.from && t < tr.to ? 1 : 0;
	let turn = 0;
	// A whole turn is 0 again once done — and it must SAY 0, not 360: the
	// settle at the end blends rot numerically toward 0, and a 360 left on it
	// spun the picture back round a full turn as the win ended.
	if (tr.kind === 'flip') turn = p < 1 ? -360 * p : 0;
	else if (tr.kind === 'spin') turn = p < 1 ? 360 * p : 0;
	else if (tr.kind === 'rock') turn = 14 * Math.sin(2 * Math.PI * p) * on;
	else {
		// the card: it turns edge-on and back twice, like a coin spun on a
		// table. Narrowed, never mirrored: a width through zero has a sign
		// flip in it, which is a jump, and a zero-width picture has no area
		const c = Math.abs(Math.cos(2 * Math.PI * p));
		r.sx *= 0.2 + 0.8 * c;
		// and a hop to turn in, since it cannot turn on the spot it stands on
		r.dy -= 14 * Math.sin(Math.PI * p);
		pose.air = Math.max(pose.air, Math.sin(Math.PI * p));
	}
	r.pop *= 1 + AIR_POP * Math.max(air, tr.kind === 'card' ? Math.sin(Math.PI * p) : 0);
	if (turn !== 0) {
		r.rot += turn;
		// about the picture's middle, not its feet: the turn moves the middle
		// round the feet by this much, so move it back
		const L = (spec.feetY - 40) / 2;
		const th = (turn * Math.PI) / 180;
		r.dx += -L * Math.sin(th) * r.pop;
		r.dy += (-L + L * Math.cos(th)) * r.pop;
	}
};

export const hopped = (spec: MeshWinSpec): MeshWinSpec => ({
	...spec,
	pose: (rig, t, amp) => {
		const pose = spec.pose(rig, t, amp);
		if (spec.mode === 'panel') {
			const e = envelope(spec, t);
			const p = bone(rig, pose, 'panel');
			if (!p) return pose;
			const s = PANEL_SCALE[spec.symbol] ?? 1;
			p.dy -= PANEL.hop * s * e.air;
			p.along *= 1 - PANEL.squash * s * e.contact + 0.5 * PANEL.squash * s * e.air + PANEL.pop * s * e.pop;
			p.across *= 1 + PANEL.squash * s * e.contact - 0.3 * PANEL.squash * s * e.air + PANEL.pop * s * e.pop;
			// JELLY: the first hit sets the inside of the frame wobbling, tall
			// then wide then tall, dying away — the panel's answer to the highs'
			// tricks, since a frame nailed down cannot leave its cell
			const fade = 1 - smoothstep((t - (spec.durationMs - OUT_MS - 180)) / OUT_MS);
			const jelly = PANEL.jelly * s * fade * flick(t, spec.hitMs, 4.2, 4.5);
			p.along *= 1 + jelly;
			p.across *= 1 - 0.8 * jelly;
			return pose;
		}
		const tr = TRICKS[spec.symbol];
		if (tr) trick(spec, pose, t, tr);
		return pose;
	},
});

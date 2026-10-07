/**
 * THE HIGH PAYS JUMP — INSIDE THEIR OWN CELL.
 *
 * H1-H4 (the scarab, the Eye, the chest, the ankh) are what a player hopes to
 * see win, so their win is the most cartoon thing on the board: the subject
 * crouches, springs up off its plate stretched along the motion, tilts and
 * bobs while it performs up there, drops back, splats wide on the landing and
 * rebounds once.
 *
 * AND IT NEVER LEAVES ITS CELL. A first version threw the whole tile three
 * quarters of a cell over the one above; that was too much. Now the plate
 * stays where it is and only the cut-out subject jumps, and every frame the
 * subject's top edge — its measured box pushed through the same rigid
 * transform the skinning uses — is held LEAP.margin px inside the tile: when
 * the jump would take it higher, the jump gives way. The gate
 * (design/check_mesh_wins.mjs) poses every frame and checks the box.
 *
 * Everything here is RIGID (pose.rigid), so none of it folds a triangle; the
 * cut-mode drop shadow on the plate already follows pose.air.
 *
 * IMPORTS ONLY TYPES AND meshRig: bare node poses it in the gate.
 */
import { CANVAS, type MeshWinSpec, type Pose, type RigidPose } from './meshRig';

/** each high pay's subject at rest, [x0, y0, x1, y1] in the 256 canvas —
 *  measured off *_subject.png (alpha > 40) */
export const SUBJECT_BOX: Record<string, [number, number, number, number]> = {
	H1: [66, 51, 190, 204],
	// the Eye's brow lifts 2px above its resting box while it acts
	H2: [43, 56, 211, 199],
	H3: [45, 52, 210, 211],
	H4: [71, 34, 184, 221],
};

export const LEAP = {
	/** px up at the top of the jump, before the cell clamps it */
	lift: 34,
	/** px of bob while it hangs */
	bob: 3,
	/** degrees of tilt in the air */
	tilt: 5,
	/** how much longer it gets along the motion, at most */
	stretch: 0.08,
	/** how much flatter on the landing */
	landSquash: 0.2,
	/** px of the rebound after the landing */
	rebound: 6,
	/** px the subject's top must stay inside the tile */
	margin: 8,
};

export type LeapState = { prevAir: number; prevT: number };
export const leapState = (): LeapState => ({ prevAir: 0, prevT: 0 });

/** where a point of the subject lands under the rigid transform — the same
 *  arithmetic as meshRig.skin's last step */
const place = (x: number, y: number, r: RigidPose, feetY: number): [number, number] => {
	const cx = CANVAS / 2, cy = CANVAS / 2;
	const th = (r.rot * Math.PI) / 180;
	let qx = cx + (x - cx) * r.sx;
	let qy = feetY + (y - feetY) * r.sy;
	const rx = qx - cx, ry = qy - feetY;
	qx = cx + rx * Math.cos(th) - ry * Math.sin(th);
	qy = feetY + rx * Math.sin(th) + ry * Math.cos(th);
	return [cx + (qx - cx) * r.pop + r.dx, cy + (qy - cy) * r.pop + r.dy];
};

/** the subject's box after the rigid transform: [left, top, right, bottom] */
export const subjectBounds = (spec: MeshWinSpec, r: RigidPose): [number, number, number, number] => {
	const [x0, y0, x1, y1] = SUBJECT_BOX[spec.symbol];
	const pts = [place(x0, y0, r, spec.feetY), place(x1, y0, r, spec.feetY), place(x0, y1, r, spec.feetY), place(x1, y1, r, spec.feetY)];
	return [
		Math.min(...pts.map((p) => p[0])),
		Math.min(...pts.map((p) => p[1])),
		Math.max(...pts.map((p) => p[0])),
		Math.max(...pts.map((p) => p[1])),
	];
};

/** Add the jump to a high pay's win pose, in place. `t` ms into the win. */
export const applyLeap = (spec: MeshWinSpec, pose: Pose, t: number, s: LeapState) => {
	if (!SUBJECT_BOX[spec.symbol]) return;
	const air = pose.air;
	// stretch along the motion, from how fast it is climbing or falling
	const vel = t > s.prevT ? Math.abs(air - s.prevAir) / ((t - s.prevT) / 1000) : 0;
	s.prevAir = air;
	s.prevT = t;
	const stretch = 1 + Math.min(LEAP.stretch, vel * 0.03);
	// after it lands: a splat, then one small rebound, both over before the win
	// ends (the static sprite takes the cell back on the drawing)
	const since = t - spec.landMs;
	const tail = Math.max(60, spec.durationMs - spec.landMs - 10);
	const splat = since > 0 && since < 120 ? Math.sin((Math.PI * since) / 120) : 0;
	const rebound = since > 40 && since < tail ? Math.sin((Math.PI * (since - 40)) / (tail - 40)) : 0;

	const r = pose.rigid;
	const squash = LEAP.landSquash * splat;
	r.sy *= (1 - squash) * stretch;
	r.sx *= (1 + 0.7 * squash) / Math.sqrt(stretch);
	r.rot += LEAP.tilt * air * Math.sin((2 * Math.PI * t) / 760);
	r.dy -= LEAP.lift * air + LEAP.bob * air ** 4 * Math.sin((2 * Math.PI * t) / 520) + LEAP.rebound * rebound;

	// ...and never out of its cell
	const top = subjectBounds(spec, r)[1];
	if (top < LEAP.margin) r.dy += LEAP.margin - top;
};

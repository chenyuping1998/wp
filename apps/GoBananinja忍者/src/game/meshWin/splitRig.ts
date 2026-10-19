/**
 * THE SPLIT TILES ACT TOO (2026-10-04). When the katana cuts a reel, each of
 * its cells shows its symbol TWICE on one tile — two smaller copies on a
 * diagonal, the lower-right one overlapping the other — and the maths counts
 * the cell twice. Those tiles won as flat pictures while every other symbol
 * leapt and flipped.
 *
 * The split art is painted, not composed, so nothing here assumes it is the
 * full symbol pasted twice. What it does use: design/fit_split_motifs.py
 * measured where each copy sits (splitFit.ts — a scale and an offset per copy)
 * and make_symbol_layers.py cut the split art itself into plate and subject
 * (h1s_*, ...), so the mesh draws the split tile's own pixels and the swap from
 * the static tile is seamless.
 *
 * The rig is the symbol's own rig, TWICE: every part of the full-size rig is
 * mapped into each copy's place (its distance field, pivot and joints scaled
 * and moved), the front copy's parts winning where the two overlap. The
 * acting is the symbol's own act, played on each copy — the front one 90ms
 * after the back, so they read as a pair rather than as one sticker — and both
 * share a small hop (they cannot leap out of the cell: the copies overlap, and
 * two subjects in the air with one gap between them tear it).
 *
 * Imports nothing outside this folder (the gate loads it under bare node).
 */
import {
	bump,
	buildRig,
	restPose,
	restRigid,
	settled,
	track,
	type MeshWinSpec,
	type PartSpec,
	type Point,
	type Rig,
} from './meshRig';
import { SPLIT_FIT } from './splitFit';

/** the front copy starts this much after the back one — less where the two
 *  copies overlap, since the gap between them is all the slack there is */
export const FRONT_DELAY = 90;
const OVERLAPPING = new Set(['H1', 'H3', 'H4', 'W']);
/** the copies act at this fraction of the full symbol's deformation: they are
 *  smaller, and two acting side by side share the air between them */
const DAMP_DEFAULT = 0.8;
const DAMP: Record<string, number> = { H1: 0.65, H3: 0.5, H4: 0.65 };
/** parts left out of a split rig: hidden behind the other copy (b_ = the back
 *  copy only), or too small at this size to show (the shuriken's jade) */
const SKIP: Record<string, string[]> = { H2: ['gem', 'b_blade_br'], H4: ['b_tassel_r'], W: ['b_scarf'] };
const PREFIX = ['b_', 'f_'];
const HOP = { crouch: 140, top: 430, land: 820 };

export const splitOf = (raw: MeshWinSpec): MeshWinSpec | undefined => {
	const fit = SPLIT_FIT[raw.symbol];
	if (!fit) return undefined;
	const base = settled(raw);
	const delay = OVERLAPPING.has(raw.symbol) ? 50 : FRONT_DELAY;
	const damp = DAMP[raw.symbol] ?? DAMP_DEFAULT;
	const skip = (m: number, name: string) => (SKIP[raw.symbol] ?? []).some((n) => n === name || n === PREFIX[m] + name);
	const panel = raw.mode === 'panel';
	// back first: the lower-right copy is the one painted over the other
	const motifs = Object.values(fit).sort((a, b) => a[1] + a[2] - (b[1] + b[2]));
	const own = (name: string) => panel && (name === 'frame' || name === 'panel');
	const parts: PartSpec[] = raw.rig.parts.filter((p) => own(p.name));
	motifs.forEach(([s, x, y], m) => {
		// The foreground gorilla faces left; its band tails stream right.
		const mirror = raw.symbol === 'W' && m === 1;
		const to = (p: Point): Point => [mirror ? 256 - (p[0] - x) / s : (p[0] - x) / s, (p[1] - y) / s];
		for (const P of raw.rig.parts) {
			if (own(P.name) || skip(m, P.name)) continue;
			const keep = P.keep;
			parts.push({
				name: PREFIX[m] + P.name,
				parent: P.parent === undefined ? undefined : own(P.parent) ? P.parent : PREFIX[m] + P.parent,
				pivot: [x + s * (mirror ? 256 - P.pivot[0] : P.pivot[0]), y + s * P.pivot[1]],
				axis: mirror && P.axis ? [-P.axis[0], P.axis[1]] : P.axis,
				dist: (p) => P.dist(to(p)) * s,
				keep: keep ? (p) => keep(to(p)) : undefined,
				priority: (P.priority ?? 0) * s + (m === 1 ? 4 : 0),
			});
		}
	});
	const limits: MeshWinSpec['limits'] = {};
	for (const part of parts) {
		const bare = part.name.replace(/^[bf]_/, '');
		const lim = raw.limits[bare];
		if (!lim) continue;
		limits[part.name] = raw.symbol === 'W' && part.name.startsWith('f_') ? { ...lim, pos: lim.neg, neg: lim.pos } : lim;
	}

	let baseRig: Rig | undefined;
	const map = new Map<Rig, number[][]>();
	const motifBones = (rig: Rig, br: Rig) => {
		let out = map.get(rig);
		if (!out) {
			out = [0, 1].map((m) => br.bones.map((b) => (own(b.name) ? -1 : rig.bones.findIndex((x) => x.name === PREFIX[m] + b.name))));
			map.set(rig, out);
		}
		return out;
	};

	return {
		...raw,
		symbol: `${raw.symbol}S`,
		key: `${raw.key}S`,
		sprite: panel ? `${raw.key}Split` : undefined,
		leaps: false,
		smear: undefined,
		durationMs: raw.durationMs + delay,
		landMs: panel ? raw.landMs : HOP.land,
		// the whole split tile is the portrait for the Wild
		inked: panel ? (p) => p[0] > 10 && p[0] < 246 && p[1] > 10 && p[1] < 246 : undefined,
		rig: { grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 64, rows: 64 }, soft: 4, parts },
		limits,
		pose: (rig, t, amp) => {
			baseRig ??= buildRig(raw.rig);
			const pose = restPose(rig);
			const idx = motifBones(rig, baseRig);
			let flash = 0, sheen = -1, plateHit = 1;
			motifs.forEach(([s], m) => {
				const sign = raw.symbol === 'W' && m === 1 ? -1 : 1;
				const bp = base.pose(baseRig!, Math.max(0, t - m * delay), amp);
				baseRig!.bones.forEach((b, i) => {
					const j = idx[m][i];
					const src = bp.bones[i];
					if (j < 0) {
						// the Wild's shared panel takes the back copy's move
						if (m === 0) {
							const k = rig.bones.findIndex((x) => x.name === b.name);
							if (k >= 0) Object.assign(pose.bones[k], src);
						}
						return;
					}
					const dst = pose.bones[j];
					dst.angle = src.angle * damp * sign;
					dst.along = 1 + (src.along - 1) * damp;
					dst.across = 1 + (src.across - 1) * damp;
					dst.dx = src.dx * s * damp * sign;
					dst.dy = src.dy * s * damp;
					// a copy's own rigid move (a letter's hop) is NOT moved onto its
					// root: two roots hopping out of step tore the gap between the
					// copies. The pair's shared hop below carries it instead.
				});
				flash = Math.max(flash, bp.flash);
				if (m === 1) sheen = bp.sheen;
				plateHit = Math.max(plateHit, bp.plateHit);
			});
			if (!panel) {
				// the pair hops together: a crouch, a small lift, a squash on the landing
				const air = track(t, [[0, 0], [HOP.crouch, 0], [HOP.top, 1, 'out'], [HOP.land, 0, 'in']]);
				pose.rigid = {
					...restRigid(),
					sx: 1 + 0.05 * bump(t, 40, HOP.crouch + 60) - 0.03 * air + 0.05 * bump(t, HOP.land - 20, HOP.land + 140),
					sy: 1 - 0.07 * bump(t, 40, HOP.crouch + 60) + 0.04 * air - 0.07 * bump(t, HOP.land - 20, HOP.land + 140),
					pop: 1 + 0.06 * air,
					dy: -16 * air,
				};
				pose.air = air;
				plateHit = Math.max(plateHit, 1 + 0.04 * bump(t, HOP.land - 20, HOP.land + 160));
			}
			pose.flash = flash;
			pose.sheen = sheen;
			pose.plateHit = plateHit;
			return pose;
		},
	};
};

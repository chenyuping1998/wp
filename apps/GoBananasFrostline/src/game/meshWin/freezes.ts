/**
 * THE REEL FREEZING OVER, ACTED BY ITS SYMBOLS (ExpandingWilds' freeze
 * takeover). The frost used to creep over a reel of symbols that sat there
 * like stickers while it covered them. Now the reel takes part:
 *
 *   ROAR    the Wild that landed announces it — he crouches, throws his head
 *           back with a bite on the banana, the goggles bounce, and the inside
 *           of his frame wobbles like jelly as he settles. Played the moment
 *           the takeover opens, on his own cell.
 *   FREEZE  every other symbol on the reel, the instant the frost front
 *           reaches its cell (frostTakeover.cellFrostStartMs): it FLINCHES as
 *           the cold hits — a jolt up and a cringe — then CHATTERS with cold,
 *           and STIFFENS as the ice takes it, coming to rest exactly on its
 *           drawing as the slab sets over it.
 *
 * Quiet acts, like a landing: inside the cell, no light, no frame, no sparks
 * (SymbolMeshWin's landing mode) — the frost and the slab are drawn over them.
 *
 * CUT symbols (the high pays) do it on the subject's rigid move, which distorts
 * nothing; PANEL symbols (letters, W, S) on the panel bone, held to what each
 * fade band lets it (check_mesh_wins gates every one, as `H1:freeze` …).
 */
import { bump, flick, ramp, restPose, smoothstep, track, type MeshWinSpec, type Pose, type Rig } from './meshRig';
import { H1 } from './h1Ushanka';
import { H2 } from './h2Flare';
import { H3 } from './h3Sled';
import { H4 } from './h4Lantern';
import { L1, L2, L3, L4, L5, W, S } from './panelWins';

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** the freeze, ms: flinch, chatter, stiffen */
export const FREEZE_MS = 1000;
/** the roar, ms */
export const ROAR_MS = 1150;

const quiet = (spec: MeshWinSpec, ms: number, act: (rig: Rig, pose: Pose, t: number) => void): MeshWinSpec => ({
	...spec,
	durationMs: ms,
	landMs: 0,
	hitMs: 0,
	landing: true,
	pose: (rig, t) => {
		const pose = restPose(rig);
		act(rig, pose, t);
		return pose;
	},
});

/** the freeze's three curves, 0 at both ends */
const freezeCurves = (t: number) => {
	// FLINCH: up and cringing as the cold hits, in 90ms, easing back over 300
	const flinch = track(t, [[0, 0], [90, 1, 'out'], [380, 0.35, 'inOut'], [760, 0, 'inOut']]);
	// CHATTER: a fast shake, ~15Hz, swelling in after the flinch and dying as
	// the ice stiffens it — gone by 820ms, so the last beat is still
	const shakeEnv = ramp(t, 80, 200) * (1 - smoothstep((t - 380) / 440));
	const chatter = Math.sin((2 * Math.PI * 15 * t) / 1000) * shakeEnv;
	return { flinch, chatter };
};

// the loose parts rattle with the chatter, each a little out of step — the
// cold shaking the thing, not the thing sliding about. Degrees per unit of
// chatter, inside each bone's limit.
const RATTLE: Record<string, [string, number, number][]> = {
	H1: [['flap_l', 5, 0], ['flap_r', -4, 0.8], ['goggles', 2.5, 1.6]],
	H2: [['cap', 3, 0.5], ['ring', 8, 1.2]],
	H3: [['lid', 2.6, 0.6], ['box', 1.5, 0]],
	H4: [['bail', 5, 0.9]],
};
const freezeCut = (spec: MeshWinSpec) =>
	quiet(spec, FREEZE_MS, (rig, pose, t) => {
		const { flinch, chatter } = freezeCurves(t);
		const shake = (phase: number) => {
			const c = freezeCurves(t - phase * 12);
			return c.chatter;
		};
		for (const [name, deg, phase] of RATTLE[spec.symbol] ?? []) bone(rig, pose, name).angle = deg * shake(phase);
		pose.rigid.dy = -9 * flinch;
		pose.rigid.sy = 1 - 0.1 * flinch;
		pose.rigid.sx = 1 + 0.06 * flinch;
		// a rigid move distorts nothing, so the chatter can be big enough to
		// read from across the board (3 units, ~1.5px, did not)
		pose.rigid.dx = 5.5 * chatter;
		pose.rigid.rot = 2.6 * chatter;
		pose.air = 0.4 * flinch;
	});

// the panel bone's room differs per symbol: S's fade band is the tightest
const PANEL_FREEZE: Record<string, number> = { S: 0.4, L5: 0.7, W: 0.8 };
const freezePanel = (spec: MeshWinSpec) =>
	quiet(spec, FREEZE_MS, (rig, pose, t) => {
		const k = PANEL_FREEZE[spec.symbol] ?? 1;
		const { flinch, chatter } = freezeCurves(t);
		const p = bone(rig, pose, 'panel');
		p.dy = -3 * k * flinch;
		p.along = 1 - 0.05 * k * flinch;
		p.across = 1 + 0.03 * k * flinch;
		p.dx = 1.6 * k * chatter;
	});

export const FREEZES: Record<string, MeshWinSpec> = {
	H1: freezeCut(H1),
	H2: freezeCut(H2),
	H3: freezeCut(H3),
	H4: freezeCut(H4),
	L1: freezePanel(L1),
	L2: freezePanel(L2),
	L3: freezePanel(L3),
	L4: freezePanel(L4),
	L5: freezePanel(L5),
	S: freezePanel(S),
	W: freezePanel(W),
};

/** the Wild that landed: the roar that opens the takeover */
export const ROARS: Record<string, MeshWinSpec> = {
	W: quiet(W, ROAR_MS, (rig, pose, t) => {
		const p = bone(rig, pose, 'panel');
		// crouch (squash), then thrown up tall on the roar, a jelly settle
		const crouch = bump(t, 0, 200);
		const rise = bump(t, 160, 620);
		const jelly = flick(t, 560, 4.2, 5) * (1 - smoothstep((t - 820) / 200));
		p.along = 1 - 0.05 * crouch + 0.06 * rise + 0.04 * jelly;
		p.across = 1 + 0.035 * crouch - 0.03 * rise - 0.03 * jelly;
		p.dy = 2 * crouch - 5 * rise;
		// the head goes back on the roar and shakes with it
		bone(rig, pose, 'head').angle = -1.35 * rise + 0.4 * Math.sin((2 * Math.PI * 11 * t) / 1000) * rise;
		// two hard bites on the banana
		bone(rig, pose, 'banana').angle = 4.2 * (bump(t, 200, 380) + bump(t, 420, 600)) - 1.2 * bump(t, 600, 860);
		// the goggles bounce on the jolt
		bone(rig, pose, 'goggles').angle = 3.2 * flick(t, 170, 3.4, 5) * (1 - smoothstep((t - 820) / 200));
	}),
};

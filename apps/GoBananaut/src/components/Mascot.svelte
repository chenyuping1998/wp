<script lang="ts" module>
	// Raised by the book handler, not derived here: whether a trigger counted as
	// four scatters is something only the book knows, and a component that had to
	// go and find that out would be reaching across the game to do it.
	export type EmitterEventMascot =
		| { type: 'mascotChestBeat' }
		// Raised by the transition as it begins, so the wind-up happens before the
		// canister exists. See THROW_RELEASE_MS there.
		| { type: 'mascotThrow' }
		// The goggle tease. Fired at the top of a round that is GOING to trigger
		// the feature — see playBet in src/game/utils.ts, which owns the coin flip.
		| { type: 'mascotGoggleTease' };
</script>

<script lang="ts">
	import { Container, Graphics, SpineProvider, SpineTrack } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { onDestroy } from 'svelte';

	import { getContext } from '../game/context';
	import { FRAME_SCALE } from '../game/constants';

	const context = getContext();

	// Skeleton units are the source PSD's pixels, and its origin sits on the
	// ground between the boots (design/generate_monkey_spine.mjs). So the figure
	// is 924 units from the floor to the top of his head, 546 across, and
	// positioning it means putting its FEET somewhere rather than working out
	// where the centre of a bounding box ought to go.
	//
	// EVERY NUMBER IN THIS BLOCK IS PRINTED BY THE GENERATOR. They were typed
	// here, and typed numbers survive a new PSD looking plausible while being
	// wrong — this delivery moved the canvas from 560x912 to 560x928 and rebuilt
	// the character inside it, and nothing about a stale 846 would have looked
	// like an error. Re-run the generator and copy its readout whenever the rig
	// changes; it prints ART, GOGGLE, the release point and both fists.
	const ART = { height: 924, width: 546 };

	// Where the canister leaves his hand, in skeleton units, printed by
	// design/generate_monkey_spine.mjs when it builds the 'throwit' animation:
	// the left hand at full extension.
	const RELEASE = { x: -426, y: 524 };

	// Below this there is no room to stand him next to the board without either
	// overlapping the frame or shrinking him to a thumbnail. Tablet (1000x1000)
	// and portrait (800x1422) both fall here, and he is simply absent — which is
	// the honest answer for those layouts, and better than a 90px smudge in the
	// margin.
	const MIN_GAP = 260;

	const placement = $derived.by(() => {
		const layout = context.stateLayoutDerived.mainLayout();
		const board = context.stateGameDerived.boardLayout();
		// BoardFrame draws the housing at FRAME_SCALE, which is PER AXIS — 1.3 wide
		// against 1.06 tall. It was a single 1.28 written out here, and when the
		// housing went asymmetric this kept claiming the frame was 28% taller than
		// the board: he was pushed down against the bet bar to clear an overhang
		// that is not there, and given 2% less room on the left than he has.
		const frameHalfWidth = (board.width * board.scale * FRAME_SCALE.x) / 2;
		const frameHalfHeight = (board.height * board.scale * FRAME_SCALE.y) / 2;

		// The bet bar's height in this layout's units, recovered from where
		// boardLayout has already centred the board above it, rather than by
		// importing the bar's own theme and re-deriving the same fraction twice.
		const barHeight = layout.height - board.y * 2;

		const gapLeft = board.x + frameHalfWidth;
		const gapWidth = layout.width - gapLeft;
		if (gapWidth < MIN_GAP) return null;

		// One scale, not a width and a height: setting both on a pixi container
		// sets scale.x and scale.y independently, and any rounding between the two
		// squashes him. Fit to whichever of the two limits bites first.
		const maxWidth = gapWidth * 0.86;
		const maxHeight = (layout.height - barHeight) * 0.94;
		const height = Math.min(maxHeight, (maxWidth * ART.height) / ART.width);

		return {
			x: gapLeft + gapWidth / 2,
			// Standing on the same line the board frame sits on, so he shares its
			// ground plane instead of floating at his own height. Clamped off the
			// bet bar, which on a short layout the frame's own foot reaches into.
			y: Math.min(board.y + frameHalfHeight, layout.height - barHeight - 6),
			scale: height / ART.height,
		};
	});

	// ── zero gravity, for the duration of the free game ──────────────────────
	//
	// He stands on the board frame's ground line all through the base game, which
	// is right: there is a floor in that backdrop and he is on it. The free game
	// is the other side of a hull breach — the transition ends with a gravity
	// charge going off — and a character still planted on the deck through it is
	// the one thing on screen insisting nothing happened.
	//
	// FOUR MOTIONS, none of them in the skeleton:
	//
	//   LIFT   a constant rise, so the feet actually clear the ground. This is the
	//          part that has to be unambiguous; a bob around the old position
	//          reads as breathing, not as floating.
	//   BOB    a slow rise and fall on top of it.
	//   SWAY   a slow horizontal drift.
	//   ROLL   a slow tilt, about his MIDDLE rather than his feet. A body with
	//          nothing under it turns about its own mass; pivoting at the ankles
	//          is what standing looks like, which is the read being removed.
	//
	// The three periods are deliberately not harmonics of each other, so the
	// combination never visibly repeats.
	//
	// DONE AS A TRANSFORM, NOT AS AN ANIMATION. The skeleton's tracks stay exactly
	// as they are, so the chest beat, the cheer and the nod all still play in
	// full — they simply play on a body that is off the ground. Adding a floating
	// idle to the rig instead would have meant a second copy of every reaction.
	// LIFT carries the FEET OFF THE GROUND and BOB is the swing on top of it, so
	// the trough — LIFT minus BOB — is the thing that must never approach zero.
	// At 70/62 the trough was 8 units and his boots brushed the deck at the bottom
	// of every cycle, which is the one thing this is for.
	//
	// Modelled against the two layouts this game draws him on, the feet end up:
	//
	//     1080 tall    41 .. 131 px up   (an 89px swing)
	//      800 tall    28 ..  88 px up   (a  60px swing)
	const FLOAT_LIFT = 100;
	const FLOAT_BOB = 52;
	// He recedes as he drifts, and that is not only a depth cue — it is what buys
	// the room for the swing above.
	//
	// placement fits him to 94% of the space over the bet bar, so his head has
	// about 50 layout units of clear air and no more. LIFT plus BOB's peak is 132
	// skeleton units, which at the sizes this game draws him is more than twice
	// that: without making room the bob would be squeezed to a twitch on exactly
	// the layouts that draw him biggest. Taking 8% off his height during the
	// feature frees roughly 70 units, which is what the full swing needs.
	const FLOAT_SHRINK = 0.1;
	const FLOAT_SWAY = 20;
	const FLOAT_ROLL = 0.045; // radians, ~2.6 degrees
	const BOB_MS = 3700;
	const SWAY_MS = 5300;
	const ROLL_MS = 6700;
	// Asymmetric on purpose: drifting up off the deck is a slow release, coming
	// back down when the feature ends is gravity returning and is quicker.
	const FLOAT_IN_MS = 1100;
	const FLOAT_OUT_MS = 700;

	// THE CLOCK IS KEPT TWICE, and it has to be.
	//
	// `floatClockRaw` / `floatLevelRaw` are plain variables the frame loop reads
	// and writes; `floatClock` / `floatLevel` are the $state copies the render
	// reads. The effect below must not READ a rune that its own frame writes —
	// the read makes the effect depend on it, the write re-runs the effect, and
	// the effect starts a new requestAnimationFrame chain on every single frame.
	// ReelLid shipped exactly that and the fix was exactly this split.
	let floatClockRaw = 0;
	let floatLevelRaw = 0;
	let floatClock = $state(0);
	let floatLevel = $state(0);
	let floatRaf = 0;

	$effect(() => {
		const t0 = performance.now() - floatClockRaw;
		let last = performance.now();
		const step = (now: number) => {
			floatClockRaw = now - t0;
			const dt = now - last;
			last = now;
			// Read inside the loop rather than as a dependency: this effect must not
			// re-subscribe every frame, and the target is the only thing it needs
			// from state.
			const target = context.stateGame.gameType === 'freegame' ? 1 : 0;
			const rate = dt / (target > floatLevelRaw ? FLOAT_IN_MS : FLOAT_OUT_MS);
			floatLevelRaw =
				target > floatLevelRaw
					? Math.min(target, floatLevelRaw + rate)
					: Math.max(target, floatLevelRaw - rate);
			floatClock = floatClockRaw;
			floatLevel = floatLevelRaw;
			floatRaf = requestAnimationFrame(step);
		};
		floatRaf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(floatRaf);
	});

	// Smoothstep on the level, so he does not arrive at the top of the lift with
	// the velocity he left the ground at.
	const floatEase = $derived(floatLevel * floatLevel * (3 - 2 * floatLevel));

	/**
	 * The float, in MAIN-LAYOUT units, plus the pivot it turns about.
	 *
	 * `midY` is half his drawn height: the container sits that far above his feet
	 * so the roll happens around his middle, and the contents are pushed back down
	 * by the same amount so nothing else moves.
	 */
	const floatXf = $derived.by(() => {
		if (!placement) return null;
		const e = floatEase;
		const t = floatClock;
		const scale = placement.scale * (1 - FLOAT_SHRINK * e);
		const midY = (ART.height / 2) * scale;

		// pixi y is down, skeleton y is up, so a lift SUBTRACTS
		const wanted =
			(FLOAT_LIFT + FLOAT_BOB * Math.sin((t / BOB_MS) * Math.PI * 2)) * scale * e;

		// FITTED TO THE HEADROOM, NOT CLIPPED TO IT.
		//
		// It was Math.min, which is a clip: on a layout with less room than the
		// swing wants, the top of every bob flattens into a hold and the motion
		// reads as a stutter rather than as a smaller float. Scaling the whole
		// wave by the same factor keeps it a sine and simply makes it shallower
		// where there is no room — which is the honest degradation.
		const room = Math.max(0, placement.y - ART.height * scale - 8);
		const peak = (FLOAT_LIFT + FLOAT_BOB) * scale * e;
		const fit = peak > room && peak > 0 ? room / peak : 1;

		const lift = wanted * fit;
		const sway = FLOAT_SWAY * Math.sin((t / SWAY_MS) * Math.PI * 2 + 1.7) * scale * e;
		const roll = FLOAT_ROLL * Math.sin((t / ROLL_MS) * Math.PI * 2 + 0.6) * e;
		return {
			midY,
			scale,
			x: placement.x + sway,
			y: placement.y - midY - lift,
			rotation: roll,
		};
	});

	// Publish the release point for the transition to spawn its canister at, in
	// main-layout coordinates. null when he is not on screen, which is how the
	// transition knows to fall back to dropping one in from above.
	// THE CLEAN-UP DOES NOT NULL THIS. That is the whole point of the change.
	//
	// It used to, and an effect's clean-up runs before every RE-RUN, not only on
	// unmount — so every time `placement` was recomputed the origin went null for
	// an instant and then came back. `placement` depends on boardLayout(), which
	// depends on gameType, which is changed by a transition's own cover. Any
	// transition that mounted inside that window read null, decided the mascot was
	// off screen, and dropped the canister in from above without ever telling him
	// to throw it — which is what "he doesn't throw when you buy Hold and Spin"
	// was: that mode's transition fires on the round's very first reveal, with far
	// less slack around it than the free-spin ones.
	//
	// Nulling on real unmount still happens, below, where it belongs.
	// THROUGH THE FLOAT, not through `placement`.
	//
	// The skill note for this rig is blunt about it: anything outside the skeleton
	// that needs to know where a hand is must read it back rather than recompute
	// it, because a stale release point spawns the prop where the hand used to be.
	// The float is exactly that kind of staleness — he is lifted, swaying and
	// rolled, and the hand is wherever those three put it.
	//
	// In practice he is on the deck for every transition the game currently makes
	// (both of them start in the base game), so this is belt and braces. It costs
	// four lines and it cannot go wrong later.
	$effect(() => {
		if (!placement || !floatXf) {
			context.stateGame.mascotThrowOrigin = null;
			return;
		}
		// the hand, in the floating container's own frame — at the FLOATING scale,
		// since he is drawn smaller while he drifts
		const lx = RELEASE.x * floatXf.scale;
		const ly = floatXf.midY - RELEASE.y * floatXf.scale;
		const cos = Math.cos(floatXf.rotation);
		const sin = Math.sin(floatXf.rotation);
		context.stateGame.mascotThrowOrigin = {
			x: floatXf.x + lx * cos - ly * sin,
			y: floatXf.y + lx * sin + ly * cos,
		};
	});

	// ── comic impacts on the chest beat ────────────────────────────────────
	//
	// Six strikes, six hits. These are drawn here rather than baked into the
	// skeleton because they are not part of the body: a Spine slot can only show
	// a drawing, and this wants to be generated - a different jag on every hit,
	// so six of them in a row do not read as the same stamp six times.
	//
	// The timings mirror design/generate_monkey_spine.mjs (BEAT_START 0.48,
	// BEAT_GAP 0.30). They are duplicated, which is a cost, and the alternative -
	// firing an event per strike out of an animation that has no event track -
	// would mean adding one to the skeleton for six numbers that have not moved.
	const BEAT_START_MS = 480;
	const BEAT_GAP_MS = 300;
	const BEATS = 6;
	const IMPACT_LIFE_MS = 280;
	// Where each fist lands, in skeleton units. Right takes beats 0/2/4, left
	// takes 1/3/5, matching which arm owns which strike in the skeleton.
	//
	// MEASURED, not guessed. design/generate_monkey_spine.mjs walks the bone chain
	// and prints the wrist's world position at the top of each strike:
	//
	//     beat     R fist at (60, 437)
	//              L fist at (-63, 380)
	//
	// The previous single point (50, 500) mirrored for both sides was a guess at a
	// pose from an earlier rig, and the two arms do not reach the same place — the
	// left is one rigid piece on a long lever, the right is a two-piece arm. Stars
	// were landing above and inboard of both fists, which is why the hits read as
	// decoration floating on his chest rather than as something he did.
	//
	// Re-print these whenever the beat's angles change.
	//
	// They CROSS on this character, and that is the artwork rather than a mistake.
	// The shoulder is 354 units above the fist and the pecs are 203 from the
	// shoulder, so a fist at chest height is either far outside the body or across
	// it — the only way to a fist on its OWN pec is about 114 degrees of elbow,
	// which is well past where this arm folds back on itself. Crossed-arm beating
	// is what a gorilla does anyway; the alternation is what makes it read, so
	// BEAT_OUT does the work of separating the two.
	// They are NOT mirror images of each other, and that is the drawing rather than
	// a bug: this delivery hangs the two arms at different heights, so the left
	// fist lands 66 units lower than the right. Read out, not assumed — a mirrored
	// pair would put half the impacts off the fist.
	const IMPACT_AT = {
		right: { x: -17, y: 390 },
		left: { x: 131, y: 437 },
	};
	// At 96 the star was two-thirds of his body width and stopped being a hit on
	// his chest — it became an explosion he happened to be standing behind. 84 is
	// 76 carried across to a character 8% taller, and no further: the warning above
	// is about the ratio, and the ratio has not changed.
	const IMPACT_R = 84;

	// Ink and fill of a printed panel: flat colour, hard black line, no gradient.
	const INK = 0x1a1206;
	const FLASH = 0xfff7d6;
	const GOLD = 0xffcf4a;

	let impactClock = $state(-1);
	let impactRaf = 0;

	const startImpacts = () => {
		cancelAnimationFrame(impactRaf);
		const t0 = performance.now();
		const end = BEAT_START_MS + (BEATS - 1) * BEAT_GAP_MS + IMPACT_LIFE_MS;
		const step = (now: number) => {
			impactClock = now - t0;
			if (impactClock >= end) {
				impactClock = -1;
				return;
			}
			impactRaf = requestAnimationFrame(step);
		};
		impactRaf = requestAnimationFrame(step);
	};
	// The throw's grunt is on a timer (it lands on the release, not on the
	// wind-up), so it can outlive the component if a resize takes him off screen
	// mid-throw.
	let voiceTimer = 0;
	onDestroy(() => {
		context.stateGame.mascotThrowOrigin = null;
		cancelAnimationFrame(impactRaf);
		cancelAnimationFrame(teaseRaf);
		clearTimeout(voiceTimer);
	});

	// A jagged star. `seed` varies the jag so no two hits are the same shape, and
	// it is derived from the beat index rather than random per frame — a star
	// that re-jags every frame is a boiling blob, not an impact.
	const starPoints = (cx: number, cy: number, outer: number, inner: number, spikes: number, seed: number) => {
		const pts: number[] = [];
		for (let i = 0; i < spikes * 2; i++) {
			const wobble = Math.sin(seed * 12.9898 + i * 4.1) * 0.5 + 0.5;
			const r = i % 2 === 0 ? outer * (0.78 + 0.22 * wobble) : inner * (0.7 + 0.3 * wobble);
			const a = (i / (spikes * 2)) * Math.PI * 2 + seed;
			pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
		}
		return pts;
	};

	// A tapered wedge, drawn as a triangle rather than stroked. A comic impact's
	// action lines are chisel strokes — wide where they leave the hit and coming
	// to a point — and a constant-width line reads as a diagram of an explosion
	// instead of a drawing of one.
	const wedge = (cx: number, cy: number, angle: number, r0: number, r1: number, halfWidth: number) => {
		const nx = -Math.sin(angle);
		const ny = Math.cos(angle);
		return [
			cx + Math.cos(angle) * r0 + nx * halfWidth,
			cy + Math.sin(angle) * r0 + ny * halfWidth,
			cx + Math.cos(angle) * r1,
			cy + Math.sin(angle) * r1,
			cx + Math.cos(angle) * r0 - nx * halfWidth,
			cy + Math.sin(angle) * r0 - ny * halfWidth,
		];
	};

	const drawImpacts = (g: PixiGraphics) => {
		g.clear();
		if (impactClock < 0) return;
		for (let i = 0; i < BEATS; i++) {
			const t = (impactClock - (BEAT_START_MS + i * BEAT_GAP_MS)) / IMPACT_LIFE_MS;
			if (t < 0 || t > 1) continue;
			// Snap out, hold, then go. A symmetric in-and-out reads as a pulse; an
			// impact has to arrive already at full size.
			const grow = t < 0.18 ? t / 0.18 : 1;
			const alpha = t < 0.62 ? 1 : 1 - (t - 0.62) / 0.38;
			const scale = 0.55 + 0.45 * grow + t * 0.35;
			// beat 0 is the right fist; the skeleton alternates from there
			const landing = i % 2 === 0 ? IMPACT_AT.right : IMPACT_AT.left;
			const seed = i * 1.7;
			// The hit KICKS, away from the body centre and slightly up — the
			// direction the force went. A star that stays exactly on the knuckles
			// for its whole life is a sticker; one that leaves the fist behind by a
			// few units is something that happened.
			const kick = 18 * scale * (t < 0.4 ? t / 0.4 : 1);
			const cx = landing.x + Math.sign(landing.x || 1) * kick;
			// pixi y is down, skeleton y is up
			const cy = -landing.y - kick * 0.5;

			// 1. THE SHOCK RING. Expands past the star and thins as it goes, which
			// is the part that gives the hit a size — the star alone reads as an
			// ornament pinned to his chest.
			const ring = IMPACT_R * scale * (0.7 + 1.5 * t);
			g.circle(cx, cy, ring);
			g.stroke({ width: 13 * scale * (1 - t), color: INK, alpha: alpha * 0.7 });

			// 2. ACTION LINES, under the star so it sits on top of them.
			for (let k = 0; k < 9; k++) {
				const a = seed * 0.6 + (k / 9) * Math.PI * 2;
				const r0 = IMPACT_R * 0.8 * scale;
				const r1 = r0 + (34 + 30 * (((k * 7919) % 11) / 11)) * scale;
				g.poly(wedge(cx, cy, a, r0, r1, 7 * scale));
				g.fill({ color: INK, alpha: alpha * 0.9 });
			}

			// 3. The outer star is drawn TWICE — once filled, once stroked. In pixi
			// v8 a fill() consumes the accumulated path, so a stroke() after it has
			// nothing left to outline.
			const outer = starPoints(cx, cy, IMPACT_R * scale, IMPACT_R * 0.46 * scale, 11, seed);
			g.poly(outer);
			g.fill({ color: GOLD, alpha });
			g.poly(outer);
			g.stroke({ width: 6 * scale, color: INK, alpha });

			const inner = starPoints(cx, cy, IMPACT_R * 0.56 * scale, IMPACT_R * 0.23 * scale, 9, seed + 0.9);
			g.poly(inner);
			g.fill({ color: FLASH, alpha });

			// 4. THE FLASH, and it is over almost before it starts. A comic panel
			// blows the hit out to white for a single frame; anything longer than
			// about a tenth of a second stops being a flash and becomes a glow, and
			// a glow on his chest for a quarter of a second is six pale blobs by the
			// end of the clip.
			if (t < 0.16) {
				const punch = 1 - t / 0.16;
				g.circle(cx, cy, IMPACT_R * 0.9 * scale * (0.5 + 0.9 * punch));
				g.fill({ color: FLASH, alpha: punch * 0.85 });
			}
		}
	};

	// ── the goggle tease ───────────────────────────────────────────────────
	//
	// A tell, not an announcement. The round already knows it is going to trigger
	// the feature; half the time the goggles warm up while the reels are still
	// turning, so a player who is watching him gets a second or two of knowing
	// before the scatters land.
	//
	// It is 50/50 on purpose. A tell that fires every single time is not a tell,
	// it is the result displayed early — the reels stop mattering. Firing half the
	// time means a lit visor is worth leaning in for and an unlit one means
	// nothing, which is the only way this reads as luck rather than as a spoiler.
	// It is also strictly one-directional: it never lights on a round that does
	// not trigger, so it can promise but never lie.
	//
	// Drawn here rather than tinted onto the Spine slot: the visor art is already
	// a lit green screen, and multiplying a colour over it can only make it
	// darker. A glow has to be added ON TOP, which a slot tint cannot do.
	//
	// The goggle plate in skeleton units. Printed by the generator, which finds the
	// `*_eye` layer by pattern — it was head_1_eye last delivery and head_3_eye in
	// this one, and a hard-coded box would have put the glow on his chin.
	const GOGGLE = { x: -12, y: 837, halfWidth: 117, halfHeight: 88 };
	const GOGGLE_GREEN = 0x63ff9c;
	// Slow in, hold, slow out. A visor that snaps on is a fault light; one that
	// warms up is a machine noticing something.
	const TEASE_IN_MS = 620;
	const TEASE_HOLD_MS = 900;
	const TEASE_OUT_MS = 760;
	const TEASE_LIFE_MS = TEASE_IN_MS + TEASE_HOLD_MS + TEASE_OUT_MS;
	// Deliberately low. This is meant to be noticed by someone looking at him, not
	// to pull the eye off the reels, which are where the round actually happens.
	const TEASE_PEAK = 0.5;

	let teaseClock = $state(-1);
	let teaseRaf = 0;

	const startTease = () => {
		cancelAnimationFrame(teaseRaf);
		const t0 = performance.now();
		const step = (now: number) => {
			teaseClock = now - t0;
			if (teaseClock >= TEASE_LIFE_MS) {
				teaseClock = -1;
				return;
			}
			teaseRaf = requestAnimationFrame(step);
		};
		teaseRaf = requestAnimationFrame(step);
	};

	const drawTease = (g: PixiGraphics) => {
		g.clear();
		if (teaseClock < 0) return;
		const t = teaseClock;
		const level =
			t < TEASE_IN_MS
				? t / TEASE_IN_MS
				: t < TEASE_IN_MS + TEASE_HOLD_MS
					? 1
					: 1 - (t - TEASE_IN_MS - TEASE_HOLD_MS) / TEASE_OUT_MS;
		// A slow breath on top of the envelope, so the hold is not a flat panel of
		// colour for the best part of a second.
		const breathe = 0.86 + 0.14 * Math.sin((t / 1000) * 5.2);
		const alpha = Math.max(0, level) * TEASE_PEAK * breathe;
		if (alpha <= 0.002) return;

		const cx = GOGGLE.x;
		const cy = -GOGGLE.y; // pixi y is down, skeleton y is up

		// Three passes, widest and faintest first: the bloom around the visor, the
		// plate itself, then a hot core. Rounded to match the goggle's own shape.
		const passes = [
			{ pad: 34, radius: 30, a: 0.28 },
			{ pad: 12, radius: 18, a: 0.5 },
			{ pad: -6, radius: 10, a: 1 },
		];
		for (const pass of passes) {
			const w = GOGGLE.halfWidth + pass.pad;
			const h = GOGGLE.halfHeight + pass.pad;
			g.roundRect(cx - w, cy - h, w * 2, h * 2, pass.radius);
			g.fill({ color: GOGGLE_GREEN, alpha: alpha * pass.a });
		}
	};

	// idle loops; cheer, chestbeat and nod are one-shots that return to it.
	// Transitions run off the track's own complete callback rather than timers, so
	// a one-shot cannot be cut short or leave him stuck in a pose because a frame
	// was dropped.
	let animationName = $state('idle');
	let loop = $state(true);
	const ONE_SHOTS = ['cheer', 'chestbeat', 'nod', 'throwit'];

	const play = (name: string, loops: boolean) => {
		animationName = name;
		loop = loops;
	};

	// He makes a noise for two things, and stays quiet for everything else.
	//
	// The nod is silent because it fires on most paying base spins, and a
	// character who vocalises that often is not alive, he is a notification
	// sound. The big-win cheer is silent for the opposite reason: that moment
	// already has a blast, a coin shimmer and a plaque counting up, and one more
	// voice in it was noise on top of a pile of noise rather than a reaction to
	// anything. He still jumps — the animation is the reaction.
	//
	// What is left are the two moments that are otherwise quiet enough to hear
	// him: squaring up for a four-scatter trigger, and the effort of the throw.
	const say = (name: 'roar' | 'effort') => {
		context.eventEmitter.broadcast({ type: 'soundMascotVoice', name });
	};

	context.eventEmitter.subscribeOnMount({
		winUpdate: ({ winLevelData }) => {
			// Only for a win the game is itself making a fuss about. Reacting to
			// every paying spin would have him bouncing through most of an 18-spin
			// feature, and a mascot who celebrates everything is celebrating
			// nothing.
			if (winLevelData.type !== 'big') return;
			// cheer ends standing, and that is the whole of it.
			//
			// It used to hand over to a looping 'celebrate' that held the arms up
			// while the plaque was on screen. The plaque waits for the player, so
			// "while the plaque is up" is unbounded, and the result was a character
			// standing with both arms in the air for as long as anyone looked away.
			// Held that long it stops reading as a celebration and starts reading as
			// something that has jammed.
			play('cheer', false);
		},
		// The gorilla, for the biggest way into the feature. Deliberately not the
		// same gesture as the win: using one celebration for "you are going in" and
		// "you won" makes both of them mean less.
		mascotChestBeat: () => {
			play('chestbeat', false);
			// one clip covering all six strikes, so the grunts cannot drift out of
			// sync with them
			say('roar');
			// no point running a clock for something with nowhere to be drawn
			if (placement) startImpacts();
		},

		// Interrupts whatever he was doing, unlike the others. A transition is the
		// scene being torn down; finishing a shrug first would put the wind-up
		// after the canister should already be in the air.
		// The glow is pinned to the goggles' REST position, so it is only correct
		// while the head is where the idle put it. That is the only state it fires
		// in anyway — the tease runs during the spin — but a big win landing on the
		// spin before would start a cheer, and the visor would be left glowing in
		// mid-air where his head used to be.
		mascotGoggleTease: () => {
			if (!placement) return;
			if (animationName !== 'idle') return;
			startTease();
		},

		mascotThrow: () => {
			play('throwit', false);
			// on the release, not on the wind-up
			clearTimeout(voiceTimer);
			voiceTimer = setTimeout(() => say('effort'), 520) as unknown as number;
		},

		// An ordinary base-game win. This is the common case by a wide margin, so
		// it is the smallest thing he does — see the 'nod' animation, which is
		// deliberately almost nothing.
		//
		// Only from idle. A win line resolving during a big-win presentation would
		// otherwise cut the celebration short with a shrug, and the free game is
		// excluded entirely: at up to 18 spins, most of them paying, a reaction per
		// win would be near-continuous and would stop meaning anything.
		winLinesShow: () => {
			if (context.stateGame.gameType !== 'basegame') return;
			if (animationName !== 'idle') return;
			play('nod', false);
		},
	});
</script>

{#if placement && floatXf}
	<!--
		THE FLOAT IS THE OUTER CONTAINER, and all three layers take it — the
		skeleton, the comic impacts and the visor tease. They were three siblings
		pinned to the same point; if only the skeleton floated, the chest beat's
		impacts would land where his fists used to be.

		zIndex moves out here with it: it is the wrapper that is now the sibling
		BoardFrame and the rest are sorted against.
	-->
	<Container
		x={floatXf.x}
		y={floatXf.y}
		rotation={floatXf.rotation}
		zIndex={-1}
	>
	<SpineProvider
		key="gbMonkey"
		x={0}
		y={floatXf.midY}
		scale={floatXf.scale}
	>
		<SpineTrack
			trackIndex={0}
			{animationName}
			{loop}
			{...{
				/*
				 * Cross-fade instead of cut. Every change of animation used to be a
				 * hard swap: idle stops mid-breath, cheer starts from its own first
				 * frame, and the pose jumps between the two on one frame.
				 *
				 * Short on purpose. This is a reaction set — a nod that fades in over
				 * a third of a second has missed the thing it was reacting to — so it
				 * is just long enough to cover the pop.
				 */
				mixDuration: 0.16,
			}}
			listener={{
				complete: (entry) => {
					const finished = entry.animation?.name;
					// idle loops, so complete fires on every pass — only the
					// one-shots have anywhere to go from here.
					if (finished && ONE_SHOTS.includes(finished)) play('idle', true);
				},
			}}
		/>
	</SpineProvider>

	<!--
		After the spine, so the hits land in front of him rather than inside him.
		Same origin and scale as the skeleton, so the impacts are placed in
		skeleton units and follow him at whatever size the layout gives him.
	-->
	<Container x={0} y={floatXf.midY} scale={floatXf.scale}>
		<Graphics draw={drawImpacts} />
	</Container>

	<!--
		Its own container so the tease is not caught by the impact graphics' clear.
		Same origin and scale as the skeleton, like the impacts.
	-->
	<Container x={0} y={floatXf.midY} scale={floatXf.scale}>
		<Graphics draw={drawTease} blendMode="add" />
	</Container>
	</Container>
{/if}

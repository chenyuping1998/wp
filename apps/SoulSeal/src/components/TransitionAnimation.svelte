<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';

	// The transition is a seal being struck.
	//
	// It has been re-themed twice, and both previous versions were the same
	// mistake: the effect belonged to the game the code came from, not to the game
	// on screen. First it was a bomb - the symbol dropped in, blinked, and blew up
	// in leaf-green shrapnel, inherited from a jungle title. Then it was a trading
	// halt: a price line ripped in from the left, topped out at the sigil and dove
	// off the bottom while red flooded up, with circuit-breaker shutters closing
	// over hazard stripes. A share price collapsing is a fine picture of a triple
	// witching. It is not a picture of anything that happens in this game.
	//
	// What actually happens here is that a spirit gets sealed, so that is what
	// plays:
	//
	//   ARM    the SOUL SEAL sigil drops in and locks on
	//   LOCK   the strike is called while the sigil pulses cinnabar
	//   SEAL   the sigil discharges - cinnabar rings drive outward, brush strokes
	//          radiate from it, and a storm of TALISMANS is thrown out of it,
	//          tumbling as they go
	//   FLOOD  the talismans keep coming until the paper fills the frame
	//   OPEN   they scatter away to reveal whatever is next
	//
	// Those are four separate beats and they are meant to be heard as four. The
	// cue belongs to LOCK, on its own, before anything moves: sigil, then sound,
	// then strike, then the storm.
	//
	// ── what covers the screen, and why that is not negotiable ──
	//
	// `oncover` is a PROMISE: while it runs the screen must show nothing, because
	// that is the window the caller tears the board down and rebuilds it in. Two
	// earlier versions got this wrong in the same way - the first blast peaked at
	// 95% white and cut on that frame, which is nearly opaque and therefore no
	// use at all.
	//
	// The version before this one solved it with circuit-breaker shutters closing
	// from top and bottom. They were genuinely solid, and they were also two doors
	// slamming - a machine's gesture in a game about paper and ink.
	//
	// So the cover is now the talismans' own doing. They are thrown outward from
	// the sigil, and as the storm thickens a wash rises behind them to full
	// opacity for the covered window. The wash is night blue rather than a flash:
	// a full-screen white peak is the one thing certification reliably objects to,
	// and a seal closing should darken rather than blind. What the player watches
	// through it is paper, not a fade.
	type Props = {
		/** Fired while the screen is fully covered. Change the scene here. */
		oncover?: () => void;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	const ARM_MS = 380; // sigil drops in from the top, face-on
	const LOCK_MS = 420; // armed: the cue sounds and the seal takes its charge
	const CRASH_MS = 460; // the sigil discharges and the first talismans fly
	const CLOSE_MS = 260; // the storm thickens until the frame is full
	const COVERED_MS = 100; // solid - the scene changes in here
	// The paper finishes, and only then does the board appear. See the two curves
	// in the open phase below: this window holds both, one after the other, which
	// is why it is longer than the throw it used to cross-fade with.
	const OPEN_MS = 560;

	const CRASH_AT = ARM_MS + LOCK_MS;
	const CLOSE_AT = CRASH_AT + CRASH_MS;
	const COVERED_AT = CLOSE_AT + CLOSE_MS;
	const OPEN_AT = COVERED_AT + COVERED_MS;
	const TOTAL_MS = OPEN_AT + OPEN_MS;

	// art-bible 2.1. Cinnabar is the seal's own ink; talisman-yellow is the paper.
	// Nothing here is green: the palette the two previous versions drew in was a
	// market's, and the only green this game allows is the spirit's own cyan,
	// which belongs to the spirits and not to an effect.
	const CINNABAR = 0xc8102e;
	const TALISMAN = 0xf2d544;
	const BRASS_HI = 0xd9a85c;
	const SHUTTER = 0x0b1420;

	// ── the seal's fire ───────────────────────────────────────────────────────
	//
	// This and the collect are both fire, and they are opposites on purpose - see
	// the note beside FLAME in Collect.svelte. Here it is WARM and it BURSTS: the
	// seal is struck and the paper takes light and is thrown outward. There it is
	// cold and it converges, because a spirit is being drawn in.
	//
	// A player should be able to tell which of the two is on screen from the
	// colour alone, without waiting to see which way anything is moving.
	//
	// Hottest LAST, like every other flame in this game: a fire's core is its
	// palest part.
	const FIRE = [0xc8102e, 0xff7a1a, 0xffcb6b, 0xfff3dc];
	// The seal's charge: indigo out to a near-white core. See drawSeal.
	const SEAL_DEEP = 0x3b2f7a;
	const SEAL_MID = 0x8f7fe0;
	const SEAL_PALE = 0xece5ff;
	const SEAL_MOTES = 6;

	let elapsed = 0;
	let rafId = 0;
	let completed = false;
	let covered = false;
	let alarmFired = false;
	let slamFired = false;

	let dropVisible = $state(false);
	let dropY = $state(0);
	let dropScale = $state(1);
	let dropTint = $state(0xffffff);
	/** 0..1 through the crash, -1 before it starts */
	let crashT = $state(-1);
	/** 0 = clear, 1 = the frame is full of paper. Drives the STORM. */
	let floodT = $state(0);
	/**
	 * 0 = clear, 1 = the screen is solid. Drives the WASH, and only the wash.
	 *
	 * Deliberately a separate value on a separate curve. The storm eases IN, which
	 * is right for it - the paper should arrive late and fast - but that pushes
	 * almost all of the change into the last few frames, and tying the wash to the
	 * same curve left it reaching full opacity 29ms before `oncover` fires. That is
	 * under two frames at 60Hz: drop one and the caller rebuilds the board while
	 * the screen is still see-through.
	 *
	 * The cover is a contract and the storm is a look. They do not share a curve.
	 */
	let washT = $state(0);

	const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
	const easeOutCubic = (t: number) => 1 - (1 - clamp01(t)) ** 3;
	const easeInCubic = (t: number) => clamp01(t) ** 3;


	// ── the talisman storm ────────────────────────────────────────────────────
	//
	// Deterministic, like everything else here: the same storm every play, because
	// a transition that throws a different shape each time reads as noise rather
	// than as the game's own punctuation. Seeded by index, not by Math.random.
	const TALISMAN_COUNT = 44;

	const talismans = Array.from({ length: TALISMAN_COUNT }, (_, i) => {
		// A cheap deterministic hash of the index, so the fan is irregular without
		// being random. Three different multipliers keep the three values from
		// moving together, which is what would make the storm look combed.
		const noise = (k: number) => ((Math.sin(i * k) * 43758.5453) % 1 + 1) % 1;
		return {
			// Spread around the full circle, jittered off the even spacing so they
			// do not read as spokes - the spokes are a separate figure above.
			angle: (Math.PI * 2 * i) / TALISMAN_COUNT + (noise(12.9898) - 0.5) * 0.5,
			// How far out it gets by the end, as a fraction of the canvas diagonal.
			// Past 1 leaves the frame, which most of them do.
			reach: 0.55 + noise(78.233) * 0.85,
			// Size, tumble rate and launch delay.
			size: 0.7 + noise(37.719) * 0.7,
			spin: 2.4 + noise(93.989) * 4.2,
			// Launch delay. Kept under half the throw: with the open phase now
			// holding the cover until the storm has cleared, a slip that launches
			// later than this is still near the middle when the paper is asked to be
			// gone, and it vanishes on the spot instead of leaving the frame.
			delay: noise(11.137) * 0.42,
			// which way it tumbles
			sense: i % 2 === 0 ? 1 : -1,
			// ── what makes it paper rather than shrapnel ──
			//
			// The first pass gave every slip the same easing and the same upright
			// lean, so forty-four of them left the sigil as one expanding ring of
			// rectangles - the motion of a shockwave, not of paper thrown into the
			// air.
			//
			// DRAG varies how sharply each one loses its launch speed, so the ring
			// breaks up almost immediately: the light ones run out ahead and the
			// heavy ones are still near the middle when the frame fills.
			drag: 1.6 + noise(24.611) * 2.2,
			// SINK is gravity, as a fraction of the diagonal by the end. Small, and
			// scaled by the same noise as drag so a slip that hangs also falls
			// further - which is what a light object does.
			sink: 0.04 + noise(24.611) * 0.1,
			// FLUTTER is the wobble on the lean. A slip of paper turning over does
			// not keep one attitude; it rocks as it goes.
			flutter: 0.5 + noise(58.317) * 0.9,
		};
	});

	onMount(() => {
		let last = 0;
		const tick = (now: number) => {
			if (!last) last = now;
			elapsed += now - last;
			last = now;

			const h = context.stateLayoutDerived.canvasSizes().height;

			if (elapsed < ARM_MS) {
				const p = easeOutCubic(elapsed / ARM_MS);
				dropVisible = true;
				dropY = -h * 0.72 * (1 - p);
				dropScale = 0.7 + p * 0.5;
				dropTint = 0xffffff;
			} else if (elapsed < CRASH_AT) {
				// Armed on the spot: the alarm sounds and the seal charges.
				//
				// The alarm fires HERE, not with the crash below. The beat is: the
				// seal arrives, it sounds, and only then does the spirit go.
				// Firing it with the line meant the sound and the picture landed
				// together and the sigil's whole entrance played in silence.
				//
				// It used to BLINK RED and throb: dropTint switched between cinnabar
				// and white six times a second while dropScale breathed. That is a
				// hazard light. The seal is a painted object, and the charge drawn
				// behind it now says everything the blink was saying, so the sprite
				// holds still in its own colours and lets the charge do the work.
				if (!alarmFired) {
					alarmFired = true;
					context.eventEmitter.broadcast({ type: 'soundAlarm' });
				}
				dropVisible = true;
				dropY = 0;
				dropScale = 1.2;
				dropTint = 0xffffff;
			} else if (elapsed < CLOSE_AT) {
				crashT = (elapsed - CRASH_AT) / CRASH_MS;
				dropVisible = true;
				dropY = 0;
				// settling back as it discharges
				dropScale = 1.26 - 0.16 * crashT;
				dropTint = 0xffffff;
			} else {
				crashT = 1;
				if (!slamFired) {
					slamFired = true;
					context.eventEmitter.broadcast({ type: 'soundSlam' });
					context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1.4 });
				}
				if (elapsed < COVERED_AT) {
					// the storm thickens - easeIn, so the frame fills late and fast
					dropVisible = true;
					const through = (elapsed - CLOSE_AT) / CLOSE_MS;
					floodT = easeInCubic(through);
					// the wash runs LINEARLY and finishes early, so it is solid well
					// before the covered window opens
					washT = clamp01(through / 0.6);
				} else if (elapsed < OPEN_AT) {
					dropVisible = false;
					floodT = 1;
					washT = 1;
					if (!covered) {
						covered = true;
						props.oncover?.();
					}
				} else {
					dropVisible = false;
					// ── the paper first, the board after ──────────────────────────
					//
					// These used to be the same curve: the storm and the cover faded
					// together, so the board came up THROUGH a screen still full of
					// flying talismans and the last of the throw played over it. The
					// paper never finished; it was interrupted by the thing it was
					// supposed to be hiding.
					//
					// Now they run in sequence. The storm clears over the first three
					// quarters of the window, and the cover only starts to lift once
					// it is nearly gone - so the throw completes against a solid
					// ground, and the board is revealed to a screen that is already
					// empty.
					const back = (elapsed - OPEN_AT) / OPEN_MS;
					floodT = 1 - easeOutCubic(clamp01(back / 0.75));
					washT = 1 - easeInCubic(clamp01((back - 0.62) / 0.38));
				}
			}

			if (elapsed >= TOTAL_MS) {
				if (!completed) {
					completed = true;
					// Belt and braces: a caller that passed oncover must always get it,
					// even if a frame was dropped across the covered window.
					if (!covered) {
						covered = true;
						props.oncover?.();
					}
					props.oncomplete();
				}
				return;
			}

			rafId = requestAnimationFrame(tick);
		};

		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	});

	const drawSeal = (g: PixiGraphics) => {
		g.clear();
		if (crashT < 0) return;
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const diagonal = Math.sqrt(width * width + height * height);

		// The charge at the seal.
		//
		// This has been two things and both were a RED EXPLOSION: first a flat
		// cinnabar wash spreading from the middle, then the same stack of discs run
		// through the fire ramp so the edge was cinnabar and the middle white-hot.
		// The second is a better picture of a fire and still the wrong picture -
		// what fills the screen as the feature opens should not be the colour of an
		// alarm.
		//
		// So it is the SCATTER'S OWN CHARGE, the construction ScatterTrigger draws
		// round a landed scatter: stacked low-alpha rings that breathe, with motes
		// going round them. The transition is the same event one beat later, and
		// carrying the same figure across the cut is what ties the two together.
		//
		// In a different colour, though. ScatterTrigger charges in candle and brass
		// because it is drawn on the board among the symbols and has to stay out of
		// the spirits' cyan. Here the board is already gone, so the seal discharges
		// in INDIGO - the night sky the courtyard stands under, and the one strong
		// colour in this game not already spoken for: cyan is the spirits', teal is
		// the collect's, candle is the trigger's, cinnabar is the ink's.
		const wash = clamp01((crashT - 0.15) / 0.85);
		if (wash > 0) {
			const breathe = 0.5 + 0.5 * Math.sin(crashT * Math.PI * 3);
			const reach = diagonal * 0.44 * wash;

			// The halo: three rings, widest and faintest first, so the falloff reads
			// as light rather than as outlines.
			for (const [mult, width, alpha] of [
				[1.0, reach * 0.5, 0.1],
				[0.72, reach * 0.36, 0.15],
				[0.5, reach * 0.24, 0.2],
			] as [number, number, number][]) {
				g.circle(0, 0, reach * mult);
				g.stroke({
					width,
					color: mult > 0.6 ? SEAL_DEEP : SEAL_MID,
					alpha: alpha * wash * (0.6 + 0.4 * breathe),
				});
			}

			// The motes, at transition scale. Same idea as the trigger's four: a
			// halo alone is a glow, something going round it is a thing being held.
			const orbit = crashT * Math.PI * 2.2;
			for (let i = 0; i < SEAL_MOTES; i += 1) {
				const angle = orbit + (Math.PI * 2 * i) / SEAL_MOTES;
				const ring = reach * (0.78 + 0.06 * Math.sin(orbit * 2 + i));
				const mx = Math.cos(angle) * ring;
				const my = Math.sin(angle) * ring;
				const size = diagonal * 0.006 * (0.7 + 0.3 * Math.sin(orbit * 3 + i));
				g.circle(mx, my, size * 2.1);
				g.fill({ color: SEAL_MID, alpha: 0.22 * wash * (0.6 + 0.4 * breathe) });
				g.circle(mx, my, size);
				g.fill({ color: SEAL_PALE, alpha: 0.75 * wash * (0.6 + 0.4 * breathe) });
			}
		}

		// NO RINGS.
		//
		// Two cinnabar rings used to drive outward from the sigil here, offset in
		// time so the discharge read as a pulse. On its own that is a fine piece of
		// geometry; over a painted board it is two enormous red circles expanding
		// across the screen, which is what every effects library does by default
		// and looked like it.
		//
		// The paper does the work instead. Forty-four talismans thrown out of a
		// seal is a picture of a specific thing happening; a ring is a picture of
		// "an effect".

		// The storm. Each talisman is a rounded slip with a cinnabar column down it,
		// drawn as a rotated quad rather than as a sprite - Graphics has no
		// per-shape transform, so the four corners are rotated by hand.
		//
		// The tumble is faked the way design/generate_talisman_spin.mjs bakes it
		// into the burst sheet: a slip rotating about its own long axis is the same
		// slip at cos(theta) of its width. One cheap multiply buys a piece of paper
		// turning over in the air instead of a rectangle sliding sideways.
		const stormT = clamp01((crashT - 0.05) / 0.95);
		if (stormT > 0) {
			drawStorm(g, stormT, diagonal, 1);
		}

		// NO SPOKES.
		//
		// Eight tapering brush strokes used to drive out of the sigil on the compass
		// points, three passes each. They started at half the canvas diagonal, which
		// was an asterisk drawn over the board; shortening them to 0.24 made them
		// jets rather than bars, and they were still eight radiating lines in fire
		// colours coming out of the middle of the screen.
		//
		// The talismans are the radiating thing. Forty-four slips thrown out of a
		// seal already say this is coming from here, and they say it as an object
		// rather than as a graphic. Anything else on the same rays is a second and
		// worse drawing of the same idea.
	};

	/**
	 * The talisman storm.
	 *
	 * `t` is 0..1 through the throw; `alpha` scales the whole thing so the same
	 * routine can draw the opening burst and the thickening flood.
	 */
	// Per-pass alpha for the four-colour fire ramp, scaled by the whole storm's
	// alpha. Named rather than inlined because both the tongue and the ember use
	// it and they must agree.
	const FIRE_ALPHA = [0.34, 0.5, 0.66, 0.9];

	const drawStorm = (g: PixiGraphics, t: number, diagonal: number, alpha: number) => {
		const alphaOf = (pass: number) => FIRE_ALPHA[pass] * alpha;
		for (const slip of talismans) {
			// each launches on its own delay, then runs to its own reach
			const local = clamp01((t - slip.delay) / (1 - slip.delay));
			if (local <= 0) continue;
			// Per-slip drag rather than one shared ease: 1 - e^(-k t) normalised, so
			// each slip has its own deceleration curve and the ring they left in
			// comes apart on its own.
			const travelled = (1 - Math.exp(-slip.drag * local)) / (1 - Math.exp(-slip.drag));
			const distance = diagonal * 0.5 * slip.reach * travelled;
			const cx = Math.cos(slip.angle) * distance;
			// gravity, growing with the square of time the way it does
			const cy = Math.sin(slip.angle) * distance + diagonal * slip.sink * local * local;

			// Tumble about the long axis: the visible width narrows to nothing and
			// opens out again, which is what a slip of paper turning over does.
			// Driven by `local` and not by distance, so a slip that has stopped
			// travelling is still turning - the two are not the same motion.
			const theta = local * slip.spin * Math.PI * 2 * slip.sense;
			const halfW = diagonal * 0.016 * slip.size * Math.abs(Math.cos(theta));
			const halfH = diagonal * 0.034 * slip.size;
			// The slip leans, rocks, and settles toward its direction of travel as it
			// slows - paper turns to face where it is going.
			const lean =
				slip.angle +
				Math.PI / 2 +
				Math.sin(theta * 0.7) * slip.flutter * (1 - travelled * 0.5);
			const cos = Math.cos(lean);
			const sin = Math.sin(lean);
			const at = (u: number, v: number): [number, number] => [
				cx + u * halfW * cos - v * halfH * sin,
				cy + u * halfW * sin + v * halfH * cos,
			];

			// ── the flame it trails ──────────────────────────────────────────
			//
			// Drawn BEFORE the slip, so the paper sits in front of its own fire.
			//
			// The tongue points back along the direction of travel and shortens as
			// the slip slows, which is what a trailing flame does - it is left
			// behind by speed, so when the speed goes, so does it. Length comes from
			// the derivative of the drag curve rather than from a timer, so a slip
			// that is still moving is still burning and one that has stopped is not.
			const speed = slip.drag * Math.exp(-slip.drag * local) / (1 - Math.exp(-slip.drag));
			const tongue = diagonal * 0.055 * slip.size * Math.min(1, speed * 0.55);
			if (tongue > 1) {
				const backX = -Math.cos(slip.angle);
				const backY = -Math.sin(slip.angle);
				FIRE.forEach((colour, pass) => {
					const reach = tongue * [1, 0.72, 0.46, 0.22][pass];
					const width = halfH * [0.9, 0.66, 0.42, 0.2][pass];
					g.moveTo(cx, cy);
					g.lineTo(cx + backX * reach, cy + backY * reach);
					g.stroke({
						width: Math.max(1, width),
						color: colour,
						alpha: alphaOf(pass) * (1 - local * 0.3),
						cap: 'round',
					});
				});
			}

			const [ax, ay] = at(-1, -1);
			const [bx, by] = at(1, -1);
			const [dx2, dy2] = at(1, 1);
			const [ex, ey] = at(-1, 1);
			g.moveTo(ax, ay);
			g.lineTo(bx, by);
			g.lineTo(dx2, dy2);
			g.lineTo(ex, ey);
			g.closePath();
			// Face-on it is lit paper; edge-on it is the paper's dark edge. Driven
			// by the same cosine as the width, so the two agree.
			const face = Math.abs(Math.cos(theta));
			g.fill({
				color: face > 0.25 ? TALISMAN : BRASS_HI,
				alpha: alpha * (0.55 + 0.4 * face) * (1 - local * 0.15),
			});

			// the cinnabar column down the middle, only while the face is readable
			if (face > 0.4) {
				const [mx0, my0] = at(0, -0.6);
				const [mx1, my1] = at(0, 0.6);
				g.moveTo(mx0, my0);
				g.lineTo(mx1, my1);
				g.stroke({
					width: Math.max(1, halfW * 0.5),
					color: CINNABAR,
					alpha: alpha * 0.85,
					cap: 'round',
				});
			}
		}
	};

	/**
	 * The flood: the storm at full density over a wash that reaches full opacity.
	 *
	 * The WASH is the part that has to be exactly right. `oncover` promises the
	 * screen shows nothing, so at floodT = 1 this must be opaque - not 0.95, not
	 * "visually opaque". The ramp is deliberately steep and reaches 1 before the
	 * covered window opens, and the rect is drawn wide enough to overshoot a canvas
	 * that is wider than the layout box.
	 */
	const drawFlood = (g: PixiGraphics) => {
		g.clear();
		if (floodT <= 0 && washT <= 0) return;
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const diagonal = Math.sqrt(width * width + height * height);

		// washT is already the ramp; see its declaration for why it is not floodT.
		// Drawn wider than the canvas because the canvas can be wider than the
		// layout box this container is centred in.
		g.rect(-width * 0.6, -height * 0.6, width * 1.2, height * 1.2);
		g.fill({ color: SHUTTER, alpha: washT });

		// The storm keeps running over the wash, so the cover is watched through
		// paper rather than through a fade. It thins with floodT on the way out,
		// which is what makes the end read as the paper scattering rather than as a
		// dissolve - and because floodT now reaches zero BEFORE the wash starts to
		// lift, the scattering finishes on its own before the board is under it.
		drawStorm(g, 0.35 + floodT * 0.65, diagonal, Math.min(1, floodT * 1.6));
	};

</script>

<Container
	x={context.stateLayoutDerived.canvasSizes().width * 0.5}
	y={context.stateLayoutDerived.canvasSizes().height * 0.5}
>
	<Graphics draw={drawSeal} />

	{#if dropVisible}
		<Sprite
			key="mcS"
			anchor={0.5}
			x={0}
			y={dropY}
			width={context.stateLayoutDerived.canvasSizes().height * 0.2 * dropScale}
			height={context.stateLayoutDerived.canvasSizes().height * 0.2 * dropScale}
			tint={dropTint}
		/>
	{/if}

	<Graphics draw={drawFlood} />
</Container>

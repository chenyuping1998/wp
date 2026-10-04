<script lang="ts" module>
	// Raised by the book handler, not derived here: whether a trigger counted as
	// four scatters is something only the book knows, and a component that had to
	// go and find that out would be reaching across the game to do it.
	export type EmitterEventMascot =
		| { type: 'mascotChestBeat' }
		// Raised by the transition as it begins, so the wind-up happens before the
		// dynamite exists. See THROW_RELEASE_MS there.
		| { type: 'mascotThrow' }
		// The goggle tease. Fired at the top of a round that is GOING to trigger
		// the feature — see playBet in src/game/utils.ts, which owns the coin flip.
		| { type: 'mascotGoggleTease' };
</script>

<script lang="ts">
	import { Container, Graphics, SpineProvider, SpineTrack, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { DropShadowFilter } from 'pixi-filters';

	import { onDestroy } from 'svelte';

	import { getContext } from '../game/context';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';

	const context = getContext();

	// TWO CASTS, ONE SKELETON (Go Banandit): the Bandit stands beside the board
	// in the base game, the Lookout in free spins. Both are cut from a single
	// drawing each (design/cut_cast_layers.py, MIRRORED so both face the board)
	// onto the same rig
	// (design/generate_monkey_spine.mjs, CAST=mg|fg), so they share every
	// animation. gameType flips inside the transition's cover — while the shutter
	// is fully down — so the swap is never seen happening.
	//
	// Per cast, in skeleton units (origin on the ground between the boots):
	//   art      floor to the top of the head, and the width across
	//   release  where the sack leaves his hand in 'throwit' (printed by the
	//            generator as `release hand at`)
	//   impact   where each fist lands in the chest beat (`beat R/L fist at`)
	//   tease    the plate that lights for the trigger tell: the Bandit's mask,
	//            the Lookout's flying goggles
	// Re-print release/impact whenever the rig or the beat angles change.
	const CASTS = {
		basegame: {
			key: 'gbBandit',
			art: { height: 854, width: 526 },
			release: { x: -374, y: 490 },
			impact: { right: { x: 44, y: 344 }, left: { x: -109, y: 334 } },
			// his 'chestbeat' is a laugh (design/cast_motions.mjs): the beats pop
			// HA! off his head instead of stars off his fists
			beatFx: 'laugh',
			tease: { x: -20, y: 739, halfWidth: 95, halfHeight: 28 },
		},
		freegame: {
			key: 'gbLookout',
			art: { height: 881, width: 462 },
			release: { x: -367, y: 513 },
			impact: { right: { x: -6, y: 371 }, left: { x: -54, y: 340 } },
			// his is a hip shimmy: nothing lands, so nothing is drawn
			beatFx: 'none',
			tease: { x: -12, y: 843, halfWidth: 62, halfHeight: 25 },
		},
	} as const;

	// Printed off the backdrop rather than outlined: the figure's own silhouette
	// in ink, set a few pixels low and right like the misregistered plate under
	// every card. The Bandit's red sweater and green trousers are the backdrop's
	// own two inks, and without this he melted into the sun and the warehouse
	// (2026-10-04). Hard (no blur) — a soft shadow is a different medium.
	const castShadow = [
		new DropShadowFilter({ offset: { x: 7, y: 6 }, color: 0x1e1b1a, alpha: 0.72, blur: 0, quality: 1 }),
	];

	const cast = $derived(context.stateGame.gameType === 'freegame' ? CASTS.freegame : CASTS.basegame);
	const ART = $derived(cast.art);
	const RELEASE = $derived(cast.release);

	// Below this there is no room to stand him next to the board without either
	// overlapping the frame or shrinking him to a thumbnail. Tablet (1000x1000)
	// and portrait (800x1422) both fall here, and he is simply absent — which is
	// the honest answer for those layouts, and better than a 90px smudge in the
	// margin.
	const MIN_GAP = 260;

	const placement = $derived.by(() => {
		const layout = context.stateLayoutDerived.mainLayout();
		const board = context.stateGameDerived.boardLayout();
		// BoardFrame draws the housing at 1.28x the board (its FRAME_SCALE).
		const frameHalfWidth = (board.width * board.scale * 1.28) / 2;
		const frameHalfHeight = (board.height * board.scale * 1.28) / 2;

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

	// Publish the release point for the transition to spawn its dynamite at, in
	// main-layout coordinates. null when he is not on screen, which is how the
	// transition knows to fall back to dropping one in from above.
	// THE CLEAN-UP DOES NOT NULL THIS. That is the whole point of the change.
	//
	// It used to, and an effect's clean-up runs before every RE-RUN, not only on
	// unmount — so every time `placement` was recomputed the origin went null for
	// an instant and then came back. `placement` depends on boardLayout(), which
	// depends on gameType, which is changed by a transition's own cover. Any
	// transition that mounted inside that window read null, decided the mascot was
	// off screen, and dropped the dynamite in from above without ever telling him
	// to throw it — which is what "he doesn't throw when you buy Hold and Spin"
	// was: that mode's transition fires on the round's very first reveal, with far
	// less slack around it than the free-spin ones.
	//
	// Nulling on real unmount still happens, below, where it belongs.
	$effect(() => {
		context.stateGame.mascotThrowOrigin = placement
			? {
					x: placement.x + RELEASE.x * placement.scale,
					y: placement.y - RELEASE.y * placement.scale,
				}
			: null;
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
	const IMPACT_AT = $derived(cast.impact);
	// At 96 the star was two-thirds of his body width and stopped being a hit on
	// his chest — it became an explosion he happened to be standing behind.
	const IMPACT_R = 76;

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

	// The Bandit's laugh: one HA! per beat, alternating either side of his head
	// and climbing, printed red on an ink rim like every other caption.
	const HA_LIFE_MS = 420;
	const haPops = $derived.by(() => {
		if (impactClock < 0 || cast.beatFx !== 'laugh') return [];
		const pops = [];
		for (let i = 0; i < BEATS; i++) {
			const t = (impactClock - (BEAT_START_MS + i * BEAT_GAP_MS)) / HA_LIFE_MS;
			if (t < 0 || t > 1) continue;
			const side = i % 2 === 0 ? 1 : -1;
			pops.push({
				i,
				x: side * (150 + 14 * i) - 20,
				// pixi y is down; above his shoulders, rising as it fades
				y: -(ART.height * 0.84 + 20 * i) - 60 * t,
				scale: (t < 0.15 ? 0.6 + 0.6 * (t / 0.15) : 1.2 - 0.2 * Math.min(1, (t - 0.15) / 0.3)) * (1 + 0.06 * i),
				rotation: side * (0.18 + 0.03 * i),
				alpha: t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4,
			});
		}
		return pops;
	});

	const drawImpacts = (g: PixiGraphics) => {
		g.clear();
		if (impactClock < 0) return;
		// the comic stars are kept for a cast whose beat lands on its chest
		if ((cast.beatFx as string) !== 'stars') return;
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
			const cx = landing.x;
			// pixi y is down, skeleton y is up
			const cy = -landing.y;
			const seed = i * 1.7;

			// speed lines first, so the star sits on top of them
			for (let k = 0; k < 7; k++) {
				const a = seed * 0.6 + (k / 7) * Math.PI * 2;
				const r0 = IMPACT_R * 0.82 * scale;
				const r1 = r0 + (30 + 26 * ((k * 7919) % 11) / 11) * scale;
				g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
				g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
			}
			g.stroke({ width: 7 * scale, color: INK, alpha: alpha * 0.85 });

			// The outer star is drawn TWICE — once filled, once stroked. In pixi v8
			// a fill() consumes the accumulated path, so a stroke() after it has
			// nothing left to outline.
			const outer = starPoints(cx, cy, IMPACT_R * scale, IMPACT_R * 0.46 * scale, 11, seed);
			g.poly(outer);
			g.fill({ color: GOLD, alpha });
			g.poly(outer);
			g.stroke({ width: 6 * scale, color: INK, alpha });

			const inner = starPoints(cx, cy, IMPACT_R * 0.56 * scale, IMPACT_R * 0.23 * scale, 9, seed + 0.9);
			g.poly(inner);
			g.fill({ color: FLASH, alpha });
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
	// The goggle plate in skeleton units, from its layer box in the PSD
	// (head_1_eye at 232,95, 204x77) put through toSpine.
	const GOGGLE = $derived(cast.tease);
	// banana yellow: the game's one colour for money on its way
	const GOGGLE_GREEN = 0xf4c21b;
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
	const ONE_SHOTS = ['cheer', 'chestbeat', 'nod', 'throwit', 'flinch', 'alert', 'glance'];
	// The small reactions (flinch, alert, glance, nod) may interrupt each other
	// and idle; they never cut into the big three, which each mean something.
	const INTERRUPTIBLE = ['idle', 'nod', 'glance', 'alert', 'flinch'];
	const react = (name: string) => {
		if (!INTERRUPTIBLE.includes(animationName)) return;
		play(name, false);
	};

	// GLANCE: idle variety. The idle loop plays for as long as the player sits
	// there; every so often he looks over at the board and back. Sooner in the
	// free game, and sooner still as the Bandit meter climbs, so the tension shows
	// on him too.
	let glanceTimer = 0;
	const scheduleGlance = () => {
		clearTimeout(glanceTimer);
		const fg = context.stateGame.gameType === 'freegame';
		const level = 1 + context.stateGame.banditMeter.level;
		const base = fg ? Math.max(3500, 7000 - level * 700) : 8000;
		glanceTimer = setTimeout(() => {
			if (placement && animationName === 'idle') play('glance', false);
			scheduleGlance();
		}, base + Math.random() * base * 0.6) as unknown as number;
	};
	scheduleGlance();
	onDestroy(() => clearTimeout(glanceTimer));

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

	// The chest beat, with its roar and its six impacts. A function rather than
	// inline in the handler because two things raise it: the free-game trigger,
	// and the top three big-win tiers.
	const beatChest = () => {
		play('chestbeat', false);
		// one clip covering all six strikes, so the grunts cannot drift out of
		// sync with them
		say('roar');
		// no point running a clock for something with nowhere to be drawn
		if (placement) startImpacts();
	};

	context.eventEmitter.subscribeOnMount({
		winUpdate: ({ winLevelData }) => {
			// Only for a win the game is itself making a fuss about. Reacting to
			// every paying spin would have him bouncing through most of an 18-spin
			// feature, and a mascot who celebrates everything is celebrating
			// nothing.
			if (winLevelData.type !== 'big') return;
			// HE ESCALATES WITH THE TIER. Every big win used to get the same cheer,
			// so a 20x big win and the 10,000x cap drew the identical reaction from
			// him — alongside identical audio, which soundWinTier now also fixes.
			//
			//   big, superwin      cheer — the jump, arms up
			//   mega, epic, max    the chest beat, with its roar and impacts
			//
			// The chest beat is the biggest thing he does, and it already means the
			// feature trigger. Sharing it with the top tiers is deliberate rather
			// than an accident of reuse: both say "this is the big one", and a
			// separate animation for it is not something this rig has the arm range
			// to make read differently (see 'brace', and why it was dropped).
			//
			// Each ends standing, and that is the whole of it. There used to be a
			// looping 'celebrate' held while the plaque was up; the plaque waits for
			// the player, so that ran unbounded and read as something jammed.
			const alias = winLevelData.alias;
			if (alias === 'mega' || alias === 'epic' || alias === 'max') beatChest();
			else play('cheer', false);
		},
		// The gorilla, for the biggest way into the feature. Deliberately not the
		// same gesture as the win: using one celebration for "you are going in" and
		// "you won" makes both of them mean less.
		mascotChestBeat: () => beatChest(),

		// Interrupts whatever he was doing, unlike the others. A transition is the
		// scene being torn down; finishing a shrug first would put the wind-up
		// after the dynamite should already be in the air.
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

		// A rung up the Bandit meter: he takes notice and leans in.
		banditLevelUp: () => react('alert'),
	});
</script>

{#if placement}
	{#key cast.key}
	<Container>
		<!-- A single flat paper spotlight keeps the figure readable on the
		     backdrop without drawing a contour around it — the Lookout on the
		     green warehouse wall, the Bandit on the red sun and sheds. -->
		<Container x={placement.x} y={placement.y} scale={placement.scale} zIndex={-2}>
			<Graphics draw={(g) => {
				g.clear();
				g.poly([-310, -930, 230, -930, 300, 0, -300, 0]);
				g.fill({ color: 0xf2e8d0, alpha: 0.42 });
			}} />
		</Container>
	<Container zIndex={-1} filters={castShadow}>
	<SpineProvider
		key={cast.key}
		x={placement.x}
		y={placement.y}
		scale={placement.scale}
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
		<!-- TRACK 1, ALWAYS: the banana chewing and the pocket tube rocking
		     (`flutter`, design/generate_monkey_spine.mjs). It keys only those two
		     bones, so it layers over whatever track 0 plays; the physics on the
		     banana, the helmet and the tube adds the follow-through. -->
		<SpineTrack trackIndex={1} animationName="flutter" loop />
	</SpineProvider>
	</Container>
	</Container>
	{/key}

	<!--
		After the spine, so the hits land in front of him rather than inside him.
		Same origin and scale as the skeleton, so the impacts are placed in
		skeleton units and follow him at whatever size the layout gives him.
	-->
	<Container x={placement.x} y={placement.y} scale={placement.scale}>
		<Graphics draw={drawImpacts} />
		{#each haPops as pop (pop.i)}
			<Text
				anchor={0.5}
				x={pop.x}
				y={pop.y}
				scale={pop.scale}
				rotation={pop.rotation}
				alpha={pop.alpha}
				text="HA!"
				style={{
					fontFamily: GAME_FONT,
					fontWeight: GAME_FONT_WEIGHT,
					fontSize: 92,
					fill: 0xd24a2c,
					stroke: { color: 0x1e1b1a, width: 12, join: 'round' },
				}}
			/>
		{/each}
	</Container>

	<!--
		Its own container so the tease is not caught by the impact graphics' clear.
		Same origin and scale as the skeleton, like the impacts.
	-->
	<Container x={placement.x} y={placement.y} scale={placement.scale}>
		<Graphics draw={drawTease} blendMode="add" />
	</Container>
{/if}

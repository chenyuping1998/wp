<script lang="ts" module>
	// Raised by the book handler, not derived here: whether a trigger counted as
	// four scatters is something only the book knows, and a component that had to
	// go and find that out would be reaching across the game to do it.
	export type EmitterEventMascot =
		| { type: 'mascotChestBeat' }
		// Raised by the transition as it begins, so the wind-up happens before the
		// dynamite exists. See THROW_RELEASE_MS there.
		| { type: 'mascotThrow' }
		// The tease. Fired at the top of a round that is GOING to trigger
		// the feature — see playBet in src/game/utils.ts, which owns the coin flip.
		| { type: 'mascotTease' }
		// The cargo reel: 'watch' while it turns, 'reveal' when it stops.
		| { type: 'mascotCargo'; phase: 'watch' | 'reveal' };
</script>

<script lang="ts">
	import { Container, Graphics, SpineProvider, SpineTrack } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { onDestroy } from 'svelte';

	import { getContext } from '../game/context';

	const context = getContext();

	// Skeleton units are the source PSD's pixels, and its origin sits on the
	// ground between the boots (design/generate_monkey_spine.mjs). So the figure
	// is 924 units from the floor to the top of his cap, 548 across, and
	// positioning it means putting its FEET somewhere rather than working out
	// where the centre of a bounding box ought to go.
	//
	// Measured off the captain PSD's own piece bounds, not estimated: the art
	// spans x 4..552 and y 0..924 on a 560x928 canvas with the origin on the
	// ground at (291, 924). Re-measure whenever the character art is replaced —
	// nothing checks this, it just draws him at the wrong size.
	const ART = { height: 924, width: 548 };

	// Where the mine leaves his hand, in skeleton units, PRINTED BY
	// design/generate_monkey_spine.mjs when it builds the 'throwit' animation
	// ("release  hand at (x, y) at t=..."): the left hand at full extension, at
	// RELEASE_AT = 0.58s.
	//
	// Not a free number. TransitionAnimation's THROW_RELEASE_MS must equal that
	// same 0.58s in milliseconds, because the skeleton hides the prop in his fist
	// at exactly that moment and the transition switches its own copy on. If the
	// two drift there is a frame with two props or a frame with none.
	const RELEASE = { x: -392, y: 525 };

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
	const IMPACT_AT = {
		right: { x: 60, y: 437 },
		left: { x: -63, y: 380 },
	};
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

	// ── the tease ──────────────────────────────────────────────────────────
	//
	// A tell, not an announcement. The round already knows it is going to trigger
	// the feature; half the time he notices while the reels are still turning, so
	// a player who is watching him gets a second or two of knowing before the
	// scatters land.
	//
	// It is 50/50 on purpose. A tell that fires every single time is not a tell,
	// it is the result displayed early — the reels stop mattering. Firing half the
	// time means it is worth leaning in for and an unlit one means nothing, which
	// is the only way this reads as luck rather than as a spoiler. It is also
	// strictly one-directional: it never lights on a round that does not trigger,
	// so it can promise but never lie.
	//
	// IT USED TO BE A GREEN VISOR, ON A CHARACTER WHO HAS NO VISOR.
	//
	// This was inherited whole from the jungle commando, who wore amber aviator
	// goggles: one wide rounded plate of #63FF9C drawn at skeleton (54, 750),
	// measured off THAT psd's `head_1_eye` layer (232,95, 204x77). The captain's
	// head is a different drawing and a different size — his eyes are two
	// separate pieces inside `head_5_eye` (164,0, 225x156), whose centres come out
	// at (-2, 793) and (71, 786). So the tell has been a fluorescent green oval
	// hanging in the air beside his jaw, roughly 70 across and 95 up from
	// anything on his face.
	//
	// Now it is the light catching his eyes, in the warm amber the rest of this
	// game is lit by — the lamp on the dock, the lamp in the hold, the brass on
	// the frame. Two small ellipses rather than one plate, because a gorilla's
	// eyes are set wide apart and a single lozenge across both reads as a visor
	// again.
	//
	// Drawn here rather than tinted onto the Spine slot: a slot tint MULTIPLIES,
	// so it can only make art darker. A glow has to be added ON TOP.
	//
	// Skeleton units, from the two eye shapes' own bounding boxes in the PSD put
	// through toSpine. Re-measure these if the head art is ever replaced — like
	// the numbers they replaced, they fail silently.
	const EYES = [
		{ x: -2, y: 793, halfWidth: 36, halfHeight: 18 },
		{ x: 71, y: 786, halfWidth: 25, halfHeight: 16 },
	];
	const TEASE_AMBER = 0xffb347;
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

		// Three passes per eye, widest and faintest first: the bloom thrown onto the
		// brow around it, the eye itself, then a hot core. Ellipses, not rounded
		// rectangles — a rectangle at this size reads as a lit panel.
		const passes = [
			{ pad: 26, a: 0.22 },
			{ pad: 9, a: 0.42 },
			{ pad: -3, a: 1 },
		];
		for (const eye of EYES) {
			const cx = eye.x;
			const cy = -eye.y; // pixi y is down, skeleton y is up
			for (const pass of passes) {
				g.ellipse(cx, cy, eye.halfWidth + pass.pad, eye.halfHeight + pass.pad);
				g.fill({ color: TEASE_AMBER, alpha: alpha * pass.a });
			}
		}
	};

	// idle (and, in the free spins, the march) loops; cheer, chestbeat, nod and
	// the rest are one-shots that return to it — see rest() below.
	// Transitions run off the track's own complete callback rather than timers, so
	// a one-shot cannot be cut short or leave him stuck in a pose because a frame
	// was dropped.
	let animationName = $state('idle');
	let loop = $state(true);
	const ONE_SHOTS = ['cheer', 'chestbeat', 'nod', 'alert', 'throwit'];

	// WHAT HE DOES WHEN NOTHING IS HAPPENING. In the base game he stands (idle);
	// through the free spins he MARCHES IN PLACE, looping, and the only thing
	// that stops him is a big win, which gets the cheer and then hands straight
	// back to the march. Every one-shot returns here rather than to idle, so a
	// cheer in the feature ends marching and a cheer in the base game ends
	// standing, without either one needing to know which game it is in.
	const inFreeGame = $derived(context.stateGame.gameType === 'freegame');
	const rest = () => (inFreeGame ? 'march' : 'idle');

	// ...and following the game in and out of the feature while he is at rest.
	// Only from rest: if the switch lands mid-gesture (the throw that carries
	// the scene into the feature, a cheer on the last spin), that gesture ends
	// in rest() and picks the right one then.
	$effect(() => {
		if (inFreeGame && animationName === 'idle') play('march', true);
		else if (!inFreeGame && animationName === 'march' && loop) play('idle', true);
	});

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
		// after the dynamite should already be in the air.
		// The glow is pinned to the eyes' REST position, so it is only correct
		// while the head is where the idle put it. That is the only state it fires
		// in anyway — the tease runs during the spin — but a big win landing on the
		// spin before would start a cheer, and the glow would be left hanging in
		// mid-air where his face used to be.
		mascotTease: () => {
			if (!placement) return;
			if (animationName !== 'idle') return;
			startTease();
		},

		// THE MANIFEST BEING READ — see CargoPick.
		//
		// The one stretch of the round where he has something other than the board
		// to look at, and it runs four and a half seconds. He used to stand at idle
		// through all of it.
		//
		// 'watch' is the `alert` lean. 'reveal' is a NOD, not a cheer: what has just
		// happened is information, not a win, and `cheer` is the gesture this game
		// keeps for a win worth making a fuss about — spending it here would cost
		// it there.
		mascotCargo: ({ phase }) => play(phase === 'watch' ? 'alert' : 'nod', false),

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

{#if placement}
	<SpineProvider
		key="gbMonkey"
		x={placement.x}
		y={placement.y}
		scale={placement.scale}
		zIndex={-1}
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
				/*
				 * Keep an animation's ATTACHMENT SWAPS through its blend-out.
				 *
				 * Spine's default (0) drops them the instant the next animation
				 * starts mixing in, while the bones still take mixDuration to get
				 * home. The chest beat swaps in front copies of the right arm and
				 * hides its cast shadow; cut short (the throw interrupts it), the
				 * default would snap the resting pieces back with the arm still
				 * across the chest, and for a few frames show the black shadow
				 * blob and the forearm under the cuff that the swaps exist to
				 * hide. At 1 they hold until the blend is done, when the pose is
				 * back at rest and the resting pieces fit again. Animations that
				 * end on their own are unaffected: their last keys already
				 * restore the resting pieces.
				 */
				mixAttachmentThreshold: 1,
			}}
			listener={{
				complete: (entry) => {
					const finished = entry.animation?.name;
					// Loops fire complete on every pass (idle always, and the march
					// while it is the feature's rest) — only a one-shot that has run
					// out has anywhere to go.
					if (finished && !entry.loop && ONE_SHOTS.includes(finished)) play(rest(), true);
				},
			}}
		/>
		<!-- TRACK 1, ALWAYS: the neckerchief tails and the banana (flutter, in
	     design/generate_monkey_spine.mjs). It keys only their own bones, so it
	     layers over whatever track 0 plays; their physics adds follow-through. -->
	<SpineTrack trackIndex={1} animationName="flutter" loop />
	</SpineProvider>

	<!--
		After the spine, so the hits land in front of him rather than inside him.
		Same origin and scale as the skeleton, so the impacts are placed in
		skeleton units and follow him at whatever size the layout gives him.
	-->
	<Container x={placement.x} y={placement.y} scale={placement.scale}>
		<Graphics draw={drawImpacts} />
	</Container>

	<!--
		Its own container so the tease is not caught by the impact graphics' clear.
		Same origin and scale as the skeleton, like the impacts.
	-->
	<Container x={placement.x} y={placement.y} scale={placement.scale}>
		<Graphics draw={drawTease} blendMode="add" />
	</Container>
{/if}

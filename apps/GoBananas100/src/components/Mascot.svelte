<script lang="ts" module>
	// Raised by the book handler, not derived here: whether a trigger counted as
	// four scatters is something only the book knows, and a component that had to
	// go and find that out would be reaching across the game to do it.
	export type EmitterEventMascot =
		| { type: 'mascotChestBeat' }
		// Raised by the transition as it begins, so the wind-up happens before the
		// grenade exists. See THROW_RELEASE_MS there.
		| { type: 'mascotThrow' };
</script>

<script lang="ts">
	import { Container, Graphics, SpineProvider, SpineTrack } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { onDestroy } from 'svelte';

	import { getContext } from '../game/context';

	const context = getContext();

	// Skeleton units are the source PSD's pixels, and its origin sits on the
	// ground between the boots (design/generate_monkey_spine.mjs). So the figure
	// is 846 units from the floor to the top of the beret, 518 across, and
	// positioning it means putting its FEET somewhere rather than working out
	// where the centre of a bounding box ought to go.
	const ART = { height: 846, width: 518 };

	// Where the grenade leaves his hand, in skeleton units, printed by
	// design/generate_monkey_spine.mjs when it builds the 'throwit' animation:
	// the left hand at full extension, at RELEASE_AT = 0.38s.
	const RELEASE = { x: -363, y: 445 };

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

	// Publish the release point for the transition to spawn its grenade at, in
	// main-layout coordinates. null when he is not on screen, which is how the
	// transition knows to fall back to dropping one in from above.
	$effect(() => {
		context.stateGame.mascotThrowOrigin = placement
			? {
					x: placement.x + RELEASE.x * placement.scale,
					y: placement.y - RELEASE.y * placement.scale,
				}
			: null;
		return () => {
			context.stateGame.mascotThrowOrigin = null;
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
	// Where a fist lands, in skeleton units. Alternating sides, matching which
	// arm owns which beat (right takes 0/2/4, left takes 1/3/5).
	// Rendered out against the character's own proportions: at 96 the star was
	// two-thirds of his body width and stopped being a hit on his chest — it
	// became an explosion he happened to be standing behind.
	const IMPACT_AT = { x: 50, y: 500 };
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
		cancelAnimationFrame(impactRaf);
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
			const side = i % 2 === 0 ? 1 : -1;
			const cx = IMPACT_AT.x * side;
			// pixi y is down, skeleton y is up
			const cy = -IMPACT_AT.y;
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
		// after the grenade should already be in the air.
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
	<Container x={placement.x} y={placement.y} scale={placement.scale}>
		<Graphics draw={drawImpacts} />
	</Container>
{/if}

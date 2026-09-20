<script lang="ts" module>
	// Raised by the book handler, not derived here: whether a trigger counted as
	// four scatters is something only the book knows, and a component that had to
	// go and find that out would be reaching across the game to do it.
	export type EmitterEventMascot =
		| { type: 'mascotChestBeat' }
		// Raised by the transition as it begins, so the wind-up happens before the
		// scarab exists. See THROW_RELEASE_MS there.
		| { type: 'mascotThrow' }
		// The run's seal being read (MysteryOracle). Two beats, because the moment
		// has two: the wheel starting, and what it lands on.
		| { type: 'mascotOracle'; phase: 'watch' | 'reveal' };
</script>

<script lang="ts">
	import { Container, Graphics, SpineProvider, SpineTrack } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { onDestroy, onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { BEAT_START_MS, BEAT_GAP_MS, BEATS } from '../game/tombQuake.svelte';

	const context = getContext();

	// Skeleton units are the source PSD's pixels, and its origin sits on the
	// ground under the body's centre line (design/generate_anubis_spine.mjs). So
	// the figure is 926 units from the floor to the tips of the jackal ears, 547
	// across at the knuckles, and positioning it means putting its FEET somewhere
	// rather than working out where the centre of a bounding box ought to go.
	const ART = { height: 926, width: 547 };

	// Where the scarab leaves his hand, in skeleton units. Printed by
	// design/generate_anubis_spine.mjs, which walks the finished 'throwit'
	// animation - the whole chain, including the torso lean and the hip drive, not
	// just the arm angles - and reports the centre of the scarab's own drawing at
	// RELEASE_AT.
	const RELEASE = { x: -356, y: 473 };

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

	// Publish the release point for the transition to spawn its scarab at, in
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
	// The timings are the chest beat's own (BEAT_START 0.36, BEAT_GAP 0.42, four
	// strikes, printed by design/generate_anubis_spine.mjs). They live in
	// game/tombQuake.svelte.ts now, because the quake shakes the room and drops
	// stone on the same four strikes — one copy of four numbers, read by the
	// stars, the board knocks, the shake and the debris alike.
	// Short, and shorter than the gap. A star that outlives its strike is still on
	// screen when the next one lands, and two stars at once is a firework rather
	// than a blow.
	const IMPACT_LIFE_MS = 260;
	// WHERE THE FIST ACTUALLY IS, printed by design/generate_anubis_spine.mjs when
	// it builds the animation: the right fist lands at (53, 367) on beats 0 and 2,
	// the left at (-3, 397) on beats 1 and 3. Lifted 45 units to sit on the
	// KNUCKLES rather than the centre of the hand drawing, which is where a blow
	// would land.
	//
	// An earlier pass drew the star up on the pectorals instead, on the argument
	// that a comic star is a convention and marks where the blow *should* be. It
	// does not survive contact: the star was a hand's width above the hand, so the
	// eye read two separate things happening rather than one, and the strike lost
	// the only cue tying it to the arm. The fists cannot reach the chest on this
	// drawing — measured, see the note in the generator — so the impact goes where
	// the fists go, which on a hunched gorilla is the base of the sternum. It
	// still reads as a chest beat because the body is slamming into it.
	//
	// Sized against this figure's own proportions: at 96 the star was two-thirds
	// of his body width and stopped being a hit on his chest — it became an
	// explosion he happened to be standing behind.
	const IMPACT_AT = [
		{ x: 53, y: 412 }, // right fist, beats 0 and 2
		{ x: -3, y: 442 }, // left fist, beats 1 and 3
	];
	const IMPACT_R = 80;

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
	// One timer per strike, so the board knock survives him going off screen.
	let beatKnocks: number[] = [];
	const clearBeatKnocks = () => {
		for (const id of beatKnocks) clearTimeout(id);
		beatKnocks = [];
	};
	onDestroy(() => {
		cancelAnimationFrame(impactRaf);
		clearTimeout(voiceTimer);
		clearBeatKnocks();
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
			//
			// 0.10 rather than 0.18 to reach full size: the skeleton now FREEZES for
			// 70ms on each landing pose, and a star still inflating through that
			// freeze is the one thing on screen still moving during the frame the
			// whole gag depends on being still.
			const grow = t < 0.1 ? t / 0.1 : 1;
			const alpha = t < 0.62 ? 1 : 1 - (t - 0.62) / 0.38;
			const scale = 0.55 + 0.45 * grow + t * 0.35;
			// beat 0 is the right fist; the skeleton alternates from there
			const at = IMPACT_AT[i % 2];
			const cx = at.x;
			// pixi y is down, skeleton y is up
			const cy = -at.y;
			const seed = i * 1.7;

			// A shock ring, thrown out ahead of the star and gone before it fades.
			// The star says WHERE; this says HOW HARD, and it is the part that reads
			// at the size the mascot is actually drawn on screen.
			if (t < 0.5) {
				const rt = t / 0.5;
				g.circle(cx, cy, IMPACT_R * (0.5 + 1.5 * rt) * scale);
				g.stroke({ width: 9 * (1 - rt) * scale, color: FLASH, alpha: (1 - rt) * 0.8 });
			}

			// speed lines next, so the star sits on top of them
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
	const ONE_SHOTS = ['cheer', 'chestbeat', 'nod', 'alert', 'throwit', 'idlebreak'];

	const play = (name: string, loops: boolean) => {
		animationName = name;
		loop = loops;
	};

	// ── HE DOES NOT ONLY BREATHE ─────────────────────────────────────────────
	//
	// `idle` is a breath, and it is what the player watches for most of a
	// session — between spins, through autoplay, while reading the bet bar. Left
	// at that he stops being a character and becomes a print beside the board,
	// which is the note certification raised about the still drawing to begin
	// with. So every so often he shifts his weight and looks around
	// (design/generate_anubis_spine.mjs: `idlebreak`, deliberately the quietest
	// move in the set so it is never mistaken for a reaction to the board).
	//
	// ONLY FROM IDLE, and the clock is re-armed at a random interval so it never
	// falls into a rhythm the player can predict — a character who does the same
	// thing every fifteen seconds is as mechanical as one who does nothing.
	//
	// A timer rather than requestAnimationFrame: rAF stops dead in a hidden tab,
	// and a player coming back to the tab should find him alive rather than find
	// a break that was queued up and fires the instant the tab is focused.
	const BREAK_MIN_MS = 13000;
	const BREAK_SPREAD_MS = 9000;
	let breakTimer: ReturnType<typeof setTimeout> | undefined;
	const armIdleBreak = () => {
		clearTimeout(breakTimer);
		breakTimer = setTimeout(
			() => {
				// anything at all going on — a win, a trigger, a feature intro — and
				// he simply keeps breathing; the break waits for the next window
				if (animationName === 'idle') play('idlebreak', false);
				armIdleBreak();
			},
			BREAK_MIN_MS + Math.random() * BREAK_SPREAD_MS,
		);
	};
	onMount(() => {
		armIdleBreak();
		return () => clearTimeout(breakTimer);
	});

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
		// The end of a feature. The total-win plaque used to arrive with him
		// standing idle beside it, as if nothing had happened; a big total gets
		// the cheer, anything smaller a nod — the same scale of reaction as a
		// base-game win, so the size of his response still means something.
		freeSpinOutroCountUp: ({ amount, winLevelData }) => {
			if (amount <= 0) return;
			play(winLevelData.type === 'big' ? 'cheer' : 'nod', false);
		},
		// The gorilla, for the biggest way into the feature. Deliberately not the
		// same gesture as the win: using one celebration for "you are going in" and
		// "you won" makes both of them mean less.
		mascotChestBeat: () => {
			play('chestbeat', false);
			// one clip covering all four strikes, so the grunts cannot drift out of
			// sync with them
			say('roar');
			// no point running a clock for something with nowhere to be drawn
			if (placement) startImpacts();
			// The board housing takes each strike too. Reusing the knock the sealed
			// tablets already use: a mascot who slams and a board that does not
			// move is a character in front of a photograph, and this is the one
			// moment in the game where the two are asked to be in the same room.
			// Scheduled rather than driven off the impact clock, because the knock
			// has to land even when he is off screen (MIN_GAP) and there are no
			// stars being drawn.
			clearBeatKnocks();
			for (let i = 0; i < BEATS; i++) {
				beatKnocks.push(
					setTimeout(
						() =>
							context.eventEmitter.broadcast({
								type: 'boardFrameImpact',
								strength: i === 0 ? 0.5 : 0.38,
							}),
						BEAT_START_MS + i * BEAT_GAP_MS,
					) as unknown as number,
				);
			}
		},

		// Interrupts whatever he was doing, unlike the others. A transition is the
		// scene being torn down; finishing a shrug first would put the wind-up
		// after the scarab should already be in the air.
		mascotThrow: () => {
			play('throwit', false);
			// on the release, not on the wind-up
			clearTimeout(voiceTimer);
			voiceTimer = setTimeout(() => say('effort'), 520) as unknown as number;
		},

		// The seal is being read, and he is the only thing on screen besides the
		// wheel that is still lit — so he has to be doing something.
		//
		// Both beats reuse animations he already has rather than asking for a new
		// clip: 'alert' is exactly "turns to the board and holds", which is what
		// watching a wheel is, and 'cheer' is what he does when something good has
		// just been decided. Interrupting whatever he was doing is correct here —
		// the trigger's chest beat has finished by now, and the transition has
		// already torn the scene down between then and this.
		mascotOracle: ({ phase }) => play(phase === 'watch' ? 'alert' : 'cheer', false),

		// The second Scatter has landed and he looks at the board.
		//
		// The tease was the one stretch of the game he sat out: the sound climbs a
		// step per Scatter, the cell flashes and keeps a hold, the housing takes a
		// knock, and the character whose job is to react stood still until the
		// trigger. Two is the right moment — one Scatter is an ordinary spin, and
		// three is already the chest beat.
		//
		// Only from idle, and never during a feature: in the free game Scatters
		// land constantly and a look per Scatter would be a tic. The animation is
		// deliberately interruptible — if the third lands, 'chestbeat' cuts
		// straight in over it, which is the right way round.
		scatterLand: ({ count }) => {
			if (count !== 2) return;
			if (context.stateGame.gameType !== 'basegame') return;
			if (animationName !== 'idle') return;
			play('alert', false);
		},

		// An ordinary base-game win. This is the common case by a wide margin, so
		// it is the smallest thing he does — see the 'nod' animation, which is
		// deliberately almost nothing.
		//
		// Only from idle. A win line resolving during a big-win presentation would
		// otherwise cut the celebration short with a shrug, and the free game is
		// excluded entirely: at up to 15 spins, most of them paying, a reaction per
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
		key="gbAnubis"
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
					//
					// AND ONLY IF IT IS STILL THE ONE PLAYING. A one-shot that was
					// interrupted still reports `complete` from the track it was
					// mixed out of, so this used to drop him back to idle in the
					// middle of whatever had interrupted it. The chest beat is
					// exactly that case: 'alert' fires on the second Scatter and the
					// trigger arrives about a second later, so the beat was being
					// cancelled a frame or two after it started — reported as the
					// chest beat having disappeared.
					if (finished && finished === animationName && ONE_SHOTS.includes(finished)) {
						play('idle', true);
					}
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

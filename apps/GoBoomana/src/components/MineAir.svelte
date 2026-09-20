<script lang="ts">
	import { Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { untrack } from 'svelte';

	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { makeRockShape, paintRock, type RockShape } from '../game/rockPaint';

	type Props = {
		// Two instances, as CaveRockfall has: 'back' between the background and
		// the board (the lamp's warmth and the far debris), 'front' over the board
		// (the close pieces and the dark closing in at the edges).
		layer: 'back' | 'front';
	};
	const props: Props = $props();
	const context = getContext();

	// THE MINE COMING APART, DURING THE FEATURE ONLY.
	//
	// The base game is a well-lit room with a painting of a mine in it, and that
	// is right for a base game. The feature is where the run climbs the blast
	// ladder towards a full board, and this is the part of the picture that
	// climbs with it — the roof giving way a little more on every rung:
	//
	//   debris    small rock coming down, more of it and faster on every rung,
	//             and a burst of it the moment a rung is reached
	//   lamp      a warm glow behind the board that flickers like a flame, harder
	//             and hotter on every rung, and with the odd guttering dip from
	//             rung 3 up, as if the mine had noticed
	//   edges     the dark closing in a little more each rung
	//
	// IT IS ROCK, NOT DUST. The first version of this drifted pale motes with a
	// soft amber halo around the close ones, meant to read as dust hanging in the
	// lamplight. On screen each halo read as a small yellow ring — little glowing
	// circles floating over the reels, which is a UI effect, not a mine. They are
	// the same stone as the trigger's cave-in now (game/rockPaint.ts), just
	// smaller and further apart, so everything falling in this game is the same
	// material.
	//
	// It is nothing at all outside the feature. That is deliberate: ambience that
	// never stops is wallpaper, and the point of this is that it BEGINS when the
	// feature does and only builds. It eases in over 1.5s and out over 0.8s.
	//
	// Timed with setInterval and Date.now, not requestAnimationFrame, which stops
	// dead in a hidden tab.
	const active = $derived(stateGame.gameType === 'freegame');
	const isBack = $derived(props.layer === 'back');

	const TICK_MS = 33;
	const FADE_IN_MS = 1500;
	const FADE_OUT_MS = 800;

	let now = $state(0);
	let fade = $state(0);
	// the level, eased, so a rung arrives as a swell rather than a step
	let lvl = $state(1);
	// the burst of rock when a rung is reached, and the moment it happened
	let surge = $state(0);
	let surgeAt = $state(-99);
	let lastLevel = 1;

	$effect(() => {
		const target = active;
		if (!target && untrack(() => fade) === 0) return;
		const id = setInterval(() => {
			now = Date.now() / 1000;
			fade = Math.max(0, Math.min(1, fade + (target ? TICK_MS / FADE_IN_MS : -TICK_MS / FADE_OUT_MS)));
			lvl += (Math.max(1, stateGame.blastLevel) - lvl) * 0.07;
			surge = Math.max(0, surge - TICK_MS / 1600);
			if (!target && fade === 0) {
				clearInterval(id);
				lvl = 1;
				surge = 0;
			}
		}, TICK_MS);
		return () => clearInterval(id);
	});

	// A batch of rock thrown down from the roof. 1 is a rung of the ladder; a
	// plain detonation gets less, but it gets some — the board just exploded, and
	// a mine that does not answer that is a painted backdrop again.
	const shakeLoose = (strength: number) => {
		if (!active || strength <= surge) return;
		surge = strength;
		surgeAt = Date.now() / 1000;
	};

	$effect(() => {
		const level = stateGame.blastLevel;
		if (level > lastLevel) shakeLoose(1);
		lastLevel = level;
	});

	context.eventEmitter.subscribeOnMount({
		// every detonation, whether or not it moved the ladder
		reelBlast: () => shakeLoose(0.6),
	});

	// seeded, so the fall is the same fall every time and nothing re-rolls per frame
	const seeded = (seed: number) => {
		let s = seed;
		return () => {
			s = (s * 16807) % 2147483647;
			return s / 2147483647;
		};
	};

	type Debris = {
		x: number;
		// seconds between one fall of this piece and the next, and where in that
		// cycle it currently is — a pool that recycles rather than a spawner, so
		// the count on screen is bounded whatever the level does
		period: number;
		phase: number;
		size: number;
		drift: number;
		spin: number;
		spin0: number;
		shape: RockShape;
		// the order in which pieces join as the level rises: a few are always
		// falling, the rest arrive with the rungs
		rank: number;
	};

	const MAX_DEBRIS = 12;
	const debris = $derived.by<Debris[]>(() => {
		const rand = seeded(isBack ? 40213 : 77191);
		return Array.from({ length: MAX_DEBRIS }, () => ({
			x: rand(),
			// A piece takes about two seconds to cross and then rests for the rest
			// of its cycle, so at the top rung only two or three per layer are on
			// screen at once, and at the first only one. This ran at a 2-4s cycle
			// with 30 pieces and read as a storm down both sides of the board for
			// the whole feature, which is a lot of motion to have in the corner of
			// the player's eye; the mine should be coming apart, not raining.
			period: (isBack ? 5 : 4.5) + rand() * 4,
			phase: rand(),
			// Small. These are chips off the roof between blasts, not the cave-in
			// the trigger drops — that one is CaveRockfall, and it is three times
			// this size on purpose.
			size: (isBack ? 0.009 : 0.016) * (0.55 + rand() * 1.05),
			drift: (rand() - 0.5) * 0.008,
			spin: (rand() - 0.5) * 4,
			spin0: rand() * Math.PI * 2,
			shape: makeRockShape(rand),
			rank: rand(),
		}));
	});

	const GLOW = 0xff8a2a;

	// A flame is not a sine. Two incommensurate waves make the wander, and a
	// stepped hash on top makes the sudden small dips a real flame has — a smooth
	// pulse reads as a breathing light, which is a different and calmer thing.
	// From rung 3 the dips get deeper: that is the tension.
	const flicker = (t: number, level: number) => {
		const wander = 0.5 + 0.5 * Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1.0);
		const step = Math.floor(t * 9);
		const h = Math.sin(step * 12.9898) * 43758.5453;
		const r = h - Math.floor(h);
		const dip = r > 0.86 ? (r - 0.86) / 0.14 : 0;
		const depth = level >= 3 ? 0.35 + 0.1 * (level - 3) : 0.12;
		return Math.max(0, wander * 0.7 + 0.3 - dip * depth);
	};

	// how many of MAX_DEBRIS are falling: a quarter at rung 1, all at rung 5
	const amount = $derived(0.25 + 0.75 * ((lvl - 1) / 4));

	// The fall itself. Gentler than the trigger's cave-in on purpose (CaveRockfall
	// falls at 1.7 and 0.3): this is a chip working loose, not the roof coming
	// down, and it has to be legible as a single falling thing rather than a
	// blur. A piece crosses the screen in about two seconds.
	const fallY = (s: number, height: number) =>
		0.5 * height * (isBack ? 0.45 : 0.6) * s * s + height * 0.12 * s;

	// THE FALL STAYS IN THE MARGINS. Debris that crossed the board sat over the
	// symbols the player is trying to read for the whole feature, which is the
	// one place it must never be. So the pool is laid out along the two side
	// bands - the strip of scene each side of the housing - and nothing falls
	// across the reels.
	//
	// The bands come from where the housing actually is: the board's centre and
	// half-width in CANVAS pixels (main layout scale x board shrink x the frame's
	// overhang), so it follows the layout instead of assuming a 16:9 screen. In a
	// portrait layout the board fills the width and there is no margin to speak
	// of; each side then keeps a thin strip at the very edge rather than none.
	const FRAME_OVERHANG = 1.25;
	const MIN_BAND = 0.06;
	const sideBands = (width: number) => {
		const main = context.stateLayoutDerived.mainLayout();
		const board = context.stateGameDerived.boardLayout();
		const half = board.width * board.scale * main.scale * 0.5 * FRAME_OVERHANG;
		const centre = main.x;
		return {
			left: Math.max(width * MIN_BAND, centre - half),
			right: Math.max(width * MIN_BAND, width - (centre + half)),
		};
	};
	// u in [0,1): the first half of it is the left band, the second the right
	const onSides = (u: number, bands: { left: number; right: number }, width: number) => {
		const k = ((u % 1) + 1) % 1;
		return k < 0.5 ? (k / 0.5) * bands.left * 0.94 : width - ((k - 0.5) / 0.5) * bands.right * 0.94;
	};

	const draw = (g: PixiGraphics) => {
		g.clear();
		if (fade <= 0) return;
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const speed = 1 + 0.06 * (lvl - 1) + 0.2 * surge;
		const bands = sideBands(width);

		if (isBack) {
			// the lamp's warmth: behind the board, so it only ever tints the wall
			const f = flicker(now, lvl);
			const strength = fade * (0.014 + 0.017 * (lvl - 1) + 0.05 * surge);
			g.rect(0, 0, width, height).fill({ color: GLOW, alpha: strength * (0.55 + 0.9 * f) });
		}

		for (const d of debris) {
			const standing = d.rank <= amount + 0.02;
			// A RUNG SHAKES A BATCH LOOSE. The pieces that are not part of the
			// standing fall are thrown down FROM THE TOP when the rung lands,
			// staggered by rank so they cascade rather than arriving as a row.
			// Speeding up the existing pool instead, which is what this did first,
			// is not something the eye reads as an event at all.
			const sinceSurge = now - surgeAt - d.rank * 0.45;
			const thrown = !standing && surge > 0 && sinceSurge > 0 && sinceSurge < 2;
			if (!standing && !thrown) continue;
			const join = standing ? Math.min(1, (amount - d.rank) / 0.08) : 1;

			// where this piece is: its own cycle, or the fall the rung started
			const cycle = (d.phase + (now * speed) / d.period) % 1;
			const s = thrown ? sinceSurge : cycle * d.period;
			const r = d.size * height;
			const cy = -r * 1.2 + fallY(s, height);
			if (cy - r > height) continue;
			// x is a position ALONG THE SIDE BANDS, not across the screen
			const cx = onSides(d.x + d.drift * s, bands, width);
			paintRock(g, {
				shape: d.shape,
				cx,
				cy,
				r,
				turn: d.spin0 + d.spin * s,
				haze: isBack ? 0.5 : 0,
				alpha: fade * join * (isBack ? 0.85 : 1),
			});
		}
	};

	// the dark closing in: the existing corner vignette, laid over the board at
	// a strength that rises with the rung. Nothing much at rung 1.
	const vignetteAlpha = $derived(fade * (0.04 + 0.05 * (lvl - 1)) * (1 - 0.5 * surge));
</script>

<Graphics {draw} />
{#if !isBack && vignetteAlpha > 0.005}
	<Sprite
		key="fxVignette"
		width={context.stateLayoutDerived.canvasSizes().width}
		height={context.stateLayoutDerived.canvasSizes().height}
		alpha={vignetteAlpha}
	/>
{/if}

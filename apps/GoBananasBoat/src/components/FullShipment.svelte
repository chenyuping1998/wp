<script lang="ts" module>
	export type EmitterEventFullShipment = { type: 'fullShipment' };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForTimeout } from 'utils-shared/wait';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import BoardContainer from './BoardContainer.svelte';

	// THE WHOLE HOLD COMES UP AT ONCE.
	//
	// A few percent of free-game spins turn every free cell on the board into a
	// crate (GameExecutables.full_shipment), and every one of them opens on the
	// run's cargo — a full 4x5 of one symbol, which is 1,024 ways of a single pay
	// and the top of this game's range.
	//
	// It had no presentation at all. The maths emitted nothing for it, so the
	// biggest thing the feature does arrived as an ordinary crate reveal that
	// happened to have more tarps in it: same rattle, same lift, and a housing
	// knock that CAPPED at seven crates, so twenty felt exactly like seven.
	//
	// WHY THIS IS A BEAT BEFORE THE REVEAL AND NOT A BANNER AFTER IT.
	//
	// By the time the tarps are off, the board has already said it: twenty cells
	// of one symbol is not something a plaque needs to explain. What is missing
	// is the half second BEFORE — the moment where the board is visibly all
	// crates and nothing has opened yet. So the maths emits `fullShipment` ahead
	// of `reveal` and this holds there: the horn sounds, the housing takes a full
	// slam, the deck lights go up, and only then do the reels stop and the
	// unloading start.
	//
	// NO WORDS, deliberately. Every other string this game draws carries sixteen
	// locales (see game/i18nText.ts), and a phrase invented here would either be
	// English on fifteen of them or sixteen translations invented by whoever
	// added it. A horn, a slam and the light is a language everyone already has.

	const context = getContext();

	// Long enough to register as its own moment, short enough that it is not a
	// toll booth on the way to the win — and this fires several times in a
	// feature, which is the argument against anything longer.
	const HOLD_MS = 620;
	const HOLD_MS_TURBO = 380;

	// Warm, and the same amber as every light in this game: the dock lamps, the
	// hold's caged lamp, the brass on the housing.
	const FLARE = 0xffb347;
	const FLARE_PEAK = 0.34;

	let clock = $state(-1);
	let lifeMs = $state(HOLD_MS);
	let raf = 0;
	// THE END IS ON A TIMER, NOT ON THE FRAME LOOP.
	//
	// requestAnimationFrame STOPS in a backgrounded tab. The interpolation can
	// live with that — nobody is watching — but the thing that CLEARS the flare
	// cannot, because it only ever runs inside the same loop: switch away
	// mid-shipment and `clock` freezes at whatever it held, the graphic never
	// reaches its life and the board comes back wearing a stuck amber wash.
	// setTimeout keeps running, so it owns the ending.
	let killTimer = 0;

	onDestroy(() => {
		cancelAnimationFrame(raf);
		clearTimeout(killTimer);
	});

	const start = (ms: number) => {
		cancelAnimationFrame(raf);
		clearTimeout(killTimer);
		lifeMs = ms;
		const t0 = performance.now();
		const step = (now: number) => {
			clock = now - t0;
			if (clock >= lifeMs) {
				clock = -1;
				return;
			}
			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		killTimer = setTimeout(() => {
			cancelAnimationFrame(raf);
			clock = -1;
		}, ms + 40) as unknown as number;
	};

	const board = {
		width: SYMBOL_SIZE * BOARD_DIMENSIONS.x,
		height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
	};

	// Up fast, down slow. A light that fades in as slowly as it fades out reads
	// as a dissolve; a deck lamp struck on and then dying back is an event.
	const draw = (g: PixiGraphics) => {
		g.clear();
		if (clock < 0) return;
		const p = clock / lifeMs;
		const level = p < 0.18 ? p / 0.18 : 1 - (p - 0.18) / 0.82;
		const alpha = Math.max(0, level) * FLARE_PEAK;
		if (alpha <= 0.004) return;

		// Two passes: a flat wash over the whole board, and a brighter band across
		// the middle so the flare has a direction rather than being a filter laid
		// over the picture.
		g.rect(0, 0, board.width, board.height);
		g.fill({ color: FLARE, alpha: alpha * 0.55 });
		g.rect(0, board.height * 0.3, board.width, board.height * 0.4);
		g.fill({ color: FLARE, alpha: alpha * 0.45 });
	};

	context.eventEmitter.subscribeOnMount({
		fullShipment: async () => {
			const ms = stateBet.isTurbo ? HOLD_MS_TURBO : HOLD_MS;
			context.eventEmitter.broadcast({ type: 'soundShipHorn' });
			// Full strength, no scaling. Everything else that knocks this housing
			// scales its knock by how much happened; this is the case where
			// everything happened.
			context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1 });
			start(ms);
			// Awaited, so the reveal that follows waits for it. Not the whole life
			// of the flare — the light is still dying back while the first tarps
			// move, which is what ties the two together instead of playing them
			// one after the other.
			await waitForTimeout(ms * 0.62);
		},
	});
</script>

<BoardContainer>
	<Graphics draw={draw} />
</BoardContainer>

<script lang="ts" module>
	export type EmitterEventFullBoard = { type: 'fullBoardTease' } | { type: 'fullBoardStamp' };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { getSymbolX } from '../game/utils';

	const context = getContext();

	// THE FULL BOARD, GIVEN A BEFORE AND AN AFTER.
	//
	// Five reels of one symbol is what the whole feature is a chase for, and it
	// used to arrive as the ordinary blast held 700ms longer: nothing warned the
	// player it was coming, and nothing marked that it had happened. The blast
	// itself is left exactly as it is — it is the same dynamite — and this puts
	// one beat either side of it.
	//
	//   TEASE   before the fuse. A fuse catches at the top of each reel in turn,
	//           left to right, and burns down it. The first one looks like any
	//           blast; by the third the player can see where this is going, and
	//           that is the surprise — it is not announced, it is WATCHED
	//           happening, one reel at a time. The last beat pulls the air out
	//           so the bang lands in a hole.
	//
	//   STAMP   after the smoke. A flash, a shockwave off the middle of the board,
	//           sparks, and BOOM! slammed down over it — the game's own name for
	//           the thing that just happened, and one word every locale reads.
	//
	// Both beats are awaited by the blastReels handler, so the win evaluation
	// waits for them too. Turbo does not shorten them, for the same reason it
	// does not shorten the blast (see ReelBlast): this is the moment the round is
	// played for.
	//
	// Timed off timers rather than requestAnimationFrame, which stops dead in a
	// hidden tab — a round awaiting a rAF would hang for as long as the player
	// looked away. rAF-free drawing: the clock is a setInterval, and the awaits
	// are waitForTimeout.
	//
	// Sounds: fullboard_chain.wav and fullboard_stamp.wav are built to these
	// numbers (design/generate_audio_jungle.mjs). Change one, change both.
	const IGNITE_EVERY_MS = 190;
	const BURN_MS = 520;
	const TEASE_MS = 1300;
	// the dim and the trails fade out under ReelBlast's own CHARGE, which darkens
	// the same reels from nothing — so the board never pops bright in between
	const HANDOFF_MS = 380;
	const STAMP_MS = 1500;

	const REELS = BOARD_DIMENSIONS.x;
	const HEIGHT = SYMBOL_SIZE * BOARD_DIMENSIONS.y;
	const LEFT = getSymbolX(0) - SYMBOL_SIZE / 2;
	const WIDTH = SYMBOL_SIZE * REELS;
	const CX = LEFT + WIDTH / 2;
	const CY = HEIGHT / 2;

	let phase = $state<'none' | 'tease' | 'stamp'>('none');
	let clock = $state(0);
	let timer: ReturnType<typeof setInterval> | undefined;
	// a clear mid-beat must not let an old beat keep drawing, or wake a new one
	let generation = 0;

	const startClock = (endAt: number) => {
		clearInterval(timer);
		const t0 = Date.now();
		clock = 0;
		timer = setInterval(() => {
			clock = Date.now() - t0;
			if (clock >= endAt) {
				clearInterval(timer);
				phase = 'none';
			}
		}, 16);
	};
	onDestroy(() => clearInterval(timer));

	const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

	// ── TEASE ──────────────────────────────────────────────────────────────
	const drawTease = (g: PixiGraphics) => {
		const t = clock;
		// 1 through the tease, then down to 0 across the handoff
		const out = t < TEASE_MS ? 1 : 1 - Math.min(1, (t - TEASE_MS) / HANDOFF_MS);
		// the last beat: everything alight burns brighter, pulling towards the bang
		const intake = t < TEASE_MS - 350 ? 0 : Math.min(1, (t - (TEASE_MS - 350)) / 350);

		g.rect(LEFT, 0, WIDTH, HEIGHT).fill({ color: 0x140d05, alpha: 0.42 * Math.min(1, t / 300) * out });

		for (let k = 0; k < REELS; k++) {
			const lit = t - k * IGNITE_EVERY_MS;
			if (lit < 0) continue;
			const x = getSymbolX(k);
			const burn = easeOut(lit / BURN_MS);
			const y = HEIGHT * (0.02 + 0.96 * burn);
			const glow = (0.55 + 0.45 * intake) * out;

			// the burnt length of fuse behind the spark: a soft glow and a hot core
			g.moveTo(x, HEIGHT * 0.02)
				.lineTo(x, y)
				.stroke({ width: SYMBOL_SIZE * 0.16, color: 0xff7a10, alpha: 0.2 * glow, cap: 'round' });
			g.moveTo(x, HEIGHT * 0.02)
				.lineTo(x, y)
				.stroke({ width: SYMBOL_SIZE * 0.035, color: 0xffc45a, alpha: 0.85 * glow, cap: 'round' });

			// the spark, flickering, and flaring as it catches
			const catchFlare = lit < 160 ? 1 - lit / 160 : 0;
			const flicker = 0.7 + 0.3 * Math.abs(Math.sin(t * 0.045 + k * 1.9));
			const r = SYMBOL_SIZE * (0.07 + 0.05 * flicker + 0.12 * catchFlare + 0.05 * intake);
			g.circle(x, y, r * 2.6).fill({ color: 0xff8a2a, alpha: (0.22 + 0.3 * catchFlare) * out });
			g.circle(x, y, r).fill({ color: 0xffc45a, alpha: 0.95 * out });
			g.circle(x, y, r * 0.45).fill({ color: 0xfff6e0, alpha: out });
		}
	};

	// ── STAMP ──────────────────────────────────────────────────────────────
	const SPARKS = Array.from({ length: 28 }, (_, i) => {
		const seed = Math.sin(i * 91.7 + 3.1) * 43758.5453;
		const rand = seed - Math.floor(seed);
		return { angle: (i / 28) * Math.PI * 2 + rand * 0.3, reach: 0.55 + 0.5 * rand, size: 0.5 + rand };
	});

	const drawStamp = (g: PixiGraphics) => {
		const t = clock;
		// the flash: warm white, gone in a quarter of a second
		const flash = Math.max(0, 1 - t / 260);
		if (flash > 0) g.rect(LEFT, 0, WIDTH, HEIGHT).fill({ color: 0xfff1d6, alpha: 0.55 * flash });

		// the shockwave off the middle of the board, thinning as it goes
		const wave = Math.min(1, t / 650);
		if (wave < 1) {
			const radius = easeOut(wave) * WIDTH * 0.8;
			g.circle(CX, CY, radius).stroke({ width: SYMBOL_SIZE * 0.22 * (1 - wave), color: 0xffd27a, alpha: 0.8 * (1 - wave) });
			g.circle(CX, CY, radius * 0.86).stroke({ width: SYMBOL_SIZE * 0.06 * (1 - wave), color: 0xfff6e0, alpha: 0.9 * (1 - wave) });
		}

		// sparks thrown clear, falling a little as they slow
		const fly = Math.min(1, t / 900);
		if (fly < 1) {
			for (const s of SPARKS) {
				const d = easeOut(fly) * WIDTH * 0.5 * s.reach;
				const x = CX + Math.cos(s.angle) * d;
				const y = CY + Math.sin(s.angle) * d * 0.8 + fly * fly * SYMBOL_SIZE * 0.6;
				const r = SYMBOL_SIZE * 0.04 * s.size * (1 - fly * 0.6);
				g.circle(x, y, r * 2.2).fill({ color: 0xff8a2a, alpha: 0.3 * (1 - fly) });
				g.circle(x, y, r).fill({ color: 0xffe2a0, alpha: 1 - fly });
			}
		}
	};

	// BOOM! slams down from 2.4x, overshoots under, and settles, then holds and
	// fades. A small tilt so it lands like a stamp rather than a caption.
	const stampScale = $derived.by(() => {
		const t = clock;
		if (t < 170) return 2.4 - 1.55 * (t / 170);
		if (t < 300) return 0.85 + 0.15 * easeOut((t - 170) / 130);
		return 1;
	});
	const stampAlpha = $derived(
		clock < 90 ? clock / 90 : clock > STAMP_MS - 320 ? Math.max(0, (STAMP_MS - clock) / 320) : 1,
	);

	const draw = (g: PixiGraphics) => {
		g.clear();
		if (phase === 'tease') drawTease(g);
		else if (phase === 'stamp') drawStamp(g);
	};

	context.eventEmitter.subscribeOnMount({
		fullBoardTease: async () => {
			const mine = ++generation;
			phase = 'tease';
			startClock(TEASE_MS + HANDOFF_MS);
			context.eventEmitter.broadcast({ type: 'soundFullBoardChain' });
			await waitForTimeout(TEASE_MS);
			if (mine !== generation) return;
			// resolves here and keeps drawing through the handoff, under the blast
		},
		fullBoardStamp: async () => {
			const mine = ++generation;
			phase = 'stamp';
			startClock(STAMP_MS);
			context.eventEmitter.broadcast({ type: 'soundFullBoardStamp' });
			await waitForTimeout(STAMP_MS);
			if (mine !== generation) return;
		},
		reelBlastClear: () => {
			generation += 1;
			clearInterval(timer);
			phase = 'none';
		},
	});
</script>

<BoardContainer>
	<Graphics {draw} />
	{#if phase === 'stamp'}
		<Container x={CX} y={CY} scale={stampScale} alpha={stampAlpha} rotation={-0.07}>
			<GoldText
				text="BOOM!"
				fontSize={SYMBOL_SIZE * 1.15}
				fill={[0xfff6e0, 0xffc45a, 0xc07a14]}
				stroke={0x2a2016}
			/>
		</Container>
	{/if}
</BoardContainer>

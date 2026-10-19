<script lang="ts" module>
	export type EmitterEventFullBoard = { type: 'fullBoardTease' } | { type: 'fullBoardStamp' };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import TextMesh from './TextMesh.svelte';
	import { STAMP_ACT } from '../game/meshWin/textMesh';
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
	// the word's own slam (TextMesh, 2026-10-16): it squashes into the board
	// as the stamp lands, a shock runs out from the middle, a jelly settle
	let stampAt = $state(-1);
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
		for (let reel = 0; reel < REELS; reel++) {
			const t = Math.max(0, clock - reel * IGNITE_EVERY_MS);
			const live =
				Math.min(1, t / 220) * Math.max(0, 1 - Math.max(0, clock - TEASE_MS) / HANDOFF_MS);
			for (let i = 0; i < 7; i++) {
				const cy = HEIGHT * (0.17 + i * 0.11) - t * 0.018;
				const cx = getSymbolX(reel) + Math.sin(i * 2.1 + t / 600) * SYMBOL_SIZE * 0.15;
				g.circle(cx, cy, SYMBOL_SIZE * (0.015 + (i % 3) * 0.008)).stroke({
					width: 1.5,
					color: 0xa6cfa9,
					alpha: live * 0.5,
				});
			}
		}
	};

	// ── STAMP ──────────────────────────────────────────────────────────────
	const SPARKS = Array.from({ length: 28 }, (_, i) => {
		const seed = Math.sin(i * 91.7 + 3.1) * 43758.5453;
		const rand = seed - Math.floor(seed);
		return {
			angle: (i / 28) * Math.PI * 2 + rand * 0.3,
			reach: 0.55 + 0.5 * rand,
			size: 0.5 + rand,
		};
	});

	const drawStamp = (g: PixiGraphics) => {
		const alpha = Math.min(1, clock / 200) * Math.max(0, 1 - Math.max(0, clock - 850) / 650);
		g.roundRect(CX - WIDTH * 0.39, CY - SYMBOL_SIZE * 0.47, WIDTH * 0.78, SYMBOL_SIZE * 0.94, 14)
			.fill({ color: 0x102d28, alpha: alpha * 0.92 })
			.stroke({ width: 2, color: 0xb99d65, alpha: alpha * 0.7 });
	};

	// BOOM! slams down from 2.4x, overshoots under, and settles, then holds and
	// fades. A small tilt so it lands like a stamp rather than a caption.
	const stampScale = $derived(0.98 + 0.02 * Math.min(1, clock / 350));
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
			stampAt = Date.now();
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
		<Container x={CX} y={CY} scale={stampScale} alpha={stampAlpha} rotation={0}>
			<TextMesh
				text="TRANSMUTED"
				fontSize={SYMBOL_SIZE * 0.48}
				fill={[0xfff6e0, 0xffc45a, 0xc07a14]}
				stroke={0x2a2016}
				bevel
				at={{ stamp: stampAt }}
				act={STAMP_ACT}
			/>
		</Container>
	{/if}
</BoardContainer>

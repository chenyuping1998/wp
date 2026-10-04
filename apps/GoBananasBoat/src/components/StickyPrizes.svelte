<script lang="ts" module>
	export type EmitterEventStickyPrizes =
		| { type: 'stickyPrizesNew'; prizes: { reel: number; row: number; prize: number }[] }
		| { type: 'stickyPrizesCelebrate'; wins: { reel: number; row: number; prize: number }[] }
		| { type: 'stickyPrizesRestore'; prizes: { reel: number; row: number; prize: number }[] }
		| { type: 'stickyPrizesClear' };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { onDestroy } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import { waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import {
		SYMBOL_SIZE,
		BOARD_CELL_COLOR,
		isBigPrize,
		BIG_PRIZE_FROM,
		BIG_PRIZE_FILL,
		BIG_PRIZE_STROKE,
	} from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';
	import CoinMesh from './CoinMesh.svelte';

	type PrizeEntry = {
		reel: number;
		row: number;
		prize: number;
		scale: Tween<number>;
		landedAt: number;
		/** the toss (CoinMesh): when it started, how many whole turns, how long */
		tossAt: number;
		turns: number;
		tossMs: number;
	};

	// ── THE COIN IS TOSSED (2026-09-28) ─────────────────────────────────────────
	//
	// A coin that sticks used to pop in as a flat picture scaling up. Now it is
	// flipped in: it goes up off its plate, turns over twice in perspective
	// (CoinMesh), and comes down face-up with the pop's bounce — its value
	// appears once it has landed. At the tally every winning coin turns over
	// once more, as it pulses. Ends on whole turns, so it always stops face-up.
	const TOSS_MS = 560;
	const flipOf = (e: PrizeEntry) => {
		const p = tossProgress(e);
		return e.turns * Math.PI * 2 * (1 - (1 - p) ** 3);
	};
	const tossProgress = (e: PrizeEntry) => (e.tossAt === 0 ? 1 : Math.max(0, Math.min(1, (clock - e.tossAt) / e.tossMs)));
	// up and down once over the toss, a third of a cell at the top
	const hopOf = (e: PrizeEntry) => {
		const p = tossProgress(e);
		return e.turns > 1 ? -SYMBOL_SIZE * 0.34 * Math.sin(Math.PI * p) : 0;
	};

	const context = getContext();
	// visible padded row r sits at (r - 0.5) * SYMBOL_SIZE (same convention the crate reveal uses)
	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;
	const keyOf = (p: { reel: number; row: number }) => `${p.reel},${p.row}`;

	// threshold and palette live in constants so the reel-side copy of the same
	// coin (Symbol.svelte) grades identically
	const isBig = isBigPrize;

	// Landing shake, scaled by how big the prize is: 10x barely twitches, the
	// top prizes really slam. log10 keeps the range usable — the values span
	// three orders of magnitude, so anything linear would be imperceptible at
	// 10x or absurd at 10000x.
	const SHAKE_MS = 420;
	const shakeAmplitude = (prize: number) => {
		if (!isBig(prize)) return 0;
		const decades = Math.log10(prize / BIG_PRIZE_FROM); // 10x -> 0, 10000x -> 3
		return SYMBOL_SIZE * (0.05 + 0.055 * decades);
	};

	let clock = $state(0);
	let rafId = 0;
	let shakeRunning = false;

	const startShake = () => {
		if (shakeRunning) return;
		shakeRunning = true;
		const step = (now: number) => {
			clock = now;
			if (prizes.some((entry) => now - entry.landedAt < SHAKE_MS || now - entry.tossAt < entry.tossMs)) {
				rafId = requestAnimationFrame(step);
			} else {
				shakeRunning = false;
			}
		};
		rafId = requestAnimationFrame(step);
	};

	const shakeOffset = (entry: PrizeEntry) => {
		const amp = shakeAmplitude(entry.prize);
		if (amp === 0) return { x: 0, y: 0 };
		const t = clock - entry.landedAt;
		if (t < 0 || t > SHAKE_MS) return { x: 0, y: 0 };
		// decaying rattle; x and y run at different rates so it jitters rather
		// than sliding along one axis
		const decay = (1 - t / SHAKE_MS) ** 2;
		return {
			x: Math.sin(t / 17) * amp * decay,
			y: Math.cos(t / 13) * amp * decay * 0.8,
		};
	};

	let prizes = $state<PrizeEntry[]>([]);

	onDestroy(() => cancelAnimationFrame(rafId));

	context.eventEmitter.subscribeOnMount({
		// New coins landed and stuck: pop each in with a bounce (hold and spin
		// "hold em" — every new coin also resets the remaining spins).
		stickyPrizesNew: async ({ prizes: incoming }) => {
			const fresh = incoming.map((p) => ({
				...p,
				scale: new Tween(0),
				landedAt: performance.now(),
				tossAt: performance.now(),
				turns: 2,
				tossMs: TOSS_MS,
			}));
			prizes = [...prizes.filter((p) => !incoming.some((n) => keyOf(n) === keyOf(p))), ...fresh];
			for (const entry of fresh) {
				entry.tossAt = performance.now();
				// the rattle is the LANDING's, so it starts when the toss comes down
				entry.landedAt = entry.tossAt + TOSS_MS * 0.85;
				entry.scale.set(1, { duration: 420, easing: backOut });
				startShake();
				await waitForTimeout(140);
			}
			await waitForTimeout(360);
		},
		// Final tally: pulse every winning coin while the win counts up.
		stickyPrizesCelebrate: async ({ wins }) => {
			const winningKeys = new Set(wins.map(keyOf));
			for (const entry of prizes) {
				if (!winningKeys.has(keyOf(entry))) continue;
				entry.scale.set(1.35, { duration: 260, easing: cubicOut });
				entry.tossAt = performance.now();
				entry.turns = 1;
				entry.tossMs = 420;
			}
			startShake();
			await waitForTimeout(420);
			for (const entry of prizes) entry.scale.set(1, { duration: 260, easing: cubicOut });
			await waitForTimeout(300);
		},
		// Bet resume: rebuild instantly, no animation.
		stickyPrizesRestore: ({ prizes: restored }) => {
			prizes = restored.map((p) => ({ ...p, scale: new Tween(1), landedAt: 0, tossAt: 0, turns: 0, tossMs: 1 }));
		},
		stickyPrizesClear: () => {
			prizes = [];
		},
	});
</script>

<BoardContainer>
	{#each prizes as entry (keyOf(entry))}
		{@const x = getSymbolX(entry.reel)}
		{@const y = rowCenterY(entry.row)}
		<!--
			Occluder for the held cell. Its only job is to hide the reel sweeping
			behind the coin, so it is painted in the board's own plate colour rather than
			the old red — the cell then reads as an ordinary empty slot with a coin
			held on it, instead of a coloured plate laid over the reel. A thin brass
			edge still marks it as held.

		-->
		<Graphics
			draw={(g) => {
				g.clear();
				// square and full-bleed: a rounded fill alone leaves the cell
				// corners open and the sweep shows through them
				// PIXI v8 API. Olive plate and brass edge are two different colours in
				// one Graphics, which is exactly what the v7 shim collapses.
				g.rect(x - SYMBOL_SIZE / 2, y - SYMBOL_SIZE / 2, SYMBOL_SIZE, SYMBOL_SIZE);
				g.fill({ color: BOARD_CELL_COLOR, alpha: 1 });
				g.roundRect(
					x - SYMBOL_SIZE / 2 + 3,
					y - SYMBOL_SIZE / 2 + 3,
					SYMBOL_SIZE - 6,
					SYMBOL_SIZE - 6,
					10,
				);
				g.stroke({ width: 2.5, color: 0xffd43b, alpha: 0.45 });
			}}
		/>
		{@const shake = shakeOffset(entry)}
		{@const hop = hopOf(entry)}
		{@const settled = tossProgress(entry)}
		<!-- the plate stays; the coin turns over it (its own container: CoinMesh
		     adds itself at its parent's end, and must draw under the value) -->
		<Sprite
			key="gbPPlate"
			anchor={0.5}
			x={x + shake.x}
			y={y + shake.y}
			width={SYMBOL_SIZE * Math.min(1, entry.scale.current)}
			height={SYMBOL_SIZE * Math.min(1, entry.scale.current)}
		/>
		<Container>
			<CoinMesh x={x + shake.x} y={y + shake.y + hop} size={SYMBOL_SIZE} flip={flipOf(entry)} scale={entry.scale.current} />
		</Container>
		{#if isBig(entry.prize)}
			<!-- high-value coins get a hot rim so they separate from the $1s at a glance -->
			<Sprite
				key="fxGlow"
				anchor={0.5}
				x={x + shake.x}
				y={y + shake.y}
				width={SYMBOL_SIZE * 1.3}
				height={SYMBOL_SIZE * 1.3}
				tint={0xff8a3c}
				blendMode="add"
				alpha={0.22 + 0.18 * Math.min(1, entry.scale.current)}
			/>
		{/if}
		<Container
			x={x + shake.x}
			y={y + shake.y + hop}
			scale={entry.scale.current}
			alpha={entry.turns > 1 ? Math.max(0, (settled - 0.8) / 0.2) : 1}
		>
			<GoldText
				text={bookEventAmountToCurrencyString(entry.prize)}
				fontSize={28}
				maxWidth={SYMBOL_SIZE * 0.86}
				fill={isBig(entry.prize) ? BIG_PRIZE_FILL : undefined}
				stroke={isBig(entry.prize) ? BIG_PRIZE_STROKE : undefined}
			/>
		</Container>
	{/each}
</BoardContainer>

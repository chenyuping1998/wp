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
	import PropMesh from './PropMesh.svelte';
	import { COIN } from '../game/meshWin';
	import { coinFaceSwell, coinLift, type CoinEnv } from '../game/meshWin/coinP';
	type PrizeEntry = {
		reel: number;
		row: number;
		prize: number;
		scale: Tween<number>;
		landedAt: number;
		/** when the held coins were told to hop (a new coin landed), or -1 */
		hopAt: number;
	};

	const context = getContext();
	// visible padded row r sits at (r - 0.5) * SYMBOL_SIZE (same as ReelBlast)
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

	// One clock for every held coin. It runs while ANY coin is on the board, not
	// only through a landing shake: the coins are meshes now (meshWin/coinP.ts)
	// and the big ones breathe the whole time they are held.
	let clock = $state(0);
	let rafId = 0;
	let shakeRunning = false;
	const startShake = () => {
		if (shakeRunning) return;
		shakeRunning = true;
		const step = (now: number) => {
			clock = now;
			if (prizes.length > 0) {
				rafId = requestAnimationFrame(step);
			} else {
				shakeRunning = false;
			}
		};
		rafId = requestAnimationFrame(step);
	};

	// what the coin's mesh is told this frame
	const coinEnv = (entry: PrizeEntry): CoinEnv => ({
		t: clock,
		stickT: entry.landedAt > 0 ? clock - entry.landedAt : -1,
		hopT: entry.hopAt > 0 && clock >= entry.hopAt ? clock - entry.hopAt : -1,
		big: isBig(entry.prize),
	});
	// the mesh is drawn in 256-unit art space; the text on top is in board px
	const ART_PX = SYMBOL_SIZE / 256;

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
			const fresh = incoming.map((p) => ({ ...p, scale: new Tween(0), landedAt: performance.now(), hopAt: -1 }));
			// The coins already held hop as the new ones land — the respins reset
			// — in a wave outward from the first new coin, 45ms a cell.
			const now = performance.now();
			const origin = incoming[0];
			for (const held of prizes) {
				if (incoming.some((n) => keyOf(n) === keyOf(held)) || !origin) continue;
				const cells = Math.hypot(held.reel - origin.reel, held.row - origin.row);
				held.hopAt = now + 120 + cells * 45;
			}
			prizes = [...prizes.filter((p) => !incoming.some((n) => keyOf(n) === keyOf(p))), ...fresh];
			startShake();
			for (const entry of fresh) {
				entry.landedAt = performance.now();
				entry.scale.set(1, { duration: 420, easing: backOut });
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
			}
			await waitForTimeout(420);
			for (const entry of prizes) entry.scale.set(1, { duration: 260, easing: cubicOut });
			await waitForTimeout(300);
		},
		// Bet resume: rebuild instantly, no animation.
		stickyPrizesRestore: ({ prizes: restored }) => {
			prizes = restored.map((p) => ({ ...p, scale: new Tween(1), landedAt: 0, hopAt: -1 }));
			startShake();
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
			behind the coin, so it is painted in the board's own olive rather than
			the old red — the cell then reads as an ordinary empty slot with a coin
			held on it, instead of a coloured plate laid over the reel. A thin brass
			edge still marks it as held.

		-->
		<Graphics
			draw={(g) => {
				g.clear();
				// square and full-bleed: a rounded fill alone leaves the cell
				// corners open and the sweep shows through them
				g.beginFill(BOARD_CELL_COLOR, 1);
				g.drawRect(x - SYMBOL_SIZE / 2, y - SYMBOL_SIZE / 2, SYMBOL_SIZE, SYMBOL_SIZE);
				g.endFill();
				g.lineStyle(2.5, 0x59e3ff, 0.45);
				g.drawRoundedRect(
					x - SYMBOL_SIZE / 2 + 3,
					y - SYMBOL_SIZE / 2 + 3,
					SYMBOL_SIZE - 6,
					SYMBOL_SIZE - 6,
					10,
				);
			}}
		/>
		{@const shake = shakeOffset(entry)}
		{@const env = coinEnv(entry)}
		<!-- the coin through its mesh (meshWin/coinP.ts): pressed in as it
		     sticks, hopping when a new coin lands, the big ones breathing -->
		<PropMesh
			spec={COIN}
			{env}
			anchor={0.5}
			x={x + shake.x}
			y={y + shake.y}
			width={SYMBOL_SIZE * entry.scale.current}
			height={SYMBOL_SIZE * entry.scale.current}
		/>
		{#if isBig(entry.prize)}
			<!-- high-value coins get a hot rim so they separate from the $1s at a glance -->
			<Sprite
				key="fxGlow"
				anchor={0.5}
				x={x + shake.x}
				y={y + shake.y}
				width={SYMBOL_SIZE * 1.3}
				height={SYMBOL_SIZE * 1.3}
				tint={0xff3fd0}
				blendMode="add"
				alpha={0.22 + 0.18 * Math.min(1, entry.scale.current)}
			/>
		{/if}
		<!-- the value rides the coin's face: it lifts with the hop and swells
		     with the dome -->
		<Container
			x={x + shake.x}
			y={y + shake.y - coinLift(env) * ART_PX * entry.scale.current}
			scale={entry.scale.current * (1 + 0.6 * coinFaceSwell(env))}
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

<script lang="ts" module>
	export type EmitterEventSuperspinCells = {
		type: 'superspinCellsSpin';
		lockedKeys: string[];
	};
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForResolve } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	// Hold-and-spin cells that spin in place.
	//
	// The shared reel machinery scrolls a whole column at once, which is wrong for
	// this mode: a held coin has to sit perfectly still while the cells around it
	// move, and a column sweep drags everything past it. Superspin therefore skips
	// the reel spin entirely (see bookEventHandlerMap.reveal) — the board is
	// settled instantly and this overlay animates each unheld cell on its own,
	// cycling the two symbols the superspin strip actually contains: X and P.
	//
	// Because held cells are simply never given an overlay, nothing passes behind
	// them and they need no opaque plate to hide a sweep.

	const ROWS = BOARD_DIMENSIONS.y;
	const REELS = BOARD_DIMENSIONS.x;
	const SPIN_MS = 460;
	// each reel stops a beat after the one to its left, so the board still settles
	// left-to-right the way a slot is read
	const REEL_STAGGER_MS = 90;
	// how fast a cell cycles, in symbols per second
	const CYCLE_HZ = 14;

	const context = getContext();

	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;
	const cellKey = (reel: number, row: number) => `${reel},${row}`;

	let spinning = $state(false);
	let clock = $state(0);
	let startedAt = 0;
	let locked = $state(new Set<string>());
	let rafId = 0;

	const cells = Array.from({ length: REELS }, (_, reel) =>
		Array.from({ length: ROWS }, (_, i) => ({ reel, row: i + 1 })),
	).flat();

	// a cell is done once its reel's slot has elapsed
	const cellDone = (reel: number) => clock - startedAt >= SPIN_MS + reel * REEL_STAGGER_MS;

	const cellOffset = (reel: number, row: number) => {
		const t = (clock - startedAt) / 1000;
		// per-cell phase so the five cells of a reel are not locked in step —
		// they are independent reels, and identical motion would betray that
		const phase = (reel * 0.37 + row * 0.61) % 1;
		return ((t * CYCLE_HZ + phase) % 1) * SYMBOL_SIZE;
	};

	// alternate X / P as the strip scrolls past; P is rare on the real strip so it
	// shows up as an occasional flash of gold rather than a coin every other cell
	const symbolAt = (reel: number, row: number, step: number) => {
		const n = Math.floor((clock - startedAt) / (1000 / CYCLE_HZ)) + step + reel * 3 + row * 7;
		return n % 5 === 0 ? 'gbP' : 'gbX';
	};

	// Held so a mid-spin unmount can still settle the promise. Without it the
	// book player would await a resolve that never comes and the round would
	// hang — the same class of stall that has bitten this game before.
	let pendingResolve: (() => void) | null = null;

	const stop = () => {
		cancelAnimationFrame(rafId);
		rafId = 0;
	};

	const run = (resolve: () => void) => {
		pendingResolve = resolve;
		startedAt = performance.now();
		clock = startedAt;
		spinning = true;
		const total = SPIN_MS + (REELS - 1) * REEL_STAGGER_MS;
		const step = (now: number) => {
			clock = now;
			if (now - startedAt >= total) {
				spinning = false;
				stop();
				pendingResolve = null;
				resolve();
				return;
			}
			rafId = requestAnimationFrame(step);
		};
		rafId = requestAnimationFrame(step);
	};

	context.eventEmitter.subscribeOnMount({
		superspinCellsSpin: async ({ lockedKeys }) => {
			locked = new Set(lockedKeys);
			await waitForResolve((resolve) => run(resolve));
		},
	});

	onDestroy(() => {
		stop();
		pendingResolve?.();
		pendingResolve = null;
	});
</script>

{#if spinning}
	<BoardContainer>
		{#each cells as cell (cellKey(cell.reel, cell.row))}
			{#if !locked.has(cellKey(cell.reel, cell.row)) && !cellDone(cell.reel)}
				{@const x = getSymbolX(cell.reel)}
				{@const cy = rowCenterY(cell.row)}
				{@const off = cellOffset(cell.reel, cell.row)}
				<Container>
					<!-- opaque cell backing: the board underneath is already showing the
					     final symbol, so it has to be covered until this cell stops -->
					<Graphics
						draw={(g: PixiGraphics) => {
							g.clear();
							g.beginFill(0x0d1a08, 1);
							g.drawRect(x - SYMBOL_SIZE / 2, cy - SYMBOL_SIZE / 2, SYMBOL_SIZE, SYMBOL_SIZE);
							g.endFill();
						}}
					/>
					<Graphics
						isMask
						draw={(g: PixiGraphics) => {
							g.clear();
							g.beginFill(0xffffff, 1);
							g.drawRect(x - SYMBOL_SIZE / 2, cy - SYMBOL_SIZE / 2, SYMBOL_SIZE, SYMBOL_SIZE);
							g.endFill();
						}}
					/>
					{#each [0, 1] as step (step)}
						<Sprite
							key={symbolAt(cell.reel, cell.row, step)}
							anchor={0.5}
							{x}
							y={cy + off - step * SYMBOL_SIZE}
							width={SYMBOL_SIZE * 0.86}
							height={SYMBOL_SIZE * 0.86}
						/>
					{/each}
				</Container>
			{/if}
		{/each}
	</BoardContainer>
{/if}

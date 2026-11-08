<script lang="ts" module>
	import type { Position, SymbolName } from '../game/types';
	/**
	 * Petrify Gaze (SPEC 3-4).
	 *  petrifyRun     — Medusa lowers her glasses; the listed cells turn to stone (ST).
	 *  stoneRevealRun — the tumble chain stopped; every stone cracks open as `symbol`.
	 * Positions use padded rows, the same as every other book position.
	 */
	export type EmitterEventPetrify =
		| { type: 'petrifyRun'; positions: Position[] }
		| { type: 'stoneRevealRun'; positions: Position[]; symbol: SymbolName };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { BOARD_SIZES, SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import { medusaAnimations } from '../game/animationTimeline';
	import BoardContainer from './BoardContainer.svelte';
	import Crumble from './Crumble.svelte';

	// Placeholder choreography; final timings/art come from the Codex brief
	// (proposals/MedusaGaze梅杜莎凝視/MEDUSA_新機制_Codex需求單.md §2).
	const context = getContext();
	const STONE_SIZE = SYMBOL_SIZE * 0.98;
	const slotY = (row: number) => (row - 0.5) * SYMBOL_SIZE;

	let alive = true;
	const timers = new Set<ReturnType<typeof setTimeout>>();
	const sleep = (ms: number) =>
		new Promise<void>((resolve) => {
			const t = setTimeout(() => {
				timers.delete(t);
				resolve();
			}, ms);
			timers.add(t);
		});
	onDestroy(() => {
		alive = false;
		for (const t of timers) clearTimeout(t);
		timers.clear();
	});

	/**
	 * Tween driven by rAF for smoothness, but finished by a timer: a hidden tab
	 * stops rAF and the book must still advance (pixi-v8 gotcha #4).
	 */
	const tween = (ms: number, step: (t: number) => void) =>
		new Promise<void>((resolve) => {
			const start = performance.now();
			let done = false;
			const finish = () => {
				if (done) return;
				done = true;
				step(1);
				resolve();
			};
			const frame = (now: number) => {
				if (done || !alive) return;
				const t = Math.min(1, (now - start) / ms);
				step(t);
				if (t < 1) requestAnimationFrame(frame);
			};
			requestAnimationFrame(frame);
			void sleep(ms + 30).then(finish);
		});

	type Overlay = { id: number; x: number; y: number; alpha: number; scale: number; dx: number; crack?:number };
	type Chip = { id: number; x: number; y: number; seed: number };
	let nextId = 0;
 let sweep=$state(-1);
	let overlays = $state<Overlay[]>([]);
	let chips = $state<Chip[]>([]);

	const fast = () => stateBet.isTurbo;
	const cellOf = (p: Position) => context.stateGame.board[p.reel].reelState.symbols[p.row];

	const petrify = async ({ positions }: { positions: Position[] }) => {
		const visible = positions.filter((p) => p.row >= 1);
		if (!visible.length) return;
		// Her signature move: glasses down, then the gaze lands on the board.
		context.eventEmitter.broadcast({ type: 'medusaAction', animation: 'gaze', turbo: fast() });
		context.eventEmitter.broadcast({ type: 'soundMedusa', cue: 'peek' });
		await sleep(fast() ? 250 : medusaAnimations.gaze.beamAtMs);
		if (!alive) return;
		context.eventEmitter.broadcast({ type: 'soundMedusa', cue: 'gazeBeam' });
 const lightSweep=tween(fast()?300:600,t=>sweep=t).then(()=>{sweep=-1;});

		// Left-to-right sweep: each cell greys over and settles to stone.
		const stagger = fast() ? 30 : 70;
		const order = [...visible].sort((a, b) => a.reel - b.reel || a.row - b.row);
		await Promise.all(
			order.map(async (p, i) => {
				await sleep(i * stagger);
				if (!alive) return;
				const o: Overlay = { id: nextId++, x: getSymbolX(p.reel), y: slotY(p.row), alpha: 0, scale: 1.25, dx: 0 };
				overlays = [...overlays, o];
				await tween(fast() ? 140 : 260, (t) => {
					const e = 1 - (1 - t) ** 3;
					overlays = overlays.map((v) => (v.id === o.id ? { ...v, alpha: e, scale: 1.25 - 0.25 * e } : v));
				});
				const cell = cellOf(p);
				cell.rawSymbol = { name: 'ST' };
				cell.symbolState = 'static';
				overlays = overlays.filter((v) => v.id !== o.id);
				context.eventEmitter.broadcast({ type: 'soundMedusa', cue: 'petrifyCell', speed: 1 + i * 0.02 });
			}),
		);
		await sleep(fast() ? 120 : 380);
 void lightSweep;
	};

	const reveal = async ({ positions, symbol }: { positions: Position[]; symbol: SymbolName }) => {
		const visible = positions.filter((p) => p.row >= 1);
		context.eventEmitter.broadcast({ type: 'medusaAction', animation: 'react_small' });
		// 1. all stones rattle together — the beat before the payoff
		const shake = visible.map((p) => ({
			id: nextId++,
			x: getSymbolX(p.reel),
			y: slotY(p.row),
			alpha: 1,
			scale: 1,
			dx: 0,
		}));
		overlays = [...overlays, ...shake];
		context.eventEmitter.broadcast({ type: 'soundMedusa', cue: 'stoneRattle' });
		for (const p of visible) cellOf(p).rawSymbol = { name: symbol };
		await tween(fast() ? 220 : 520, (t) => {
			const amp = 4 * Math.sin(t * Math.PI);
			overlays = overlays.map((v) => {
				const k = shake.findIndex((s) => s.id === v.id);
				return k < 0 ? v : { ...v, dx: amp * Math.sin(t * 60 + k * 1.7), scale: 1 + 0.04 * t, crack: Math.max(0,Math.min(3,1+Math.floor((t*(fast()?220:520)-((fast()?220:520)-(fast()?135:270)))/(fast()?45:90)))) };
			});
		});
		if (!alive) return;
		// 2. crack: chips burst, the symbol underneath lands
		context.eventEmitter.broadcast({ type: 'soundMedusa', cue: 'stoneBurst' });
		const ids = new Set(shake.map((s) => s.id));
		overlays = overlays.filter((v) => !ids.has(v.id));
		chips = [...chips, ...shake.map((s, i) => ({ id: nextId++, x: s.x, y: s.y, seed: i * 7 + 3 }))];
		for (const p of visible) cellOf(p).symbolState = 'land';
		await sleep(fast() ? 200 : 450);
		for (const p of visible) cellOf(p).symbolState = 'static';
	};

	context.eventEmitter.subscribeOnMount({ petrifyRun: petrify, stoneRevealRun: reveal });
</script>

<BoardContainer>
 <Sprite key="mgGazeSweep" anchor={.5} x={-220+(BOARD_SIZES.width+440)*Math.max(0,sweep)} y={BOARD_SIZES.height/2} width={400} height={BOARD_SIZES.height} blendMode="add" visible={sweep>=0} alpha={sweep<0?0:.5*Math.sin(Math.PI*sweep)}/>
	{#each overlays as o (o.id)}
		<Sprite key={o.crack ? (['mgStoneCrack1','mgStoneCrack2','mgStoneCrack3'] as const)[o.crack-1] : 'mgST'} anchor={0.5} x={o.x + o.dx} y={o.y} width={STONE_SIZE * o.scale} height={STONE_SIZE * o.scale} alpha={o.alpha} />
	{/each}
	<Container>
		{#each chips as c (c.id)}
			<Crumble
				x={c.x}
				y={c.y}
				durationMs={fast() ? 240 : 420}
				assetKey="mgST"
				width={STONE_SIZE}
				height={STONE_SIZE}
				seed={c.seed}
				oncomplete={() => {
					if (alive) chips = chips.filter((v) => v.id !== c.id);
				}}
			/>
		{/each}
	</Container>
</BoardContainer>

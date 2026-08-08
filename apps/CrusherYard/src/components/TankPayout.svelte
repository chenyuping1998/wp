<script lang="ts" module>
	export type TankDatum = { reel: number; row: number; multiplier: number };

	export type EmitterEventTankPayout = {
		type: 'tankPayoutRun';
		positions: TankDatum[];
		boardMult: number;
	};
</script>

<script lang="ts">
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import {
		SYMBOL_SIZE,
		BOARD_DIMENSIONS,
		TANK_FLY_IN_MS,
		TANK_FLY_IN_STAGGER_MS,
		TANK_FLY_IN_MAX,
		TANK_FLY_IN_DEADLINE_MS,
		TANK_HEADLINE_FROM,
		QUENCH_FROM,
		QUENCH_HOLD_MS,
	} from '../game/constants';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	/**
	 * The nitrogen tanks resolving, at the end of a free spin.
	 *
	 * This is the only thing in the game that happens AFTER the board has gone
	 * quiet, and it needs its own beat for that reason. Everything else — the
	 * pressure gauge, the tumble chain — resolves while symbols are moving. A tank
	 * sits inert on the board for the whole spin and then multiplies the entire
	 * spin's win at the end, so if it shared the tumble's timing the player would
	 * see the payout jump with nothing on screen to explain it.
	 *
	 * The values are SUMMED, not multiplied together: three tanks of 5, 8 and 2
	 * make 15x, not 80x. The assembly here shows that sum being built one tank at
	 * a time, which is the only way the arithmetic is legible.
	 *
	 * Measured over 6,000 books per mode (10,176 of these events): one tank 79% of
	 * the time, two 18%, and never more than six. So there is no tail to merge —
	 * the cluster game's fly-in needed that because a big cluster could cover
	 * twenty heated cells; this cannot.
	 */
	const context = getContext();

	let tanks = $state<TankDatum[]>([]);
	let boardMult = $state(0);
	let running = $state(false);
	let t = $state(0);

	const slotY = (row: number) => (row - 1 + 0.5) * SYMBOL_SIZE;

	// Assembled at the middle of the board rather than at a winning cell: by this
	// point the winning symbols have already been crushed and there is no cluster
	// centre left to aim at.
	const target = $derived({
		x: (BOARD_DIMENSIONS.x * SYMBOL_SIZE) / 2,
		y: (BOARD_DIMENSIONS.y * SYMBOL_SIZE) / 2,
	});

	const duration = $derived(
		TANK_FLY_IN_MS + TANK_FLY_IN_STAGGER_MS * Math.max(0, tanks.length - 1) + 160,
	);

	const easeInBack = (v: number) => v * v * (2.2 * v - 1.2);

	/** How far each tank has travelled, 0 before its turn, 1 once landed. */
	const progressOf = (index: number) =>
		Math.max(0, Math.min(1, (t - index * TANK_FLY_IN_STAGGER_MS) / TANK_FLY_IN_MS));

	// The running sum, stepped up as each tank lands. This is what makes the
	// effect read as assembly rather than as decoration flying about.
	//
	// Once every tank has landed the readout switches to the event's own
	// boardMult rather than staying on the sum this component accumulated. The two
	// agree whenever `tanks` holds the full set, but the payout is applied from
	// boardMult — so if TANK_FLY_IN_MAX ever clips the list again, the player is
	// shown the number they were actually paid instead of a short one.
	const assembled = $derived(
		tanks.reduce((sum, tank, index) => (progressOf(index) >= 1 ? sum + tank.multiplier : sum), 0),
	);
	const allLanded = $derived(tanks.length > 0 && progressOf(tanks.length - 1) >= 1);
	const landed = $derived(allLanded ? boardMult : assembled);

	// Pops on each arrival, then settles.
	const bump = $derived.by(() => {
		let closest = 1;
		tanks.forEach((_, index) => {
			const since = t - (index * TANK_FLY_IN_STAGGER_MS + TANK_FLY_IN_MS);
			if (since >= 0 && since < 160) closest = Math.min(closest, since / 160);
		});
		return 1 + (1 - closest) * 0.35;
	});

	const drawTankMarks = (graphics: PixiGraphics) => {
		graphics.clear();
		if (!running) return;
		for (const tank of tanks) {
			if (tank.row < 1 || tank.row > BOARD_DIMENSIONS.y) continue;
			const left = getSymbolX(tank.reel) - SYMBOL_SIZE / 2 + 4;
			const top = slotY(tank.row) - SYMBOL_SIZE / 2 + 4;
			graphics.roundRect(left, top, SYMBOL_SIZE - 8, SYMBOL_SIZE - 8, 8);
		}
		graphics.stroke({ width: 3, color: 0x8fe3ff, alpha: 0.9 });
	};

	/**
	 * Runs the assembly on a clock and resolves when it is done.
	 *
	 * Bounded by a deadline for the same reason the cluster fly-in was: this await
	 * sits in the round's critical path, and a requestAnimationFrame loop stops
	 * being called when the tab is backgrounded. Without the bound, tabbing away
	 * mid-assembly and coming back leaves the round frozen; with it the worst case
	 * is one spike cut short.
	 */
	const runAssembly = async () => {
		const startedAt = performance.now();
		await new Promise<void>((resolve) => {
			let raf = 0;
			const tick = (now: number) => {
				t = now - startedAt;
				if (t >= duration || t >= TANK_FLY_IN_DEADLINE_MS) {
					resolve();
					return;
				}
				raf = requestAnimationFrame(tick);
			};
			raf = requestAnimationFrame(tick);
			// Belt and braces: if rAF never fires at all (backgrounded tab), the
			// timeout still lets the round continue.
			setTimeout(() => {
				cancelAnimationFrame(raf);
				resolve();
			}, TANK_FLY_IN_DEADLINE_MS);
		});
	};

	context.eventEmitter.subscribeOnMount({
		tankPayoutRun: async ({ positions, boardMult: mult }) => {
			// Guard rather than assertion: the books top out at five, but a maths
			// change that raises the tank density should degrade to showing the first
			// few rather than throwing a dozen numbers across the board.
			tanks = positions.slice(0, TANK_FLY_IN_MAX);
			boardMult = mult;
			t = 0;
			running = true;

			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_tank_burst' });
			context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.5 });

			await runAssembly();

			// The rarest tier: the yard is flooded. Held HERE rather than inside
			// QuenchFlash because the pause has to stop the SEQUENCE, not just play an
			// animation over it.
			if (mult >= QUENCH_FROM) {
				context.eventEmitter.broadcast({ type: 'quenchFlash' });
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
				context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1.1 });
				await waitForTimeout(QUENCH_HOLD_MS);
			}

			running = false;
			tanks = [];
			boardMult = 0;
		},
	});
</script>

{#if running}
	<BoardContainer>
		<Graphics draw={drawTankMarks} />

		{#each tanks as tank, index (index)}
			{@const p = progressOf(index)}
			{#if p > 0 && p < 1}
				{@const from = { x: getSymbolX(tank.reel), y: slotY(tank.row) }}
				{@const e = easeInBack(p)}
				{@const headline = tank.multiplier >= TANK_HEADLINE_FROM}
				<Container
					x={from.x + (target.x - from.x) * e}
					y={from.y + (target.y - from.y) * e - Math.sin(p * Math.PI) * SYMBOL_SIZE * 0.5}
					scale={1 + (1 - p) * 0.35}
				>
					<Sprite
						key="fxGlow"
						anchor={0.5}
						width={SYMBOL_SIZE * 0.85}
						height={SYMBOL_SIZE * 0.85}
						tint={headline ? 0xffffff : 0x8fe3ff}
						blendMode="add"
						alpha={0.8 * (1 - p * 0.3)}
					/>
					<Text
						text={`${tank.multiplier}x`}
						anchor={{ x: 0.5, y: 0.5 }}
						style={{
							fontFamily: GAME_FONT,
							fontWeight: GAME_FONT_WEIGHT,
							fontSize: SYMBOL_SIZE * (headline ? 0.4 : 0.34),
							fill: headline ? 0xffffff : 0xdff4ff,
							stroke: { color: 0x0a2733, width: 4 },
						}}
					/>
				</Container>
			{/if}
		{/each}

		<!-- the sum being assembled, where the spin's payout is about to jump -->
		{#if landed > 0}
			<Container x={target.x} y={target.y} scale={bump}>
				<Text
					text={`x${landed}`}
					anchor={{ x: 0.5, y: 0.5 }}
					style={{
						fontFamily: GAME_FONT,
						fontWeight: GAME_FONT_WEIGHT,
						fontSize: SYMBOL_SIZE * (landed >= boardMult ? 0.62 : 0.5),
						fill: landed >= QUENCH_FROM ? 0xffffff : 0xdff4ff,
						stroke: { color: 0x0a2733, width: 5 },
					}}
				/>
			</Container>
		{/if}
	</BoardContainer>
{/if}

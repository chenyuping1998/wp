<script lang="ts" module>
	import type { SymbolName } from '../game/types';

	export type EmitterEventMysteryOracle = { type: 'mysteryOracle'; symbol: SymbolName };
</script>

<script lang="ts">
	/**
	 * READING THE SEAL — which symbol every tablet in this run will open to.
	 *
	 * Built on the same idea as Go Bananas Boat's CargoPick, for the same reason:
	 * a free run holds ONE mystery symbol for its whole length (`mystery_cargo`,
	 * drawn once and then held — see assign_mystery_symbols), which is the single
	 * most important fact about the round the player is entering. Until now they
	 * had to infer it by watching two or three tablets crack open over several
	 * spins and noticing they matched.
	 *
	 * NOTHING IS DECIDED HERE. The maths settled this before the first frame —
	 * the symbol is read out of the book, from the first mysteryReveal after the
	 * trigger (see freeSpinTrigger in bookEventHandlerMap, which reads ahead the
	 * same way Boat's does). This is a reading of an omen already cast, not a
	 * draw a client could ever disagree with the book about.
	 *
	 * A REEL, NOT A WHEEL. This game already has a strong idiom for "a symbol
	 * being decided" — the sealed tablet cracking open — and a wheel or roulette
	 * would be a second, competing way of showing the same idea. A single-column
	 * strip dropped into a stone slot reuses the vocabulary that is everywhere
	 * else on this board (the tablet's own recess, the buy button's plate, the
	 * held-cell frame) rather than inventing a new shape for one moment.
	 */
	import { onDestroy } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { Container, Graphics, Rectangle, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForTimeout } from 'utils-shared/wait';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS, SYMBOL_INFO_MAP } from '../game/constants';
	import BoardContainer from './BoardContainer.svelte';

	const context = getContext();

	// The pool the maths draws from (game_config.mystery_weights): every paying
	// symbol including the Wild — this game's tablets DO reveal to W, unlike
	// Boat's cargo. S can never be the seal (assign_mystery_symbols never draws
	// it — the weight tables carry no S entry at all) and must not appear in a
	// reel pretending it could.
	const POOL = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'L5', 'W'] as const;

	// THIS IS THE SLOWEST THING IN THE GAME, DELIBERATELY — same reasoning as
	// Boat's cargo pick. It runs once per free round, before the spins that pay
	// off whatever it names, so nothing is lost by giving it room.
	const LEAD_MS = 750;
	const LEAD_MS_TURBO = 550;
	const SPIN_MS = 3000;
	const SPIN_MS_TURBO = 2300;
	// THE PAUSE AFTER IT LANDS, AND TURBO KEEPS IT.
	//
	// Everything else here shortens under turbo — the waiting does, which is what
	// turbo is for. This does not, or barely: the symbol arriving IS the payoff,
	// and at 650ms the free spins were already starting before the player had
	// read what the run had been sealed with. A hold is not waiting; it is the
	// moment landing.
	const HOLD_MS = 1700;
	const HOLD_MS_TURBO = 1400;
	const TRAVEL = 14;
	const APPROACH_SHARE = 0.55;

	// A tablet-sized slot, not a board cell: this is one symbol being read, not
	// a cell of the board underneath it.
	const CELL = SYMBOL_SIZE * 1.55;

	const board = {
		width: SYMBOL_SIZE * BOARD_DIMENSIONS.x,
		height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
	};

	let show = $state(false);
	let strip = $state<string[]>([]);
	let pos = $state(0);
	type Phase = 'lead' | 'turning' | 'approach' | 'landed';
	let phase = $state<Phase>('lead');
	let raf = 0;
	// The frame loop stops in a backgrounded tab — same rule every clock in this
	// game follows now. The timer owns the ending; rAF only interpolates.
	let killTimer = 0;

	// The punch on the landing. The hold gives the player time to read the symbol;
	// this is what tells them to look at it.
	//
	// A Tween rather than a clock of its own: the rAF loop above EXITS the frame
	// the reel lands, so there is nothing left running to interpolate against —
	// and a Tween carries its own reactivity, which is the idiom the rest of this
	// game uses for exactly this (see ExpandingWilds' badge in Go Bananas 100).
	const punch = new Tween(0);
	const slam = () => {
		punch.set(1, { duration: 130, easing: cubicOut }).then(() => {
			punch.set(0, { duration: 320, easing: cubicOut });
		});
	};

	onDestroy(() => {
		cancelAnimationFrame(raf);
		clearTimeout(killTimer);
	});

	const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;
	const smoothstep = (p: number) => p * p * (3 - 2 * p);

	const positionAt = (p: number, last: number) =>
		p < APPROACH_SHARE
			? easeOutCubic(p / APPROACH_SHARE) * (last - 1)
			: last - 1 + smoothstep((p - APPROACH_SHARE) / (1 - APPROACH_SHARE));

	const assetKeyOf = (name: string) =>
		(SYMBOL_INFO_MAP as Record<string, { static: { assetKey: string } }>)[name].static.assetKey;

	// Target is the LAST entry, so running `pos` to the end lands on it by
	// construction rather than by arithmetic that could be off by one.
	const buildStrip = (target: SymbolName) => [
		...Array.from({ length: TRAVEL }, () => POOL[Math.floor(Math.random() * POOL.length)]),
		target,
	];

	const spin = (target: SymbolName, ms: number) => {
		cancelAnimationFrame(raf);
		clearTimeout(killTimer);
		pos = 0;
		phase = 'turning';
		const last = strip.length - 1;
		const t0 = performance.now();
		const step = (now: number) => {
			const p = Math.min(1, (now - t0) / ms);
			pos = positionAt(p, last);
			if (p >= APPROACH_SHARE && phase === 'turning') phase = 'approach';
			if (p >= 1) {
				phase = 'landed';
				return;
			}
			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		killTimer = setTimeout(() => {
			cancelAnimationFrame(raf);
			pos = last;
			phase = 'landed';
		}, ms + 40) as unknown as number;
	};

	// The window the reel runs in: a stone recess with a gilt hairline lip — the
	// same three-part construction (basalt / sandstone / gilt) as every plate in
	// this game, in place of Boat's brass-lipped chrome slot.
	const drawSlot = (g: PixiGraphics) => {
		g.clear();
		const w = CELL * 1.12;
		const h = CELL * 1.12;
		g.roundRect(-w / 2, -h / 2, w, h, 10);
		g.fill({ color: 0x14171a, alpha: 0.95 });
		g.roundRect(-w / 2, -h / 2, w, h, 10);
		g.stroke({ width: 5, color: 0x8a7859, alpha: 0.95 });
		// the lip lights by stage, so the slot itself says where in the spin
		// this is — dim while it waits, brightest once the seal is fixed
		const LIP: Record<Phase, number> = { lead: 0.28, turning: 0.45, approach: 0.7, landed: 1 };
		const alpha = LIP[phase];
		g.roundRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 6);
		g.stroke({ width: 1.6, color: 0xffd75e, alpha: 0.3 + 0.55 * alpha });
		// corner studs, matching the buy cards and every symbol plate
		for (const [cx, cy] of [
			[-w / 2 + 8, -h / 2 + 8],
			[w / 2 - 14, -h / 2 + 8],
			[-w / 2 + 8, h / 2 - 14],
			[w / 2 - 14, h / 2 - 14],
		]) {
			g.rect(cx, cy, 6, 6).fill({ color: 0x9a7f66, alpha: 0.85 });
		}
	};

	context.eventEmitter.subscribeOnMount({
		mysteryOracle: async (event) => {
			const ms = stateBet.isTurbo ? SPIN_MS_TURBO : SPIN_MS;

			// The slot drops in and waits, holding a filler symbol — dead time on
			// purpose, so its arrival reads as an event and not just a state the
			// board was found in.
			phase = 'lead';
			pos = 0;
			strip = buildStrip(event.symbol);
			show = true;
			// He turns to look while the slot is still holding still, so his reaction
			// is what ARRIVES with it rather than something that happens afterwards.
			context.eventEmitter.broadcast({ type: 'mascotOracle', phase: 'watch' });
			context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.25 });
			await waitForTimeout(stateBet.isTurbo ? LEAD_MS_TURBO : LEAD_MS);

			// ...and then the seal takes the strain and it goes. Reusing the sealed
			// tablet's own cue rather than Boat's rope-and-crate one — this is the
			// same stone giving way, read once for the whole run instead of once
			// per cell.
			context.eventEmitter.broadcast({ type: 'soundSealStrain' });
			spin(event.symbol, ms);
			// The same tremolo the reels use when a Scatter is one reel away — this
			// game has already taught the player to read it as "wait for it".
			await waitForTimeout(ms * APPROACH_SHARE);
			context.eventEmitter.broadcast({ type: 'soundReelTensionStart' });
			// He leans in a second time as the reel reaches its final cell. 'alert'
			// is a 1.1s one-shot and the spin is three seconds, so a single look at
			// the start left him back at rest for the half of it that matters —
			// and the approach is the beat the whole animation is built around.
			context.eventEmitter.broadcast({ type: 'mascotOracle', phase: 'watch' });
			await waitForTimeout(ms * (1 - APPROACH_SHARE));
			context.eventEmitter.broadcast({ type: 'soundReelTensionStop' });
			// TWO cues on the landing, because it is two things at once.
			//
			// The crack is the seal setting — the same note the tablets give when
			// they break, which is what this has just decided for the whole run. The
			// gliss over the top is the announcement. Alone, the crack was a thud
			// that could be mistaken for another reel stop; the pair reads as an
			// answer.
			context.eventEmitter.broadcast({ type: 'soundStoneCrack', step: 0 });
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
			context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.55 });
			context.eventEmitter.broadcast({ type: 'mascotOracle', phase: 'reveal' });
			slam();
			await waitForTimeout(stateBet.isTurbo ? HOLD_MS_TURBO : HOLD_MS);
			show = false;
		},
	});
</script>

{#if show}
	<BoardContainer>
		<!-- the board goes quiet behind it; this sits over the reels, which are
		     showing the trigger board and have nothing left to say -->
		<Graphics
			draw={(g) => {
				g.clear();
				g.rect(0, 0, board.width, board.height);
				g.fill({ color: 0x05070a, alpha: 0.78 });
			}}
		/>

		<Container
			x={board.width / 2}
			y={board.height / 2}
			scale={1 + 0.11 * punch.current}
		>
			<Graphics draw={drawSlot} />

			<!-- the whole strip is one container, and it is the thing that moves —
			     see CargoPick.svelte for why this shape rather than per-frame
			     texture swaps -->
			<Container>
				<Rectangle
					isMask
					x={-CELL / 2}
					y={-CELL / 2}
					width={CELL}
					height={CELL}
					backgroundColor={0xffffff}
				/>
				<Container y={-pos * CELL}>
					{#each strip as name, index (index)}
						<Container y={index * CELL}>
							<Sprite key={assetKeyOf(name)} anchor={0.5} width={CELL} height={CELL} />
						</Container>
					{/each}
				</Container>
			</Container>
		</Container>
	</BoardContainer>
{/if}

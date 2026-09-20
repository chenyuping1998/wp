<script lang="ts" module>
	import type { SymbolName } from '../game/types';

	export type EmitterEventCargoPick = { type: 'cargoPick'; symbol: SymbolName };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Graphics, Rectangle, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForTimeout } from 'utils-shared/wait';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS, SYMBOL_INFO_MAP } from '../game/constants';
	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';

	// READING THE MANIFEST — which cargo this run is carrying.
	//
	// A free run shares ONE cargo symbol: every crate, on every spin, opens on the
	// same thing (see assign_mystery_symbols — the maths draws once per run and
	// holds it). That is the single most important fact about the round the player
	// is entering, and until now they had to infer it by watching the first few
	// crates come off and noticing that they matched.
	//
	// So the round opens by naming it: one reel, spun and stopped on the cargo.
	//
	// NOTHING IS DECIDED HERE. The maths settled this before the first frame; the
	// symbol comes out of the book (see freeSpinTrigger in bookEventHandlerMap,
	// which reads ahead to the run's first mysteryReveal). This is a reading of a
	// manifest, not a draw — which matters beyond honesty, because a client-side
	// draw that disagreed with the book would show one cargo and pay another.

	const context = getContext();

	// The pool the maths draws from: everything that pays. W and S are excluded in
	// the maths for reasons that are structural rather than aesthetic — a wild
	// folds into the reel's count and would multiply across reels, a scatter would
	// move the trigger rate — so they can never be the cargo and must not appear
	// in the reel pretending they could.
	const POOL = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'L5'] as const;

	// THIS IS THE SLOWEST THING IN THE GAME, DELIBERATELY.
	//
	// It happens once per free round and it decides what every crate in that round
	// will open as. There is nothing to rush towards — the spins come next either
	// way — so the time spent here is the only anticipation the round gets before
	// it starts paying.
	//
	// Turbo shortens it but does not change its shape, the same rule the crate
	// reveal follows: turbo is for the waiting, not for the payoff.
	// THE SLOT ARRIVES, AND THEN NOTHING HAPPENS FOR A MOMENT.
	//
	// It used to start turning on the frame it appeared, which gives the player
	// nothing to arrive at — by the time they have registered that a new thing is
	// on screen it is already a blur. The lead-in is dead time on purpose: the
	// slot drops in, sits there holding one symbol, and only then goes. It is also
	// what makes the START of the spin an event rather than just the state the
	// slot was found in.
	const LEAD_MS = 750;
	const LEAD_MS_TURBO = 550;
	const SPIN_MS = 3000;
	const SPIN_MS_TURBO = 2300;
	const HOLD_MS = 900;
	const HOLD_MS_TURBO = 650;
	// How many symbols pass before the target. Enough that the landing is not
	// predictable from the first frame, and not so many that it becomes a list.
	const TRAVEL = 14;

	// THE LAST CELL GETS ITS OWN PHASE, AND MOST OF THE CLOCK.
	//
	// A single ease-out across the whole strip spends its slow part spread over
	// the last three or four symbols, so the reel drifts to a halt and the final
	// symbol arrives as the least eventful moment in the run. Splitting it means
	// the reel can come almost to rest ONE SHORT of the cargo and then creep the
	// last position on its own — which is the beat the player is waiting on.
	//
	// 0.55 of the clock covers thirteen cells; the remaining 0.45 covers one. At
	// 2400ms that is a little over a second on the final symbol alone.
	const APPROACH_SHARE = 0.55;

	// Bigger than a board cell. This is one symbol being presented, not a cell of
	// a board, and at cell size it read as a stray reel left running.
	const CELL = SYMBOL_SIZE * 1.55;

	const board = {
		width: SYMBOL_SIZE * BOARD_DIMENSIONS.x,
		height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
	};

	let show = $state(false);
	let strip = $state<string[]>([]);
	let pos = $state(0);
	// Four stages, because the slot's own lip reports which one it is in and two
	// booleans had started to disagree about the order they could be in.
	//   lead      on screen, holding still
	//   turning   running down the strip
	//   approach  on the final cell
	//   landed    stopped on the cargo
	type Phase = 'lead' | 'turning' | 'approach' | 'landed';
	let phase = $state<Phase>('lead');
	let raf = 0;
	// The frame loop stops in a backgrounded tab, so it cannot be what ends this —
	// same rule as FullShipment. The timer owns the ending; rAF only interpolates.
	let killTimer = 0;

	onDestroy(() => {
		cancelAnimationFrame(raf);
		clearTimeout(killTimer);
		// A LOOP, so it has to be stopped by something that always runs. The happy
		// path stops it when the reel lands; this is for the round being torn down
		// mid-spin, which would otherwise leave a hoist running under the free
		// games for as long as the tab is open.
		context.eventEmitter.broadcast({ type: 'soundCargoRoll', phase: 'stop' });
	});

	// Cubic ease-out for the approach: fast off the mark, losing momentum all the
	// way, arriving at the cell before the cargo with almost nothing left. Quartic
	// was too front-loaded — it spent its middle already crawling, so by the time
	// the last cell came round there was no contrast left to make it mean
	// anything.
	const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;
	// ...and a smoothstep for the final cell, so it eases OUT of the near-stop as
	// well as into the landing. A linear last cell reads as the reel being dragged
	// by hand; this reads as it having just enough left to turn over once more.
	const smoothstep = (p: number) => p * p * (3 - 2 * p);

	// `pos` in cells at a given point through the spin. Split in two - see
	// APPROACH_SHARE.
	const positionAt = (p: number, last: number) =>
		p < APPROACH_SHARE
			? easeOutCubic(p / APPROACH_SHARE) * (last - 1)
			: last - 1 + smoothstep((p - APPROACH_SHARE) / (1 - APPROACH_SHARE));

	const assetKeyOf = (name: string) =>
		(SYMBOL_INFO_MAP as Record<string, { static: { assetKey: string } }>)[name].static.assetKey;

	// The target is the LAST entry, so `pos` running to the end lands on it by
	// construction rather than by arithmetic that could be off by one. Built
	// before the lead-in, because the slot is on screen holding strip[0] while it
	// waits.
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

	// The window the reel runs in: a recessed slot with a brass lip, the same
	// language as the board's own housing.
	const drawSlot = (g: PixiGraphics) => {
		g.clear();
		const w = CELL * 1.12;
		const h = CELL * 1.12;
		g.roundRect(-w / 2, -h / 2, w, h, 14);
		g.fill({ color: 0x0b1318, alpha: 0.92 });
		g.roundRect(-w / 2, -h / 2, w, h, 14);
		// The lip lights by stage, so the slot itself says where in the spin this
		// is — dimmest while it waits, brightest once it has stopped.
		const LIP: Record<Phase, [number, number]> = {
			lead: [0.34, 0.14],
			turning: [0.5, 0.22],
			approach: [0.78, 0.45],
			landed: [0.95, 0.6],
		};
		const [outer, inner] = LIP[phase];
		g.stroke({ width: 6, color: 0xd8a334, alpha: outer });
		g.roundRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 9);
		g.stroke({ width: 2, color: 0xffe98a, alpha: inner });
	};

	context.eventEmitter.subscribeOnMount({
		cargoPick: async (event) => {
			const ms = stateBet.isTurbo ? SPIN_MS_TURBO : SPIN_MS;

			// The slot drops into place and waits. Nothing is moving, and the strip
			// is parked on its first symbol — which is filler, not the cargo, so the
			// pause gives nothing away.
			phase = 'lead';
			pos = 0;
			strip = buildStrip(event.symbol);
			show = true;
			// He turns to look while the slot is still holding still, so the look is
			// what ARRIVES with it rather than a reaction to it having already gone.
			context.eventEmitter.broadcast({ type: 'mascotCargo', phase: 'watch' });
			context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.25 });
			await waitForTimeout(stateBet.isTurbo ? LEAD_MS_TURBO : LEAD_MS);

			// ...and then the rope takes the load and it goes.
			context.eventEmitter.broadcast({ type: 'soundCrateStrain' });
			// ...and the hoist runs for as long as the reel does. rope_strain above
			// is the load being taken — one event, 0.42s — and for the three seconds
			// after it the reel used to turn in silence.
			context.eventEmitter.broadcast({ type: 'soundCargoRoll', phase: 'start' });
			spin(event.symbol, ms);
			// Hand over to the anticipation loop for the final cell — the same
			// tremolo the reels use when a scatter is one reel away, which is the
			// cue this game has already taught the player to read as "wait".
			await waitForTimeout(ms * APPROACH_SHARE);
			// Louder than the board's own anticipation (0.8). There, this plays under
			// four reels still spinning; here it is the only thing happening, and the
			// moment it marks decides every crate in the round.
			context.eventEmitter.broadcast({ type: 'soundReelTensionStart', gain: 1 });
			// The roll comes UP into the last cell rather than fading out of the way
			// of the tension loop. This is the loudest the reel gets, and it should
			// be: it is the point of the whole ceremony.
			context.eventEmitter.broadcast({ type: 'soundCargoRoll', phase: 'swell' });
			// He leans in a second time as the reel reaches its final cell. `alert` is
			// a 1.1s one-shot against a three-second spin, so a single look at the
			// start left him back at rest for the half of it that matters — and the
			// approach is the beat the whole thing is built around.
			context.eventEmitter.broadcast({ type: 'mascotCargo', phase: 'watch' });
			await waitForTimeout(ms * (1 - APPROACH_SHARE));
			context.eventEmitter.broadcast({ type: 'soundReelTensionStop' });
			context.eventEmitter.broadcast({ type: 'soundCargoRoll', phase: 'stop' });
			// THE LOCK.
			//
			// This used to borrow `soundTarpPull` and rattle the housing at 0.55, and
			// both were understating it. tarp_pull is a cue about a cover coming OFF
			// something, and nothing is being uncovered here — the reel is arriving at
			// its stop. And 0.55 on the frame alone says "something bumped the
			// housing", when what has actually happened is that the machine deciding
			// the whole round has come to rest.
			//
			// So: its own cue (cargo_lock — iron pin, sub drop, brass hasp), the frame
			// at full, and the WHOLE SCENE thrown. This is the only place the scene
			// shake is spent at strength 1.
			context.eventEmitter.broadcast({ type: 'soundCargoLock' });
			context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1 });
			context.eventEmitter.broadcast({ type: 'cameraShake', strength: 1 });
			context.eventEmitter.broadcast({ type: 'mascotCargo', phase: 'reveal' });
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
				g.fill({ color: 0x050b0f, alpha: 0.72 });
			}}
		/>

		<Container x={board.width / 2} y={board.height / 2}>
			<!-- what this wheel is deciding: the round's cargo SYMBOL. The multiplier
			     wheel that follows carries its own caption in the same place, so
			     the two read as a pair — first the symbol, then what it is worth. -->
			<GoldText text="SYMBOL" y={-CELL * 0.82} fontSize={SYMBOL_SIZE * 0.2} letterSpacing={3} />

			<Graphics draw={drawSlot} />

			<!--
				THE WHOLE STRIP IS ONE CONTAINER, AND IT IS THE THING THAT MOVES.

				First version built two sprites and rewrote their `y` and their texture
				every frame, so that a one-cell window could show a strip of fifteen.
				It did not move on screen — and rather than work out which of the two
				per-frame rewrites was not landing, this drops both: all fifteen
				symbols are laid out once, stacked a cell apart, and a single parent
				slides. That is the shape every animation in this game already uses
				(MysteryReveal's tarps, StickyPrizes' shake), there is no texture swap
				during the spin at all, and fifteen sprites is nothing.

				`pos` is in CELLS, so the symbol at index `pos` sits in the window by
				construction — which is why the target being the last entry is enough
				to land on it.
			-->
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

<script lang="ts" module>
	export type EmitterEventMultiplierPick = { type: 'multiplierPick'; multiplier: number };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Graphics, Rectangle } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForTimeout } from 'utils-shared/wait';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { MULTIPLIER_TIERS, MULTIPLIER_LIT } from '../game/multiplierTiers';
	import { wheelSchedule, wheelPositionAt } from '../game/wheelSchedule';
	import BoardContainer from './BoardContainer.svelte';
	import FlapperMesh from './FlapperMesh.svelte';
	import GoldText from './GoldText.svelte';
	import MultiplierPlateMesh from './MultiplierPlateMesh.svelte';

	// THE SECOND WHEEL: what every win in this round will be worth.
	//
	// Straight after the cargo wheel (CargoPick), in the same slot, with the same
	// hoist and the same lock — the two read as one ceremony: what the crates
	// hold, then how much it all counts for. freeSpinTrigger reads ahead to the
	// book's freeGameMultiplier event and plays this with its value.
	//
	// NOTHING IS DECIDED HERE, as with the cargo. The maths drew the multiplier
	// before the round began and every win in the book is already multiplied by
	// it; this is a reading of that, not a draw. A client-side draw that disagreed
	// with the book would show one multiplier and pay another.
	//
	// THE FILLER IS RANDOM, AND DELIBERATELY SO. It would be easy to park an x5 in
	// the cell before an x1 landing to make the stop feel close. That is a staged
	// near miss — presenting a result as nearly something it never could have been
	// — and it is exactly the kind of thing certification objects to. The strip
	// is decoration; it is not allowed to argue with the outcome.

	const context = getContext();

	const VALUES = [1, 2, 3, 4, 5] as const;

	// Shorter than the cargo wheel. It is the second wheel in a row, and the
	// player has just sat through one; the same length again would turn a
	// ceremony into a wait.
	const LEAD_MS = 450;
	const LEAD_MS_TURBO = 350;
	const SPIN_MS = 2800;
	const SPIN_MS_TURBO = 2600;
	const HOLD_MS = 1000;
	const HOLD_MS_TURBO = 700;
	const TRAVEL = 18;

	// ── HOW IT STOPS, AND WHY IT IS NOT CargoPick's CURVE ─────────────────────
	//
	// The cargo wheel spends 55% of its clock easing across every cell but the
	// last, then crawls that one cell for the remaining 45%. Through a ONE-CELL
	// window that works: you cannot see the cells before it, so the crawl IS the
	// stop. Through this three-cell window the same curve reads as the strip
	// running at speed and then one lone value inching in — not a wheel losing
	// its momentum.
	//
	// A wheel winds down over SEVERAL cells, each one slower than the one before
	// it. So the motion here is built from a DWELL SCHEDULE rather than a curve:
	// the last five cells each take 1/RATIO times as long as the cell before
	// them, and everything earlier runs at the speed the wind-down starts at.
	const APPROACH_CELLS = 5;
	// 0.6 — each approach cell takes about 1.67x the previous one. Lower and the
	// wind-down is abrupt; higher and the last cells are all much the same speed,
	// which is the flat feel this replaced.
	const RATIO = 0.48;

	// A HORIZONTAL WHEEL: the values slide LEFT TO RIGHT across a window three
	// cells wide, and the centre cell is the pick.
	//
	// The cargo wheel runs vertically in a one-cell window, and a symbol reads
	// fine that way — it is a picture. A number blinking through one box does
	// not: it reads as a counter ticking, not as something travelling. Three
	// cells wide, the player sees each value come in from the left, cross the
	// pick and leave on the right, and sees the last one arrive and stop.
	//
	// Smaller than the cargo cell so three of them fit across the board with
	// room to spare (3 x 1.25 = 3.75 symbols on a 5-symbol board).
	const CELL = SYMBOL_SIZE * 1.25;
	const WINDOW = 3;

	const board = {
		width: SYMBOL_SIZE * BOARD_DIMENSIONS.x,
		height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
	};

	type Phase = 'lead' | 'turning' | 'approach' | 'landed';
	let show = $state(false);
	let strip = $state<number[]>([]);
	let pos = $state(0);
	let phase = $state<Phase>('lead');
	let raf = 0;
	let lockTimer = 0;
	let lockStarted = $state(0);
	let lockClock = $state(0);
	// The frame loop stops in a backgrounded tab, so it cannot be what ends this —
	// same rule as CargoPick. The timer owns the ending; rAF only interpolates.
	let killTimer = 0;

	onDestroy(() => {
		cancelAnimationFrame(raf);
		clearTimeout(killTimer);
		clearInterval(lockTimer);
		context.eventEmitter.broadcast({ type: 'soundCargoRoll', phase: 'stop' });
	});

	// The schedule: how long the strip rests on each cell on its way to the stop.
	// Laid out so the TARGET sits at index TRAVEL with one filler either side of
	// it at the end — the window is three wide, so the landed value needs a
	// neighbour on each side or the stop shows an empty cell. The strip starts
	// at pos 1 for the same reason (index 0 is the right-hand neighbour then).
	const filler = () => VALUES[Math.floor(Math.random() * VALUES.length)];
	const buildStrip = (target: number) => [
		...Array.from({ length: TRAVEL }, filler),
		target,
		filler(),
	];

	// when the wind-down begins, for the cues that have to start with it
	const windDownMs = (ms: number) => {
		const s = wheelSchedule(TRAVEL - 1, ms, APPROACH_CELLS, RATIO);
		return s.times[s.cruise];
	};

	const spin = (ms: number) => {
		cancelAnimationFrame(raf);
		clearTimeout(killTimer);
		pos = 1;
		phase = 'turning';
		// the target's index: see buildStrip
		const last = TRAVEL;
		const schedule = wheelSchedule(last - 1, ms, APPROACH_CELLS, RATIO);
		const windDownAt = schedule.times[schedule.cruise];
		const t0 = performance.now();
		const step = (now: number) => {
			const t = now - t0;
			pos = 1 + wheelPositionAt(Math.min(t, ms), schedule);
			if (t >= windDownAt && phase === 'turning') phase = 'approach';
			if (t >= ms) {
				pos = last;
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

	// The plates' colours live in game/multiplierTiers, because the badge that
	// states the multiplier for the rest of the round (FreeSpinMultiplier) has to
	// use the same ones — see the note there.
	const drawPlate = (g: PixiGraphics, value: number) => {
		const t = MULTIPLIER_TIERS[value - 1];
		const w = CELL * 0.86;
		const r = 14;
		g.clear();

		// the halo, outside-in: only the top tiers have one, and it is what makes
		// them read as lit rather than merely coloured
		if (t.halo > 0) {
			for (const [spread, width, k] of [
				[10, 9, 0.45],
				[5, 6, 0.75],
				[1, 4, 1],
			] as [number, number, number][]) {
				g.roundRect(-w / 2 - spread, -w / 2 - spread, w + spread * 2, w + spread * 2, r + spread);
				g.stroke({ width, color: t.rim, alpha: t.halo * k });
			}
		}

		g.roundRect(-w / 2, -w / 2, w, w, r);
		g.fill({ color: t.face });

		// the glow inside the plate, banked against its own edge
		g.roundRect(-w / 2 + 5, -w / 2 + 5, w - 10, w - 10, r - 4);
		g.stroke({ width: 9, color: t.rim, alpha: t.inner * 0.5 });
		g.roundRect(-w / 2 + 9, -w / 2 + 9, w - 18, w - 18, r - 6);
		g.stroke({ width: 5, color: t.rim, alpha: t.inner });

		// the rim itself, heavier as the tier climbs
		g.roundRect(-w / 2, -w / 2, w, w, r);
		g.stroke({ width: t.width, color: t.rim });

		// ...and a lit edge on the top three, the same hairline the housing's brass
		// carries. It is the difference between a painted rim and a metal one.
		if (value >= 3) {
			g.roundRect(-w / 2 + t.width * 0.7, -w / 2 + t.width * 0.7, w - t.width * 1.4, w - t.width * 1.4, r - 3);
			g.stroke({ width: 1.6, color: MULTIPLIER_LIT, alpha: 0.25 + 0.18 * (value - 3) });
		}
	};

	// The window, in two pieces because they sit on opposite sides of the strip:
	// the recessed TRAY underneath (three cells wide), and the brass PICK frame on
	// top, round the centre cell only, so a value sliding through is seen to pass
	// under it. The lip lights by stage as before.
	const drawTray = (g: PixiGraphics) => {
		g.clear();
		const trayW = CELL * WINDOW + CELL * 0.24;
		const trayH = CELL * 1.12;
		g.roundRect(-trayW / 2, -trayH / 2, trayW, trayH, 14);
		g.fill({ color: 0x0b1318, alpha: 0.92 });
		g.roundRect(-trayW / 2, -trayH / 2, trayW, trayH, 14);
		g.stroke({ width: 3, color: 0x3e5a6e, alpha: 0.9 });
	};

	const drawPick = (g: PixiGraphics) => {
		g.clear();
		const w = CELL * 1.08;
		const h = CELL * 1.08;
		g.roundRect(-w / 2, -h / 2, w, h, 12);
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
		multiplierPick: async (event) => {
			const ms = stateBet.isTurbo ? SPIN_MS_TURBO : SPIN_MS;
			phase = 'lead';
			// 1, not 0: see buildStrip — at 1 all three cells of the window are filled
			pos = 1;
			strip = buildStrip(event.multiplier);
			show = true;
			context.eventEmitter.broadcast({ type: 'mascotCargo', phase: 'watch' });
			context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.25 });
			await waitForTimeout(stateBet.isTurbo ? LEAD_MS_TURBO : LEAD_MS);

			context.eventEmitter.broadcast({ type: 'soundCrateStrain' });
			context.eventEmitter.broadcast({ type: 'soundCargoRoll', phase: 'start' });
			spin(ms);
			// the anticipation cue starts when the WIND-DOWN does, so the sound and
			// the picture slow together
			await waitForTimeout(windDownMs(ms));
			context.eventEmitter.broadcast({ type: 'soundReelTensionStart', gain: 1 });
			context.eventEmitter.broadcast({ type: 'soundCargoRoll', phase: 'swell' });
			context.eventEmitter.broadcast({ type: 'mascotCargo', phase: 'watch' });
			await waitForTimeout(ms - windDownMs(ms));
			context.eventEmitter.broadcast({ type: 'soundReelTensionStop' });
			context.eventEmitter.broadcast({ type: 'soundCargoRoll', phase: 'stop' });

			// THE LOCK, SCALED BY WHAT LANDED. The cargo wheel always hits at full,
			// because every cargo is the same kind of news. A multiplier is not:
			// an x1 thrown at full strength would be the game shouting about the
			// one result that changes nothing, and would leave no bigger hit for an
			// x5. So the scene shake runs 0.35 at x1 up to 1.0 at x5.
			const k = (event.multiplier - 1) / 4;
			clearInterval(lockTimer);
			lockStarted = Date.now();
			lockClock = lockStarted;
			lockTimer = setInterval(() => {
				lockClock = Date.now();
				if (lockClock - lockStarted >= 700) clearInterval(lockTimer);
			}, 16) as unknown as number;
			context.eventEmitter.broadcast({ type: 'soundCargoLock' });
			context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.5 + 0.5 * k });
			context.eventEmitter.broadcast({ type: 'cameraShake', strength: 0.35 + 0.65 * k });
			context.eventEmitter.broadcast({ type: 'mascotCargo', phase: 'reveal' });
			await waitForTimeout(stateBet.isTurbo ? HOLD_MS_TURBO : HOLD_MS);
			show = false;
		},
	});
</script>

{#if show}
	<BoardContainer>
		<Graphics
			draw={(g) => {
				g.clear();
				g.rect(0, 0, board.width, board.height);
				g.fill({ color: 0x050b0f, alpha: 0.72 });
			}}
		/>

		<Container x={board.width / 2} y={board.height / 2}>
			<!-- what this wheel is deciding, in the same place and style as the cargo
			     wheel's SYMBOL caption, so the pair reads: SYMBOL, then MULTIPLIER -->
			<GoldText
				text="MULTIPLIER"
				y={-CELL * 0.82}
				fontSize={SYMBOL_SIZE * 0.2}
				letterSpacing={3}
			/>


			<Graphics draw={drawTray} />

			<!-- the strip, one container sliding RIGHT — the same one-container
			     construction as CargoPick, turned on its side. Value `index` sits at
			     x = (pos - index) * CELL, so as pos grows each value enters on the
			     left and leaves on the right, and at pos = TRAVEL the target is at 0. -->
			<Container>
				<Rectangle
					isMask
					x={(-CELL * WINDOW) / 2}
					y={-CELL / 2}
					width={CELL * WINDOW}
					height={CELL}
					backgroundColor={0xffffff}
				/>
				<Container x={pos * CELL}>
					{#each strip as value, index (index)}
						<Container x={-index * CELL}>
							<Graphics draw={(g) => drawPlate(g, value)} />
							<GoldText text={`x${value}`} fontSize={CELL * 0.42} />
						</Container>
					{/each}
				</Container>
			</Container>

			<!-- the side cells in shadow, so the eye goes to the pick in the middle -->
			<Graphics
				draw={(g) => {
					g.clear();
					for (const side of [-1, 1]) {
						g.rect(side < 0 ? (-CELL * WINDOW) / 2 : CELL / 2, -CELL / 2, CELL, CELL);
						g.fill({ color: 0x050b0f, alpha: 0.55 });
					}
				}}
			/>

			<!-- the pick's frame on top of everything, so a value sliding through is
			     seen to pass UNDER it -->
			<Graphics draw={drawPick} />
			{#if phase === 'landed'}
				<Container>
					<MultiplierPlateMesh value={strip[TRAVEL]} size={CELL} elapsed={lockClock - lockStarted} />
				</Container>
				<GoldText text={`x${strip[TRAVEL]}`} fontSize={CELL * 0.42} />
			{/if}
			<!-- Above the landed plate as well: the broad triangle must remain visible
			     at the exact selected value, not disappear behind its mesh. -->
			{#key phase === 'landed'}
				<Container>
					<FlapperMesh x={0} y={-CELL * 0.62} rotation={0} length={CELL * 0.26} {pos} dir={1} />
				</Container>
			{/key}
		</Container>
	</BoardContainer>
{/if}

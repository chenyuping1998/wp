<script lang="ts" module>
	export type EmitterEventMultiplierRoll = {
		type: 'multiplierRoll';
		// one entry per held tablet whose value is changing this spin
		cells: { reel: number; row: number; from: number; to: number }[];
	};
</script>

<script lang="ts">
	/**
	 * THE HELD TABLETS RE-ROLL THEIR MULTIPLIERS.
	 *
	 * Every free spin the maths re-stamps each open tablet with a fresh value
	 * (assign_mystery_symbols), so a cell showing 50X can show 2X on the next
	 * spin and the other way round. Until now that happened between two frames:
	 * the number was simply different afterwards, which is the one presentation
	 * that makes a re-roll look like a rendering bug.
	 *
	 * So it is drawn as what it is — a draw. The number spins through the ladder
	 * the maths actually uses, slowing as it goes, and lands on the value with a
	 * knock. Only then does the reveal carry on and open this spin's new tablets.
	 *
	 * NOT A COUNT-UP. Go Bananas 100 counts, because there the multiplier only
	 * ever grows and a climb is the truth. Here the value is redrawn from a
	 * weighted ladder every spin and can fall, so a climb would be a lie — this
	 * flickers, the way the gen-1 wheel did.
	 *
	 * TURBO TAKES THE SAME ANIMATION, JUST TIGHTER. The tablets' values are the
	 * feature: turbo shortens the waiting, not the payoff. Same rule the seal
	 * crack already follows (see MysteryReveal).
	 */
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	// The ladder the maths draws from (game_config.tablet_mult_values). Written
	// out rather than derived from the values on screen: a spin where every held
	// tablet happens to draw 2X would otherwise roll through nothing but 2X.
	const LADDER = [2, 3, 5, 8, 10, 15, 20, 25, 50];

	// Pace. Deliberately unhurried — this is the number that decides what a line
	// pays, and the old version gave it no time at all.
	// Per-cell stagger, and a ceiling on the whole batch. A run that has opened
	// five tablets would otherwise spend 600ms just starting them, before the
	// first one has landed — the stagger is there so the eye can separate them,
	// not so a full board takes twice as long as a half-empty one.
	const STAGGER = 150;
	const STAGGER_TOTAL_MAX = 420;
	const ROLL_MS = 900;
	// the flicker slows as it runs: first step this long, last one this long
	const STEP_FAST = 48;
	const STEP_SLOW = 165;
	const HOLD_AFTER = 320;
	// Turbo keeps the shape at three quarters of the length rather than cutting
	// the animation out.
	const TURBO_SCALE = 0.7;

	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;
	// where Symbol.svelte draws a held cell's badge, so the rolling figure sits
	// exactly where the settled one will
	const badgeY = (row: number) => rowCenterY(row) + SYMBOL_SIZE * 0.3;

	type Roll = {
		reel: number;
		row: number;
		from: number;
		to: number;
		shown: number;
		landed: boolean;
		landedAt: number;
	};

	let rolls = $state<Roll[]>([]);
	let now = $state(0);
	let clock = 0;

	const running = $derived(rolls.length > 0);

	const startClock = () => {
		if (clock) return;
		now = Date.now();
		// a timer, not requestAnimationFrame: rAF stops dead in a hidden tab, and
		// the book event handler is waiting on this sequence to finish
		clock = setInterval(() => (now = Date.now()), 32) as unknown as number;
	};

	const stopClock = () => {
		clearInterval(clock);
		clock = 0;
	};

	// the landing punch, 1 → 0 over its own quarter second
	const punchOf = (roll: Roll) => {
		if (!roll.landed) return 0;
		const p = (now - roll.landedAt) / 260;
		if (p < 0 || p > 1) return 0;
		return Math.sin(p * Math.PI) * (1 - p * 0.35);
	};

	const rollOne = async (roll: Roll, scale: number) => {
		// Steps get longer as it goes, so the wheel reads as losing speed rather
		// than stopping dead. The sum of the steps is the roll's length.
		const steps: number[] = [];
		let total = 0;
		for (let i = 0; total < ROLL_MS * scale; i++) {
			const t = Math.min(1, total / (ROLL_MS * scale));
			const step = (STEP_FAST + (STEP_SLOW - STEP_FAST) * t * t) * scale;
			steps.push(step);
			total += step;
		}

		// Starts from the face on screen, and the first thing it does is leave it:
		// a cell re-drawing the same value has from === to, so without this the
		// wheel would begin on its own answer.
		let previous = roll.from;
		for (const step of steps) {
			// never the answer, and never the same face twice in a row: both make
			// the wheel look like it has already stopped
			const options = LADDER.filter((value) => value !== roll.to && value !== previous);
			previous = options[Math.floor(Math.random() * options.length)];
			roll.shown = previous;
			// NO SOUND ON THE FLICKER. A pluck per step is a dozen per cell, and a
			// board with five held tablets turned the re-roll into a rattle with no
			// shape to it. The landings still speak — five of those is a phrase,
			// sixty ticks is noise.
			await waitForTimeout(step);
		}

		roll.shown = roll.to;
		roll.landed = true;
		roll.landedAt = Date.now();
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
		context.eventEmitter.broadcast({
			type: 'boardFrameImpact',
			// a 50X lands harder than a 2X — the only place the value itself is
			// allowed to change the presentation
			strength: 0.16 + 0.3 * Math.min(1, roll.to / 25),
		});
	};

	context.eventEmitter.subscribeOnMount({
		multiplierRoll: async (event) => {
			if (event.cells.length === 0) return;

			const scale = stateBet.isTurbo ? TURBO_SCALE : 1;
			// reading order, as everywhere else on this board
			const ordered = [...event.cells].sort((a, b) => a.reel - b.reel || a.row - b.row);
			rolls = ordered.map((cell) => ({
				reel: cell.reel,
				row: cell.row,
				from: cell.from,
				to: cell.to,
				shown: cell.from,
				landed: false,
				landedAt: 0,
			}));
			startClock();

			const stagger =
				rolls.length > 1
					? Math.min(STAGGER, STAGGER_TOTAL_MAX / (rolls.length - 1))
					: 0;

			await Promise.all(
				rolls.map(async (roll, index) => {
					await waitForTimeout(index * stagger * scale);
					await rollOne(roll, scale);
				}),
			);

			await waitForTimeout(HOLD_AFTER * scale);
			rolls = [];
			stopClock();
		},
		// a torn-down board takes any wheel still turning with it
		boardHide: () => {
			rolls = [];
			stopClock();
		},
	});

	$effect(() => () => stopClock());

	// The chip the figure sits on. It also does a job: the board underneath has
	// already been stamped with the new value by the time this runs, so without
	// something opaque here the answer would be legible under the wheel.
	const drawChips = (g: PixiGraphics) => {
		now;
		g.clear();
		for (const roll of rolls) {
			const punch = punchOf(roll);
			const w = SYMBOL_SIZE * (0.66 + 0.06 * punch);
			const h = SYMBOL_SIZE * (0.3 + 0.04 * punch);
			const x = getSymbolX(roll.reel) - w / 2;
			const y = badgeY(roll.row) - h / 2;
			g.rect(x, y, w, h).fill({ color: 0x10151a, alpha: 0.95 });
			g.rect(x, y, w, h).stroke({
				width: 2 + 2 * punch,
				color: roll.landed ? 0xffd75e : 0x8a7859,
				alpha: 0.7 + 0.3 * punch,
			});
		}
	};
</script>

{#if running}
	<BoardContainer>
		<Container zIndex={30}>
			<Graphics draw={drawChips} />
			{#each rolls as roll (`${roll.reel},${roll.row}`)}
				<Container
					x={getSymbolX(roll.reel)}
					y={badgeY(roll.row)}
					scale={1 + 0.28 * punchOf(roll)}
				>
					<GoldText x={0} y={0} text={`${roll.shown}X`} fontSize={26} maxWidth={SYMBOL_SIZE * 0.6} />
				</Container>
			{/each}
		</Container>
	</BoardContainer>
{/if}

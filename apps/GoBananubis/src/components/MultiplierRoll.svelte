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
	import { SYMBOL_SIZE, cellToBoardUnits } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';
	import { drawMultiplierBadge, BADGE_W, BADGE_H } from '../game/multiplierBadge';

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
	// long enough for the direction cue below to play out on the last cell to land
	const HOLD_AFTER = 560;
	// Turbo keeps the shape at three quarters of the length rather than cutting
	// the animation out.
	const TURBO_SCALE = 0.7;

	// ── WHICH WAY IT MOVED ───────────────────────────────────────────────────
	//
	// A re-roll can be good news or bad, and the wheel used to land both the same
	// way: a knock and a new number. Five going to fifty and fifty going to two
	// are opposite events, and the player should FEEL the difference before they
	// read a digit — so the landing has a direction:
	//
	//   UP    gold chevrons lift off the cartouche (one for a small rise, three
	//         for a jump), the figure rises into place and the rim flares; a
	//         landing on 25X or 50X also throws a ring
	//   DOWN  carnelian chevrons sink from it, the cartouche dims for a beat and
	//         the figure settles down into place — brief, and no sound, so a
	//         board of tablets that all drop does not sound like a fault
	//   SAME  just the knock: it drew the value it already had
	//
	// It costs nothing in time: it plays inside the hold the roll already has.
	const CUE_MS = 700;
	const dirOf = (roll: Roll) => Math.sign(roll.to - roll.from);
	const jumpOf = (roll: Roll) => {
		const hi = Math.max(roll.to, roll.from);
		const lo = Math.max(1, Math.min(roll.to, roll.from));
		const ratio = hi / lo;
		return ratio >= 6 ? 3 : ratio >= 2.5 ? 2 : 1;
	};
	// 0 → 1 across the cue, -1 before the landing
	const cueOf = (roll: Roll) => {
		if (!roll.landed) return -1;
		return Math.min(1, Math.max(0, (now - roll.landedAt) / CUE_MS));
	};

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
		// the face leaving as `shown` arrives, and when that swap happened — the
		// two are what let the figures ROLL past each other instead of blinking
		previous: number;
		stepAt: number;
		stepMs: number;
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
			const next = options[Math.floor(Math.random() * options.length)];
			roll.previous = previous;
			previous = next;
			roll.shown = next;
			roll.stepAt = Date.now();
			roll.stepMs = step;
			// NO SOUND ON THE FLICKER. A pluck per step is a dozen per cell, and a
			// board with five held tablets turned the re-roll into a rattle with no
			// shape to it. The landings still speak — five of those is a phrase,
			// sixty ticks is noise.
			await waitForTimeout(step);
		}

		roll.previous = roll.shown;
		roll.shown = roll.to;
		roll.stepAt = Date.now();
		roll.stepMs = 150;
		roll.landed = true;
		roll.landedAt = Date.now();
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
		// he watched it spin (Mascot: multiplierRoll); he answers what it gives
		context.eventEmitter.broadcast({ type: 'mascotMultiplier', value: roll.to });
		context.eventEmitter.broadcast({
			type: 'boardFrameImpact',
			// out from the tablet that just landed
			from: cellToBoardUnits(roll.reel, roll.row),
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
				previous: cell.from,
				stepAt: 0,
				stepMs: 1,
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

	// ── THE CARTOUCHE THE FIGURE ROLLS IN ────────────────────────────────────
	//
	// Something opaque has to sit here: the board underneath has already been
	// stamped with this spin's new value by the time the wheel runs, so the
	// answer would otherwise be legible straight through it.
	//
	// It used to be a flat near-black box with a grey outline — a hole punched in
	// the tablet for the duration of the roll, which is what made the re-roll
	// look unfinished. It is now the thing this game would actually carve a
	// number into: a rounded lapis cartouche in a gold setting, with a bead at
	// each end, lit from above. Same stones as the Buy Bonus scarab and the win
	// plaques.
	const chipBox = (roll: Roll) => {
		const punch = punchOf(roll);
		return {
			punch,
			width: SYMBOL_SIZE * (BADGE_W + 0.05 * punch),
			height: SYMBOL_SIZE * (BADGE_H + 0.035 * punch),
			x: getSymbolX(roll.reel),
			y: badgeY(roll.row),
		};
	};

	const drawChips = (g: PixiGraphics) => {
		now;
		g.clear();
		for (const roll of rolls) {
			const box = chipBox(roll);
			drawMultiplierBadge(g, { ...box, lit: roll.landed, shadow: true });

			const cue = cueOf(roll);
			const dir = dirOf(roll);
			if (cue >= 0 && cue < 1 && dir !== 0) {
				const { x, y, width: w, height: h } = box;
				if (dir < 0) {
					// the stone goes dim for a beat
					g.roundRect(x - w / 2, y - h / 2, w, h, h / 2).fill({ color: 0x0a0d18, alpha: 0.5 * (1 - cue) ** 1.5 });
				}
				const n = jumpOf(roll);
				for (let k = 0; k < n; k++) {
					const p = Math.min(1, Math.max(0, (cue - k * 0.14) / 0.72));
					if (p <= 0) continue;
					const travel = SYMBOL_SIZE * 0.4 * (1 - (1 - p) ** 2);
					const cy = dir > 0 ? y - h / 2 - 3 - travel : y + h / 2 + 3 + travel;
					const arm = dir > 0 ? 6 : -6;
					g.moveTo(x - 10, cy + arm)
						.lineTo(x, cy - arm * 0.7)
						.lineTo(x + 10, cy + arm)
						.stroke({
							width: 4,
							color: dir > 0 ? 0xffe08a : 0xe8643c,
							alpha: 0.95 * (1 - p),
							cap: 'round',
							join: 'round',
						});
				}
				// a rise into a big number is worth a ring
				if (dir > 0 && roll.to >= 25) {
					const p = cue;
					g.roundRect(x - w / 2 - 12 * p, y - h / 2 - 12 * p, w + 24 * p, h + 24 * p, h / 2 + 12 * p).stroke({
						width: 5 * (1 - p),
						color: 0xfff3c4,
						alpha: 0.8 * (1 - p),
					});
				}
			}
		}
	};

	// the figure comes to rest from the side it moved from: a rise lifts into
	// place from below, a fall settles down into it from above
	const cueLift = (roll: Roll) => {
		const cue = cueOf(roll);
		const dir = dirOf(roll);
		if (cue < 0 || cue >= 1 || dir === 0) return 0;
		return -dir * 5 * (1 - cue) ** 2 * Math.sin(cue * Math.PI * 0.5 + 0.4);
	};

	// how far through the current face's step we are, 0 → 1
	const stepProgress = (roll: Roll) => {
		if (!roll.stepAt) return 1;
		return Math.min(1, Math.max(0, (now - roll.stepAt) / Math.max(1, roll.stepMs)));
	};
	// THE FIGURES ROLL PAST EACH OTHER. The old version swapped the text between
	// frames, so a slowing wheel looked like a number being retyped. Now the face
	// arriving climbs into the window while the one it replaces climbs out of it,
	// which is what a physical wheel does — and it is why the cartouche is masked.
	const enterOffset = (roll: Roll) => {
		const p = stepProgress(roll);
		const ease = 1 - (1 - p) ** 2;
		return SYMBOL_SIZE * BADGE_H * 0.9 * (1 - ease);
	};
	const leaveOffset = (roll: Roll) => enterOffset(roll) - SYMBOL_SIZE * BADGE_H * 0.9;
</script>

{#if running}
	<BoardContainer>
		<Container zIndex={30}>
			<Graphics draw={drawChips} />
			{#each rolls as roll (`${roll.reel},${roll.row}`)}
				<Container
					x={getSymbolX(roll.reel)}
					y={badgeY(roll.row) + cueLift(roll)}
					scale={1 + 0.28 * punchOf(roll)}
				>
					<!-- the window the figures roll through: everything in this
					     container is clipped to the cartouche's stone -->
					<Graphics
						isMask
						draw={(g) => {
							now;
							g.clear();
							const w = SYMBOL_SIZE * BADGE_W - 9;
							const h = SYMBOL_SIZE * BADGE_H - 9;
							g.roundRect(-w / 2, -h / 2, w, h, h / 2).fill({ color: 0xffffff });
						}}
					/>
					<Container y={leaveOffset(roll)}>
						<GoldText
							x={0}
							y={0}
							text={`${roll.previous}X`}
							fontSize={26}
							maxWidth={SYMBOL_SIZE * 0.6}
						/>
					</Container>
					<Container y={enterOffset(roll)}>
						<GoldText x={0} y={0} text={`${roll.shown}X`} fontSize={26} maxWidth={SYMBOL_SIZE * 0.6} />
					</Container>
				</Container>
			{/each}
		</Container>
	</BoardContainer>
{/if}

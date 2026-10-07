<script lang="ts" module>
	import type { CollectSweep } from '../game/types';

	// The collect sequence: the gourd opens, each sweep pulls its carriers in,
	// the multiplier stamps down, the total lands.
	//
	// `collectPlay` is awaited by the book event handler, so this component owns
	// how long the sequence takes. Nothing upstream may assume a duration.
	export type EmitterEventCollect =
		| {
				type: 'collectPlay';
				sweeps: CollectSweep[];
				totalWin: number;
				collectMultiplier: number;
				cappedAt?: number;
		  }
		| { type: 'collectReset' };
</script>

<script lang="ts">
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { onDestroy } from 'svelte';

	import { getContext } from '../game/context';
	import config from '../game/config';
	import { getSymbolX, getSymbolY } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { stateGame } from '../game/stateGame.svelte';

	const context = getContext();

	// art-bible.md §2: cyan belongs to the spirits and nothing else; the
	// talisman yellow / cinnabar pair belongs to money and nothing else.
	const SPIRIT = 0x4fd1c5;
	const TALISMAN = 0xf2d544;
	const CINNABAR = 0xc8102e;
	const BRASS_HI = 0xd9a85c;

	// ── the spirit flame ──────────────────────────────────────────────────────
	//
	// The collect and the transition are both fire now, and they have to be
	// telling apart at a glance, so they are opposites on both axes that matter:
	//
	//              COLLECT (here)              TRANSITION
	//   colour     cold - cyan to white        warm - cinnabar to candle
	//   direction  inward, converging          outward, bursting
	//   speed      drawn out, streaming        thrown, snapping
	//
	// That is not decoration; it is the difference between "something is being
	// taken from the board" and "the board is being closed". Cold and inward is
	// also what the art bible already assigns: spirit-cyan belongs to the spirits,
	// and a collect is spirits being taken.
	//
	// Three colours, hottest LAST: a flame's core is the palest part of it.
	const FLAME = [0x2aa79c, 0x4fd1c5, 0xd8fff8];

	// The wisps circling a collecting wild.
	//
	// Five, not the scatter trigger's four and not the spin button's six. The
	// button draws at button size and the trigger at cell size; this is drawn at
	// cell size too, but around a wild that has already swelled to 1.36 cells, so
	// the ring is longer and four leaves visible gaps in it.
	const WISPS = 5;
	// Deliberately not a multiple of the breath, so the circuit and the pulse
	// drift against each other instead of locking into one repeating pose.
	const WISP_ORBIT_MS = 2400;
	const WISP_BREATH_MS = 1500;

	// art-bible.md §7.2. The per-carrier interval is what makes a big sweep feel
	// big, so it is a constant rather than something derived from the sweep
	// length - a sequence that speeds up as it grows robs the biggest wins of
	// their weight.
	// Slower than it was, and only by about a fifth.
	//
	// The sweep is now a flame drawn out of each spirit rather than a talisman
	// thrown across the board, and fire does not snap - it has to be seen to
	// stream. But the ceiling on this is hard: the feature can put FIVE wilds on a
	// board and each one sweeps separately, so every millisecond here is multiplied
	// by five. At these numbers a five-carrier sweep is 2.1s and a five-wild board
	// is about ten seconds, which is already at the edge of what a slot can hold.
	// That is why this is 450 -> 560 and not 450 -> 900.
	const LEAD_MS = 560;
	const CARRIER_MS = 150;
	const TAIL_MS = 800;
	// how long one spirit's flame takes to reach the wild
	const FLIGHT_MS = 430;

	const sweepDurationMs = (sweep: CollectSweep) =>
		LEAD_MS + sweep.carriers.length * CARRIER_MS + TAIL_MS;

	let sweep = $state<CollectSweep | null>(null);
	let elapsed = $state(0);
	let runningTotal = $state(0);
	// The rail's global multiplier for this collect, already applied to every
	// sweep's award. Shown as a stamp so the number has a visible cause.
	let multiplier = $state(1);
	let raf = 0;

	const stop = () => {
		cancelAnimationFrame(raf);
		raf = 0;
	};

	/** Play one sweep, resolving when its animation has finished. */
	const playSweep = (next: CollectSweep) =>
		new Promise<void>((resolve) => {
			sweep = next;
			elapsed = 0;
			const total = sweepDurationMs(next);
			const t0 = performance.now();
			const step = (now: number) => {
				elapsed = now - t0;
				if (elapsed >= total) {
					stop();
					resolve();
					return;
				}
				raf = requestAnimationFrame(step);
			};
			raf = requestAnimationFrame(step);
		});

	context.eventEmitter.subscribeOnMount({
		collectPlay: async ({ sweeps, totalWin, collectMultiplier }) => {
			stateGame.collectActive = true;
			runningTotal = 0;
			multiplier = collectMultiplier;

			// Played in the order the maths resolved them. Never reordered for
			// effect: this sequence is the only account the player gets of how the
			// total was reached, and a sweep shown taking a carrier it did not take
			// is indistinguishable from a payout bug.
			for (const next of sweeps) {
				// NO VOICE HERE for now.
				//
				// A synthesized chant fired once per sweep - see `voice` in
				// design/generate_audio_terminal.mjs - and is being replaced with a
				// recording. The cue, the file and the wiring in Sound.svelte all
				// still exist; this is the one line that fired it, and putting the
				// voice back is putting this line back.
				//
				// Once per SWEEP and not once per collect, when it returns: two wilds
				// is two sweeps and the player should hear both.
				await playSweep(next);
				runningTotal += next.award;
			}

			// Land on what the round PAID, not on what the sweeps summed to. When
			// the cap truncated the collect these differ, and counting up to the
			// raw sum would show a number the player was never given.
			runningTotal = totalWin;

			sweep = null;
			stateGame.collectActive = false;
		},
		collectReset: () => {
			stop();
			sweep = null;
			elapsed = 0;
			runningTotal = 0;
			stateGame.collectActive = false;
		},
	});

	onDestroy(stop);

	// Where the talismans converge, when they converge at all.
	//
	// A COLLECTOR sweep has a wild, and everything is pulled to it.
	//
	// A LINE sweep does not, and it used to be given a fake one: the talismans were
	// pulled to the middle of the board, where a "gourd" was drawn for the
	// occasion. That is the wrong picture of the wrong rule. Nothing collects in
	// the base game - three spirits LINE UP, and the line is what pays. Drawing a
	// vortex over the centre cell put a glowing hole on top of a symbol that had
	// nothing to do with it, and hid the one thing the player needed to see.
	//
	// So a line sweep now runs ALONG its line: the payline is traced, and each
	// value lifts off its own carrier and travels the line to the end of it. See
	// `linePath` and drawLineSweep.
	const gourd = $derived.by(() => {
		if (sweep?.source.kind === 'collector') {
			return {
				x: getSymbolX(sweep.source.position.reel),
				y: getSymbolY(sweep.source.position.row),
			};
		}
		return { x: 0, y: 0 };
	});

	/**
	 * The payline a line sweep runs along, in board coordinates.
	 *
	 * READ FROM THE PAYLINE TABLE, and this is a correction.
	 *
	 * It used to be built by sorting `sweep.carriers` by reel and joining them up,
	 * on the reasoning that the carriers are the paying part of the line. They are
	 * not: in the base game a line of three TRIGGERS the sweep and the sweep then
	 * takes EVERY carrier on the board. So `carriers` is the whole board, and
	 * joining it produced a zigzag through cells that had nothing to do with the
	 * line - including two on the same reel, which no payline can contain. It drew
	 * a shape the game does not have.
	 *
	 * The line is `source.lineIndex` in the payline table, walked from reel 1 for
	 * as long as the cell is a carrier - which is exactly how the maths counts it
	 * (game_executables.carrier_line_index breaks at the first non-carrier). Rows
	 * in the table are 0-based visible rows; everything else here uses the padded
	 * convention, hence the +1.
	 */
	const lineCells = $derived.by(() => {
		if (sweep?.source.kind !== 'line') return [];
		const table = (config.paylines ?? {}) as Record<string, number[]>;
		const path = table[String(sweep.source.lineIndex)];
		if (!path) return [];
		const onLine: { reel: number; row: number }[] = [];
		for (let reel = 0; reel < path.length; reel += 1) {
			const row = path[reel] + 1;
			const isCarrier = sweep.carriers.some((c) => c.reel === reel && c.row === row);
			if (!isCarrier) break;
			onLine.push({ reel, row });
		}
		return onLine;
	});

	const linePath = $derived(
		lineCells.map((cell) => ({ x: getSymbolX(cell.reel), y: getSymbolY(cell.row) })),
	);

	/** Where a line sweep's total settles: just past the end of the line. */
	const lineEnd = $derived.by(() => {
		if (linePath.length === 0) return { x: 0, y: 0 };
		const last = linePath[linePath.length - 1];
		return { x: last.x + SYMBOL_SIZE * 0.62, y: last.y };
	});

	/** Everything that is not a collector sweep reads off the line instead. */
	const focus = $derived(sweep?.source.kind === 'collector' ? gourd : lineEnd);

	/** 0..1 through the carrier-taking phase. */
	const takenCount = $derived(
		sweep ? Math.max(0, Math.min(sweep.carriers.length, Math.floor((elapsed - LEAD_MS) / CARRIER_MS) + 1)) : 0,
	);

	/**
	 * The stamp drops once every carrier is in, and only if the rail has actually
	 * raised the multiplier. At x1 there is nothing to explain and a stamp
	 * reading "x1" is noise on every base-game collect.
	 */
	const stampProgress = $derived.by(() => {
		if (!sweep || multiplier <= 1) return 0;
		const stampAt = LEAD_MS + sweep.carriers.length * CARRIER_MS + TAIL_MS * 0.35;
		return Math.max(0, Math.min(1, (elapsed - stampAt) / (TAIL_MS * 0.4)));
	});

	const easeOut = (t: number) => 1 - (1 - t) ** 3;

	/**
	 * A base-game collect, drawn as the line that caused it.
	 *
	 * Three beats, in the order the player needs them:
	 *
	 *   1. the line draws on, left to right, through the paying carriers
	 *   2. each carrier's cell flares and its value lifts off
	 *   3. the values run along the line and gather past its end
	 *
	 * The line is drawn HEAVIER than WinLines draws an ordinary win, and in the
	 * money colours rather than the win colour. That is the whole point of the
	 * beat: a line of three spirits does not pay the way three matching symbols
	 * pay, it hands over what is written on them, and the presentation has to say
	 * which of the two just happened.
	 */
	const drawLineSweep = (g: PixiGraphics) => {
		if (!sweep || linePath.length === 0) return;

		// The line draws on over the lead-in, so it is complete by the time the
		// first value lifts.
		const drawT = Math.max(0, Math.min(1, elapsed / (LEAD_MS * 0.8)));
		const reach = easeOut(drawT) * (linePath.length - 1);

		// A soft under-glow first, so the line reads over a lit symbol.
		for (const [width, color, alpha] of [
			[SYMBOL_SIZE * 0.14, CINNABAR, 0.2],
			[SYMBOL_SIZE * 0.06, TALISMAN, 0.55],
			[SYMBOL_SIZE * 0.025, 0xfff3dc, 0.95],
		] as [number, number, number][]) {
			let drew = false;
			for (let i = 0; i < linePath.length - 1; i += 1) {
				if (reach <= i) break;
				const part = Math.min(1, reach - i);
				const from = linePath[i];
				const to = linePath[i + 1];
				g.moveTo(from.x, from.y);
				g.lineTo(from.x + (to.x - from.x) * part, from.y + (to.y - from.y) * part);
				drew = true;
			}
			if (drew) g.stroke({ width, color, alpha, cap: 'round', join: 'round' });
		}

		// The carriers ON the line, running along the rest of it to the gathering
		// point. There are no others: the base-game collect pays the payline, the
		// same as any other line win.
		//
		// It used to sweep the whole board off a three-symbol line, and this loop
		// carried the machinery for that - a brighter marker on the three that
		// triggered, and a direct route for the ones standing off the line. Both
		// are gone with the rule they illustrated.
		//
		// NO RING. Each carrier used to be circled in talisman yellow while it
		// waited, and to throw an expanding ring as its value left. Neither is
		// something a line win does to any other symbol, so an M line looked like a
		// different and more important kind of win than it is. The flame leaving
		// the symbol is the whole effect now.
		// NOTHING FLIES.
		//
		// Each carrier's value used to leave as a small yellow talisman with a
		// cinnabar stripe down it, travelling along the rest of the payline to a
		// gathering point. It is the third thing this cue has tried and the third
		// that was too much for what it is.
		//
		// A base-game collect is a LINE WIN. Three spirits on a payline paying what
		// is written on them - and no other line win in this game sends an object
		// across the board. The line draws, the paying symbols light, everything
		// else steps back, and the WIN field counts. That is the whole vocabulary
		// the game uses for a win, and the collect now uses it too.
		//
		// The FEATURE sweep is a different picture and keeps its flames: there, a
		// wild really is taking the board, the value really does travel to it, and
		// the wild is the actor - see drawStorm's counterpart below.
	};

	// ── the wild does the collecting, visibly ─────────────────────────────────
	//
	// The sweep used to be drawn entirely as effects: a cyan vortex opened on the
	// collector's cell and talismans flew into it in straight lines. The wild
	// itself never moved. So the thing the player was told collects the board sat
	// perfectly still while a hole appeared on top of it, and the animation read as
	// something happening TO the wild rather than something the wild was doing.
	//
	// Now the wild is the actor. A copy of the symbol is drawn over its cell -
	// over, not instead of: it is scaled past 1 for the whole sweep, so it covers
	// the static one underneath without the reel pipeline needing to know a collect
	// is happening. It rises and swells as the sweep opens, kicks each time a
	// talisman reaches it, and settles as the sweep closes.

	/** Only a collector sweep has a wild to animate. A line sweep has no source. */
	const collector = $derived(sweep?.source.kind === 'collector' ? sweep.source.position : null);

	/** How hard the wild is kicked by talismans landing, right now. */
	const absorbKick = $derived.by(() => {
		if (!sweep) return 0;
		let kick = 0;
		for (let i = 0; i < sweep.carriers.length; i += 1) {
			// a carrier's talisman lands FLIGHT_MS after it sets off
			const landedAt = LEAD_MS + i * CARRIER_MS + FLIGHT_MS;
			const since = elapsed - landedAt;
			// Each landing is a short decaying bump. They overlap on a fast sweep,
			// which is what makes a big board feel like a big board.
			if (since < 0 || since > 260) continue;
			kick += (1 - since / 260) ** 2;
		}
		return Math.min(1.6, kick);
	});

	/** The wild's drawn size and lift, in board units. */
	const wildPose = $derived.by(() => {
		if (!sweep) return { size: SYMBOL_SIZE, lift: 0, glow: 0 };
		const open = Math.max(0, Math.min(1, elapsed / LEAD_MS));
		const total = sweepDurationMs(sweep);
		// close over the last third of the tail, so it settles rather than snapping
		const closing = Math.max(0, Math.min(1, (elapsed - (total - TAIL_MS * 0.45)) / (TAIL_MS * 0.45)));
		const swell = easeOut(open) * (1 - easeOut(closing));
		return {
			// 1.13 is the carrier's tier and the wild's is 1.06; at 1.06 + 0.3 the
			// drawn wild clears every neighbour without leaving its own column.
			size: SYMBOL_SIZE * (1.06 + 0.3 * swell + 0.16 * absorbKick),
			lift: -SYMBOL_SIZE * 0.06 * swell,
			glow: swell,
		};
	});
</script>

{#if sweep}
	<Container>
		<Graphics
			draw={(g) => {
				g.clear();
				if (!sweep) return;

				// Pixi v8's explicit API throughout: circle()/fill() and
				// moveTo()/stroke(). The v7 compat calls (beginFill, lineStyle,
				// drawCircle) share one deferred style, so a stroked shape after a
				// filled one picks the fill up - which is how the win lines came out
				// as solid blocks.

				// A LINE sweep is a different picture entirely - see drawLineSweep.
				if (sweep.source.kind === 'line') {
					drawLineSweep(g);
					return;
				}

				// ── the wild, holding ─────────────────────────────────────────
				//
				// WISPS going round it, not rings coming in at it.
				//
				// The rings were an argument about direction: a collect is energy
				// arriving, so they converged rather than expanded, and that was the
				// only thing on screen saying which way it went. It works and it is
				// still a graphic - three circles a frame, drawn at the cell, in the
				// vocabulary every effects library ships with.
				//
				// A handful of spirit-lights circling the wild says the same thing
				// about the same moment and says it as OBJECTS. It is also the
				// figure this game already uses for "charged and about to spend": the
				// spin button in an active mode, and the scatter as it lands. The
				// wild about to empty the board belongs in that family - see
				// ScatterTrigger, which carries the long version of this note.
				//
				// In spirit-cyan, which is the one colour reserved for the spirits.
				// The scatter charges in candle because it is the seal rather than a
				// spirit; this IS the spirits' own light being gathered.
				const openT = Math.max(0, Math.min(1, elapsed / LEAD_MS));
				const breathe = 0.5 + 0.5 * Math.sin((elapsed / WISP_BREATH_MS) * Math.PI * 2);
				const held = openT * (0.55 + 0.45 * wildPose.glow);

				// A soft bed under them, so the wisps read as lights in something
				// rather than as dots on the board.
				for (const [mult, width, alpha] of [
					[1.34, SYMBOL_SIZE * 0.22, 0.09],
					[1.06, SYMBOL_SIZE * 0.16, 0.14],
				] as [number, number, number][]) {
					g.circle(gourd.x, gourd.y, SYMBOL_SIZE * 0.5 * mult);
					g.stroke({ width, color: SPIRIT, alpha: alpha * held * (0.6 + 0.4 * breathe) });
				}

				const orbit = (elapsed / WISP_ORBIT_MS) * Math.PI * 2;
				for (let i = 0; i < WISPS; i += 1) {
					const angle = orbit + (Math.PI * 2 * i) / WISPS;
					// The ring breathes in and out slightly, and each wisp sits on its
					// own phase of that, so they do not turn as one rigid wheel.
					const ring = SYMBOL_SIZE * (0.62 + 0.07 * Math.sin(orbit * 2 + i * 1.7));
					const wx = gourd.x + Math.cos(angle) * ring;
					const wy = gourd.y + Math.sin(angle) * ring;
					const size = SYMBOL_SIZE * 0.052 * (0.7 + 0.3 * Math.sin(orbit * 3 + i));
					// tail, body, head - a will-o'-the-wisp is a core in a haze
					g.circle(wx, wy, size * 2.6);
					g.fill({ color: FLAME[0], alpha: 0.16 * held * (0.6 + 0.4 * breathe) });
					g.circle(wx, wy, size * 1.5);
					g.fill({ color: SPIRIT, alpha: 0.34 * held * (0.6 + 0.4 * breathe) });
					g.circle(wx, wy, size);
					g.fill({ color: FLAME[2], alpha: 0.85 * held * (0.6 + 0.4 * breathe) });
				}

				// ── each carrier: its value is drawn out as a flame ─────────────
				//
				// The talisman used to fly, as a small yellow rectangle on an arc. It
				// read as an ICON being tweened across the board - the shape never
				// changed, it just moved - and it said nothing about what was
				// happening to the spirit it came from.
				//
				// A flame is drawn instead: a tapering ribbon that leaves the carrier,
				// bends along the same arc, and is swallowed at the wild. It is built
				// from the arc rather than following it, so the ribbon bends where the
				// path bends and thins as it is consumed.
				sweep.carriers.forEach((carrier, i) => {
					const cx = getSymbolX(carrier.reel);
					const cy = getSymbolY(carrier.row);
					const startAt = LEAD_MS + i * CARRIER_MS;
					const t = (elapsed - startAt) / FLIGHT_MS;

					// The arc this carrier's flame runs along. Control point offset
					// perpendicular to the run, alternating by index so a board of them
					// fans out instead of stacking into one stream.
					const dx = gourd.x - cx;
					const dy = gourd.y - cy;
					const bow = (i % 2 === 0 ? 1 : -1) * 0.26;
					const mx = cx + dx * 0.5 - dy * bow;
					const my = cy + dy * 0.5 + dx * bow;
					const at = (u: number) => {
						const v = 1 - u;
						return {
							x: v * v * cx + 2 * v * u * mx + u * u * gourd.x,
							y: v * v * cy + 2 * v * u * my + u * u * gourd.y,
						};
					};

					if (t < 0) {
						// Not lit yet. The path brightens as its turn approaches, so the
						// order the board is being emptied in is visible before it happens
						// rather than only in hindsight.
						const soon = Math.max(0, Math.min(1, 1 + (elapsed - startAt) / 460));
						const steps = 10;
						for (let k = 0; k <= steps; k += 1) {
							const q = at(k / steps);
							if (k === 0) g.moveTo(q.x, q.y);
							else g.lineTo(q.x, q.y);
						}
						g.stroke({ width: 1.5 + 1.5 * soon, color: FLAME[0], alpha: 0.1 + 0.26 * soon });
						return;
					}

					if (t >= 1) return; // already taken

					const e = easeOut(Math.min(1, t));
					// The flame occupies a WINDOW of the arc: its head is at `e` and its
					// tail trails behind. Both ends converge on the wild as it is drawn
					// in, which is what makes it look consumed rather than moved.
					const head = e;
					const tail = Math.max(0, e - 0.34 * (1 - e * 0.4));

					// Three passes, widest and coolest first, hottest and thinnest last.
					// Same construction as every other light in this game.
					const SEGMENTS = 14;
					FLAME.forEach((colour, pass) => {
						const scale = [1, 0.62, 0.3][pass];
						const alpha = [0.3, 0.55, 0.95][pass];
						let drew = false;
						for (let k = 0; k < SEGMENTS; k += 1) {
							const u0 = tail + ((head - tail) * k) / SEGMENTS;
							const u1 = tail + ((head - tail) * (k + 1)) / SEGMENTS;
							const a = at(u0);
							const b = at(u1);
							g.moveTo(a.x, a.y);
							g.lineTo(b.x, b.y);
							drew = true;
						}
						if (!drew) return;
						// tapers as it is consumed
						const width = SYMBOL_SIZE * 0.16 * scale * (1 - e * 0.55);
						g.stroke({
							width: Math.max(1, width),
							color: colour,
							alpha: alpha * (1 - e * 0.25),
							cap: 'round',
							join: 'round',
						});
					});

					// The head: a bright tongue leading the ribbon, so the eye has one
					// thing to follow rather than a whole band.
					const tip = at(head);
					g.circle(tip.x, tip.y, SYMBOL_SIZE * 0.11 * (1 - e * 0.5));
					g.fill({ color: FLAME[1], alpha: 0.5 * (1 - e * 0.3) });
					g.circle(tip.x, tip.y, SYMBOL_SIZE * 0.055 * (1 - e * 0.5));
					g.fill({ color: FLAME[2], alpha: 0.9 * (1 - e * 0.2) });
				});

				// ── the multiplier stamp ──────────────────────────────────────
				if (stampProgress > 0) {
					// drops from above and overshoots slightly, so it reads as a
					// stamp coming down rather than a number fading in
					const p = stampProgress;
					const drop = (1 - easeOut(p)) * SYMBOL_SIZE * 0.5;
					const r = SYMBOL_SIZE * (0.34 + 0.06 * (1 - p));
					g.circle(focus.x, focus.y - drop, r);
					g.stroke({ width: 5, color: BRASS_HI, alpha: 0.9 * p });
				}
			}}
		/>

		<!--
			The wild, over its own cell.

			Drawn AFTER the pull effects so the rings pass behind it, and before the
			stamp and the total so neither is covered. Scaled past 1 for the whole
			sweep, which is what lets it cover the static symbol on the reel
			underneath without ReelSymbol having to know about collects at all.
		-->
		{#if collector}
			<Sprite
				key="mcW"
				anchor={0.5}
				x={getSymbolX(collector.reel)}
				y={getSymbolY(collector.row) + wildPose.lift}
				width={wildPose.size}
				height={wildPose.size}
			/>
			<!--
				Additive copy on top: the wild flares as it takes each talisman. A
				direct sibling with nothing masked or filtered between it and the
				sprite it is lighting - inside a mask or a filter an additive layer
				has nothing to add to and comes out as a faint film.
			-->
			{#if absorbKick > 0.01}
				<Sprite
					key="mcW"
					anchor={0.5}
					x={getSymbolX(collector.reel)}
					y={getSymbolY(collector.row) + wildPose.lift}
					width={wildPose.size}
					height={wildPose.size}
					blendMode="add"
					alpha={Math.min(0.7, absorbKick * 0.45)}
				/>
			{/if}
		{/if}

		{#if stampProgress > 0}
			<Text
				text={`x${multiplier}`}
				x={focus.x}
				y={focus.y - (1 - easeOut(stampProgress)) * SYMBOL_SIZE * 0.5}
				anchor={{ x: 0.5, y: 0.5 }}
				alpha={stampProgress}
				style={{
					fontFamily: GAME_FONT,
					fontSize: SYMBOL_SIZE * 0.34,
					fontWeight: GAME_FONT_WEIGHT,
					fill: BRASS_HI,
					stroke: { color: 0x1a1008, width: SYMBOL_SIZE * 0.03 },
				}}
			/>
		{/if}

		<!--
			The running total. Drawn under the gourd rather than over it so it never
			covers the thing it is counting.

			`takenCount` drives it, so the number only moves when a talisman actually
			lands - a total that ticks up on its own clock drifts away from the
			animation and stops being an explanation of it.
		-->
		{#if takenCount > 0}
			{@const partial =
				runningTotal +
				sweep.carriers.slice(0, takenCount).reduce((sum, c) => sum + c.value, 0) * multiplier}
			<Text
				text={`${partial.toFixed(2)}x`}
				x={focus.x}
				y={focus.y + SYMBOL_SIZE * 0.7}
				anchor={{ x: 0.5, y: 0.5 }}
				style={{
					fontFamily: GAME_FONT,
					fontSize: SYMBOL_SIZE * 0.3,
					fontWeight: GAME_FONT_WEIGHT,
					fill: TALISMAN,
					stroke: { color: CINNABAR, width: SYMBOL_SIZE * 0.035 },
				}}
			/>
		{/if}
	</Container>
{/if}

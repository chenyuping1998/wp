<script lang="ts">
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { onMount, onDestroy } from 'svelte';

	import { getContext } from '../game/context';

	const context = getContext();

	// Two live price feeds, one in each gutter beside the board.
	//
	// This started as a single chart drawn across the whole canvas, and it did not
	// work: the board sits in the middle covering most of it, so the only parts a
	// player could actually see were the ragged ends poking out either side, and
	// the visible part was the part with the least going on. Drawing two narrower
	// panels that live entirely in the space the board leaves free means every line
	// on screen is a line that was meant to be there - and it reads as two desk
	// monitors flanking the terminal, which is the right furniture for the theme.
	//
	// The gutters move: the board grows when the feature opens. The panel geometry
	// is derived from the board's live canvas bounds, so it reflows rather than
	// being drawn under the expanded board.

	type Series = {
		values: number[];
		/** columns per second - the front series moves fastest */
		speed: number;
		alpha: number;
		width: number;
		/** vertical band, as a fraction of the canvas */
		band: { top: number; height: number };
		/** how far a single step can move, as a fraction of the band */
		volatility: number;
		offset: number;
		seed: number;
		/**
		 * An in-flight price shock. While one is live the series abandons its own
		 * pace and prints `cols` columns at `rate` per second with a hard
		 * directional `drift` - which is what tears a near-vertical leg at the
		 * right-hand edge. When the columns run out the series returns to its
		 * ordinary walk and the leg scrolls away to the left as history, exactly
		 * the way a real print does.
		 */
		shock: { delay: number; cols: number; drift: number; rate: number } | null;
	};

	const COLUMNS = 26;
	const RISE = 0x4bd67f;
	const FALL = 0xff5566;

	// Panels narrower than this have nothing to say - a chart four columns wide is
	// noise. Portrait layouts leave almost no gutter, and drawing one there would
	// crowd the board, which is the one thing this must not do.
	const MIN_PANEL_WIDTH = 96;
	// Breathing room between a panel and the board, and between a panel and the
	// canvas edge, as fractions of the canvas width.
	const BOARD_GAP = 0.018;
	const EDGE_PAD = 0.012;

	// Deterministic per series: the same walk every load, so the backdrop is a
	// designed thing rather than a different picture each session.
	const makeRandom = (seed: number) => () => {
		seed = (seed * 1103515245 + 12345) % 2147483648;
		return seed / 2147483648;
	};

	const makeSeries = (config: Omit<Series, 'values' | 'offset' | 'shock'>): Series => {
		const random = makeRandom(config.seed);
		const values: number[] = [];
		let value = 0.5;
		for (let i = 0; i < COLUMNS + 2; i++) {
			value = Math.min(1, Math.max(0, value + (random() - 0.5) * config.volatility));
			values.push(value);
		}
		return { ...config, values, offset: 0, shock: null };
	};

	// Alphas are set for the unblurred layer this draws on. It used to sit inside
	// the blurred backdrop container, which smeared it into the wallpaper - out in
	// the gutters, away from the board, it can afford to be read.
	const bands = [
		{ speed: 0.34, alpha: 0.3, width: 2, band: { top: 0.1, height: 0.34 }, volatility: 0.34 },
		{ speed: 0.55, alpha: 0.42, width: 2.5, band: { top: 0.32, height: 0.34 }, volatility: 0.42 },
		{ speed: 0.85, alpha: 0.55, width: 3, band: { top: 0.54, height: 0.34 }, volatility: 0.5 },
	];

	// Separate seed sets, so the two panels are visibly different feeds rather
	// than the same walk mirrored.
	const makePanel = (seeds: number[]) =>
		bands.map((config, i) => makeSeries({ ...config, seed: seeds[i] }));

	let panels = $state([makePanel([7, 4021, 90210]), makePanel([1301, 55, 733331])]);

	const randoms = panels.map((panel) => panel.map((s) => makeRandom(s.seed + 1)));

	// ── shocks ───────────────────────────────────────────────────────────────
	// The feed reacts by PRINTING, not by rescaling.
	//
	// The first attempt at this scaled the whole chart's amplitude with the state,
	// and it was wrong twice over. A market does not get taller when something
	// happens, it prints a violent tick - and scaling ran out of room anyway: the
	// outer bands clipped against the canvas edge and flattened onto it (measured,
	// 719px drawn on a 720px canvas).
	//
	// A shock is a discrete event instead. The leading edge tears up or down
	// across a handful of columns in a few hundred milliseconds, and then that leg
	// scrolls left through the panel. Nothing about the resting chart changes.
	//
	// A DELIBERATE NON-FEATURE: the tease prints the same agitation whether or not
	// it is going to pay. The client holds the whole round before playing any of
	// it, so this could rip only when the Scatter is actually coming - which is
	// exactly why it must not; players would learn to read the backdrop and the
	// tease would stop being a tease. The crash fires when the trigger LANDS, not
	// while the reel is still spinning.
	// A shock has to be MUCH steeper than the resting chop or it does not read as
	// a shock at all. The idle walk already moves up to `volatility / 2` per
	// column - 0.17 to 0.25 of a band - so a shock drifting 0.3 was only fractions
	// steeper than an ordinary tick and simply looked like more of the same.
	//
	// These move half a band or more per column, over very few columns, which is
	// what makes the leg near-vertical: two or three columns is 12-18px of
	// horizontal travel against 120-180px of vertical.
	type ShockSpec = { cols: number; drift: number; rate: number };
	const SHOCKS: Record<string, ShockSpec> = {
		// a win: one decisive leg up
		win: { cols: 3, drift: 0.5, rate: 14 },
		// the tease: whipsaw, re-fired on a timer for as long as it lasts
		chop: { cols: 2, drift: 0.55, rate: 18 },
		// the margin call has landed: the floor goes out
		crash: { cols: 4, drift: -0.62, rate: 16 },
	};

	/**
	 * Arm every series.
	 *
	 * The per-series delay is what stops six lines tearing on the same frame,
	 * which reads as one object moving rather than as a market: the near feed goes
	 * first and the others follow it a few frames later.
	 */
	const fireShock = (spec: ShockSpec, sign = 1) => {
		panels.forEach((panel, panelIndex) => {
			panel.forEach((s, index) => {
				s.shock = {
					delay: index * 0.055 + panelIndex * 0.09,
					cols: spec.cols,
					// the front series is the loudest, matching its weight and speed
					drift: spec.drift * sign * (0.75 + index * 0.2),
					rate: spec.rate,
				};
			});
		});
	};

	context.eventEmitter.subscribeOnMount({
		scatterTriggerShow: () => fireShock(SHOCKS.crash),
	});

	// A win prints one leg, on the EDGE of the highlight rather than continuously
	// while it holds - otherwise a long win presentation would rip repeatedly.
	let wasWinning = false;
	$effect(() => {
		const winning = context.stateGame.highlightActive;
		if (winning && !wasWinning) fireShock(SHOCKS.win);
		wasWinning = winning;
	});

	// The tease prints one whipsaw per reel that enters it, alternating direction.
	//
	// NOT on a timer. The resting chart advances 0.34-0.85 columns per second, so
	// the 26-column window is about half a minute of history - which means a shock
	// fired every 260ms lands on top of the last one and the panel fills with
	// vertical legs. Measured: 127 of ~150 segments steep, a picket fence rather
	// than a market. Pacing it to the reels gives two to four ticks across a tease,
	// spaced by the reel stops themselves.
	let teasingCount = $derived(
		context.stateGame.board.filter((reel) => reel.reelState.anticipating).length,
	);
	let prevTeasing = 0;
	let chopSign = 1;
	$effect(() => {
		const now = teasingCount;
		if (now > prevTeasing) {
			chopSign = -chopSign;
			fireShock(SHOCKS.chop, chopSign);
		}
		prevTeasing = now;
	});

	// No redraw counter. `panels` is $state, the walk below mutates it, and the
	// draw reads it - which is the whole dependency. An extra counter read as
	// `void frame` looks like it forces a redraw and does not reliably do
	// anything: the compiler is free to drop a discarded expression, and if it
	// does, the read that was supposed to register the dependency never happens.
	let raf = 0;
	let last = 0;

	/** Advance one series by however many whole columns its offset has crossed. */
	const consume = (s: Series, panelIndex: number, index: number, shocking: boolean) => {
		while (s.offset >= 1) {
			s.offset -= 1;
			s.values.shift();
			const previous = s.values[s.values.length - 1];
			// Pulled gently back toward the middle of its band, so a crash that
			// slams the line to the floor recovers over the following columns
			// instead of leaving it pinned there for the rest of the session.
			const recentre = (0.5 - previous) * 0.04;
			// Noise is damped during a shock: the point of a shock is that it has a
			// direction, and full noise on top of it makes the leg ragged rather
			// than decisive.
			const noise = (randoms[panelIndex][index]() - 0.5) * s.volatility * (shocking ? 0.4 : 1);
			const drift = shocking && s.shock ? s.shock.drift : 0;
			s.values.push(Math.min(1, Math.max(0, previous + noise + drift + recentre)));
			if (shocking && s.shock) {
				s.shock.cols -= 1;
				if (s.shock.cols <= 0) s.shock = null;
			}
		}
	};

	onMount(() => {
		last = performance.now();
		const step = (now: number) => {
			const dt = Math.min(0.1, (now - last) / 1000);
			last = now;

			panels.forEach((panel, panelIndex) => {
				panel.forEach((s, index) => {
					// A shock waits out its stagger at the series' ordinary pace.
					if (s.shock && s.shock.delay > 0) {
						s.shock.delay -= dt;
						if (s.shock.delay > 0) {
							s.offset += s.speed * dt;
							consume(s, panelIndex, index, false);
							return;
						}
					}
					const shocking = s.shock !== null;
					s.offset += (shocking ? s.shock!.rate : s.speed) * dt;
					consume(s, panelIndex, index, shocking);
				});
			});

			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
	});

	onDestroy(() => cancelAnimationFrame(raf));

	const drawPanel = (
		g: PixiGraphics,
		panel: Series[],
		rect: { x: number; width: number; height: number },
	) => {
		const columnWidth = rect.width / (COLUMNS - 2);

		for (const s of panel) {
			// Fixed bands. Amplitude is deliberately NOT a dial: scaling the whole
			// chart is not how a market reacts to news, and it could not be pushed
			// far anyway before the outer bands clipped on the canvas edge.
			const top = rect.height * s.band.top;
			const bandHeight = rect.height * s.band.height;
			const yOf = (v: number) => top + (1 - v) * bandHeight;

			// Every segment is coloured by its own direction - that is what makes it
			// read as a price series rather than a decorative squiggle, and it is why
			// a shock needs no colour of its own: a leg up prints green and a crash
			// prints red, for free. Drawn as two paths rather than one stroke per
			// segment: this runs every frame for the whole session, and a stroke call
			// per segment is a cost the background has no business incurring.
			for (const rising of [true, false]) {
				let drew = false;
				for (let i = 0; i < s.values.length - 1; i++) {
					if ((s.values[i + 1] >= s.values[i]) !== rising) continue;
					const x0 = rect.x + (i - s.offset) * columnWidth;
					const x1 = rect.x + (i + 1 - s.offset) * columnWidth;
					// Columns scroll in from the right and off the left; the two that
					// are part-way through doing so would otherwise overhang the panel
					// and run under the board.
					if (x1 < rect.x || x0 > rect.x + rect.width) continue;
					g.moveTo(x0, yOf(s.values[i]));
					g.lineTo(x1, yOf(s.values[i + 1]));
					drew = true;
				}
				if (drew) g.stroke({ width: s.width, color: rising ? RISE : FALL, alpha: s.alpha });
			}
		}
	};

	const draw = (g: PixiGraphics) => {
		g.clear();
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const board = context.stateGameDerived.boardCanvasBounds();

		const gap = width * BOARD_GAP;
		const pad = width * EDGE_PAD;
		const rects = [
			{ x: pad, width: board.left - gap - pad },
			{ x: board.right + gap, width: width - pad - (board.right + gap) },
		];

		rects.forEach((rect, index) => {
			if (rect.width < MIN_PANEL_WIDTH) return;
			drawPanel(g, panels[index], { ...rect, height });
		});
	};
</script>

<Graphics {draw} />

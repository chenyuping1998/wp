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

	const makeSeries = (config: Omit<Series, 'values' | 'offset'>): Series => {
		const random = makeRandom(config.seed);
		const values: number[] = [];
		let value = 0.5;
		for (let i = 0; i < COLUMNS + 2; i++) {
			value = Math.min(1, Math.max(0, value + (random() - 0.5) * config.volatility));
			values.push(value);
		}
		return { ...config, values, offset: 0 };
	};

	// Alphas are set for the unblurred layer this now draws on. It used to sit
	// inside the blurred backdrop container, which smeared it into the wallpaper -
	// out there in the gutters, away from the board, it can afford to be read.
	const bands = [
		{ speed: 0.34, alpha: 0.3, width: 2, band: { top: 0.08, height: 0.36 }, volatility: 0.34 },
		{ speed: 0.55, alpha: 0.42, width: 2.5, band: { top: 0.3, height: 0.34 }, volatility: 0.42 },
		{ speed: 0.85, alpha: 0.55, width: 3, band: { top: 0.54, height: 0.34 }, volatility: 0.5 },
	];

	// Separate seed sets, so the two panels are visibly different feeds rather
	// than the same walk mirrored.
	const makePanel = (seeds: number[]) =>
		bands.map((config, i) => makeSeries({ ...config, seed: seeds[i] }));

	let panels = $state([makePanel([7, 4021, 90210]), makePanel([1301, 55, 733331])]);

	const randoms = panels.map((panel) => panel.map((s) => makeRandom(s.seed + 1)));

	// No redraw counter. `panels` is $state, the walk below mutates it, and the
	// draw reads it - which is the whole dependency. An extra counter read as
	// `void frame` looks like it forces a redraw and does not reliably do
	// anything: the compiler is free to drop a discarded expression, and if it
	// does, the read that was supposed to register the dependency never happens.
	let raf = 0;
	let last = 0;

	onMount(() => {
		last = performance.now();
		const step = (now: number) => {
			const dt = Math.min(0.1, (now - last) / 1000);
			last = now;

			panels.forEach((panel, panelIndex) => {
				panel.forEach((s, index) => {
					s.offset += s.speed * dt;
					// One whole column consumed: drop the oldest point and extend the walk.
					while (s.offset >= 1) {
						s.offset -= 1;
						s.values.shift();
						const previous = s.values[s.values.length - 1];
						const next = Math.min(
							1,
							Math.max(0, previous + (randoms[panelIndex][index]() - 0.5) * s.volatility),
						);
						s.values.push(next);
					}
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
			const top = rect.height * s.band.top;
			const bandHeight = rect.height * s.band.height;
			const yOf = (v: number) => top + (1 - v) * bandHeight;

			// Every segment is coloured by its own direction - that is what makes it
			// read as a price series rather than a decorative squiggle. Drawn as two
			// paths rather than one stroke per segment: this runs every frame for the
			// whole session, and a stroke call per segment is a cost the background
			// has no business incurring.
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

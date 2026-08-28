<script lang="ts">
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';

	import { BODY_FONT, displayFontFor, displayWeightFor } from '../game/fonts';
	import { gameText } from '../game/i18nText';
	import { getContext } from '../game/context';

	// The three-panel feature card shown once loading reaches 100%.
	//
	// Order is deliberate and the middle slot is the headline: how you get into
	// the feature. Collecting sits left because it is what the player does on
	// every spin, and the cap sits right because it is the number they scan for
	// last. The centre panel is drawn taller and in cinnabar so the eye lands
	// there first.
	//
	// There were TWO panels here until the maths settled, which the layout gave
	// away - `boxes` divides the area in three whether or not three panels exist,
	// so the card had a hole in it. The missing one was the collect panel, held
	// back because its copy quotes what actually happens.
	//
	// Everything readable here comes from game/i18nText, and every string is set
	// through displayFontFor - see game/fontCoverage for why naming GAME_FONT
	// directly on localised copy is a bug rather than a style choice.

	const context = getContext();

	// art-bible 2.1. These were the scaffold's market colours - a teal, a "BEAR"
	// red and a "BULL" green - and the names were not the only thing wrong with
	// them: a jade game lit by one candle has no green in it anywhere.
	const SPIRIT = 0x4fd1c5; // the ghost's own cold light, and nothing else's
	const CINNABAR = 0xc8102e;
	const BRASS_HI = 0xd9a85c;
	const TALISMAN = 0xf2d544;
	const INK = 0x0b1420;
	const BODY_FILL = 0xefe3c8;

	const layout = $derived(context.stateLayoutDerived.mainLayout());

	// Three columns need width. The portrait box is 800x1422 and the tablet box is
	// square; on either, three columns are too narrow to hold a sentence of German
	// or Russian, so the panels stack into rows and the art moves beside the text.
	const stacked = $derived(layout.width / layout.height < 1.2);

	// `top` also sets where the volatility badge hangs, since the badge is drawn
	// just above the panels. It cannot be pushed down to clear the loading
	// screen's subtitle - that only drives it INTO the subtitle - so the subtitle
	// retires with the progress bar instead. It said "243 WAYS - MAX WIN 12,000x",
	// which is panels one and three restated anyway.
	// Down about 30% by area from the first pass (0.88 x 0.62 of the box), which
	// was large enough that the title had to be shoved to the very top of the
	// screen to clear it. Smaller panels buy the wordmark room to sit where a
	// title should sit.
	const AREA = $derived({
		top: layout.height * 0.32,
		bottom: layout.height * 0.835,
		left: layout.width * 0.135,
		right: layout.width * 0.865,
	});

	type Panel = {
		accent: number;
		title: string;
		body: string;
		art: (g: PixiGraphics, w: number, h: number) => void;
		/** drawn from a supplied symbol PNG rather than vectors */
		symbolKey?: string;
		/** the big figure printed under the art */
		figure?: string;
		hero?: boolean;
	};

	// ── illustrations ─────────────────────────────────────────────────────────
	/**
	 * Three carriers on a middle-row line, their values lifting away to be sealed.
	 *
	 * The grid is 5x3 and drawn at the real proportions, so the panel is showing
	 * the board the player is about to see rather than a diagram of it.
	 */
	const drawCollect = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const cols = 5;
		const rows = 3;
		const cell = Math.min(w / (cols + 0.8), h / (rows + 1.6));
		const gap = cell * 0.13;
		const gridW = cols * (cell + gap) - gap;
		const gridH = rows * (cell + gap) - gap;
		const x0 = (w - gridW) / 2;
		const y0 = h - gridH - cell * 0.1;

		// the line that pays: middle row, first three reels
		const lit = (c: number, r: number) => r === 1 && c < 3;

		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const x = x0 + c * (cell + gap);
				const y = y0 + r * (cell + gap);
				g.roundRect(x, y, cell, cell, cell * 0.14);
				g.fill({ color: INK, alpha: lit(c, r) ? 0.2 : 0.55 });
				g.roundRect(x, y, cell, cell, cell * 0.14);
				g.stroke({
					width: 2,
					color: lit(c, r) ? SPIRIT : BRASS_HI,
					alpha: lit(c, r) ? 0.95 : 0.3,
				});
			}
		}

		// the line itself, at the hairline weight WinLines draws it
		const lineY = y0 + (cell + gap) + cell / 2;
		g.moveTo(x0 - cell * 0.24, lineY);
		g.lineTo(x0 + 3 * (cell + gap) - gap + cell * 0.1, lineY);
		g.stroke({ width: 2, color: BRASS_HI, alpha: 0.9 });

		// a talisman slip on each of the three, and its value lifting off the board
		for (let c = 0; c < 3; c++) {
			const cx = x0 + c * (cell + gap) + cell / 2;
			const slipW = cell * 0.3;
			const slipH = cell * 0.56;
			g.roundRect(cx - slipW / 2, lineY - slipH / 2, slipW, slipH, slipW * 0.16);
			g.fill({ color: TALISMAN, alpha: 0.9 });
			g.roundRect(cx - slipW / 2, lineY - slipH / 2, slipW, slipH, slipW * 0.16);
			g.stroke({ width: 1.5, color: CINNABAR, alpha: 0.85 });

			// the lift: a stem with an arrowhead, taller on each successive carrier
			// so the three read as one movement rather than as three ticks
			const rise = cell * (0.5 + c * 0.16);
			const tipY = lineY - slipH / 2 - rise;
			g.moveTo(cx, lineY - slipH / 2 - cell * 0.08);
			g.lineTo(cx, tipY);
			g.moveTo(cx - cell * 0.13, tipY + cell * 0.17);
			g.lineTo(cx, tipY);
			g.lineTo(cx + cell * 0.13, tipY + cell * 0.17);
		}
		g.stroke({ width: 2.5, color: SPIRIT, alpha: 0.95 });
	};

	/**
	 * A stack of sealed talismans climbing to the cap.
	 *
	 * This slot used to hold an OHLC candlestick chart - eight bodies with wicks,
	 * green when the close was up and red when it was down. That is a picture of a
	 * share price, and it was the scaffold's whole theme; on a night-shrine board
	 * it read as a chart someone had left open in another window. The ascent
	 * survives because "climbing to a cap" is the idea worth drawing. What climbs
	 * is now slips of sealed paper.
	 */
	const drawAscent = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		// Fixed heights, not random: this is a designed illustration and it should
		// be the same picture every load.
		const series = [0.2, 0.3, 0.44, 0.56, 0.7, 0.86, 1];
		const slipW = (w * 0.74) / series.length;
		const x0 = (w - slipW * series.length) / 2 + slipW * 0.12;
		const base = h * 0.95;

		series.forEach((value, i) => {
			const top = i === series.length - 1;
			const slipH = h * 0.14 + value * h * 0.6;
			const x = x0 + i * slipW;
			const y = base - slipH;
			const bw = slipW * 0.68;
			g.roundRect(x, y, bw, slipH, bw * 0.14);
			g.fill({ color: TALISMAN, alpha: top ? 0.95 : 0.34 + value * 0.4 });
			g.roundRect(x, y, bw, slipH, bw * 0.14);
			g.stroke({ width: 2, color: top ? CINNABAR : BRASS_HI, alpha: top ? 1 : 0.65 });
			// the cinnabar mark down the middle of each slip
			g.moveTo(x + bw / 2, y + slipH * 0.14);
			g.lineTo(x + bw / 2, y + slipH * 0.86);
			g.stroke({ width: 1.5, color: CINNABAR, alpha: top ? 0.9 : 0.45 });
		});

		// the cap the stack is reaching for
		const capY = base - (h * 0.14 + h * 0.6) - h * 0.06;
		g.moveTo(x0 - slipW * 0.2, capY);
		g.lineTo(x0 + slipW * series.length, capY);
		g.stroke({ width: 2, color: CINNABAR, alpha: 0.8 });
	};

	/** Backing glow for the hero panel's symbol. */
	const drawSymbolGlow = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const r = Math.min(w, h) * 0.34;
		g.circle(w / 2, h / 2, r * 1.35);
		g.fill({ color: CINNABAR, alpha: 0.12 });
		g.circle(w / 2, h / 2, r);
		g.fill({ color: CINNABAR, alpha: 0.16 });
	};

	const panels = $derived<Panel[]>([
		{
			accent: SPIRIT,
			title: gameText('introCollectTitle'),
			body: gameText('introCollectBody'),
			art: drawCollect,
			// No figure on this panel.
			//
			// It read "3 · 1" - three carriers on a line in the base game, one wild in
			// the feature - which is exactly the mechanic and completely opaque as two
			// digits and a dot. A figure earns its place when a player can act on it
			// at a glance ("3+" scatters, "10,000x"); this one needed the sentence
			// underneath to decode it, and a caption that needs a caption is noise.
			// The body copy says both rules in the player's own language.
		},
		{
			accent: CINNABAR,
			title: gameText('introTriggerTitle'),
			body: gameText('introTriggerBody'),
			art: drawSymbolGlow,
			symbolKey: 'mcS',
			// Figures, not words: readable in every locale and the one thing a
			// player can act on. Deliberately "3+" and not "3 -> 8": U+2192 is
			// outside the display face's subset, so the arrow alone would have come
			// from a different face. The body copy carries 8/12/15 in the player's
			// own language.
			figure: '3+',
			hero: true,
		},
		{
			accent: BRASS_HI,
			title: gameText('introMaxWinTitle'),
			body: gameText('introMaxWinBody'),
			art: drawAscent,
			figure: '10,000x',
		},
	]);

	// ── geometry ──────────────────────────────────────────────────────────────
	// The figure sits between the art and the title, and it used to sit too high:
	// anchored a full 0.9 of the title's size above the title, which on a desktop
	// layout put its ascenders into the illustration's lower edge. 0.35 drops it
	// into the gap it was meant to occupy, and the art slot below gives up four
	// hundredths of the panel to make that gap real rather than borrowed.
	const FIGURE_LIFT = 0.35;

	const boxes = $derived.by(() => {
		const areaW = AREA.right - AREA.left;
		const areaH = AREA.bottom - AREA.top;
		if (stacked) {
			const gap = areaH * 0.04;
			const h = (areaH - gap * 2) / 3;
			return panels.map((_, i) => ({
				x: AREA.left,
				y: AREA.top + i * (h + gap),
				w: areaW,
				h,
			}));
		}
		const gap = areaW * 0.028;
		const w = (areaW - gap * 2) / 3;
		return panels.map((panel, i) => {
			// The hero stands a little proud of its neighbours, top and bottom.
			const grow = panel.hero ? areaH * 0.05 : 0;
			return {
				x: AREA.left + i * (w + gap),
				y: AREA.top - grow,
				w,
				h: areaH + grow * 2,
			};
		});
	});

	const chamfer = (g: PixiGraphics, x: number, y: number, w: number, h: number, c: number) => {
		g.moveTo(x + c, y);
		g.lineTo(x + w - c, y);
		g.lineTo(x + w, y + c);
		g.lineTo(x + w, y + h - c);
		g.lineTo(x + w - c, y + h);
		g.lineTo(x + c, y + h);
		g.lineTo(x, y + h - c);
		g.lineTo(x, y + c);
		g.closePath();
	};

	const drawPanelChrome = (g: PixiGraphics) => {
		g.clear();
		boxes.forEach((box, i) => {
			const accent = panels[i].accent;
			const c = Math.min(box.w, box.h) * 0.07;
			chamfer(g, box.x, box.y, box.w, box.h, c);
			g.fill({ color: 0x0d1611, alpha: 0.94 });
			chamfer(g, box.x, box.y, box.w, box.h, c);
			g.stroke({ width: 3, color: accent, alpha: 0.85 });
			// accent bar across the head
			g.roundRect(box.x + box.w * 0.07, box.y + box.h * 0.045, box.w * 0.86, 4, 2);
			g.fill({ color: accent, alpha: 0.9 });
		});
	};

	// Where the art sits inside a panel, and where the text starts. Stacked panels
	// put the art beside the text instead of above it - a full-width row with the
	// art on top would waste most of its width.
	const slots = $derived(
		boxes.map((box) => {
			if (stacked) {
				const artW = box.w * 0.28;
				return {
					art: { x: box.x + box.w * 0.03, y: box.y + box.h * 0.14, w: artW, h: box.h * 0.72 },
					text: { x: box.x + box.w * 0.34, w: box.w * 0.62, titleY: box.y + box.h * 0.16 },
					centred: false,
				};
			}
			return {
				art: { x: box.x + box.w * 0.1, y: box.y + box.h * 0.06, w: box.w * 0.8, h: box.h * 0.3 },
				text: { x: box.x + box.w * 0.08, w: box.w * 0.84, titleY: box.y + box.h * 0.52 },
				centred: true,
			};
		}),
	);

	// The body is placed below a title slot two lines deep, always, rather than
	// below the title's measured height. Titles wrap on the long locales - Russian
	// sets "БЕСПЛАТНЫЕ ВРАЩЕНИЯ" over two lines where English sets "FREE SPINS"
	// over one - and a single-line offset put the body straight through the
	// second line. Reserving the space unconditionally costs one line of air on
	// the short locales and cannot collide on any of them.
	const TITLE_LINES = 2;

	const titleSize = $derived(Math.round((stacked ? layout.width * 0.034 : layout.width * 0.023)));
	const bodySize = $derived(Math.round((stacked ? layout.width * 0.025 : layout.width * 0.0148)));
	const figureSize = $derived(Math.round(layout.width * 0.03));
</script>

<MainContainer>
	<!-- volatility badge, directly under the game title -->
	<Graphics
		draw={(g) => {
			g.clear();
			const w = layout.width * 0.24;
			const h = layout.height * 0.042;
			g.roundRect((layout.width - w) / 2, AREA.top - h * 1.9, w, h, h / 2);
			g.fill({ color: INK, alpha: 0.8 });
			g.roundRect((layout.width - w) / 2, AREA.top - h * 1.9, w, h, h / 2);
			g.stroke({ width: 2, color: 0xf7a83a, alpha: 0.7 });

			// Volatility pips, drawn rather than typed. The obvious character for
			// these is U+25AE, which is in neither the display subset nor reliably
			// in the body stack — a missing-glyph box is a worse outcome than five
			// rectangles, and rectangles are what it would have been anyway.
			const pipH = h * 0.42;
			const pipW = pipH * 0.42;
			const pipGap = pipW * 0.7;
			const pipsW = 5 * pipW + 4 * pipGap;
			const pipX = (layout.width + w) / 2 - pipsW - h * 0.5;
			for (let i = 0; i < 5; i++) {
				g.rect(pipX + i * (pipW + pipGap), AREA.top - h * 1.9 + (h - pipH) / 2, pipW, pipH);
			}
			g.fill({ color: 0xf7a83a, alpha: 0.95 });
		}}
	/>
	<Text
		text={gameText('volatility')}
		anchor={{ x: 0.5, y: 0.5 }}
		x={layout.width * 0.5 - layout.width * 0.035}
		y={AREA.top - layout.height * 0.042 * 1.4}
		style={{
			fontFamily: BODY_FONT,
			fontSize: Math.round(layout.width * 0.0145),
			fontWeight: '700',
			letterSpacing: 2,
			fill: 0xf7a83a,
		}}
	/>

	<Graphics draw={drawPanelChrome} />

	{#each panels as panel, i (i)}
		{@const box = boxes[i]}
		{@const slot = slots[i]}
		<!-- illustration -->
		<Container x={slot.art.x} y={slot.art.y}>
			<Graphics draw={(g) => panel.art(g, slot.art.w, slot.art.h)} />
			{#if panel.symbolKey}
				<Sprite
					key={panel.symbolKey}
					anchor={0.5}
					x={slot.art.w / 2}
					y={slot.art.h / 2}
					width={Math.min(slot.art.w, slot.art.h) * 0.62}
					height={Math.min(slot.art.w, slot.art.h) * 0.62}
				/>
			{/if}
		</Container>

		{#if panel.figure}
			<Text
				text={panel.figure}
				anchor={{ x: slot.centred ? 0.5 : 0, y: 1 }}
				x={slot.centred ? box.x + box.w / 2 : slot.text.x}
				y={slot.text.titleY - titleSize * FIGURE_LIFT}
				style={{
					fontFamily: displayFontFor(panel.figure),
					fontSize: figureSize,
					fontWeight: displayWeightFor(panel.figure),
					fill: panel.accent,
				}}
			/>
		{/if}

		<Text
			text={panel.title}
			anchor={{ x: slot.centred ? 0.5 : 0, y: 0 }}
			x={slot.centred ? box.x + box.w / 2 : slot.text.x}
			y={slot.text.titleY}
			style={{
				fontFamily: displayFontFor(panel.title),
				fontSize: titleSize,
				fontWeight: displayWeightFor(panel.title),
				letterSpacing: 1,
				fill: panel.accent,
				align: slot.centred ? 'center' : 'left',
				wordWrap: true,
				wordWrapWidth: slot.text.w,
			}}
		/>

		<Text
			text={panel.body}
			anchor={{ x: slot.centred ? 0.5 : 0, y: 0 }}
			x={slot.centred ? box.x + box.w / 2 : slot.text.x}
			y={slot.text.titleY + titleSize * TITLE_LINES * 1.25}
			style={{
				fontFamily: BODY_FONT,
				fontSize: bodySize,
				fontWeight: '600',
				fill: BODY_FILL,
				align: slot.centred ? 'center' : 'left',
				wordWrap: true,
				wordWrapWidth: slot.text.w,
				lineHeight: bodySize * 1.4,
			}}
		/>
	{/each}
</MainContainer>

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
	// the feature. The board expansion sits left because it only matters once you
	// are in, and the cap sits right because it is the number players scan for
	// last. The centre panel is drawn taller and in the alarm red so the eye lands
	// there first.
	//
	// Everything readable here comes from game/i18nText, and every string is set
	// through displayFontFor - see game/fontCoverage for why naming GAME_FONT
	// directly on localised copy is a bug rather than a style choice.

	const context = getContext();

	const TEAL = 0x3fd0d4;
	const BEAR = 0xff5566;
	const BULL = 0x4bd67f;
	const INK = 0x050908;
	const BODY_FILL = 0xcfe9da;

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
	/** 5x3 solid, two more rows opening above it, arrows through the new rows. */
	const drawExpand = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const cols = 5;
		const cell = Math.min(w / (cols + 1), h / 6.4);
		const gap = cell * 0.14;
		const gridW = cols * (cell + gap) - gap;
		const x0 = (w - gridW) / 2;
		const y0 = (h - (5 * (cell + gap) - gap)) / 2;

		for (let r = 0; r < 5; r++) {
			for (let c = 0; c < cols; c++) {
				const x = x0 + c * (cell + gap);
				const y = y0 + r * (cell + gap);
				const opening = r < 2;
				if (opening) {
					// Pixi has no dashed stroke, so the outline is drawn as four gapped
					// runs - enough to read as "not there yet" without a dash pattern.
					const d = cell * 0.3;
					for (const [ax, ay, bx, by] of [
						[x, y, x + d, y],
						[x + cell - d, y, x + cell, y],
						[x, y + cell, x + d, y + cell],
						[x + cell - d, y + cell, x + cell, y + cell],
						[x, y, x, y + d],
						[x, y + cell - d, x, y + cell],
						[x + cell, y, x + cell, y + d],
						[x + cell, y + cell - d, x + cell, y + cell],
					]) {
						g.moveTo(ax, ay);
						g.lineTo(bx, by);
					}
					g.stroke({ width: 2, color: TEAL, alpha: 0.9 });
				} else {
					g.roundRect(x, y, cell, cell, cell * 0.14);
					g.fill({ color: BULL, alpha: 0.2 });
					g.roundRect(x, y, cell, cell, cell * 0.14);
					g.stroke({ width: 2, color: BULL, alpha: 0.55 });
				}
			}
		}

		for (let c = 0; c < cols; c++) {
			const x = x0 + c * (cell + gap) + cell / 2;
			const tip = y0 + cell * 0.25;
			const tail = y0 + cell * 1.9;
			g.moveTo(x, tail);
			g.lineTo(x, tip);
			g.moveTo(x - cell * 0.2, tip + cell * 0.3);
			g.lineTo(x, tip);
			g.lineTo(x + cell * 0.2, tip + cell * 0.3);
		}
		g.stroke({ width: 3, color: TEAL, alpha: 0.95 });
	};

	/** A run of candles climbing to the cap. */
	const drawCandles = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		// Fixed series, not random: this is a designed illustration and it should
		// be the same picture every load.
		const series = [0.28, 0.42, 0.34, 0.56, 0.48, 0.74, 0.66, 0.95];
		const barW = (w * 0.72) / series.length;
		const x0 = (w - barW * series.length) / 2 + barW * 0.15;
		const base = h * 0.94;

		series.forEach((value, i) => {
			const rising = i === 0 || value >= series[i - 1];
			const color = rising ? BULL : BEAR;
			const bodyH = h * 0.16 + value * h * 0.42;
			const x = x0 + i * barW;
			const y = base - bodyH;
			g.moveTo(x + barW * 0.35, y - h * 0.06);
			g.lineTo(x + barW * 0.35, y + bodyH + h * 0.06);
			g.stroke({ width: 2, color, alpha: 0.6 });
			g.roundRect(x, y, barW * 0.7, bodyH, 3);
			g.fill({ color, alpha: 0.5 });
			g.roundRect(x, y, barW * 0.7, bodyH, 3);
			g.stroke({ width: 2, color, alpha: 0.95 });
		});
	};

	/** Backing glow for the hero panel's symbol. */
	const drawSymbolGlow = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const r = Math.min(w, h) * 0.34;
		g.circle(w / 2, h / 2, r * 1.35);
		g.fill({ color: BEAR, alpha: 0.1 });
		g.circle(w / 2, h / 2, r);
		g.fill({ color: BEAR, alpha: 0.14 });
	};

	const panels = $derived<Panel[]>([
		{
			accent: TEAL,
			title: gameText('introWaysTitle'),
			body: gameText('introWaysBody'),
			art: drawExpand,
		},
		{
			accent: BEAR,
			title: gameText('introTriggerTitle'),
			body: gameText('introTriggerBody'),
			art: drawSymbolGlow,
			symbolKey: 'mcS',
			// Figures, not words: readable in every locale and the one thing a
			// player can act on. Deliberately "3+" and not "3 → 8": U+2192 is outside
			// the Titan One subset, so the arrow alone would have come from a
			// different face. The body copy carries 10/12/15 in the player's language.
			figure: '3+',
			hero: true,
		},
		{
			accent: BULL,
			title: gameText('introMaxWinTitle'),
			body: gameText('introMaxWinBody'),
			art: drawCandles,
			figure: '10,000×',
		},
	]);

	// ── geometry ──────────────────────────────────────────────────────────────
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
				art: { x: box.x + box.w * 0.1, y: box.y + box.h * 0.07, w: box.w * 0.8, h: box.h * 0.34 },
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
				y={slot.text.titleY - titleSize * 0.9}
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

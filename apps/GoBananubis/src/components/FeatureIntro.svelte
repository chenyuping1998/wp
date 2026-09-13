<script lang="ts">
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle } from 'pixi.js';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';

	import { GAME_FONT, GAME_FONT_WEIGHT, BODY_FONT } from '../game/fonts';
	import config from '../game/config';
	import { getContext } from '../game/context';

	// The three-panel feature card shown once loading reaches 100%.
	//
	// The middle slot is the headline and it is the sealed Tablet: this is Go
	// Bananubis, the Tablet IS the mechanic, and it is the only thing here a
	// player of an earlier Go Bananas would not already know. The trigger sits
	// left because it is the familiar half, and the max win sits right because it
	// is the figure players scan for last.
	//
	// This card was inherited from Go Bananas 100 and described that game's
	// growing wild multiplier — a mechanic this one does not have. Nothing about
	// the layout was wrong; every word in the middle panel was.
	//
	// Copy is English-only, matching this app's loading tips. TripleWitching
	// localises its equivalent card through game/i18nText; GoBananas has never
	// localised its loading copy, and half-localising it would be worse than
	// either end. Every string avoids the social restricted list by hand —
	// design/check_social_words only scans literal markup, and everything here
	// lives in the script block where it cannot see it.

	const context = getContext();

	// THE PALETTE IS THE TOMB'S, NOT THE JUNGLE'S.
	//
	// These panels were inherited from Go Bananas and kept its olive greens —
	// #14200c ink, #2c3a1c cells, a mint-green accent. This is the FIRST screen
	// of the game, sitting in front of a sandstone hall, and it was the one
	// surface still painted for the previous game.
	//
	// Same four jobs, this game's colours: tomb gold, scarab red, faience
	// turquoise, and basalt for the panel — the palette the board frame, the
	// tablets and the win lines already run on.
	const GOLD = 0xffd43b;
	const HOT = 0xff7a33;
	const JADE = 0x5fe3d0;
	const PANEL_INK = 0x141a1e;
	const BODY_FILL = 0xf0e2c8;

	// the unlit cells of the two board illustrations: basalt with a sandstone
	// edge, which is what an empty cell looks like on the real board
	const CELL_FILL = 0x232b31;
	const CELL_EDGE = 0x6b7780;

	const layout = $derived(context.stateLayoutDerived.mainLayout());

	// The awards come from the maths (config.scatterSpins, scraped from
	// game_config.py's freespin_triggers) rather than being typed into the copy.
	// This card, the loading tips, the rules page and the pay table each used to
	// carry their own hand-written version of the same sentence, and all four were
	// wrong in the same way at the same time.
	const spinsFor = (config.scatterSpins ?? {}) as Record<string, number>;
	const scatterCounts = Object.keys(spinsFor)
		.map(Number)
		.sort((a, b) => a - b);
	const asList = (values: (string | number)[]) =>
		values.length > 1 ? `${values.slice(0, -1).join(', ')} or ${values[values.length - 1]}` : `${values[0]}`;

	// Three columns need width. On portrait and square boxes they are too narrow
	// to hold a sentence, so the panels stack into rows and the art moves beside
	// the text instead of above it.
	const stacked = $derived(layout.width / layout.height < 1.2);

	const AREA = $derived({
		top: layout.height * 0.34,
		bottom: layout.height * 0.84,
		left: layout.width * 0.13,
		right: layout.width * 0.87,
	});

	// ── illustrations ─────────────────────────────────────────────────────────

	// Both grid illustrations are the same 5x5 board at the same size, so the two
	// panels rhyme rather than each inventing its own geometry.
	const grid = (w: number, h: number) => {
		const cell = Math.min(w / 6.2, h / 6.2);
		const gap = cell * 0.16;
		const span = 5 * (cell + gap) - gap;
		return { cell, gap, x0: (w - span) / 2, y0: (h - span) / 2 };
	};

	/**
	 * 5x5 grid with the SMALLEST triggering Scatter count lit — three, which is
	 * both the lowest entry and, on the base strip, 98.6% of the entries that
	 * happen. The panel is showing the player what a trigger looks like, and a
	 * five-Scatter board is not what one looks like.
	 *
	 * The three-Scatter entry did not exist until the maths was corrected: every
	 * distribution forced five, so freespin_triggers' 3 and 4 rows were unreachable
	 * and this panel showed a count the game never awarded.
	 */
	const drawScatterGrid = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const { cell, gap, x0, y0 } = grid(w, h);
		// which cells hold a Scatter — one per reel, spread out and never adjacent,
		// because that is how they actually land and a clustered three reads as a
		// cluster mechanic. Reels 1, 3 and 5, which is where BR0 keeps them.
		const lit = new Set(['0,1', '2,0', '4,2']);
		for (let c = 0; c < 5; c++) {
			for (let r = 0; r < 5; r++) {
				const x = x0 + c * (cell + gap);
				const y = y0 + r * (cell + gap);
				const on = lit.has(`${c},${r}`);
				g.roundRect(x, y, cell, cell, cell * 0.16);
				g.fill({ color: on ? GOLD : CELL_FILL, alpha: on ? 0.85 : 0.65 });
				g.roundRect(x, y, cell, cell, cell * 0.16);
				g.stroke({ width: 1.5, color: on ? GOLD : CELL_EDGE, alpha: on ? 0.95 : 0.55 });
			}
		}
	};

	/**
	 * Four sealed Tablets on the same board, scattered across four different reels
	 * on purpose: they open together as one symbol wherever they are, and two of
	 * them side by side would read as an adjacency rule.
	 *
	 * The empty cells are drawn here; the Tablets themselves are the real `gbM`
	 * texture, placed as sprites by the template below. It used to draw them with
	 * a vector stand-in, which was right while the symbol had no art — now that it
	 * does, this panel has to show the same picture the reels will, or it is
	 * teaching the player the wrong shape.
	 */
	const SEALED = ['0,3', '1,1', '3,2', '4,0'];

	const drawSealedBoard = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const { cell, gap, x0, y0 } = grid(w, h);
		const sealed = new Set(SEALED);
		for (let c = 0; c < 5; c++) {
			for (let r = 0; r < 5; r++) {
				if (sealed.has(`${c},${r}`)) continue;
				const x = x0 + c * (cell + gap);
				const y = y0 + r * (cell + gap);
				g.roundRect(x, y, cell, cell, cell * 0.16);
				g.fill({ color: CELL_FILL, alpha: 0.65 });
				g.roundRect(x, y, cell, cell, cell * 0.16);
				g.stroke({ width: 1.5, color: CELL_EDGE, alpha: 0.55 });
			}
		}
	};

	/** Where the Tablet sprites go, in the art slot's own coordinates. */
	const sealedTiles = (w: number, h: number) => {
		const { cell, gap, x0, y0 } = grid(w, h);
		return SEALED.map((key) => {
			const [c, r] = key.split(',').map(Number);
			return {
				x: x0 + c * (cell + gap) + cell / 2,
				y: y0 + r * (cell + gap) + cell / 2,
				size: cell,
			};
		});
	};

	/** Multipliers from several opened Tablets adding into one figure. */
	const drawAddedMultipliers = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const barW = w * 0.13;
		const gap = w * 0.055;
		const baseY = h * 0.86;
		const heights = [0.24, 0.42, 0.62, 0.86];
		const totalW = heights.length * barW + (heights.length - 1) * gap;
		const x0 = (w - totalW) / 2;
		heights.forEach((f, i) => {
			const bh = h * 0.7 * f;
			const x = x0 + i * (barW + gap);
			g.roundRect(x, baseY - bh, barW, bh, barW * 0.22);
			g.fill({ color: JADE, alpha: 0.18 + i * 0.16 });
			g.roundRect(x, baseY - bh, barW, bh, barW * 0.22);
			g.stroke({ width: 2, color: JADE, alpha: 0.5 + i * 0.14 });
		});

		// Plus signs between the bars: these ADD, they do not compound. Built in a
		// second pass on purpose — fill()/stroke() consume the current path, so
		// interleaving these with the bars above would hand each pending plus to
		// the next bar's fill() and paint it as a filled blob instead of a stroke.
		for (let i = 0; i < heights.length - 1; i++) {
			const px = x0 + i * (barW + gap) + barW + gap / 2;
			const py = baseY - h * 0.1;
			const s = gap * 0.3;
			g.moveTo(px - s, py);
			g.lineTo(px + s, py);
			g.moveTo(px, py - s);
			g.lineTo(px, py + s);
		}
		g.stroke({ width: 2.5, color: GOLD, alpha: 0.8 });
	};

	type Panel = {
		accent: number;
		title: string;
		body: string;
		figure: string;
		art: (g: PixiGraphics, w: number, h: number) => void;
		/** square symbol art, centred in the slot */
		symbolKey?: string;
		/** repeated square art placed by the panel's own geometry */
		tiles?: { key: string; at: (w: number, h: number) => { x: number; y: number; size: number }[] };
		hero?: boolean;
	};

	// Bodies are one short sentence each. The first pass ran to two and three
	// sentences and overflowed the panels — the copy is a caption for the art, not
	// the rules screen, which is one tap away and carries the full wording.
	const panels: Panel[] = [
		{
			accent: GOLD,
			title: 'FREE SPINS',
			body: `Land ${asList(scatterCounts)} Scatters anywhere to open ${asList(
				scatterCounts.map((n) => spinsFor[n]),
			)} Free Spins.`,
			figure: `${scatterCounts[0]}-${scatterCounts[scatterCounts.length - 1]}`,
			art: drawScatterGrid,
			symbolKey: 'gbS',
		},
		{
			accent: HOT,
			title: 'SEALED TABLETS',
			body: 'Every Tablet opens to the same symbol. In Free Spins they stay open, each carrying 2X to 50X.',
			figure: '50X',
			art: drawSealedBoard,
			tiles: { key: 'gbM', at: sealedTiles },
			hero: true,
		},
		{
			accent: JADE,
			title: 'MAX WIN',
			body: 'Tablet multipliers on a winning line are added together.',
			figure: `${(config.betModes?.base?.max_win ?? 0).toLocaleString()}X`,
			art: drawAddedMultipliers,
		},
	];

	// ── geometry ──────────────────────────────────────────────────────────────
	const boxes = $derived.by(() => {
		const areaW = AREA.right - AREA.left;
		const areaH = AREA.bottom - AREA.top;
		if (stacked) {
			const gap = areaH * 0.04;
			const h = (areaH - gap * 2) / 3;
			return panels.map((_, i) => ({ x: AREA.left, y: AREA.top + i * (h + gap), w: areaW, h }));
		}
		const gap = areaW * 0.028;
		const w = (areaW - gap * 2) / 3;
		return panels.map((panel, i) => {
			// the hero stands a little proud of its neighbours, top and bottom
			const grow = panel.hero ? areaH * 0.05 : 0;
			return { x: AREA.left + i * (w + gap), y: AREA.top - grow, w, h: areaH + grow * 2 };
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
			g.fill({ color: PANEL_INK, alpha: 0.94 });
			chamfer(g, box.x, box.y, box.w, box.h, c);
			g.stroke({ width: 3, color: accent, alpha: 0.85 });
			g.roundRect(box.x + box.w * 0.07, box.y + box.h * 0.045, box.w * 0.86, 4, 2);
			g.fill({ color: accent, alpha: 0.9 });
		});
	};

	// Art above text in the wide layout, art beside text when the panels stack.
	//
	// The hero used to take the side-by-side arrangement in BOTH, because its art
	// was the real 1:5 WILD reel panel and a short wide slot squeezed it to about
	// 24px across. Its art is now the same square 5x5 board as its left-hand
	// neighbour, so it wants the same shape as its neighbour: the emphasis is
	// carried by standing proud of them and by the accent colour, and a third
	// arrangement in the middle of three panels just looked like a mistake.
	const slots = $derived(
		boxes.map((box, i) => {
			if (stacked) {
				const artW = box.w * 0.28;
				const textX = box.x + box.w * 0.34;
				return {
					art: { x: box.x + box.w * 0.03, y: box.y + box.h * 0.14, w: artW, h: box.h * 0.72 },
					text: { x: textX, w: box.x + box.w * 0.95 - textX, titleY: box.y + box.h * 0.2 },
					centred: false,
				};
			}
			return {
				art: { x: box.x + box.w * 0.1, y: box.y + box.h * 0.07, w: box.w * 0.8, h: box.h * 0.3 },
				text: { x: box.x + box.w * 0.08, w: box.w * 0.84, titleY: box.y + box.h * 0.5 },
				centred: true,
			};
		}),
	);

	const titleSize = $derived(Math.round(stacked ? layout.width * 0.03 : layout.width * 0.02));
	const bodySize = $derived(Math.round(stacked ? layout.width * 0.023 : layout.width * 0.0135));
	const figureSize = $derived(Math.round(layout.width * 0.028));

	// How far below the title the body starts, MEASURED rather than assumed.
	//
	// This was a constant number of title lines, and it was wrong twice in a row:
	// at two lines it wasted a line under the short titles, and at one line the
	// long middle title — which fits one line in a wide centred panel and wraps in
	// a narrow stacked one — printed the body straight through its second line.
	// There is no constant that is right for both, so each panel now reserves
	// exactly what its own title occupies at its own column width.
	const titleHeights = $derived(
		panels.map((panel, i) => {
			const slot = slots[i];
			const measured = CanvasTextMetrics.measureText(
				panel.title,
				new TextStyle({
					fontFamily: GAME_FONT,
					fontSize: titleSize,
					fontWeight: GAME_FONT_WEIGHT,
					letterSpacing: 1,
					wordWrap: true,
					wordWrapWidth: slot.text.w,
					align: slot.centred ? 'center' : 'left',
				}),
			).height;
			// Floor at two lines' worth for the hero: it has the longest title of the
			// three, and if this measures before the display face has loaded the
			// fallback's narrower metrics would report one line where Titan One
			// needs two — and the body would print through it.
			const floor = panel.hero ? titleSize * 2.4 : titleSize * 1.2;
			return Math.max(measured, floor) + bodySize * 0.5;
		}),
	);
</script>

<MainContainer>
	<Graphics draw={drawPanelChrome} />

	{#each panels as panel, i (i)}
		{@const box = boxes[i]}
		{@const slot = slots[i]}
		<Container x={slot.art.x} y={slot.art.y}>
			<Graphics draw={(g) => panel.art(g, slot.art.w, slot.art.h)} />
			{#if panel.tiles}
				{#each panel.tiles.at(slot.art.w, slot.art.h) as tile, t (t)}
					<Sprite
						key={panel.tiles.key}
						anchor={0.5}
						x={tile.x}
						y={tile.y}
						width={tile.size}
						height={tile.size}
					/>
				{/each}
			{/if}
			{#if panel.symbolKey}
				<Sprite
					key={panel.symbolKey}
					anchor={0.5}
					x={slot.art.w / 2}
					y={slot.art.h / 2}
					width={Math.min(slot.art.w, slot.art.h) * 0.44}
					height={Math.min(slot.art.w, slot.art.h) * 0.44}
				/>
			{/if}
		</Container>

		<Text
			text={panel.figure}
			anchor={{ x: slot.centred ? 0.5 : 0, y: 1 }}
			x={slot.centred ? box.x + box.w / 2 : slot.text.x}
			y={slot.text.titleY - titleSize * 0.85}
			style={{
				fontFamily: GAME_FONT,
				fontSize: figureSize,
				fontWeight: GAME_FONT_WEIGHT,
				fill: panel.accent,
			}}
		/>

		<Text
			text={panel.title}
			anchor={{ x: slot.centred ? 0.5 : 0, y: 0 }}
			x={slot.centred ? box.x + box.w / 2 : slot.text.x}
			y={slot.text.titleY}
			style={{
				fontFamily: GAME_FONT,
				fontSize: titleSize,
				fontWeight: GAME_FONT_WEIGHT,
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
			y={slot.text.titleY + titleHeights[i]}
			style={{
				fontFamily: BODY_FONT,
				fontSize: bodySize,
				fontWeight: '600',
				fill: BODY_FILL,
				align: slot.centred ? 'center' : 'left',
				wordWrap: true,
				wordWrapWidth: slot.text.w,
				lineHeight: bodySize * 1.42,
			}}
		/>
	{/each}
</MainContainer>

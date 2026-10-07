<script lang="ts">
	import { Container, Graphics, Sprite, Text, getContextApp } from 'pixi-svelte';
	import { onDestroy } from 'svelte';

	import SymbolMeshWin from './SymbolMeshWin.svelte';
	import { CanvasTextMetrics, TextStyle } from 'pixi.js';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';

	import { GAME_FONT, GAME_FONT_WEIGHT, BODY_FONT } from '../game/fonts';
	import { getContext } from '../game/context';
	import config from '../game/config';

	// The three-panel feature card shown once loading reaches 100%.
	//
	// The middle slot is the headline and it is THE STRETCH, not the trigger: a
	// board that changes shape is the only thing here a player of another ways
	// game would not already know. The trigger sits left because it is the
	// familiar half, and the max win sits right because it is the figure players
	// scan for last.
	//
	// Copy is English-only, matching this app's loading tips. TripleWitching
	// localises its equivalent card through game/i18nText; GoBananas has never
	// localised its loading copy, and half-localising it would be worse than
	// either end. Every string avoids the social restricted list by hand —
	// design/check_social_words only scans literal markup, and everything here
	// lives in the script block where it cannot see it.

	const context = getContext();

	// THE SCATTER ACTS while it is being introduced (2026-09-28): its mesh beats
	// in turn — the idle tick, the win beat, the trigger's climbing flare — with
	// a breath between, instead of a still picture. The layers are preloaded; if
	// they are somehow not there yet, the still picture stays.
	const app = getContextApp();
	const meshReady = !!app.stateApp.loadedAssets?.gbSSheen && !!app.stateApp.loadedAssets?.gbSShadow;
	const INTRO_BEATS = ['S_IDLE', 'S', 'S_IDLE', 'S_TRIGGER'];
	let beat = $state(0);
	let beatTimer: ReturnType<typeof setTimeout> | undefined;
	const nextBeat = () => {
		clearTimeout(beatTimer);
		beatTimer = setTimeout(() => (beat += 1), 650);
	};
	onDestroy(() => clearTimeout(beatTimer));

	const GOLD = 0xffd43b;
	const HOT = 0xff8c1a;
	const JADE = 0x7fe3a4;
	const PANEL_INK = 0x14200c;
	const BODY_FILL = 0xf0e2c8;

	const layout = $derived(context.stateLayoutDerived.mainLayout());

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

	/** 5x5 grid with four cells lit — the Scatter count that opens the feature. */
	const drawScatterGrid = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const cell = Math.min(w / 6.2, h / 6.2);
		const gap = cell * 0.16;
		const span = 5 * (cell + gap) - gap;
		const x0 = (w - span) / 2;
		const y0 = (h - span) / 2;
		// which cells hold a Scatter — spread out, never adjacent, because that is
		// how they actually land and a clustered four reads as a cluster mechanic
		const lit = new Set(['0,1', '1,3', '3,0', '4,2']);
		for (let c = 0; c < 5; c++) {
			for (let r = 0; r < 5; r++) {
				const x = x0 + c * (cell + gap);
				const y = y0 + r * (cell + gap);
				const on = lit.has(`${c},${r}`);
				g.roundRect(x, y, cell, cell, cell * 0.16);
				g.fill({ color: on ? GOLD : 0x2c3a1c, alpha: on ? 0.85 : 0.5 });
				g.roundRect(x, y, cell, cell, cell * 0.16);
				g.stroke({ width: 1.5, color: on ? GOLD : 0x4a5c28, alpha: on ? 0.95 : 0.5 });
			}
		}
	};

	/**
	 * Drawn beside the panel copy, which is
	 * the in-game asset rather than a vector stand-in — the panel the player will
	 * actually see when a reel locks. It is 1:5, so it is sized off the slot's
	 * HEIGHT and the arrow takes the width left over.
	 */
	/** A reel cut down the middle: each cell becomes two. */
	/**
	 * THE STRETCH: five reels standing on a shared floor, the first two grown.
	 *
	 * Three things the picture has to get right, because each is a rule a player
	 * would otherwise have to be told:
	 *
	 *   - the board is BOTTOM-ANCHORED and grows UPWARD. The game draws it that
	 *     way (see reelYOffset in game/constants) and the new cells arrive at the
	 *     top of the reel, so a diagram growing downward or out from the centre
	 *     would contradict the first spin the player sees.
	 *   - the new cells are marked as NEW - hot outline, barely filled - so the
	 *     eye reads "this reel gained rows" rather than "this reel won".
	 *   - growth is LEFT TO RIGHT AND DEPTH FIRST: reel 1 fills to six before
	 *     reel 2 is touched. So the silhouette is a staircase down from the left,
	 *     never a random comb.
	 *
	 * Drawn from config rather than from literals, so the shape cannot disagree
	 * with the board: baseRows is the floor every reel starts at, maxRows the
	 * ceiling reel 1 is shown having reached.
	 */
	const drawStretch = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const base = config.growth.baseRows;
		const max = config.growth.maxRows;
		const cols = config.numReels;
		const bottom = h * 0.92;
		// sized off the TALLEST reel, so the full-height column fits the slot and
		// the baseline ones simply stop short of the top
		const cellH = (bottom - h * 0.08) / max;
		const cw = (w * 0.92) / cols;
		const x0 = w * 0.5 - (cols * cw) / 2;
		// The staircase: reel 1 at full height, reel 2 one row up, the rest at the
		// baseline - exactly what steps 1..3 of the ladder produce.
		const heights = Array.from({ length: cols }, (_, c) =>
			c === 0 ? max : c === 1 ? base + 1 : base,
		);
		heights.forEach((rows, c) => {
			for (let r = 0; r < rows; r++) {
				// r counted from the BOTTOM, which is the direction the reel fills
				const x = x0 + c * cw;
				const y = bottom - (r + 1) * cellH;
				const grown = r >= base;
				g.roundRect(x + 1.5, y + 1.5, cw - 3, cellH - 3, 3);
				g.fill({ color: grown ? HOT : PANEL_INK, alpha: grown ? 0.28 : 0.9 });
				g.roundRect(x + 1.5, y + 1.5, cw - 3, cellH - 3, 3);
				g.stroke({ width: 1.4, color: grown ? HOT : JADE, alpha: grown ? 0.95 : 0.4 });
			}
		});
		// A hot edge around each stretched reel - the same treatment the buy cards
		// use. NOT the game's doubling colour, which is the ice cyan ReelGrow
		// washes a doubling column in: this panel is marking the rows as NEW, and
		// the doubling is a separate rule that only applies in Free Spins.
		heights.forEach((rows, c) => {
			if (rows === base) return;
			g.roundRect(x0 + c * cw, bottom - rows * cellH, cw, rows * cellH, 4);
			g.stroke({ width: 2.5, color: HOT, alpha: 0.95 });
		});
	};

	/** Ways multiplying across reels as more of them stretch. */
	const drawWaysGrow = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const barW = w * 0.13;
		const gap = w * 0.055;
		const baseY = h * 0.86;
		// 1, 2, 4, 8 — in the feature every stretched reel DOUBLES, so the steps
		// double too. A linear ramp would say the multipliers ADD, which is the
		// one thing about ways a player is most likely to get wrong.
		const heights = [0.12, 0.24, 0.48, 0.96];
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

		// Multiplication signs between the bars. Built in a second pass on
		// purpose — fill()/stroke() consume the current path, so interleaving
		// these with the bars would hand each pending cross to the next bar's
		// fill() and paint it as a filled blob instead of a stroke.
		for (let i = 0; i < heights.length - 1; i++) {
			const px = x0 + i * (barW + gap) + barW + gap / 2;
			const py = baseY - h * 0.1;
			const sz = gap * 0.26;
			g.moveTo(px - sz, py - sz);
			g.lineTo(px + sz, py + sz);
			g.moveTo(px + sz, py - sz);
			g.lineTo(px - sz, py + sz);
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
		/** 1:5 panel art, sized off the slot height and pushed to the left of it */
		panelKey?: string;
		hero?: boolean;
	};

	// Bodies are one short sentence each. The first pass ran to two and three
	// sentences and overflowed the panels — the copy is a caption for the art, not
	// the rules screen, which is one tap away and carries the full wording.
	// The FULL board's ways — 6^5 — which is the hero panel's figure.
	//
	// Deliberately NOT config.numRows: that array is the BASELINE board and never
	// leaves 4-flat however tall the reels get, so reading it here would print
	// 1,024 under a panel about a board that grows to six.
	const FULL_WAYS = Math.pow(config.growth.maxRows, config.numReels);

	const panels: Panel[] = [
		{
			accent: GOLD,
			title: 'FREE SPINS',
			body: 'Land 3, 4 or 5 Scatters anywhere to open 8, 10 or 12 Free Spins.',
			figure: '3-5',
			art: drawScatterGrid,
			symbolKey: 'gbS',
		},
		{
			accent: HOT,
			title: 'THE STRETCH',
			// The figure is the DREAM, not the average: every reel at full height is
			// what a feature climbs towards, and it is a number the player can read
			// straight off the board's own silhouette.
			//
			// The body states the two halves separately and in order — taller
			// first, then the doubling — because they are separate effects that
			// multiply, and the doubling is FREE SPINS ONLY. Running them together
			// would promise a base-game double the maths does not pay.
			body: `A gravity charge pulls its reel one row taller, ${config.growth.baseRows} up to ${config.growth.maxRows}, left to right. In Free Spins the taller reels stay for the whole round and every cell on one counts TWICE.`,
			figure: FULL_WAYS.toLocaleString(),
			art: drawStretch,
			hero: true,
		},
		{
			accent: JADE,
			title: 'MAX WIN',
			body: 'The cap on a single round. Reach it and the round ends there and then.',
			// 'X' rather than the multiplication sign, for the same reason the
			// loading tips avoid it: this is set in Titan One and U+00D7 is not in
			// that face's subset.
			figure: `${(config.betModes?.base?.max_win ?? 15000).toLocaleString()}X`,
			art: drawWaysGrow,
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

	// The hero uses the side-by-side arrangement even in the wide layout, because
	// its art is the real 1:5 WILD panel. Sized to a short, wide art slot that
	// panel comes out about 24px across — the character in it is unreadable. Given
	// the full height of the box it is ~60px across and reads properly, and the
	// copy takes the width instead. Its neighbours keep art-above-text; the hero
	// already stands proud of them, so the different shape reads as emphasis.
	const slots = $derived(
		boxes.map((box, i) => {
			if (stacked || panels[i].hero) {
				const artW = box.w * (stacked ? 0.28 : 0.32);
				const textX = box.x + box.w * (stacked ? 0.34 : 0.4);
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
	// at two lines it wasted a line under the short titles, and at one line
	// "GROWING WILDS" — which fits one line in the wide centred panels but wraps
	// in the hero's narrower side-by-side column — printed the body straight
	// through its second line. There is no constant that is right for both, so
	// each panel now reserves exactly what its own title occupies at its own
	// column width.
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
			// Floor at two lines' worth for the hero: its column is the narrow one,
			// and if this measures before the display face has loaded the fallback's
			// narrower metrics would report one line where Titan One needs two.
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
			{#if panel.symbolKey && meshReady}
				<Container>
					{#key beat}
						<SymbolMeshWin
							symbolName={INTRO_BEATS[beat % INTRO_BEATS.length]}
							x={slot.art.w / 2}
							y={slot.art.h / 2}
							size={Math.min(slot.art.w, slot.art.h) * 0.44}
							speed={1}
							oncomplete={nextBeat}
						/>
					{/key}
				</Container>
			{:else if panel.symbolKey}
				<Sprite
					key={panel.symbolKey}
					anchor={0.5}
					x={slot.art.w / 2}
					y={slot.art.h / 2}
					width={Math.min(slot.art.w, slot.art.h) * 0.44}
					height={Math.min(slot.art.w, slot.art.h) * 0.44}
				/>
			{/if}
			{#if panel.panelKey}
				<!-- 1:5 art: driven off the slot height, width follows the ratio. -->
				<Sprite
					key={panel.panelKey}
					anchor={0.5}
					x={slot.art.h / 10 + slot.art.w * 0.04}
					y={slot.art.h / 2}
					width={slot.art.h / 5}
					height={slot.art.h}
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

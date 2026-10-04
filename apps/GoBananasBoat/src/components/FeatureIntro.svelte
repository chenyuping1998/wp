<script lang="ts">
	import { Container, Graphics, Sprite, Text, getContextApp } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import SymbolMeshWin from './SymbolMeshWin.svelte';
	import { CanvasTextMetrics, TextStyle } from 'pixi.js';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';

	import { GAME_FONT, GAME_FONT_WEIGHT, BODY_FONT } from '../game/fonts';
	import { getContext } from '../game/context';
	import config from '../game/config';

	// The three-panel feature card shown once loading reaches 100%.
	//
	// The middle slot is the headline and it is the crates, not the trigger: the
	// split is the only thing here a player of another ways game would not already
	// know. The trigger sits left because it is the familiar half, and the max win
	// sits right because it is the figure players scan for last.
	//
	// Copy is English-only, matching this app's loading tips. TripleWitching
	// localises its equivalent card through game/i18nText; GoBananas has never
	// localised its loading copy, and half-localising it would be worse than
	// either end. Every string avoids the social restricted list by hand —
	// design/check_social_words only scans literal markup, and everything here
	// lives in the script block where it cannot see it.

	const context = getContext();

	// NAVY, BRASS AND SEA — the palette in game/palette.ts, plus the sea-foam the
	// harbour water is drawn in. This card was the jungle's: a mint-jade accent
	// on olive panels, which made the first screen a player sees each session the
	// one screen that belonged to a different game.
	const GOLD = 0xffd43b;
	const HOT = 0xff8c1a;
	const SEA = 0x9bdcea;
	const PANEL_INK = 0x0f1b24;
	const CELL_OFF = 0x22323d;
	const CELL_EDGE = 0x3e5a6e;
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

	/**
	 * This game's board — 5 reels of 4 — with three Scatters lit, the ordinary
	 * way in. It was a 5x5 grid with four lit: the board of the lines game this
	 * card was forked from, and a count that is not the one that opens anything.
	 */
	const drawScatterGrid = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const cols = 5;
		const rows = 4;
		const cell = Math.min(w / 6.2, h / 5.2);
		const gap = cell * 0.16;
		const spanX = cols * (cell + gap) - gap;
		const spanY = rows * (cell + gap) - gap;
		const x0 = (w - spanX) / 2;
		const y0 = (h - spanY) / 2;
		// which cells hold a Scatter — spread out, never adjacent, because that is
		// how they actually land and a clustered group reads as a cluster mechanic
		const lit = new Set(['0,1', '2,3', '4,0']);
		for (let c = 0; c < cols; c++) {
			for (let r = 0; r < rows; r++) {
				const x = x0 + c * (cell + gap);
				const y = y0 + r * (cell + gap);
				const on = lit.has(`${c},${r}`);
				g.roundRect(x, y, cell, cell, cell * 0.16);
				g.fill({ color: on ? GOLD : CELL_OFF, alpha: on ? 0.85 : 0.6 });
				g.roundRect(x, y, cell, cell, cell * 0.16);
				g.stroke({ width: 1.5, color: on ? GOLD : CELL_EDGE, alpha: on ? 0.95 : 0.6 });
			}
		}
	};

	/**
	 * Crates scattered across the board, all lit the same.
	 *
	 * The picture has to say ONE thing: several cells, wherever they fall, turn
	 * out to be the same cargo. So the lit cells are deliberately NOT a column —
	 * the art this replaced filled one column because the mechanic it described
	 * blew up one reel, and reusing that shape would tell the player the crates
	 * arrive by the reel, which is the one thing they do not do.
	 */
	const drawCrates = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const top = h * 0.12;
		const bottom = h * 0.9;
		const rows = 4;
		const cellH = (bottom - top) / rows;
		const cols = 5;
		const cw = (w * 0.9) / cols;
		const x0 = w * 0.5 - (cols * cw) / 2;
		// Scattered, and stacked where they land — two on one reel, two on
		// another, which is the shape the strips actually produce.
		const crates = new Set(['0,1', '0,2', '2,0', '3,2', '3,3']);
		for (let c = 0; c < cols; c++) {
			for (let r = 0; r < rows; r++) {
				const x = x0 + c * cw;
				const y = top + r * cellH;
				g.roundRect(x + 1.5, y + 1.5, cw - 3, cellH - 3, 3);
				if (crates.has(`${c},${r}`)) {
					g.fill({ color: GOLD, alpha: 0.85 });
				} else {
					g.fill({ color: PANEL_INK, alpha: 0.9 });
					g.roundRect(x + 1.5, y + 1.5, cw - 3, cellH - 3, 3);
					g.stroke({ width: 1.4, color: CELL_EDGE, alpha: 0.7 });
				}
			}
		}
		// A hot edge around each crate, the same treatment the buy cards use.
		for (const cell of crates) {
			const [c, r] = cell.split(',').map(Number);
			g.roundRect(x0 + c * cw + 1.5, top + r * cellH + 1.5, cw - 3, cellH - 3, 3);
			g.stroke({ width: 2, color: HOT, alpha: 0.95 });
		}
	};

	/**
	 * Wins climbing to a ceiling.
	 *
	 * This panel used to show bars doubling with multiplication signs between
	 * them — "ways multiplying as more reels are cut", the machete split of the
	 * game this was forked from. That mechanic is gone and the panel is about the
	 * cap, so the picture is the cap: four rising stacks and the last one
	 * reaching a line it does not cross.
	 */
	const drawMaxWin = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const barW = w * 0.13;
		const gap = w * 0.06;
		const baseY = h * 0.88;
		const capY = h * 0.14;
		const heights = [0.22, 0.42, 0.66, 1];
		const totalW = heights.length * barW + (heights.length - 1) * gap;
		const x0 = (w - totalW) / 2;
		heights.forEach((f, i) => {
			const bh = (baseY - capY) * f;
			const x = x0 + i * (barW + gap);
			g.roundRect(x, baseY - bh, barW, bh, barW * 0.22);
			g.fill({ color: SEA, alpha: 0.16 + i * 0.14 });
			g.roundRect(x, baseY - bh, barW, bh, barW * 0.22);
			g.stroke({ width: 2, color: SEA, alpha: 0.5 + i * 0.14 });
		});
		// the ceiling: a brass line the tallest stack stops dead against
		g.moveTo(x0 - gap * 0.6, capY);
		g.lineTo(x0 + totalW + gap * 0.6, capY);
		g.stroke({ width: 3, color: GOLD, alpha: 0.95, cap: 'round' });
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
	// 4 rows on 5 reels is 1,024 ways, which is also exactly what a full board of
	// one cargo pays on: every cell the same symbol means every reel contributes
	// all four of its rows. Derived rather than typed, because the board size
	// comes from the maths config.
	const BASE_WAYS = (config.numRows ?? []).reduce((a: number, b: number) => a * b, 1);

	const panels: Panel[] = [
		{
			accent: GOLD,
			title: 'FREE SPINS',
			body: 'Land 3, 4 or 5 Scatters anywhere to open 8, 10 or 12 Free Spins, each round with an x1 to x5 multiplier.',
			figure: '3-5',
			art: drawScatterGrid,
			symbolKey: 'gbS',
		},
		{
			accent: HOT,
			title: 'CARGO CRATES',
			// The figure is the DREAM, not the average: a whole board of one cargo
			// is what the round loads towards, and it is a count the player can
			// verify on the board the first time it happens.
			// "an opened crate stays open" went with the sticky hold. What replaced
			// it is the Full Shipment, and that is the thing worth a line here.
			body: `Every crate on the board holds the same cargo. In Free Spins the whole round shares one shipment, and a Full Shipment can fill the board with crates.`,
			figure: BASE_WAYS.toLocaleString(),
			art: drawCrates,
			hero: true,
		},
		{
			accent: SEA,
			title: 'MAX WIN',
			body: 'The cap on a single round. Reach it and the round ends there and then.',
			figure: `${(config.betModes?.base?.max_win ?? 10000).toLocaleString()}X`,
			art: drawMaxWin,
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

	// ── THE CARDS HANG AND THE ART ACTS (2026-10-02) ────────────────────────
	//
	// The three cards drop in one after another and are caught short, a little
	// past their place, as if hung — a bounce, then each sways on its own slow
	// clock about the middle of its top edge. And the art on them is the game's
	// own acting: the Scatter on the first card plays its win every few
	// seconds; the second card carries a crate whose tarp heaves the way every
	// crate does before a Full Shipment unload (mReveal.ts M_HEAVE).
	const app = getContextApp();
	let t = $state(0);
	let cycle = $state(0);
	onMount(() => {
		const ticker = app.stateApp.pixiApplication?.ticker;
		const t0 = performance.now();
		const tick = () => (t = performance.now() - t0);
		ticker?.add(tick);
		// the art's own clock: a fresh act every 2.8s, first one once the cards are in
		const first = setTimeout(() => (cycle = 1), 900);
		const loop = setInterval(() => (cycle += 1), 2800);
		return () => {
			ticker?.remove(tick);
			clearTimeout(first);
			clearInterval(loop);
		};
	});
	const DROP_MS = 380;
	const DROP_GAP = 130;
	const hang = (i: number) => {
		const h = boxes[i]?.h ?? 0;
		const local = t - i * DROP_GAP;
		if (local < DROP_MS) {
			const p = Math.max(0, local) / DROP_MS;
			return { dy: -layout.height * 0.9 * (1 - p * p) + h * 0.04 * p * p, rot: 0, alpha: local < 0 ? 0 : 1 };
		}
		const c = local - DROP_MS;
		return {
			dy: h * 0.04 * Math.exp(-c / 120) * Math.cos((2 * Math.PI * c) / 260),
			rot: 0.022 * Math.exp(-c / 900) * Math.sin((2 * Math.PI * c) / 1400) + 0.0045 * Math.sin((2 * Math.PI * c) / (3100 + i * 470) + i),
			alpha: 1,
		};
	};

	const drawCardChrome = (g: PixiGraphics, i: number) => {
		g.clear();
		{
			const box = boxes[i];
			const accent = panels[i].accent;
			const c = Math.min(box.w, box.h) * 0.07;
			chamfer(g, box.x, box.y, box.w, box.h, c);
			g.fill({ color: PANEL_INK, alpha: 0.94 });
			chamfer(g, box.x, box.y, box.w, box.h, c);
			g.stroke({ width: 3, color: accent, alpha: 0.85 });
			g.roundRect(box.x + box.w * 0.07, box.y + box.h * 0.045, box.w * 0.86, 4, 2);
			g.fill({ color: accent, alpha: 0.9 });
		}
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
	{#each panels as panel, i (i)}
		{@const box = boxes[i]}
		{@const slot = slots[i]}
		{@const hung = hang(i)}
		{@const art = Math.min(slot.art.w, slot.art.h) * 0.44}
		<!-- hung by the middle of its top edge: turned about it, everything
		     inside still laid out in the menu's own coordinates -->
		<Container x={box.x + box.w / 2} y={box.y + hung.dy} rotation={hung.rot} alpha={hung.alpha}>
		<Container x={-(box.x + box.w / 2)} y={-box.y}>
		<Graphics draw={(g) => drawCardChrome(g, i)} />
		<Container x={slot.art.x} y={slot.art.y}>
			<Graphics draw={(g) => panel.art(g, slot.art.w, slot.art.h)} />
			{#if panel.symbolKey}
				<!-- the Scatter, acting its win on the art's clock -->
				<Container x={slot.art.w / 2} y={slot.art.h / 2}>
					{#if cycle === 0}
						<Sprite key={panel.symbolKey} anchor={0.5} width={art} height={art} />
					{:else}
						{#key cycle}
							<SymbolMeshWin symbolName="S" width={art} height={art} />
						{/key}
					{/if}
				</Container>
			{/if}
			{#if panel.hero}
				<!-- a crate, heaving like the cargo is shoving under it -->
				<Container x={slot.art.w / 2} y={slot.art.h / 2}>
					<Sprite key="gbM" anchor={0.5} width={art * 0.9} height={art * 0.9} />
					{#if cycle > 0}
						{#key cycle}
							<Container>
								<SymbolMeshWin heave symbolName="M" width={art * 0.9} height={art * 0.9} />
							</Container>
						{/key}
					{/if}
				</Container>
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
		</Container>
		</Container>
	{/each}
</MainContainer>

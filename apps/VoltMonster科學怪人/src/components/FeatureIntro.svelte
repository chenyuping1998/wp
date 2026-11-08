<script lang="ts">
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle } from 'pixi.js';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';

	import { GAME_FONT, GAME_FONT_WEIGHT, BODY_FONT } from '../game/fonts';
	import { getContext } from '../game/context';
	import config from '../game/config';

	// The three-panel feature card shown once loading reaches 100%.
	//
	// The middle slot is the headline and it is the Volt Meter, not the trigger:
	// the climbing multiplier is the thing a player of another lines game would not
	// already know. The trigger sits left because it is the familiar half, and the
	// Tesla Wheel sits right because its max is the figure players scan for last.
	//
	// Copy is English-only, matching this app's loading tips. TripleWitching
	// localises its equivalent card through game/i18nText; GoBananas has never
	// localised its loading copy, and half-localising it would be worse than
	// either end. Every string avoids the social restricted list by hand —
	// design/check_social_words only scans literal markup, and everything here
	// lives in the script block where it cannot see it.

	const context = getContext();

	// VOLT_ART_REQUIREMENTS §0.3: slate, copper and electric cyan.
	const GOLD = 0xf5c518;
	const TURQ = 0x4ff0c8;
	const SAND = 0xc47a3a;
	const CARMINE = 0xc8443a;
	const PANEL_INK = 0x1b2430;
	const CELL_OFF = 0x1b4651;
	const BODY_FILL = 0xe6f2f1;

	const layout = $derived(context.stateLayoutDerived.mainLayout());

	// Three columns need width. On portrait and square boxes they are too narrow
	// to hold a sentence, so the panels stack into rows and the art moves beside
	// the text instead of above it.
	const stacked = $derived(layout.width / layout.height < 1.2);

	const AREA = $derived({
		top: layout.height * (stacked ? 0.27 : 0.34),
		bottom: layout.height * (stacked ? 0.86 : 0.84),
		left: layout.width * (stacked ? 0.07 : 0.13),
		right: layout.width * (stacked ? 0.93 : 0.87),
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
				g.fill({ color: on ? GOLD : CELL_OFF, alpha: on ? 0.85 : 0.6 });
				g.roundRect(x, y, cell, cell, cell * 0.16);
				g.stroke({ width: 1.5, color: on ? GOLD : SAND, alpha: on ? 0.95 : 0.35 });
			}
		}
	};

	// Illustrated Volt hardware: design/source/volt_delivery.
	/** The Volt Meter: a half arch of seven tiles on a plate, the top tile lit. */
	const drawArch = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const cx = w * 0.5;
		const cy = h * 0.9;
		const rOut = Math.min(w * 0.46, h * 0.8);
		const rIn = rOut * 0.69;
		const n = 7;
		const step = Math.PI / n;
		for (let i = 0; i < n; i++) {
			const a0 = Math.PI - i * step - 0.02;
			const a1 = Math.PI - (i + 1) * step + 0.02;
			const lit = i === 3;
			g.moveTo(cx + Math.cos(a0) * rOut, cy - Math.sin(a0) * rOut);
			g.arc(cx, cy, rOut, -a0, -a1, false);
			g.lineTo(cx + Math.cos(a1) * rIn, cy - Math.sin(a1) * rIn);
			g.arc(cx, cy, rIn, -a1, -a0, true);
			g.closePath();
			g.fill({ color: lit ? TURQ : CELL_OFF, alpha: 0.92 });
		}
		g.arc(cx, cy, rOut, Math.PI, 0);
		g.stroke({ width: 2, color: SAND, alpha: 0.7 });
		g.circle(cx, cy, rIn * 0.78);
		g.fill({ color: PANEL_INK, alpha: 1 });
		g.circle(cx, cy, rIn * 0.78);
		g.stroke({ width: 2.5, color: TURQ, alpha: 0.9 });
		// the fixed pointer over the lit tile
		g.moveTo(cx, cy - rOut + 2);
		g.lineTo(cx - rOut * 0.08, cy - rOut - rOut * 0.16);
		g.lineTo(cx + rOut * 0.08, cy - rOut - rOut * 0.16);
		g.closePath();
		g.fill({ color: CARMINE, alpha: 0.95 });
	};

	/** The Tesla Wheel: twelve wedges, LEVEL UP on top, the needle from the hub. */
	const drawSun = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const cx = w * 0.5;
		const cy = h * 0.52;
		const r = Math.min(w, h) * 0.4;
		const seg = (Math.PI * 2) / 12;
		for (let i = 0; i < 12; i++) {
			const a0 = -Math.PI / 2 + (i - 0.5) * seg;
			g.moveTo(cx, cy);
			g.arc(cx, cy, r, a0, a0 + seg);
			g.closePath();
			g.fill({ color: i === 0 ? TURQ : i === 6 ? GOLD : i % 2 ? PANEL_INK : CELL_OFF, alpha: 0.92 });
		}
		g.circle(cx, cy, r * 1.06);
		g.stroke({ width: 3, color: GOLD, alpha: 0.85 });
		const na = -Math.PI / 2 + seg * 0.15;
		g.moveTo(cx + Math.cos(na) * r * 0.78, cy + Math.sin(na) * r * 0.78);
		g.lineTo(cx + Math.cos(na + Math.PI / 2) * r * 0.07, cy + Math.sin(na + Math.PI / 2) * r * 0.07);
		g.lineTo(cx + Math.cos(na - Math.PI / 2) * r * 0.07, cy + Math.sin(na - Math.PI / 2) * r * 0.07);
		g.closePath();
		g.fill({ color: CARMINE, alpha: 0.95 });
		g.circle(cx, cy, r * 0.14);
		g.fill({ color: GOLD, alpha: 1 });
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

	// Bodies are one short sentence each — the copy is a caption for the art,
	// not the rules screen, which is one tap away and carries the full wording.
	const cfg = config as unknown as {
		scatterSpins?: Record<string, number>;
		fgWheelValues: number[];
		rouletteSegments: Record<number, (number | 'UP')[]>;
	};
	const spins = Object.values(cfg.scatterSpins ?? { 3: 10, 4: 12, 5: 15 }).join(', ');
	const wheelTop = Math.max(...cfg.fgWheelValues);
	const sunTop = Math.max(
		...Object.values(cfg.rouletteSegments).flatMap((s) => s.filter((v): v is number => v !== 'UP')),
	);

	const panels: Panel[] = [
		{
			accent: SAND,
			title: 'FREE SPINS',
			body: `3 / 4 / 5 Scatters award ${spins} Free Spins.`,
			figure: '3-5',
			art: drawScatterGrid,
			symbolKey: 'gbS',
		},
		{
			accent: TURQ,
			title: 'VOLT METER',
			body: 'Winning free spins turn the meter. The highest multiplier stays.',
			figure: `${wheelTop}X`,
			art: drawArch,
			hero: true,
		},
		{
			accent: GOLD,
			title: 'TESLA WHEEL',
			body: 'May appear after a base round. LEVEL UP reaches four tiers.',
			figure: `${sunTop.toLocaleString()}X`,
			art: drawSun,
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

	// Wide: art above centred text in all three cards (the hero used to sit side
	// by side for GoBoomana's 1:5 Wild panel art; the Scarab arch is wide, so it
	// takes the same shape as its neighbours and only stands a little taller).
	// Stacked: art beside the text.
	const slots = $derived(
		boxes.map((box, i) => {
			if (stacked) {
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

	const titleSize = $derived(Math.round(stacked ? layout.width * 0.04 : layout.width * 0.02));
	const bodySize = $derived(Math.round(stacked ? layout.width * 0.032 : layout.width * 0.0135));
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
			// floor at one line, in case this measures before the display face loads
			const floor = titleSize * 1.2;
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
			{@const size = Math.min(slot.art.w,slot.art.h)*.9}
            {#if i===1}
                <Sprite key="mummyArch" x={slot.art.w/2} y={slot.art.h*.7} anchor={{x:.5,y:1}} width={size} height={size*.54}/>
                <Sprite key="mummyPlate" x={slot.art.w/2} y={slot.art.h*.7} anchor={.5} width={size*.36} height={size*.36}/>
            {:else}
                <Sprite key={i===0?"gbS":"mummySunDisc1"} x={slot.art.w/2} y={slot.art.h/2} anchor={.5} width={size} height={size}/>
                {#if i===2}<Sprite key="mummySunRing" x={slot.art.w/2} y={slot.art.h/2} anchor={.5} width={size*1.07} height={size*1.07}/>{/if}
            {/if}
		</Container>

		<!-- The figure sits ABOVE the title in the wide columns. Stacked (portrait,
		     square), the rows are too short for that: it was pushed up onto the
		     accent rule at the top of the card and read as struck through. There
		     it goes on the title's own line, right-aligned in the text column. -->
		<Text
			text={panel.figure}
			anchor={stacked ? { x: 1, y: 0 } : { x: slot.centred ? 0.5 : 0, y: 1 }}
			x={stacked ? slot.text.x + slot.text.w : slot.centred ? box.x + box.w / 2 : slot.text.x}
			y={stacked ? slot.text.titleY : slot.text.titleY - titleSize * 0.85}
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

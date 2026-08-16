<script lang="ts">
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';

	import { BODY_FONT, displayFontFor, displayWeightFor, titleFontFor } from '../game/fonts';
	import { gameText } from '../game/i18nText';
	import { getContext } from '../game/context';

	/**
	 * The three-panel feature card shown once loading reaches 100%.
	 *
	 * The loading screen already cycles one-line tips, but a tip only exists for
	 * three seconds and a player who arrives mid-rotation sees a third of the
	 * game explained. This says the whole thing at once, and it is the last thing
	 * on screen before the board, so it is what a player carries in.
	 *
	 * Order is deliberate and the middle slot is the headline: how you get into
	 * the feature. Cluster pays sits left because it is what every spin does, and
	 * the heat grid sits right because it only exists once you are inside. The
	 * centre panel is drawn taller and in the hottest accent so the eye lands
	 * there first.
	 *
	 * Every readable string comes from game/i18nText and is set in GAME_FONT,
	 * which check_font_coverage holds to "fully covered or cleanly absent" for
	 * every locale — see design/check_font_coverage.mjs. Body copy uses the system
	 * stack because it is set small, and the generated faces close up under about
	 * 15px.
	 */
	const context = getContext();

	// Pulled from the forge palette the rest of the game uses. Ember for the two
	// outer panels, white-hot for the hero, so the centre reads as the hottest
	// thing on the card without needing to be bigger still.
	const EMBER = 0xff8a2b;
	const HOT = 0xffd35e;
	const BRASS = 0xd8a334;
	const INK = 0x140a06;
	const BODY_FILL = 0xf2e2cb;

	const layout = $derived(context.stateLayoutDerived.mainLayout());

	// Three columns need width. The portrait box is tall and narrow, and on it
	// three columns are too thin to hold a sentence of German or Russian, so the
	// panels stack into rows and the art moves beside the text.
	const stacked = $derived(layout.width / layout.height < 1.2);

	// Sits under the title block (which ends around 0.36 + the subtitle) and above
	// the "press anywhere" prompt along the foot.
	const AREA = $derived({
		top: layout.height * 0.46,
		bottom: layout.height * 0.86,
		left: layout.width * 0.11,
		right: layout.width * 0.89,
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
	 * A 7x7 board with one cluster lit and its neighbours cold.
	 *
	 * The lit shape is a fixed, hand-picked blob rather than a rectangle: a
	 * cluster game's whole point is that a win is not a line or a block, and a
	 * neat 2x3 would say the opposite of what the panel is explaining.
	 */
	const CLUSTER = [
		[2, 1], [3, 1],
		[1, 2], [2, 2], [3, 2], [4, 2],
		[2, 3], [3, 3],
		[3, 4],
	];
	const drawCluster = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const n = 7;
		const cell = Math.min(w, h) / (n + 0.8);
		const gap = cell * 0.12;
		const grid = n * (cell + gap) - gap;
		const x0 = (w - grid) / 2;
		const y0 = (h - grid) / 2;
		const lit = new Set(CLUSTER.map(([c, r]) => `${c},${r}`));

		for (let r = 0; r < n; r += 1) {
			for (let c = 0; c < n; c += 1) {
				const x = x0 + c * (cell + gap);
				const y = y0 + r * (cell + gap);
				const on = lit.has(`${c},${r}`);
				g.roundRect(x, y, cell, cell, cell * 0.2);
				g.fill({ color: on ? EMBER : 0x2a1a12, alpha: on ? 0.55 : 0.75 });
				g.roundRect(x, y, cell, cell, cell * 0.2);
				g.stroke({ width: on ? 2 : 1, color: on ? HOT : 0x4a3226, alpha: on ? 0.95 : 0.6 });
			}
		}
	};

	/**
	 * A cell heating through a run: three tiles left to right, each hotter and
	 * carrying a higher figure. The numbers are drawn as bars rather than typed,
	 * because Text inside a Graphics callback is not a thing and three more Text
	 * nodes for decoration is not worth it.
	 */
	const drawHeat = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const steps = 3;
		const cell = Math.min(w / (steps + 1.4), h * 0.5);
		const gap = cell * 0.42;
		const total = steps * cell + (steps - 1) * gap;
		const x0 = (w - total) / 2;
		const y = (h - cell) / 2;

		for (let i = 0; i < steps; i += 1) {
			const x = x0 + i * (cell + gap);
			const t = (i + 1) / steps;
			// bloom under the hotter cells
			if (i > 0) {
				g.circle(x + cell / 2, y + cell / 2, cell * (0.6 + t * 0.25));
				g.fill({ color: EMBER, alpha: 0.07 * t });
			}
			g.roundRect(x, y, cell, cell, cell * 0.2);
			g.fill({ color: EMBER, alpha: 0.2 + t * 0.42 });
			g.roundRect(x, y, cell, cell, cell * 0.2);
			g.stroke({ width: 2, color: HOT, alpha: 0.5 + t * 0.45 });

			// tally bars inside the cell: one, two, three
			const barW = cell * 0.5;
			const barH = cell * 0.08;
			for (let b = 0; b <= i; b += 1) {
				g.roundRect(
					x + (cell - barW) / 2,
					y + cell * 0.62 - b * barH * 2,
					barW,
					barH,
					barH / 2,
				);
			}
			g.fill({ color: 0xfff3d8, alpha: 0.9 });

			// the arrow on to the next cell
			if (i < steps - 1) {
				const ax = x + cell + gap * 0.5;
				const ay = y + cell / 2;
				g.moveTo(ax - gap * 0.22, ay);
				g.lineTo(ax + gap * 0.22, ay);
				g.moveTo(ax + gap * 0.06, ay - gap * 0.16);
				g.lineTo(ax + gap * 0.22, ay);
				g.lineTo(ax + gap * 0.06, ay + gap * 0.16);
				g.stroke({ width: 2, color: BRASS, alpha: 0.9 });
			}
		}
	};

	/** Backing glow for the hero panel's Scatter. */
	const drawScatterGlow = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const r = Math.min(w, h) * 0.34;
		g.circle(w / 2, h / 2, r * 1.4);
		g.fill({ color: EMBER, alpha: 0.1 });
		g.circle(w / 2, h / 2, r);
		g.fill({ color: HOT, alpha: 0.14 });
	};

	const panels = $derived<Panel[]>([
		{
			accent: BRASS,
			title: gameText('introClusterTitle'),
			body: gameText('introClusterBody'),
			art: drawCluster,
			figure: '5+',
		},
		{
			accent: HOT,
			title: gameText('freeSpins'),
			body: gameText('introTriggerBody'),
			art: drawScatterGlow,
			symbolKey: 'efS',
			// Figures, not words: readable in every locale and the one thing a
			// player can act on. The body copy carries 10-18 in their language.
			figure: '4+',
			hero: true,
		},
		{
			accent: EMBER,
			title: gameText('introHeatTitle'),
			body: gameText('introHeatBody'),
			art: drawHeat,
			figure: '+1x',
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
			return { x: AREA.left + i * (w + gap), y: AREA.top - grow, w, h: areaH + grow * 2 };
		});
	});

	// Cut corners rather than rounded ones — the same chamfer the iron plates and
	// the reel housing use, so the card belongs to the same object as the game.
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
			g.fill({ color: INK, alpha: 0.9 });
			chamfer(g, box.x, box.y, box.w, box.h, c);
			g.stroke({ width: 3, color: accent, alpha: 0.8 });
			// hot bar across the head
			g.roundRect(box.x + box.w * 0.07, box.y + box.h * 0.045, box.w * 0.86, 4, 2);
			g.fill({ color: accent, alpha: 0.9 });
		});
	};

	// Where the art sits inside a panel, and where the text starts. Stacked panels
	// put the art beside the text instead of above it — a full-width row with the
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

	// The body is placed below a title slot two lines deep, ALWAYS, rather than
	// below the title's measured height. Titles wrap on the long locales — Russian
	// sets "ВЫИГРЫШИ КЛАСТЕРОМ" over two lines where English sets "CLUSTER WINS"
	// over one — and a single-line offset would put the body straight through the
	// second line. Reserving the space unconditionally costs one line of air on
	// the short locales and cannot collide on any of them.
	const TITLE_LINES = 2;

	const titleSize = $derived(Math.round(stacked ? layout.width * 0.034 : layout.width * 0.023));
	const bodySize = $derived(Math.round(stacked ? layout.width * 0.025 : layout.width * 0.0148));
	const figureSize = $derived(Math.round(layout.width * 0.03));
</script>

<MainContainer>
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
					width={Math.min(slot.art.w, slot.art.h) * 0.66}
					height={Math.min(slot.art.w, slot.art.h) * 0.66}
				/>
			{/if}
		</Container>

		{#if panel.figure}
			<!--
				The figures are ASCII only (5+, 4+, +1x) so the carved display face can
				set them in every locale. That is deliberate: an arrow or a multiplication
				sign here would fall out of the generated subset and arrive from whatever
				the browser picked instead, which is exactly the mismatch
				check_font_coverage exists to prevent.
			-->
			<Text
				text={panel.figure}
				anchor={{ x: slot.centred ? 0.5 : 0, y: 1 }}
				x={slot.centred ? box.x + box.w / 2 : slot.text.x}
				y={slot.text.titleY - titleSize * 0.9}
				style={{
					// Always resolves to the carved face in practice — these are ASCII —
					// but routed through the same helper as everything else so the rule
					// has no exceptions to remember.
					fontFamily: titleFontFor(panel.figure),
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
				// Not GAME_FONT directly: the Polish and Vietnamese titles carry
				// characters the generated faces do not have (Ż, Ớ, Ệ), and naming the
				// face would set the rest of the word in it and let those single
				// letters arrive from a fallback. See fonts.displayFontFor.
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

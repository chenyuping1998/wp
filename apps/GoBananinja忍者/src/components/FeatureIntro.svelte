<script lang="ts">
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle } from 'pixi.js';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';
	import { onMount } from 'svelte';

	import { GAME_FONT, GAME_FONT_WEIGHT, BODY_FONT } from '../game/fonts';
	import { getContext } from '../game/context';
	import config from '../game/config';

	// The three-panel feature card shown once loading reaches 100%.
	//
	// The middle slot is the headline and it is the Machete, not the trigger: the
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

	const GOLD = 0xd9b978;
	const HOT = 0xbf3e4b;
	const JADE = 0x829eb5;
	const PANEL_INK = 0x101a2a;
	const BODY_FILL = 0xf2dcc0;

	// Boat's three suspended cards, with a restrained settling motion. Each
	// panel enters after the previous one so the feature order is readable.
	let elapsed = $state(0);
	onMount(() => {
		const start = performance.now();
		let frame = 0;
		const step = () => {
			elapsed = performance.now() - start;
			if (elapsed < 1100) frame = requestAnimationFrame(step);
		};
		frame = requestAnimationFrame(step);
		return () => cancelAnimationFrame(frame);
	});
	const hang = (i: number) => {
		const local = elapsed - i * 115;
		if (local <= 0) return { y: -layout.height * 0.7, rotation: 0, alpha: 0 };
		if (local < 370) {
			const p = local / 370;
			return { y: -layout.height * 0.7 * (1 - p) * (1 - p), rotation: -0.025 * (1 - p), alpha: 1 };
		}
		const settle = local - 370;
		return { y: Math.cos(settle / 65) * Math.exp(-settle / 170) * 9, rotation: Math.sin(settle / 100) * Math.exp(-settle / 230) * 0.012, alpha: 1 };
	};

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

	// ── illustrations: the game's own symbols (2026-10-16) ─────────────────
	//
	// These were vector stand-ins — a grid of flat squares, four boxes with two
	// red dots each, a bar chart — and they read as placeholder art, which is
	// what a reviewer files as "low quality asset". Every card now shows the
	// actual symbols the player will meet: three Scatters fanned like a hand of
	// cards, the katana beside the twin tile its cut makes, the Wild.
	//
	// Positions are fractions of the art slot; size is a fraction of the slot's
	// shorter side, so the same arrangement works in the wide and stacked
	// layouts.
	type Piece = { key: string; x: number; y: number; size: number; rotation?: number };
	const SCATTER_FAN: Piece[] = [
		{ key: 'gbS', x: 0.27, y: 0.56, size: 0.66, rotation: -0.16 },
		{ key: 'gbS', x: 0.73, y: 0.56, size: 0.66, rotation: 0.16 },
		{ key: 'gbS', x: 0.5, y: 0.5, size: 0.84 },
	];
	const SLASH: Piece[] = [
		{ key: 'gbM', x: 0.25, y: 0.5, size: 0.78 },
		{ key: 'gbH1Split', x: 0.74, y: 0.5, size: 0.8 },
	];
	const WILD: Piece[] = [{ key: 'gbW', x: 0.5, y: 0.5, size: 0.96 }];

	/** a small brass chevron between the katana and what it makes */
	const drawArrow = (g: PixiGraphics, w: number, h: number) => {
		g.clear();
		const x = w * 0.495, y = h * 0.5, s = Math.min(w, h) * 0.07;
		g.moveTo(x - s * 0.6, y - s).lineTo(x + s * 0.5, y).lineTo(x - s * 0.6, y + s);
		g.stroke({ width: Math.max(2, s * 0.32), color: GOLD, alpha: 0.95, cap: 'round', join: 'round' });
	};
	const noArt = (g: PixiGraphics) => g.clear();

	type Panel = {
		accent: number;
		title: string;
		body: string;
		figure: string;
		art: (g: PixiGraphics, w: number, h: number) => void;
		pieces: Piece[];
		hero?: boolean;
	};

	// Bodies are one short sentence each. The first pass ran to two and three
	// sentences and overflowed the panels — the copy is a caption for the art, not
	// the rules screen, which is one tap away and carries the full wording.
	// 4 rows on 5 reels is 1,024 ways; one split reel counts 8 down its column
	// instead of 4, so it is 2,048. Derived rather than typed, because the board
	// size comes from the maths config and has changed once already.
	const BASE_WAYS = (config.numRows ?? []).reduce((a: number, b: number) => a * b, 1);
	const SPLIT_WAYS = BASE_WAYS * 2;

	const panels: Panel[] = [
		{
			accent: GOLD,
			title: 'FREE SPINS',
			body: 'Land 3, 4 or 5 Scatters anywhere to open 8, 10 or 12 Free Spins.',
			figure: '3-5',
			art: noArt,
			pieces: SCATTER_FAN,
		},
		{
			accent: HOT,
			title: 'NINJA SLASH',
			// The figure is a WAYS COUNT, not a multiplier.
			//
			// It read 'X2', which in a slot means "your win is doubled" — and this
			// doubles the WAYS, which is a different and much smaller promise on most
			// boards. A player who reads X2 as a payout multiplier has been told
			// something untrue by the card that exists to teach them the mechanic.
			//
			// A count cannot be misread that way, and the body names both ends of it
			// so the number is anchored rather than floating.
			body: `The M slash reveals twin symbols. ${BASE_WAYS.toLocaleString()} ways becomes ${SPLIT_WAYS.toLocaleString()} ways on that reel.`,
			figure: SPLIT_WAYS.toLocaleString(),
			art: drawArrow,
			pieces: SLASH,
			hero: true,
		},
		{
			accent: JADE,
			title: 'MAX WIN',
			body: 'Ways multiply across reels. In Free Spins, splits stick.',
			figure: `${(config.betModes?.base?.max_win ?? 10000).toLocaleString()}X`,
			art: noArt,
			pieces: WILD,
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

	const drawPanelChrome = (g: PixiGraphics, i: number) => {
		g.clear();
		{
			const box = boxes[i];
			const accent = panels[i].accent;
			const c = Math.min(box.w, box.h) * 0.07;
			chamfer(g, box.x, box.y, box.w, box.h, c);
			g.fill({ color: PANEL_INK, alpha: 0.94 });
			chamfer(g, box.x, box.y, box.w, box.h, c);
			g.stroke({ width: 2.5, color: accent, alpha: 0.9 });
			// An inset brass keyline gives the card the same framed, lacquered
			// construction as the Boat intro, in the ninja palette.
			chamfer(g, box.x + 5, box.y + 5, box.w - 10, box.h - 10, c * 0.65);
			g.stroke({ width: 1, color: GOLD, alpha: 0.42 });
			g.roundRect(box.x + box.w * 0.07, box.y + box.h * 0.045, box.w * 0.86, 4, 2);
			g.fill({ color: accent, alpha: 0.9 });
		}
	};

	// Every card is art above text in the wide layout. (The hero used to put a
	// tall 1:5 panel beside its copy; with symbol art it is the same shape as
	// its neighbours, and only stands a little proud of them.) The stacked
	// layout keeps art beside text, because the rows are short.
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
				art: { x: box.x + box.w * 0.08, y: box.y + box.h * 0.07, w: box.w * 0.84, h: box.h * 0.31 },
				text: { x: box.x + box.w * 0.08, w: box.w * 0.84, titleY: box.y + box.h * 0.56 },
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
			const floor = panel.hero && stacked ? titleSize * 2.4 : titleSize * 1.2;
			return Math.max(measured, floor) + bodySize * 0.5;
		}),
	);
</script>

<MainContainer>
	{#each panels as panel, i (i)}
		{@const box = boxes[i]}
		{@const slot = slots[i]}
		{@const motion = hang(i)}
		<Container x={box.x + box.w / 2} y={box.y + motion.y} rotation={motion.rotation} alpha={motion.alpha}>
		<Container x={-(box.x + box.w / 2)} y={-box.y}>
		<Graphics draw={(g) => drawPanelChrome(g, i)} />
		<Container x={slot.art.x} y={slot.art.y}>
			<Graphics draw={(g) => panel.art(g, slot.art.w, slot.art.h)} />
			{#each panel.pieces as piece, k (k)}
				{@const side = Math.min(slot.art.w, slot.art.h) * piece.size}
				<Sprite
					key={piece.key}
					anchor={0.5}
					x={slot.art.w * piece.x}
					y={slot.art.h * piece.y}
					rotation={piece.rotation ?? 0}
					width={side}
					height={side}
				/>
			{/each}
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

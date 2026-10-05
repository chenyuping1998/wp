<script lang="ts">
	import { stateReplay, stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Graphics, Rectangle, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import ButtonReplay from './ButtonReplay.svelte';
	import LabelReplayMultiplier from './LabelReplayMultiplier.svelte';
	import UiBarStrip from './UiBarStrip.svelte';
	import UiLabel from './UiLabel.svelte';
	import { getContext } from '../context';
	import { uiTheme } from '../theme.svelte';
	import { UI_BASE_FONT_SIZE, UI_BASE_SIZE } from '../constants';
	import { i18nDerived } from '../i18n/i18nDerived';
	import type { LayoutUiProps } from '../types';

	// Compact bottom bar — one slim strip along the foot of the screen:
	//
	//   LEFT   menu, then the balance and win readouts
	//   RIGHT  bet + stepper, the spin button, then autospin and turbo
	//
	// This is the arrangement players arrive already knowing, which is the whole
	// point of it: the side-rail version read as unusual precisely because it was.
	// Everything secondary stays in the menu, which the side-rail layout already
	// established and this one reuses unchanged.
	//
	// Buy Bonus is deliberately not in the strip (uiTheme.buyBonusOnRail). Buying
	// the feature is an occasional, deliberate, expensive action and it should not
	// sit next to the control players press every few seconds.
	//
	// Positions are proportional to the standard layout box so the same component
	// serves desktop (1920x1080), landscape and the squarer tablet box.

	const props: LayoutUiProps = $props();
	const context = getContext();

	const box = $derived(context.stateLayoutDerived.mainLayoutStandard());

	// The frame is inset from the canvas on all four sides — without the bottom
	// inset its lower edge sat exactly on the canvas floor and the rounded corners
	// were cut off. The insets are deliberately tight now: the frame is meant to
	// read as a substantial console, and at the previous 40/18 it floated in the
	// middle of the margin looking undersized against the reel housing.
	//
	// The inset is a theme key now (uiTheme.barFrameBottom, default 12 — this
	// value). A flat platform casing wants a much bigger one: Hacksaw's strip
	// leaves 30.4px clear under it on a 720-tall window, so the bar reads as a
	// thing laid on the screen rather than a thing built into its edge, and the
	// oversized spin button has somewhere to hang.
	const barTop = $derived(box.height - uiTheme.barHeight);
	const frameH = $derived(uiTheme.barHeight - uiTheme.barFrameBottom);
	const barMid = $derived(barTop + frameH * 0.5);

	// The strip is one framed panel, so the readouts inside it drop their own
	// plates — a box per readout inside a box is what made the first version look
	// cluttered, and the plates were wide enough that Balance and Win overlapped,
	// with Win's plate drawn over Balance's text.
	// Enlarged from 0.6 to 0.68 (+13%). Measured against the divider-bounded cells
	// with the widest realistic strings in Titan One: BALANCE label 143, a
	// "$10,000.00" win 177 (Win cell usable ~210), a "$100.00" bet 130 clearing the
	// chevron — all inside their cells. Going higher risks the largest wins
	// touching the Win rule.
	const READOUT_SCALE = 0.68;
	// UiLabel stacks label at y=0 and value at y=UI_BASE_FONT_SIZE, so the block is
	// two lines tall; lift it by half of that to sit centred on the bar.
	const readoutTop = $derived(barMid - UI_BASE_FONT_SIZE * READOUT_SCALE);

	// Frame inset from the canvas edges.
	const FRAME_X = 24;
	const frameW = $derived(box.width - FRAME_X - (uiTheme.barFrameRightInset ?? FRAME_X));
	const innerRight = $derived(box.width - FRAME_X - 14);

	// Right cluster, spaced by even edge-to-edge gaps rather than even centres —
	// the elements are very different sizes (spin 134 across, steppers 42), so
	// equal centre spacing would leave the gaps looking wrong. Every offset below
	// is half of one element plus a uniform 40 of air plus half of the next.
	const TURBO_X = $derived(innerRight - 33);
	const AUTO_X = $derived(TURBO_X - 106);
	const SPIN_X = $derived(AUTO_X - 140);
	const STEP_X = $derived(SPIN_X - 128);
	const BET_X = $derived(STEP_X - 175);

	// Sized against the frame, not picked by eye. The spin button overhangs the
	// frame top and bottom on purpose, but it also has to stay inside the canvas:
	// 0.92 put its lower edge 8px past the bottom of the stage, and even 0.8 left
	// it 1px over. This is the largest size that clears.
	// A theme key now (uiTheme.spinScale, default 0.78 — this value). Hacksaw runs
	// theirs at 1.60x the panel height, deliberately breaking out of the strip;
	// see the note on spinScale in theme.svelte.ts.
	const SPIN_SCALE = $derived(uiTheme.spinScale);
	// The stacked pair has to fit between the frame's inner rails. At 0.36 with a
	// 30 offset it stood 77 tall against 63 of clear frame and poked out of both.
	// uiTheme.stepButtonScale, default 0.28 (this value).
	const STEP_SCALE = $derived(uiTheme.stepButtonScale);

	// Left half, divided into labelled cells rather than floating items. Four rules
	// in total: after the menu, after Balance, after Win, and one closing the empty
	// span in front of Bet. The empty cell is deliberate — it is what stops the
	// readouts from crowding the spin pod, and giving it edges makes it read as
	// designed space instead of a gap someone forgot to fill.
	// Centred in its own cell rather than eyeballed: the frame's inner lit line
	// sits at FRAME_X + 9 = 33 and the first rule at DIV_1, so the cell centre is
	// (33 + 150) / 2. At the old 84 the button sat visibly left of centre.
	const MENU_X = 92;
	const DIV_1 = 150;
	const BALANCE_X = 286;
	const DIV_2 = 424;
	const WIN_X = 540;
	const DIV_3 = 656;
	const dividerBeforeBet = $derived(BET_X - 118);

	// uiTheme.stepperLayout 'flank': −  BET  + in one row. The − sits 40 of air
	// in from the Win rule, the + keeps the stacked pair's x beside the spin pod,
	// and the readout centres between them; the empty Win→Bet cell (and its
	// closing rule and breather tick) is what the pair takes up.
	const flank = $derived(uiTheme.stepperLayout === 'flank');
	const STEP_R = $derived((UI_BASE_SIZE * STEP_SCALE) / 2);
	// the pair closes in on the readout when the span allows: at the full width
	// the − sat far from the amount it changes and read as a separate control
	const FLANK_SPREAD = 210;
	const PLUS_X = $derived(STEP_X);
	const MINUS_X = $derived(Math.max(DIV_3 + 40 + STEP_R, PLUS_X - FLANK_SPREAD * 2));
	const betReadoutX = $derived(flank ? (MINUS_X + PLUS_X) * 0.5 : BET_X);

	// How wide a readout may draw, in ITS OWN units — the cell it sits in, less a
	// little air, divided by the scale the container applies.
	//
	// Certification: "some labels are overlapping on large amounts". The cells
	// were sized against the widest strings anyone had looked at, and a Gold Coin
	// balance is nine figures — GC 9,999,652,000 ran through the rule and printed
	// over the Win readout. Nothing bounded it, because a pixi Text simply draws
	// however wide it needs to be.
	//
	// Derived from the dividers rather than typed in, so moving a rule moves the
	// limit with it and the two cannot drift apart.
	const CELL_AIR = 18;
	const cellWidth = (left: number, right: number) =>
		Math.max(0, (right - left - CELL_AIR * 2) / READOUT_SCALE);
	const balanceMaxWidth = $derived(cellWidth(DIV_1, DIV_2));
	const winMaxWidth = $derived(cellWidth(DIV_2, DIV_3));
	// The Bet cell is bounded by its own rule on the left and the stepper on the
	// right, and it also has to leave room for the chevron the affordance draws.
	const betMaxWidth = $derived(
		flank ? cellWidth(MINUS_X + STEP_R, PLUS_X - STEP_R) : cellWidth(dividerBeforeBet, STEP_X - 24),
	);
	// centre of the empty Win→Bet span, for the breather tick
	const GAP_CENTER = $derived((DIV_3 + BET_X - 118) * 0.5);

	// Rules stop short of the frame's inner rails at both ends so they read as
	// separators rather than as structure holding the frame together.
	const DIV_INSET = 22;

	// Stepper stacked rather than flanking the bet button: it saves ~90px of strip
	// and matches how nearly every bar of this shape does it. Kept as + and − (not
	// chevrons) because up/down arrows next to a money value are ambiguous about
	// whether they change the stake or scroll a list. The offset is half a button
	// plus a hair, so the two touch targets never overlap.
	// uiTheme.stepButtonGap, default 22 (this value) — raise it with the scale.
	const STEP_DY = $derived(uiTheme.stepButtonGap);

	// Replay control, drawn in the empty Win→Bet cell (replay mode only).
	// 0.66 of UI_BASE_SIZE is 99 across — the largest circle that clears the
	// frame's 128 of inner height with air to spare, and big enough to read as the
	// primary action now that the spin pod is gone.
	const REPLAY_SCALE = 0.66;
	const REPLAY_RADIUS = (UI_BASE_SIZE * REPLAY_SCALE) / 2;
	// icon + caption centred as one unit on the cell, rather than the icon alone —
	// otherwise the pair sits visibly right of the space it occupies.
	const REPLAY_CAPTION_WIDTH = 120;
	const REPLAY_X = $derived(
		GAP_CENTER - (REPLAY_RADIUS * 2 + 12 + REPLAY_CAPTION_WIDTH) * 0.5 + REPLAY_RADIUS,
	);

	// Replay with a summary (stateReplay.summary, written by the game): the strip
	// carries every row of the replay start card, so nothing the card said is
	// lost once it closes. Stake review, 2026-10-04 (Deadwood Express): "When the
	// replay finishes, some of the information are not included in the bet bar
	// next to the Replay button". Replay + caption move to the right end beside
	// turbo; the rows share the span from the menu rule to it in equal cells.
	const replaySummary = $derived(stateReplay.enabled ? stateReplay.summary : []);
	const hasReplaySummary = $derived(replaySummary.length > 0);
	const SUMMARY_TURBO_R = (UI_BASE_SIZE * 0.5) / 2;
	const SUMMARY_REPLAY_X = $derived(
		TURBO_X - SUMMARY_TURBO_R - 40 - REPLAY_CAPTION_WIDTH - 12 - REPLAY_RADIUS,
	);
	const SUMMARY_END = $derived(SUMMARY_REPLAY_X - REPLAY_RADIUS - 34);
	const summaryCellW = $derived((SUMMARY_END - DIV_1) / Math.max(1, replaySummary.length));
	const summaryX = $derived((i: number) => DIV_1 + summaryCellW * (i + 0.5));
	const summaryMaxW = $derived(cellWidth(0, summaryCellW));
	// one caption size for the whole row: the scale the longest caption needs
	let summaryLabelWidths = $state<number[]>([]);
	const summaryLabelScale = $derived(
		Math.min(1, ...summaryLabelWidths.filter((w) => w > 0).map((w) => summaryMaxW / w)),
	);
	const ruleXs = $derived(
		hasReplaySummary
			? replaySummary.map((_, i) => DIV_1 + summaryCellW * i).concat(SUMMARY_END)
			: flank
				? [DIV_1, DIV_2, DIV_3]
				: [DIV_1, DIV_2, DIV_3, dividerBeforeBet],
	);

	const replayCaptionStyle = $derived({
		fontFamily: uiTheme.fontFamily,
		fontWeight: uiTheme.fontWeight,
		fontSize: UI_BASE_FONT_SIZE * 0.62,
		fill: uiTheme.labelFill,
		stroke: uiTheme.valueStroke,
		strokeThickness: 3,
	});

	const captionStyle = $derived({
		fontFamily: uiTheme.fontFamily,
		fontWeight: uiTheme.fontWeight,
		fontSize: UI_BASE_FONT_SIZE * 0.5,
		fill: uiTheme.labelFill,
		stroke: uiTheme.valueStroke,
		strokeThickness: 3,
	});

	// Menu items rise out of the strip. The first one has to clear not just the
	// frame but the close button sitting inside it: each item carries a caption 46
	// below its centre, and at the old -40 that caption ran straight through the
	// top of the X. Measured against a 0.4-scale button (30 radius), the first item
	// now sits 110 above the frame, leaving ~60 between caption and close button.
	const MENU_PITCH = 130;
	const menuItemY = $derived((i: number) => barTop - 110 - MENU_PITCH * i);

	// uiTheme.barMessage, centred in the Win→stepper span
	const messageX = $derived((DIV_3 + MINUS_X - STEP_R) * 0.5);
	const messageWidth = $derived(Math.max(0, MINUS_X - STEP_R - DIV_3 - 48));
	const messageStyle = $derived({
		fontFamily: uiTheme.fontFamily,
		fontWeight: uiTheme.fontWeight,
		fontSize: UI_BASE_FONT_SIZE * 0.6,
		fill: uiTheme.barMessageFill,
		align: 'center' as const,
		wordWrap: true,
		wordWrapWidth: messageWidth,
		lineHeight: UI_BASE_FONT_SIZE * 0.66,
	});

	// Drawn strip artwork, if the game supplies any. Undefined for every game, so
	// the vector casing below is unchanged unless one opts in.
	const barSpriteKey = $derived(uiTheme.sprites.bar);
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>

<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
	{@render props.logo()}
</Container>

<MainContainer standard>
	<!--
		The strip is one framed panel in the same language as the readout plates it
		replaces: dark olive fill, heavy brass edge, a thin lit inner line and
		rivets along the rails.

		Drawn rather than stretched from the plate artwork on purpose. That art is
		652x146 — about 4.5:1 — and this frame is closer to 17:1, so scaling the
		sprite to fit would distort it exactly the way widening the ticker plate
		did once before. Nine-slicing would spare the corners but smear the rivets
		that run along its edges, so the shapes are drawn instead and stay correct
		at any width.

		A game whose material language is a photographed surface rather than drawn
		metal can supply uiTheme.sprites.bar and get that surface instead. It is
		sliced horizontally (UiBarStrip) for exactly the reason above: the strip's
		aspect ratio changes with the canvas, so the ends have to be left alone and
		only the middle stretched. It replaces the casing's FILL and EDGE only —
		the section rules are still drawn on top of it, because they divide the
		controls rather than decorate the panel, and their positions move with the
		layout rather than with the art.
	-->
	{#if barSpriteKey}
		<UiBarStrip
			assetKey={barSpriteKey}
			x={FRAME_X}
			y={barTop}
			width={frameW}
			height={frameH}
			slice={uiTheme.barSpriteSlice}
		/>
	{/if}

	<Graphics
		draw={(g: PixiGraphics) => {
			const h = frameH;
			g.clear();

			// The strip art IS the fill and the edge when a game supplies one, so
			// drawing either over it would hide it. Everything below that is not
			// fill or edge still runs.
			const drawCasing = !barSpriteKey;

			// Platform chrome: a flat casing instead of the drawn housing. Same
			// colours, different shapes — see uiTheme.barStyle. Hacksaw's
			// `.ActionPanel` is `border: 3px solid #0f0f0f; border-radius: 3px` on a
			// flat fill with `.divider--vertical { opacity: .15 }`, and the whole
			// point of that casing is that it recedes: no inner lit line, no
			// engraved rules, nothing that asks to be looked at.
			if (uiTheme.barStyle === 'flat') {
				const rFlat = 4;
				if (drawCasing) {
					g.roundRect(FRAME_X, barTop, frameW, h, rFlat);
					g.fill({ color: uiTheme.barFill, alpha: uiTheme.barAlpha });
					g.stroke({ width: 3, color: uiTheme.panelBorder, alpha: 1 });
				}
				const topF = barTop + DIV_INSET;
				const botF = barTop + h - DIV_INSET;
				for (const x of ruleXs) {
					g.moveTo(x, topF);
					g.lineTo(x, botF);
					g.stroke({ width: 1, color: 0xffffff, alpha: 0.15 });
				}
				return;
			}

			const r = 26;
			// Pixi v8 API (shape, then fill/stroke), NOT the v7 beginFill/lineStyle
			// compatibility calls. Mixing those here filled the whole frame with the
			// last colour set — the strip rendered solid brass instead of dark olive,
			// and every readout on it lost its contrast. Numeric layout checks cannot
			// see that; it took looking at the frame.
			if (drawCasing) {
				g.roundRect(FRAME_X, barTop, frameW, h, r);
				g.fill({ color: uiTheme.barFill, alpha: uiTheme.barAlpha });
				g.stroke({ width: 7, color: uiTheme.panelBorder, alpha: 0.95 });
				// thin lit line just inside the brass edge
				g.roundRect(FRAME_X + 9, barTop + 9, frameW - 18, h - 18, r - 8);
				g.stroke({ width: 2, color: uiTheme.labelFill, alpha: 0.35 });
			}

			// Section rules. The rivet rows that used to run along both rails were
			// removed: two dotted lines spanning the full width tied the eye
			// horizontally, exactly across the grouping the bar is trying to show.
			// Vertical rules do the opposite — they separate.
			const top = barTop + DIV_INSET;
			const bot = barTop + h - DIV_INSET;
			for (const x of ruleXs) {
				g.moveTo(x, top);
				g.lineTo(x, bot);
				g.stroke({ width: 2, color: uiTheme.panelBorder, alpha: 0.55 });
				// hairline highlight to the right, so the rule reads as an engraved
				// groove in the panel rather than a drawn-on line
				g.moveTo(x + 1.5, top);
				g.lineTo(x + 1.5, bot);
				g.stroke({ width: 1, color: uiTheme.labelFill, alpha: 0.16 });
			}

			// Breather. The span between Win and Bet is left empty on purpose; a lone
			// centred tick — shorter and fainter than the structural rules, and only
			// the middle third of the frame's height — gives that emptiness a centre
			// to sit around so it reads as designed space rather than a gap. Not a
			// section rule: it separates nothing, it just breathes.
			// flank fills that span, so there is no emptiness to give a centre to
			if (!flank && !hasReplaySummary) {
				const midY = barTop + h * 0.5;
				const half = (h - DIV_INSET * 2) * 0.28;
				g.moveTo(GAP_CENTER, midY - half);
				g.lineTo(GAP_CENTER, midY + half);
				g.stroke({ width: 2, color: uiTheme.panelBorder, alpha: 0.3 });
			}
		}}
	/>

	<!-- ── left: menu + readouts ──────────────────────────────────────────── -->
	{#if !stateUi.menuOpen}
		<Container x={MENU_X} y={barMid} scale={0.4}>
			{@render props.buttonMenu({ anchor: 0.5 })}
		</Container>
	{/if}

	{#if hasReplaySummary}
		{#each replaySummary as row, i (row.label)}
			<Container x={summaryX(i)} y={readoutTop} scale={READOUT_SCALE}>
				<UiLabel
					tiled={false}
					stacked
					label={row.label.toUpperCase()}
					value={row.value}
					maxWidth={summaryMaxW}
					labelScale={summaryLabelScale}
					onlabelwidth={(w) => (summaryLabelWidths[i] = w)}
					accent={row.tone === 'win'
						? uiTheme.winAccent
						: { border: uiTheme.panelBorder, label: uiTheme.balanceLabelFill }}
				/>
			</Container>
		{/each}
		<Container x={SUMMARY_REPLAY_X} y={barMid} scale={REPLAY_SCALE}>
			<ButtonReplay anchor={0.5} />
		</Container>
		<Text
			anchor={{ x: 0, y: 0.5 }}
			x={SUMMARY_REPLAY_X + REPLAY_RADIUS + 12}
			y={barMid}
			text={i18nDerived.replay()}
			style={replayCaptionStyle}
		/>
		<Container x={TURBO_X} y={barMid} scale={0.5}>
			{@render props.buttonTurbo({ anchor: 0.5 })}
		</Container>
	{:else}
	<Container x={BALANCE_X} y={readoutTop} scale={READOUT_SCALE}>
		{#if stateReplay.enabled}
			<LabelReplayMultiplier stacked tiled={false} />
		{:else}
			{@render props.amountBalance({ stacked: true, tiled: false, maxWidth: balanceMaxWidth })}
		{/if}
	</Container>

	<Container x={WIN_X} y={readoutTop} scale={READOUT_SCALE}>
		{@render props.amountWin({ stacked: true, tiled: false, maxWidth: winMaxWidth })}
	</Container>

	<!-- ── right: bet, stepper, spin, autospin, turbo ─────────────────────── -->
	<Container x={betReadoutX} y={readoutTop} scale={READOUT_SCALE}>
		{@render props.amountBet({ stacked: true, tiled: false, maxWidth: betMaxWidth })}
	</Container>

	{#if stateReplay.enabled}
		<!--
			Replay mode. Nothing is wagered, so every control that would place or
			size a bet is gone: the steppers, the spin button, autospin and Buy
			Bonus. What replaces them is one control — replay the round again.

			It sits in the empty Win→Bet cell, the slot immediately left of Bet.
			That cell exists in this layout precisely because it was left blank as
			a breather, and it is the only place on the strip that can take a
			control without shifting the readouts around it.

			Turbo moves in from the far right to the spin slot: with the whole right
			cluster gone it would otherwise sit alone at the end of a very long
			empty stretch.
		-->
		<Container x={REPLAY_X} y={barMid} scale={REPLAY_SCALE}>
			<ButtonReplay anchor={0.5} />
		</Container>
		<!--
			Captioned, unlike the other icon buttons: in replay mode this is the
			only control that does anything, and an unlabelled circular arrow next
			to a turbo bolt reads too easily as "spin again".

			The caption sits beside the icon rather than under it. The frame is 128
			tall, so a button large enough to be the primary action leaves no room
			for a line of text below it — but the cell is over 500 wide, so there
			is all the room in the world to the side.
		-->
		<Text
			anchor={{ x: 0, y: 0.5 }}
			x={REPLAY_X + REPLAY_RADIUS + 12}
			y={barMid}
			text={i18nDerived.replay()}
			style={replayCaptionStyle}
		/>

		<Container x={SPIN_X} y={barMid} scale={0.5}>
			{@render props.buttonTurbo({ anchor: 0.5 })}
		</Container>
	{:else}
		{#if flank && uiTheme.barMessage && messageWidth > 60}
			<Text anchor={0.5} x={messageX} y={barMid} text={uiTheme.barMessage} style={messageStyle} />
		{/if}
		{#if flank}
			<Container x={MINUS_X} y={barMid} scale={STEP_SCALE}>
				{@render props.buttonDecrease({ anchor: 0.5 })}
			</Container>
			<Container x={PLUS_X} y={barMid} scale={STEP_SCALE}>
				{@render props.buttonIncrease({ anchor: 0.5 })}
			</Container>
		{:else}
			<Container x={STEP_X} y={barMid - STEP_DY} scale={STEP_SCALE}>
				{@render props.buttonIncrease({ anchor: 0.5 })}
			</Container>
			<Container x={STEP_X} y={barMid + STEP_DY} scale={STEP_SCALE}>
				{@render props.buttonDecrease({ anchor: 0.5 })}
			</Container>
		{/if}

		<!-- Spin is the largest thing on the strip and overhangs it top and bottom,
		     which is what makes it read as the primary action without a caption. -->
		<Container x={SPIN_X} y={barMid} scale={SPIN_SCALE}>
			{@render props.buttonBet({ anchor: 0.5 })}
		</Container>

		<Container x={AUTO_X} y={barMid} scale={0.44}>
			{@render props.buttonAutoSpin({ anchor: 0.5 })}
		</Container>

		<Container x={TURBO_X} y={barMid} scale={0.44}>
			{@render props.buttonTurbo({ anchor: 0.5 })}
		</Container>

		<!--
			Buy Bonus keeps its own place off to the left; see uiTheme.buyBonusOnRail.

			Hidden while the menu is open. The menu rises up the SAME left column
			(MENU_X, four items reaching 110 + 130*3 = 500 above the strip) and ran
			straight through the plate, so "BUY BONUS" was printed across PAYTABLE
			and INFO. It is not a stacking fix waiting to happen either: the menu
			puts a full-screen scrim over everything, so the plate underneath is
			already unclickable and there is nothing to lose by not drawing it.
		-->
		{#if !uiTheme.buyBonusOnRail && !stateUi.menuOpen}
			<Container
				x={uiTheme.railWidth * 0.5}
				y={box.height * 0.46}
				scale={uiTheme.buyBonusRailScale}
			>
				{@render props.buttonBuyBonus({ anchor: 0.5 })}
			</Container>
		{/if}
	{/if}
	{/if}
</MainContainer>

<!--
	Menu, opening upward out of the strip. Same contents and same order as the
	side-rail layout: sound nearest the button just pressed, the two reference
	panels furthest away.
-->
{#if stateUi.menuOpen}
	<Rectangle
		eventMode="static"
		cursor="pointer"
		alpha={0.5}
		anchor={0.5}
		backgroundColor={BLACK}
		width={context.stateLayoutDerived.canvasSizes().width}
		height={context.stateLayoutDerived.canvasSizes().height}
		x={context.stateLayoutDerived.canvasSizes().width * 0.5}
		y={context.stateLayoutDerived.canvasSizes().height * 0.5}
		onpointerup={() => (stateUi.menuOpen = false)}
	/>

	<MainContainer standard>
		<Container x={MENU_X} y={menuItemY(0)} scale={0.4}>
			{@render props.buttonSoundSwitch({ anchor: 0.5 })}
		</Container>
		<Text
			anchor={{ x: 0.5, y: 0 }}
			x={MENU_X}
			y={menuItemY(0) + 46}
			text={i18nDerived.soundOn()}
			style={captionStyle}
		/>

		<Container x={MENU_X} y={menuItemY(1)} scale={0.4}>
			{@render props.buttonSettings({ anchor: 0.5 })}
		</Container>
		<Text
			anchor={{ x: 0.5, y: 0 }}
			x={MENU_X}
			y={menuItemY(1) + 46}
			text={i18nDerived.settings()}
			style={captionStyle}
		/>

		<Container x={MENU_X} y={menuItemY(2)} scale={0.4}>
			{@render props.buttonGameRules({ anchor: 0.5 })}
		</Container>
		<Text
			anchor={{ x: 0.5, y: 0 }}
			x={MENU_X}
			y={menuItemY(2) + 46}
			text={i18nDerived.info()}
			style={captionStyle}
		/>

		<Container x={MENU_X} y={menuItemY(3)} scale={0.4}>
			{@render props.buttonPayTable({ anchor: 0.5 })}
		</Container>
		<Text
			anchor={{ x: 0.5, y: 0 }}
			x={MENU_X}
			y={menuItemY(3) + 46}
			text={i18nDerived.payTable()}
			style={captionStyle}
		/>

		<!-- close sits where the menu button was, so it does not move under the
		     cursor that just opened it -->
		<Container x={MENU_X} y={barMid} scale={0.4}>
			{@render props.buttonMenuClose({ anchor: 0.5 })}
		</Container>
	</MainContainer>
{/if}

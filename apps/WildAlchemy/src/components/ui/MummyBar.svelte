<script lang="ts">
	// THE BET BAR, v3 (game-reskin house-rules D2: 「以後 UI 都先預設那樣」, Stone
	// 2026-11-11 「UI換成新版」 for Wild Alchemy). The connected floating console of
	// the 2026-11-07 reference capture, measured at 1920x1080 (tables in
	// ./mummyBarGeometry.ts):
	//
	//   buy tile      174 x 172, rim, 22 corner, left
	//   console       x 200..1528 of a 1528-wide group, 142 tall, 16 corner
	//   menu          three 68 x 10 bars at x 264
	//   balance       caption over value from x 324; the win amount appears
	//                 beside it while a win is showing
	//   bet box       164 x 110, caption / value / a level track under it
	//   up / down     56-wide chevrons at x 1152, 28 above / below the centre
	//   spin          r 96 roundel, centre 1314 — overhangs the console
	//   auto / turbo  r 34 discs stacked at x 1462
	//
	// Ported from Dragon Tide's copy (wp-dragon 80395e5e), which carries Hypno
	// Monkey's template fixes (house-rules D2 items 1-8, 11): the click-catcher is
	// mounted for good (item 1), hover warms a control instead of greying it
	// (item 3), Spin stays pressable when the balance is short so the player is
	// told why (item 4), the menu's speaker is drawn and its panel opaque (item 5),
	// the group stands on the SCREEN's floor (item 6), WIN starts past the wider of
	// BALANCE's caption and amount and the portrait pop-ups are 1.6x (item 7), ∞
	// is drawn (item 8), and a replay keeps this bar (item 11).
	//
	// Wild Alchemy's own (2026-11-11):
	//   · dress: the manuscript palette (game/palette.ts) — a sepia console with an
	//     ochre rule, a verdigris-edged BET box, the parchment buy tile with its
	//     vermilion inner line (the buy plate's frame), bone discs, the
	//     illuminated roundel (wildAlchemyHud/spin_plate.png) as Spin, the HUD's own
	//     drawn icons in the menu panel, Saira as the bar face (the game's face).
	//   · the buy tile's glyph is this game's flask (game/buyIcon.ts, item 10).
	//   · the board keeps its size, so the group is FITTED into what the housing and
	//     the side figure leave free (mummyBarGeometry.barGroup keep-out zones);
	//     the pop-ups are drawn back up by the same factor so they keep their size.
	//   · one turbo tier (this tree has no turbo 2), so item 2 has nothing to draw.
	//   · the shared Auto Spin panel (Shift+A shortcut) is redirected to this bar's
	//     own rounds panel, so the game has one autoplay and no stop conditions it
	//     does not offer on the bar.
	//   · every word on the bar in the player's language (Arabic as one RTL run).
	import { Tween } from 'svelte/motion';
	import { MainContainer } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { Container, Graphics, Rectangle, Sprite, Text, getContextApp } from 'pixi-svelte';
	import type { Graphics as PixiGraphics, FederatedPointerEvent } from 'pixi.js';
	import {
		stateBet,
		stateBetDerived,
		stateConfig,
		stateModal,
		stateReplay,
		stateSound,
		stateUi,
		stateI18nDerived,
		AUTO_SPINS_TEXT_OPTION_MAP,
		type AutoSpinsText,
	} from 'state-shared';
	import { numberToCurrencyString, bookEventAmountToCountUpString } from 'utils-shared/amount';
	import {
		ButtonBetProvider,
		createBetRepeat,
		markBetChanged,
		i18nDerived,
		uiTheme,
		type LayoutUiProps,
	} from 'components-ui-pixi';

	import { getContext } from '../../game/context';
	import { BAR_LABEL_FONT } from '../../game/fonts';
	import { BUY_ICON, type BuyIconFill } from '../../game/buyIcon';
	import { barFootprint } from '../../game/barFootprint.svelte';
	import { inlineBetAnchor } from '../../game/inlineBetAnchor.svelte';
	import { castTopStd, housingRect } from '../../game/cornerLogo';
	import { canvasLine, gameText } from '../../game/i18nText';
	import {
		BONE,
		GOLD,
		GOLD_DARK,
		GOLD_LIGHT,
		GUNMETAL,
		GUNMETAL_DARK,
		INK,
		INK_DEEP,
		PARCHMENT,
		WINE,
	} from '../../game/palette';
	import { AUTO_ROUNDS, HALO, barGroup, type BarKeepOut } from './mummyBarGeometry';

	const props: LayoutUiProps = $props();
	const context = getContext();
	const pixiApp = getContextApp();

	// ── palette (game/palette.ts — ART_REQUEST §0's table, nothing new) ────────
	const CONSOLE = INK_DEEP; // the strip's sepia, as the old bar's field
	const RULE = GOLD; // the console's ochre rule
	const BOX = 0x1e140b; // the BET box, one step under the console
	const CAPTION = GOLD; // BALANCE / WIN / BET captions
	const VALUE = BONE; // figures
	const WIN_VALUE = GOLD_LIGHT; // the money, warm and loud
	const DISC = BONE; // auto / turbo face
	const DISC_HOVER = 0xf3dfa6; // warmed toward ochre, never a grey (D3/D4)
	const DISC_PRESS = INK; // the ~0.1 s a press is held
	const DISC_PRESS_ICON = GOLD_DARK;
	const DISC_RUNNING = 0xd6c094; // auto while a run is going: parchment, dimmed warm
	const ICON_RUNNING = 0x6e5636;
	const MUTED = 0x9c876a; // a control that cannot act right now, warm not grey
	const POPUP = INK_DEEP;
	const CELL = INK;
	const CELL_HOVER = 0x523b22;
	const TRACK = 0x4d3a26;
	const FONT = BAR_LABEL_FONT; // Saira — the game's face (fonts.ts); variable 300..700
	const BOLD = '700';
	const SEMI = '600';

	// ── where the group stands ─────────────────────────────────────────────────
	// The board keeps its size (it is sized off uiTheme.barHeight in
	// game/stateGame.svelte.ts), so the bar gives way to it: no piece may reach
	// into the housing's ink, and — while the side figure stands in its band —
	// none may reach above the figure's soles there.
	//
	// The soles: CastAlchemy stands the figure on std.height − uiTheme.barHeight −
	// its DIAL_RISE (38), and the boots and contact shadow reach CAST_SOLE below
	// that line (measured 15 px at 1920x1080 on the alchemist; 24 keeps the
	// shadow's core clear too). Mirrors CastAlchemy.svelte — change both together.
	const CAST_DIAL_RISE = 38;
	const CAST_SOLE = 24;
	const box = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const keepOut = $derived.by((): BarKeepOut[] => {
		const housing = housingRect(context);
		const gap = 8 * box.scale;
		const zones: BarKeepOut[] = [{ x0: housing.left - gap, x1: housing.right + gap, floor: housing.bottom + gap }];
		if (castTopStd(context, 0) !== null) {
			const toY = (y: number) => box.y + (y - box.height * box.anchor) * box.scale;
			const soles = toY(box.height - uiTheme.barHeight - CAST_DIAL_RISE + CAST_SOLE);
			zones.push({ x0: housing.right, x1: canvas.width, floor: soles + gap });
		}
		return zones;
	});
	const group = $derived(barGroup(canvas, box, keepOut));
	const portrait = $derived(group.portrait);
	const G = $derived(group.G);
	const s = $derived(group.s);
	const gx = $derived(group.gx);
	const gy = $derived(group.gy);
	// what the width alone would have allowed: the pop-ups are drawn back up by
	// what the keep-out fit took off, so a fitted bar does not shrink its menus
	const sWide = $derived(Math.min(1, (box.width - 32) / G.W));

	const BUY = $derived(G.BUY);
	const PANEL = $derived(G.PANEL);
	const MID = $derived(G.MID);
	const MENU_X = $derived(G.MENU_X);
	const BAL_X = $derived(G.BAL_X);
	const BETBOX = $derived(G.BETBOX);
	const CHEV_X = $derived(G.CHEV_X);
	const SPIN = $derived(G.SPIN);
	const SMALL_R = $derived(G.SMALL_R);
	// touch targets reach past the drawn disc: ~44 CSS px on a phone either way
	const HIT_R = $derived(SMALL_R + 18);

	// Tell whoever needs it where the bar stands (game/barFootprint.svelte.ts):
	// canvas px of the console's top, of the highest piece right of the housing
	// (where the side figure stands), and the fitted scale.
	$effect(() => {
		const py = (y: number) => canvas.height / 2 + (gy + y * s - box.height / 2) * box.scale;
		const px = (x: number) => canvas.width / 2 + (gx + x * s - box.width / 2) * box.scale;
		const right = housingRect(context).right;
		const tops = [
			{ x1: G.SPIN.x + G.SPIN.r, top: G.SPIN.y - G.SPIN.r },
			{ x1: G.AUTO.x + G.SMALL_R, top: G.AUTO.y - G.SMALL_R },
			{ x1: G.TURBO.x + G.SMALL_R, top: G.TURBO.y - G.SMALL_R },
			{ x1: G.PANEL.x + G.PANEL.w, top: G.PANEL.y },
		].filter((p) => px(p.x1) > right);
		barFootprint.scale = s;
		barFootprint.consoleTop = py(G.PANEL.y);
		barFootprint.sideTop = tops.length ? Math.min(...tops.map((p) => py(p.top))) : canvas.height;
	});

	// ── state that decides how everything looks ───────────────────────────────
	const idle = $derived(context.stateXstateDerived.isIdle());
	const autoRunning = $derived(stateBetDerived.hasAutoBetCounter());
	// A replay the game has not taken over still shows THIS bar with every betting
	// control gone (uiTheme.customLayoutOwnsReplay). Wild Alchemy does take its
	// replays over (ResumeBet.svelte sets stateReplay.enabled), so in practice
	// this is the replay-again button's path; bareReplay stays as Dragon's guard.
	const bareReplay = $derived(!stateReplay.enabled && stateUi.config.mode === 'replay');
	const replay = $derived(stateReplay.enabled || bareReplay);
	const hideBuy = $derived(uiTheme.buyBonusHideInFreeSpins && stateUi.freeSpinCounterShow);
	const cannotAfford = $derived(!stateBetDerived.isBetCostAvailable());
	const explains = $derived(stateConfig.explainInsufficientBalance);

	let autoPanel = $state(false);
	// both pop-ups fade in over ~70 ms (the capture: three frames at 50 fps)
	let panelFade = $state(1);
	const fadeIn = () => {
		panelFade = 0;
		const t0 = performance.now();
		const tick = (now: number) => {
			panelFade = Math.min(1, (now - t0) / 70);
			if (panelFade < 1) requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	};
	// the run's size, for the line under the count while autoplay runs
	let autoRunSize = $state('');
	let hover = $state<string | null>(null);
	// the control under a finger or a held mouse button
	let pressed = $state<string | null>(null);
	const down = (k: string) => () => (pressed = k);
	const up = () => (pressed = null);
	const over = (k: string) => (e: { pointerType?: string }) => {
		if (e.pointerType !== 'touch') hover = k;
	};
	const out = () => (hover = null);

	// ── words (player's language; Arabic as one right-to-left run) ─────────────
	const say = (text: string) => canvasLine(text);

	// ── readouts ───────────────────────────────────────────────────────────────
	const balanceTween = new Tween(stateBet.balanceAmount);
	$effect(() => {
		balanceTween.set(stateBet.balanceAmount);
	});
	const winTween = new Tween(stateBet.winBookEventAmount);
	$effect(() => {
		winTween.set(stateBet.winBookEventAmount);
	});
	const balanceText = $derived(numberToCurrencyString(balanceTween.current));
	const winText = $derived(bookEventAmountToCountUpString(winTween.current, stateBet.winBookEventAmount));
	const showWin = $derived(stateBet.winBookEventAmount > 0);
	let balanceWidth = $state(150);
	let balanceLabelWidth = $state(0);
	let winWidth = $state(0);
	// WIN starts past the wider of BALANCE's caption and its amount (D2 item 7:
	// with a dash for the amount the template's WIN sat on the caption)
	const winX = $derived(Math.max(balanceWidth, balanceLabelWidth) + 26);
	// a nine-figure Gold Coin balance plus a win can outgrow the span up to the
	// bet box ("labels overlapping on large amounts"), so both shrink together
	const readoutRoom = $derived(BETBOX.x - 28 - BAL_X);
	const readoutScale = $derived(
		Math.min(
			1,
			readoutRoom /
				Math.max(1, stateBet.winBookEventAmount > 0 ? winX + winWidth : Math.max(balanceWidth, balanceLabelWidth)),
		),
	);

	// bet level track: where the stake sits on the server's ladder
	const options = $derived([...stateConfig.betAmountOptions].sort((a, b) => a - b));
	const levelFrac = $derived.by(() => {
		if (options.length < 2) return 1;
		const i = Math.max(0, options.findIndex((o) => o >= stateBet.betAmount));
		return (i + 1) / options.length;
	});

	// ── stake up / down (ButtonIncrease / ButtonDecrease's rules) ──────────────
	const biggest = $derived(options.length ? options[options.length - 1] : stateConfig.maxBet);
	const smallest = $derived(options.length ? options[0] : stateConfig.minBet);
	const canStep = $derived(options.length > 0 || stateConfig.stepBet > 0);
	const upDisabled = $derived(!idle || !canStep || stateBet.betAmount >= biggest || replay);
	const downDisabled = $derived(!idle || !canStep || stateBet.betAmount <= smallest || replay);
	const step = (dir: 1 | -1) => {
		if ((dir > 0 ? upDisabled : downDisabled) || !canStep) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		markBetChanged();
		if (options.length) {
			const next =
				dir > 0
					? options.find((o) => o > stateBet.betAmount)
					: [...options].reverse().find((o) => o < stateBet.betAmount);
			stateBetDerived.setBetAmount(next ?? (dir > 0 ? biggest : smallest));
			return;
		}
		stateBetDerived.setBetAmount(stateBet.betAmount + dir * stateConfig.stepBet);
	};
	const upRepeat = createBetRepeat(() => (upDisabled ? upRepeat.stop() : step(1)));
	const downRepeat = createBetRepeat(() => (downDisabled ? downRepeat.stop() : step(-1)));
	const steppers = $derived([
		{ dir: 1 as const, y: MID - 28, dis: upDisabled, rep: upRepeat, k: 'up' },
		{ dir: -1 as const, y: MID + 28, dis: downDisabled, rep: downRepeat, k: 'down' },
	]);

	// While the feature-buy menu is open the console fades out over ~0.12 s (the
	// menu carries its own stake stepper, ui/BetStepper.svelte).
	const buyMenuOpen = $derived(stateModal.modal?.name === 'buyBonus');
	const barFade = new Tween(1, { duration: 120 });
	$effect(() => {
		barFade.set(buyMenuOpen ? 0 : 1);
	});

	let betValueWidth = $state(100);
	const betValueScale = $derived(Math.min(1, (BETBOX.w - 18) / Math.max(1, betValueWidth)));
	let betCaptionWidth = $state(60);
	const betCaptionScale = $derived(Math.min(1, (BETBOX.w - 14) / Math.max(1, betCaptionWidth)));
	const betLit = $derived(idle && !replay && (hover === 'bet' || pressed === 'bet'));

	// the stake list opens as a DOM panel beside the BET box (ui/InlineBetMenu.svelte)
	const openBetMenu = (event: FederatedPointerEvent) => {
		if (!idle || replay) return;
		autoPanel = false;
		stateUi.menuOpen = false;
		const target = event.currentTarget;
		inlineBetAnchor.measure = () => {
			const bounds = target.getBounds();
			const app = pixiApp.stateApp.pixiApplication!;
			const rect = app.canvas.getBoundingClientRect();
			const sx = rect.width / app.screen.width;
			const sy = rect.height / app.screen.height;
			return { left: rect.left + bounds.x * sx, top: rect.top + bounds.y * sy, width: bounds.width * sx, height: bounds.height * sy };
		};
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = { name: 'betAmountMenu' };
	};

	// ── buy tile (ButtonBuyBonus's rules; this game has no 'activate' mode) ────
	const buyDisabled = $derived(!idle);
	const pressBuy = () => {
		if (buyDisabled) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = { name: 'buyBonus' };
	};

	// ── autoplay: an inline rounds panel, started from the spin button ────────
	const AUTO_OPTIONS: AutoSpinsText[] = [...AUTO_ROUNDS].filter(
		(o) => o in AUTO_SPINS_TEXT_OPTION_MAP,
	) as AutoSpinsText[];
	const autoDisabled = $derived(stateBet.isSpaceHold || (!idle && !autoRunning) || (cannotAfford && !explains));
	const pressAuto = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		if (autoRunning) {
			stateBet.autoSpinsCounter = 0;
			return;
		}
		if (autoDisabled) return;
		stateUi.menuOpen = false;
		autoPanel = !autoPanel;
		if (autoPanel) fadeIn();
	};
	const pickRounds = (o: AutoSpinsText) => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateUi.autoSpinsText = o;
	};
	const startAuto = () => {
		if (!idle || replay || autoDisabled) return;
		if (cannotAfford && explains) {
			stateModal.modal = { name: 'message', message: 'insufficientFunds' };
			return;
		}
		stateBet.autoSpinsCounter = AUTO_SPINS_TEXT_OPTION_MAP[stateUi.autoSpinsText];
		autoRunSize = stateUi.autoSpinsText === '∞' ? '∞' : `+${stateUi.autoSpinsText}`;
		// Rounds only, as in the reference: no loss or single-win limit (decided
		// 2026-11-07). Set explicitly so nothing left over can cap a run.
		stateBet.autoSpinsLossLimitAmount = Infinity;
		stateBet.autoSpinsSingleWinLimitAmount = Infinity;
		if (stateBetDerived.activeBetMode().type === 'buy') stateBet.activeBetModeKey = 'BASE';
		autoPanel = false;
		context.eventEmitter.broadcast({ type: 'autoBet' });
	};
	$effect(() => {
		if (!idle) autoPanel = false;
	});
	// The shared Auto Spin panel (components-ui-html ModalAutoSpin, with its loss
	// and single-win limits) is still reachable by the platform shortcut
	// (Shift+A, components-ui-pixi EnableShortcuts). This bar's autoplay is rounds
	// only, so that route opens this bar's own panel instead.
	$effect(() => {
		if (stateModal.modal?.name !== 'autoSpin') return;
		stateModal.modal = null;
		if (idle && !replay && !autoDisabled) {
			stateUi.menuOpen = false;
			autoPanel = true;
			fadeIn();
		}
	});

	// ── turbo (ButtonTurbo's rules: one tier, on / off) ────────────────────────
	const boltColor = $derived(pressed === 'turbo' ? DISC_PRESS_ICON : stateBet.isTurbo ? GOLD_LIGHT : INK);
	const pressTurbo = () => {
		if (stateBet.isSpaceHold) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateBetDerived.updateIsTurbo(!stateBet.isTurbo, { persistent: true });
	};
	// Pressing Spin while the reels run plays the rest of the round at turbo speed
	// (ButtonTurbo did this; with the shared layout gone this bar does).
	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => stateBetDerived.updateIsTurbo(true, { persistent: false }),
		stopButtonEnable: () => stateBetDerived.updateIsTurbo(false, { persistent: false }),
	});

	// ── menu ───────────────────────────────────────────────────────────────────
	const pressMenu = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateUi.menuOpen = !stateUi.menuOpen;
		autoPanel = false;
		if (stateUi.menuOpen) fadeIn();
	};
	const openModal = (name: 'gameRules' | 'payTable' | 'settings') => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateUi.menuOpen = false;
		stateModal.modal = { name };
	};
	// On a phone held upright the template's pop-ups came out ~175 px wide with
	// ~20 px rows (D2 item 7): there they are drawn 1.6x. In landscape they are
	// drawn back up by whatever the keep-out fit took off the bar.
	const POP = $derived(portrait ? 1.6 : Math.min(1.5, sWide / Math.max(0.01, s)));
	const MENU = $derived({ x: G.MENU_X0, w: 380, row: 70 });
	const MENU_ROWS = 5;
	const menuTop = $derived(PANEL.y - 16 - (MENU.row * MENU_ROWS + 24) * POP);
	// volume sliders: drag along the track, 0..100
	let dragging = $state<'sfx' | 'music' | null>(null);
	const SLIDER = { x0: 96, x1: 340 };
	const sliders = $derived([
		{ k: 'sfx' as const, value: stateSound.volumeValueSoundEffect },
		{ k: 'music' as const, value: stateSound.volumeValueMusic },
	]);
	// the HUD's own drawn icons (bone with a sepia outline, wildAlchemyHud/)
	const menuRows = $derived([
		{ k: 'gameRules' as const, label: i18nDerived.info(), icon: 'waIconInfo' },
		{ k: 'payTable' as const, label: i18nDerived.payTable(), icon: 'waIconPayTable' },
		{ k: 'settings' as const, label: i18nDerived.settings(), icon: 'waIconSettings' },
	]);
	const setVolume = (which: 'sfx' | 'music', localX: number) => {
		const v = Math.round(Math.max(0, Math.min(1, (localX - SLIDER.x0) / (SLIDER.x1 - SLIDER.x0))) * 100);
		if (which === 'sfx') stateSound.volumeValueSoundEffect = v;
		else stateSound.volumeValueMusic = v;
	};

	// ── spin icon rotation: turns while the reels run, rests upright after ────
	let spinAngle = $state(0);
	const spinning = $derived(!idle);
	$effect(() => {
		const id = setInterval(() => {
			if (spinning) spinAngle += 0.02;
			else if (spinAngle % (Math.PI * 2) !== 0) {
				const rest = Math.ceil(spinAngle / (Math.PI * 2)) * Math.PI * 2;
				spinAngle = Math.min(rest, spinAngle + 0.06);
			}
		}, 16);
		return () => clearInterval(id);
	});

	// ── drawing helpers ────────────────────────────────────────────────────────
	const text = (size: number, fill: number, weight: string = BOLD) => ({
		fontFamily: FONT,
		fontWeight: weight as '700',
		fontSize: size,
		fill,
	});

	// The spin roundel (spin_plate.png, 512 square): its painted edge is at 0.96
	// of the half-width and its sepia well at 0.555 — the mark sits in the well.
	const ROUNDEL_EDGE = 246 / 256;
	const ROUNDEL_WELL = 142 / 246;

	// A chevron at a right angle with round caps.
	const drawChevron = (g: PixiGraphics, isUp: boolean, color: number) => {
		g.clear();
		const w = 22;
		const h = 20 * (isUp ? -1 : 1);
		g.moveTo(-w, -h / 2);
		g.lineTo(0, h / 2);
		g.lineTo(w, -h / 2);
		g.stroke({ width: 11, color, cap: 'round', join: 'round' });
	};

	// One arrow of the refresh mark: a crescent that is a hairline at its tail and
	// thickens towards a broad triangular head (angles in radians, y down).
	const crescent = (g: PixiGraphics, r: number, a0: number, a1: number, wMax: number, color: number) => {
		const N = 28;
		const outer: number[] = [];
		const inner: number[] = [];
		for (let i = 0; i <= N; i++) {
			const k = i / N;
			const a = a0 + (a1 - a0) * k;
			const w = wMax * (0.07 + 0.93 * Math.pow(k, 0.6));
			outer.push(Math.cos(a) * (r + w / 2), Math.sin(a) * (r + w / 2));
			inner.unshift(Math.sin(a) * (r - w / 2));
			inner.unshift(Math.cos(a) * (r - w / 2));
		}
		g.poly([...outer, ...inner]);
		g.fill({ color });
		const span = wMax * 0.92;
		const tipA = a1 - (wMax * 1.45) / r;
		g.poly([
			Math.cos(a1) * (r + span), Math.sin(a1) * (r + span),
			Math.cos(a1) * (r - span), Math.sin(a1) * (r - span),
			Math.cos(tipA) * r, Math.sin(tipA) * r,
		]);
		g.fill({ color });
	};

	// The refresh mark: two anticlockwise crescents; `play` adds the centred
	// triangle shown while the autoplay panel is open.
	const drawSpinIcon = (g: PixiGraphics, r: number, color: number, play: boolean) => {
		g.clear();
		const wMax = r * 0.5;
		crescent(g, r, -Math.PI * 0.1, -Math.PI * 0.8, wMax, color);
		crescent(g, r, Math.PI * 0.9, Math.PI * 0.2, wMax, color);
		if (play) {
			const tr = r * 0.42;
			g.poly([-tr * 0.55, -tr, tr * 0.95, 0, -tr * 0.55, tr]);
			g.fill({ color });
		}
	};

	// A slanted bolt with sharp tips: wide shoulder up right, long tail down left.
	const drawBolt = (g: PixiGraphics, r: number, color: number) => {
		g.clear();
		const p = [0.12, -1, 0.62, -1, 0.22, -0.18, 0.58, -0.18, -0.32, 1, -0.06, 0.14, -0.44, 0.14];
		g.poly(p.map((v) => v * r));
		g.fill({ color });
	};

	// ∞, drawn: Saira has no ∞ and a fallback face's sat small and low beside the
	// figures. A lemniscate `w` wide.
	const drawInfinity = (g: PixiGraphics, w: number, color: number) => {
		g.clear();
		const a = w / 2;
		const pts: number[] = [];
		for (let i = 0; i <= 64; i++) {
			const t = (i / 64) * Math.PI * 2;
			const d = 1 + Math.sin(t) ** 2;
			pts.push((a * Math.cos(t)) / d, (a * 1.25 * Math.sin(t) * Math.cos(t)) / d);
		}
		g.poly(pts, true);
		g.stroke({ width: w * 0.16, color, join: 'round' });
	};

	// A quaver for the music row, bone with a sepia outline like the HUD icons
	// beside it (no glyph: a font's ♪ would come from whatever face the OS has).
	const drawNote = (g: PixiGraphics, size: number) => {
		g.clear();
		const k = size / 24;
		for (const [extra, c] of [
			[2.6, INK],
			[0, BONE],
		] as const) {
			g.ellipse(-4 * k, 7 * k, 5 * k + extra * k * 0.5, 3.8 * k + extra * k * 0.5);
			g.fill({ color: c });
			g.moveTo(0.6 * k, 7 * k);
			g.lineTo(0.6 * k, -10 * k);
			g.quadraticCurveTo(6 * k, -6 * k, 8 * k, -1 * k);
			g.stroke({ width: (2.6 + extra) * k, color: c, cap: 'round', join: 'round' });
		}
	};

	// Replay: one long anticlockwise arrow round a small play triangle.
	const drawReplayIcon = (g: PixiGraphics, r: number, color: number) => {
		g.clear();
		crescent(g, r, Math.PI * 0.3, -Math.PI * 1.2, r * 0.5, color);
		const tr = r * 0.42;
		g.poly([-tr * 0.55, -tr, tr * 0.95, 0, -tr * 0.55, tr]);
		g.fill({ color });
	};

	// Autoplay: the refresh mark at the small button's size with the play triangle.
	const drawAutoIcon = (g: PixiGraphics, r: number, color: number) => drawSpinIcon(g, r, color, true);

	// The buy tile's flask (game/buyIcon.ts, 100 units = `size`). Its paths are
	// M/L(/Z) only, so they are read as point lists and drawn scaled — pixi's
	// GraphicsPath.transform() warns "unknown transform action closePath" on Z.
	const pathPoints = (d: string, k: number) => (d.match(/-?\d*\.?\d+/g) ?? []).map((v) => Number(v) * k);
	const drawBuyIcon = (g: PixiGraphics, size: number, fills: Record<BuyIconFill, number>) => {
		g.clear();
		const k = size / 100;
		for (const sh of BUY_ICON) {
			const c = fills[sh.fill];
			if ('c' in sh) {
				g.circle(sh.c[0] * k, sh.c[1] * k, sh.c[2] * k);
				g.fill({ color: c });
			} else if ('s' in sh) {
				const p = pathPoints(sh.s, k);
				g.moveTo(p[0], p[1]);
				for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]);
				g.stroke({ width: sh.w * k, color: c, cap: 'round', join: 'round' });
			} else {
				g.poly(pathPoints(sh.d, k), true);
				g.fill({ color: c });
			}
		}
	};
	const BUY_FILLS = { ink: INK, tile: PARCHMENT, accent: GUNMETAL };

	// a soft warm halo for hover (rings of ochre at low alpha), never a grey box;
	// HALO units wide, which the geometry's fit counts (mummyBarGeometry.HALO)
	const drawHaloRect = (g: PixiGraphics, w: number, h: number, r: number) => {
		g.clear();
		for (let k = 5; k >= 1; k--) {
			const e = (k * HALO) / 5;
			g.roundRect(-w / 2 - e, -h / 2 - e, w + e * 2, h + e * 2, r + e);
			g.fill({ color: GOLD, alpha: 0.12 });
		}
	};
	const drawHaloDisc = (g: PixiGraphics, r: number) => {
		g.clear();
		for (let k = 5; k >= 1; k--) {
			g.circle(0, 0, r + (k * HALO) / 5);
			g.fill({ color: GOLD, alpha: 0.12 });
		}
	};
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>
<Container x={canvas.width - 20}>
	{@render props.logo()}
</Container>

<OnHotkey
	hotkey="Escape"
	disabled={!stateUi.menuOpen && !autoPanel}
	onpress={() => {
		stateUi.menuOpen = false;
		autoPanel = false;
	}}
/>

<!-- a click anywhere else closes the menu / autoplay panel. Mounted for good and
     only switched on while a panel is open (D2 item 1): pixi-svelte adds every
     node with addChild and nothing sorts by zIndex, so the template's {#if open}
     version was appended ABOVE the bar the moment a panel opened and swallowed
     the presses on the autoplay panel and on Spin. -->
<Rectangle
	zIndex={1}
	visible={stateUi.menuOpen || autoPanel}
	eventMode={stateUi.menuOpen || autoPanel ? 'static' : 'none'}
	alpha={0.001}
	anchor={0.5}
	backgroundColor={0x000000}
	width={canvas.width}
	height={canvas.height}
	x={canvas.width * 0.5}
	y={canvas.height * 0.5}
	onpointerup={() => {
		stateUi.menuOpen = false;
		autoPanel = false;
		dragging = null;
	}}
/>

<Container zIndex={2}>
	<MainContainer standard>
		<Container x={gx} y={gy} scale={s} alpha={barFade.current} visible={barFade.current > 0.01}>
			<!-- ── buy tile ───────────────────────────────────────────────────── -->
			{#if !replay && !hideBuy}
				<Container
					label="bar:buy"
					x={BUY.x + BUY.w / 2}
					y={BUY.y + BUY.h / 2}
					eventMode="static"
					cursor={buyDisabled ? 'default' : 'pointer'}
					alpha={buyDisabled ? 0.45 : 1}
					onpointerover={over('buy')}
					onpointerout={() => {
						out();
						up();
					}}
					onpointerdown={down('buy')}
					onpointerup={(e) => {
						up();
						if (e.pointerType === 'touch') hover = null;
						pressBuy();
					}}
				>
					<!-- mounted for good and switched by `visible`: pixi-svelte appends a node
					     when it mounts, so an {#if hover} halo landed OVER the tile -->
					<Graphics visible={hover === 'buy' && !buyDisabled} draw={(g: PixiGraphics) => drawHaloRect(g, BUY.w, BUY.h, BUY.r)} />
					<Graphics
						draw={(g: PixiGraphics) => {
							g.clear();
							g.roundRect(-BUY.w / 2, -BUY.h / 2, BUY.w, BUY.h, BUY.r);
							g.fill({ color: hover === 'buy' && !buyDisabled ? 0xf3e7c6 : PARCHMENT });
							g.stroke({ width: 6, color: INK });
							// the buy plate's own frame: a vermilion line inside the ink rim
							g.roundRect(-BUY.w / 2 + 10, -BUY.h / 2 + 10, BUY.w - 20, BUY.h - 20, BUY.r - 9);
							g.stroke({ width: 3, color: WINE, alpha: pressed === 'buy' ? 1 : 0.85 });
						}}
					/>
					<Graphics draw={(g: PixiGraphics) => drawBuyIcon(g, BUY.h * 0.72, BUY_FILLS)} />
				</Container>
			{/if}

			<!-- ── console ────────────────────────────────────────────────────── -->
			<Container label="bar:console">
				<Graphics
					draw={(g: PixiGraphics) => {
						g.clear();
						g.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, PANEL.r);
						g.fill({ color: CONSOLE, alpha: 0.94 });
						g.stroke({ width: 3, color: RULE });
						// verdigris hairline inside the ochre rule, as on the HUD plates
						g.roundRect(PANEL.x + 7, PANEL.y + 7, PANEL.w - 14, PANEL.h - 14, PANEL.r - 5);
						g.stroke({ width: 1.5, color: GUNMETAL, alpha: 0.75 });
					}}
				/>
			</Container>

			<!-- menu: three bars, an X while the menu is open -->
			<Container
				label="bar:menu"
				x={MENU_X}
				y={MID}
				eventMode="static"
				cursor="pointer"
				onpointerover={over('menu')}
				onpointerout={out}
				onpointerup={pressMenu}
			>
				<Rectangle anchor={0.5} width={90} height={90} alpha={0.001} backgroundColor={0x000000} />
				<Graphics
					draw={(g: PixiGraphics) => {
						g.clear();
						const c = hover === 'menu' ? GOLD : BONE;
						if (stateUi.menuOpen) {
							g.moveTo(-26, -26);
							g.lineTo(26, 26);
							g.moveTo(26, -26);
							g.lineTo(-26, 26);
							g.stroke({ width: 11, color: c, cap: 'round' });
							return;
						}
						for (const y of [-22, 0, 22]) g.roundRect(-34, y - 5, 68, 10, 5);
						g.fill({ color: c });
					}}
				/>
			</Container>

			<!-- balance, and the win beside it while one is showing -->
			<Container x={BAL_X} y={MID} scale={readoutScale}>
				<Text
					y={-28}
					anchor={{ x: 0, y: 0.5 }}
					text={say(i18nDerived.balance())}
					style={text(24, CAPTION)}
					onresize={({ width }) => (balanceLabelWidth = width)}
				/>
				<Text
					y={12}
					anchor={{ x: 0, y: 0.5 }}
					text={replay ? '—' : balanceText}
					style={text(42, VALUE)}
					onresize={({ width }) => (balanceWidth = width)}
				/>
				{#if showWin}
					<Text x={winX} y={-28} anchor={{ x: 0, y: 0.5 }} text={say(i18nDerived.win())} style={text(24, CAPTION)} />
					<Text
						x={winX}
						y={12}
						anchor={{ x: 0, y: 0.5 }}
						text={winText}
						style={text(42, WIN_VALUE)}
						onresize={({ width }) => (winWidth = width)}
					/>
				{/if}
			</Container>

			<!-- bet box: caption, stake, level track -->
			<Container
				label="bar:bet"
				x={BETBOX.x}
				y={BETBOX.y}
				eventMode="static"
				cursor={idle && !replay ? 'pointer' : 'default'}
				alpha={idle || autoRunning ? 1 : 0.55}
				onpointerover={over('bet')}
				onpointerout={() => {
					out();
					up();
				}}
				onpointerdown={down('bet')}
				onpointerupoutside={up}
				onpointerup={(e) => {
					up();
					openBetMenu(e);
				}}
			>
				<Graphics
					draw={(g: PixiGraphics) => {
						g.clear();
						g.roundRect(0, 0, BETBOX.w, BETBOX.h, BETBOX.r);
						g.fill({ color: betLit ? PARCHMENT : BOX });
						g.stroke({ width: 2, color: betLit ? GOLD : GUNMETAL });
						// level track
						g.roundRect(4, BETBOX.h - 11, BETBOX.w - 8, 7, 3.5);
						g.fill({ color: betLit ? 0xc9b48a : TRACK });
						g.roundRect(4, BETBOX.h - 11, Math.max(14, (BETBOX.w - 8) * levelFrac), 7, 3.5);
						g.fill({ color: betLit ? INK : BONE });
					}}
				/>
				<Text
					x={BETBOX.w / 2}
					y={28}
					anchor={0.5}
					scale={betCaptionScale}
					text={say(i18nDerived.betAmount())}
					style={text(22, betLit ? INK : CAPTION)}
					onresize={({ width }) => (betCaptionWidth = width)}
				/>
				<Text
					x={BETBOX.w / 2}
					y={63}
					anchor={0.5}
					scale={betValueScale}
					text={numberToCurrencyString(stateBetDerived.betCost())}
					style={text(36, betLit ? INK : VALUE)}
					onresize={({ width }) => (betValueWidth = width)}
				/>
			</Container>

			<!-- stake up / down -->
			{#if !replay}
				{#each steppers as c (c.k)}
					<Container
						label={`bar:${c.k}`}
						x={CHEV_X}
						y={c.y}
						eventMode="static"
						cursor={c.dis ? 'default' : 'pointer'}
						alpha={c.dis ? 0.35 : 1}
						onpointerover={over(c.k)}
						onpointerout={() => {
							out();
							c.rep.stop();
						}}
						onpointerdown={() => {
							pressed = c.k;
							c.rep.start();
						}}
						onpointerup={() => {
							up();
							c.rep.stop();
							step(c.dir);
						}}
					>
						<Rectangle anchor={0.5} width={96} height={56} alpha={0.001} backgroundColor={0x000000} />
						<Graphics draw={(g: PixiGraphics) => drawChevron(g, c.dir > 0, hover === c.k && !c.dis ? GOLD : BONE)} />
					</Container>
				{/each}
			{/if}

			<!-- ── spin: the illuminated roundel ─────────────────────────────── -->
			{#if bareReplay}
				<!-- nothing to press: the round plays once from the replay card -->
			{:else if replay}
				<!-- replay again: the same roundel with a replay mark. The shared
				     ButtonReplay's rules (dead while the round runs; a press re-seeds the
				     round through stateReplay.startRequested, ResumeBet.svelte), drawn
				     here because its face is the old bar's ochre disc with a small icon. -->
				{@const replayDead = stateReplay.running}
				{@const replayLit = hover === 'replay' && !replayDead}
				<Container
					label="bar:spin"
					x={SPIN.x}
					y={SPIN.y}
					eventMode="static"
					cursor={replayDead ? 'default' : 'pointer'}
					onpointerover={over('replay')}
					onpointerout={() => {
						out();
						up();
					}}
					onpointerdown={down('replay')}
					onpointerup={(e) => {
						up();
						if (e.pointerType === 'touch') hover = null;
						if (replayDead) return;
						context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
						stateReplay.waiting = false;
						stateReplay.startRequested = true;
					}}
				>
					<Graphics visible={replayLit} draw={(g: PixiGraphics) => drawHaloDisc(g, SPIN.r)} />
					<Graphics
						draw={(g: PixiGraphics) => {
							g.clear();
							g.circle(0, 0, SPIN.r);
							g.fill({ color: 0x000000, alpha: 0.001 });
						}}
					/>
					<Sprite
						key="waUiSpin"
						anchor={0.5}
						width={(SPIN.r * 2) / ROUNDEL_EDGE}
						height={(SPIN.r * 2) / ROUNDEL_EDGE}
						tint={pressed === 'replay' && !replayDead ? 0xe2cfa6 : 0xffffff}
					/>
					<Graphics draw={(g: PixiGraphics) => drawReplayIcon(g, SPIN.r * 0.34, replayDead ? MUTED : replayLit ? GOLD_LIGHT : BONE)} />
				</Container>
			{:else}
				<ButtonBetProvider>
					{#snippet children({ key, onpress })}
						{@const stopping = key === 'stop_default' || key === 'stop_disabled'}
						<!-- a player who cannot afford the bet is TOLD SO (D2 item 4,
						     stateConfig.explainInsufficientBalance, [222]): the disc stays
						     pressable then and opens the notice, as the shared ButtonBet does -->
						{@const explainsShort = key === 'spin_disabled' && cannotAfford && explains && idle}
						{@const dis = (key === 'spin_disabled' && !explainsShort) || key === 'stop_disabled'}
						{@const press = () => {
							if (autoPanel && idle) {
								startAuto();
								return;
							}
							if (cannotAfford && explains && idle) {
								stateModal.modal = { name: 'message', message: 'insufficientFunds' };
								return;
							}
							onpress();
						}}
						{@const lit = hover === 'spin' && !dis}
						<OnHotkey hotkey="Space" disabled={stateModal.modal !== null || (cannotAfford && !explains)} onpress={press} />
						<Container
							label="bar:spin"
							x={SPIN.x}
							y={SPIN.y}
							eventMode="static"
							cursor={dis ? 'default' : 'pointer'}
							onpointerover={over('spin')}
							onpointerout={() => {
								out();
								up();
							}}
							onpointerdown={down('spin')}
							onpointerup={(e) => {
								up();
								if (e.pointerType === 'touch') hover = null;
								if (!dis) press();
							}}
						>
							<!-- under the roundel for good (see the buy tile's halo) -->
							<Graphics visible={lit} draw={(g: PixiGraphics) => drawHaloDisc(g, SPIN.r)} />
							<Graphics
								draw={(g: PixiGraphics) => {
									g.clear();
									g.circle(0, 0, SPIN.r);
									g.fill({ color: 0x000000, alpha: 0.001 });
								}}
							/>
							<Sprite
								key="waUiSpin"
								anchor={0.5}
								width={(SPIN.r * 2) / ROUNDEL_EDGE}
								height={(SPIN.r * 2) / ROUNDEL_EDGE}
								tint={pressed === 'spin' && !dis ? 0xe2cfa6 : 0xffffff}
							/>
							{#if autoRunning}
								{@const well = SPIN.r * ROUNDEL_WELL}
								{#if stateBet.autoSpinsCounter === Infinity}
									<Graphics y={-well * 0.12} draw={(g: PixiGraphics) => drawInfinity(g, well * 1.15, lit ? GOLD_LIGHT : BONE)} />
								{:else}
									<Text
										y={-well * 0.12}
										anchor={0.5}
										text={String(stateBet.autoSpinsCounter)}
										style={text(stateBet.autoSpinsCounter > 99 ? well * 0.58 : well * 0.78, lit ? GOLD_LIGHT : BONE)}
									/>
								{/if}
								{#if autoRunSize === '∞'}
									<Graphics y={well * 0.6} draw={(g: PixiGraphics) => drawInfinity(g, well * 0.42, GOLD)} />
								{:else}
									<Text y={well * 0.6} anchor={0.5} text={autoRunSize} style={text(well * 0.3, GOLD)} />
								{/if}
							{:else}
								<Container rotation={spinAngle}>
									<Graphics
										draw={(g: PixiGraphics) =>
											drawSpinIcon(
												g,
												SPIN.r * 0.34,
												stopping || dis ? MUTED : lit ? GOLD_LIGHT : BONE,
												autoPanel && !stopping,
											)}
									/>
								</Container>
							{/if}
						</Container>
					{/snippet}
				</ButtonBetProvider>
			{/if}

			<!-- ── autoplay + turbo ───────────────────────────────────────────── -->
			{#if !replay}
				<Container
					label="bar:auto"
					x={G.AUTO.x}
					y={G.AUTO.y}
					eventMode="static"
					cursor={autoDisabled && !autoRunning ? 'default' : 'pointer'}
					alpha={autoDisabled && !autoRunning ? 0.45 : 1}
					onpointerover={over('auto')}
					onpointerout={() => {
						out();
						up();
					}}
					onpointerdown={down('auto')}
					onpointerup={() => {
						up();
						pressAuto();
					}}
				>
					<Graphics
						draw={(g: PixiGraphics) => {
							g.clear();
							g.circle(0, 0, HIT_R);
							g.fill({ color: 0x000000, alpha: 0.001 });
							g.circle(0, 0, SMALL_R);
							g.fill({
								color:
									pressed === 'auto'
										? DISC_PRESS
										: autoRunning
											? DISC_RUNNING
											: hover === 'auto' && !autoDisabled
												? DISC_HOVER
												: DISC,
							});
							g.stroke({ width: 5, color: INK });
						}}
					/>
					<Graphics
						draw={(g: PixiGraphics) =>
							drawAutoIcon(g, SMALL_R * 0.5, pressed === 'auto' ? DISC_PRESS_ICON : autoRunning ? ICON_RUNNING : INK)}
					/>
				</Container>
			{/if}
			<Container
				label="bar:turbo"
				x={replay && !portrait ? G.AUTO.x : G.TURBO.x}
				y={replay && !portrait ? MID : G.TURBO.y}
				eventMode="static"
				cursor="pointer"
				onpointerover={over('turbo')}
				onpointerout={() => {
					out();
					up();
				}}
				onpointerdown={down('turbo')}
				onpointerup={() => {
					up();
					pressTurbo();
				}}
			>
				<Graphics
					draw={(g: PixiGraphics) => {
						g.clear();
						g.circle(0, 0, HIT_R);
						g.fill({ color: 0x000000, alpha: 0.001 });
						g.circle(0, 0, SMALL_R);
						if (pressed === 'turbo') {
							g.fill({ color: DISC_PRESS });
							g.stroke({ width: 5, color: GOLD_DARK });
						} else if (stateBet.isTurbo) {
							// ON: the face goes to ink and the bolt lights, as on the HUD
							g.fill({ color: hover === 'turbo' ? 0x4a3420 : INK });
							g.stroke({ width: 5, color: GOLD });
						} else {
							g.fill({ color: hover === 'turbo' ? DISC_HOVER : DISC });
							g.stroke({ width: 5, color: INK });
						}
					}}
				/>
				<Graphics draw={(g: PixiGraphics) => drawBolt(g, SMALL_R * 0.6, boltColor)} />
			</Container>

			<!-- ── autoplay rounds panel ──────────────────────────────────────── -->
			{#if autoPanel}
				{@const P = {
					w: 488,
					h: 288,
					...(portrait
						? { x: G.W / 2 - 244 * POP, y: G.SPIN.y - G.SPIN.r - 24 - 288 * POP }
						: { x: G.W - 488 * POP, y: G.PANEL.y - 16 - 288 * POP }),
				}}
				<Container
					label="bar:autoPanel"
					x={P.x}
					y={P.y}
					scale={POP}
					eventMode="static"
					alpha={panelFade}
					onpointerup={(e) => e.stopPropagation()}
				>
					<Graphics
						draw={(g: PixiGraphics) => {
							g.clear();
							g.roundRect(0, 0, P.w, P.h, 12);
							g.fill({ color: POPUP });
							g.stroke({ width: 2, color: RULE });
						}}
					/>
					<Text x={P.w / 2} y={30} anchor={0.5} text={say(i18nDerived.autoSpin())} style={text(26, VALUE)} />
					<Text
						x={P.w / 2}
						y={58}
						anchor={0.5}
						text={say(stateI18nDerived.translate('NUMBER OF ROUNDS'))}
						style={text(17, 0xb9a682, SEMI)}
					/>
					{#each AUTO_OPTIONS as o, i (o)}
						{@const cx = 16 + (i % 3) * 156}
						{@const cy = 84 + Math.floor(i / 3) * 66}
						{@const sel = stateUi.autoSpinsText === o}
						<Container
							x={cx}
							y={cy}
							eventMode="static"
							cursor="pointer"
							onpointerover={over(`r${o}`)}
							onpointerout={out}
							onpointertap={(e) => {
								e.stopPropagation();
								pickRounds(o);
							}}
						>
							<Graphics
								draw={(g: PixiGraphics) => {
									g.clear();
									g.roundRect(0, 0, 148, 56, 8);
									g.fill({ color: sel ? GOLD : hover === `r${o}` ? CELL_HOVER : CELL });
									if (!sel) g.stroke({ width: 1.5, color: GUNMETAL_DARK });
								}}
							/>
							{#if o === '∞'}
								<!-- drawn: Saira has no ∞ (see drawInfinity) -->
								<Graphics x={74} y={28} draw={(g: PixiGraphics) => drawInfinity(g, 34, sel ? INK : VALUE)} />
							{:else}
								<Text x={74} y={28} anchor={0.5} text={o} style={text(23, sel ? INK : VALUE)} />
							{/if}
						</Container>
					{/each}
					<Container
						x={328}
						y={216}
						eventMode="static"
						cursor="pointer"
						onpointerover={over('start')}
						onpointerout={out}
						onpointertap={(e) => {
							e.stopPropagation();
							startAuto();
						}}
					>
						<Graphics
							draw={(g: PixiGraphics) => {
								g.clear();
								g.roundRect(0, 0, 148, 56, 8);
								g.fill({ color: hover === 'start' ? GOLD_LIGHT : GOLD });
								g.stroke({ width: 2, color: INK });
							}}
						/>
						<Text x={74} y={28} anchor={0.5} text={say(gameText('start'))} style={text(22, INK)} />
					</Container>
				</Container>
			{/if}
		</Container>
	</MainContainer>
</Container>

<!-- ── menu panel: rises out of the console above the menu button ───────── -->
{#if stateUi.menuOpen}
	<Container zIndex={3}>
		<MainContainer standard>
			<Container x={gx} y={gy} scale={s}>
				<Container label="bar:menuPanel" x={MENU.x} y={menuTop} scale={POP} eventMode="static" alpha={panelFade}>
					<Graphics
						draw={(g: PixiGraphics) => {
							g.clear();
							g.roundRect(0, 0, MENU.w, MENU.row * MENU_ROWS + 24, 12);
							// opaque (D2 item 5): at 0.96 the board's symbols showed through
							g.fill({ color: POPUP });
							g.stroke({ width: 2, color: RULE });
						}}
					/>
					{#each menuRows as row, i (row.k)}
						<Container
							y={12 + i * MENU.row}
							eventMode="static"
							cursor="pointer"
							onpointerover={over(row.k)}
							onpointerout={out}
							onpointerup={() => openModal(row.k)}
						>
							<Rectangle x={8} width={MENU.w - 16} height={MENU.row} alpha={hover === row.k ? 0.16 : 0.001} backgroundColor={GOLD} />
							<Sprite key={row.icon} anchor={0.5} x={46} y={MENU.row / 2} width={48} height={48} />
							<Text
								x={86}
								y={MENU.row / 2}
								anchor={{ x: 0, y: 0.5 }}
								text={say(row.label)}
								style={text(24, hover === row.k ? GOLD_LIGHT : VALUE)}
							/>
						</Container>
					{/each}
					{#each sliders as sl, j (sl.k)}
						{@const ry = 12 + (3 + j) * MENU.row}
						<Container
							y={ry}
							eventMode="static"
							cursor="pointer"
							onpointerdown={(e) => {
								dragging = sl.k;
								setVolume(sl.k, e.getLocalPosition(e.currentTarget).x);
							}}
							onpointermove={(e) => {
								if (dragging === sl.k) setVolume(sl.k, e.getLocalPosition(e.currentTarget).x);
							}}
							onpointerup={() => (dragging = null)}
							onpointerupoutside={() => (dragging = null)}
						>
							<Rectangle width={MENU.w} height={MENU.row} alpha={0.001} backgroundColor={0x000000} />
							{#if sl.k === 'sfx'}
								<!-- the HUD's own speaker, not the 🔊 emoji (D2 item 5) -->
								<Sprite key="waIconSoundOn" anchor={0.5} x={46} y={MENU.row / 2} width={44} height={44} />
							{:else}
								<Container x={46} y={MENU.row / 2}>
									<Graphics draw={(g: PixiGraphics) => drawNote(g, 30)} />
								</Container>
							{/if}
							<Graphics
								draw={(g: PixiGraphics) => {
									g.clear();
									const y = MENU.row / 2;
									g.roundRect(SLIDER.x0, y - 4, SLIDER.x1 - SLIDER.x0, 8, 4);
									g.fill({ color: TRACK });
									const x = SLIDER.x0 + ((SLIDER.x1 - SLIDER.x0) * sl.value) / 100;
									g.roundRect(SLIDER.x0, y - 4, x - SLIDER.x0, 8, 4);
									g.fill({ color: GOLD });
									g.circle(x, y, 13);
									g.fill({ color: BONE });
									g.stroke({ width: 3, color: INK });
								}}
							/>
						</Container>
					{/each}
				</Container>
			</Container>
		</MainContainer>
	</Container>
{/if}

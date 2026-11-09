<script lang="ts">
	// THE BET BAR, VERSION 4 — "split": the v3 bar (MummyBar, after Paperclip's
	// "Private Jet") taken apart into floating pieces. Rev. 2 (2026-11-07) lays
	// them out after the Katana Kash capture the user sent; the icons are v3's:
	//
	//   FOOT ROW   buy tile in the bottom-left corner, round menu button above
	//              it; BALANCE plate; WIN plate in the centre (always shown);
	//              ▲ over ▼; BET plate (level line along its foot)
	//   CORNER     the spin disc in the bottom-right corner, turbo and autoplay
	//              on an arc above it
	//
	// Readouts sit on dark translucent plates. Everything else is v3's: Nunito,
	// colour-only feedback (no scaling), the 70 ms panel fade, rounds-only
	// autoplay, the bar fading out while the buy menu is open (pair it with
	// BuyMenuBetPill.svelte). Phone portrait: the foot row spans the screen, the
	// buy tile and the spin cluster stand on it in the two corners.
	//
	// TEMPLATE source: wp/tools/ui-bar-v4 (README.md there).
	//
	// PLACEHOLDER(art): the buy tile's glyph; redraw it for the game's theme
	// (never the reference studio's own mark).
	import { GraphicsPath, Matrix } from 'pixi.js';
	import { BUY_ICON } from '../../game/buyIcon';
	import { Tween } from 'svelte/motion';
	import { MainContainer } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { Container, Graphics, Rectangle, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
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
		ButtonReplay,
		cycleTurbo,
		createBetRepeat,
		markBetChanged,
		i18nDerived,
		uiTheme,
		type LayoutUiProps,
	} from 'components-ui-pixi';

	import { getContext } from '../../game/context';
	import { BAR_FONT } from '../../game/fonts';
	import { barFootprint } from '../../game/barFootprint.svelte';

	const props: LayoutUiProps = $props();
	const context = getContext();

	// ── palette (sampled from the capture) ─────────────────────────────────────
	const GOLD = 0xecc254;
	const INK = 0x0a0804;
	const CONSOLE = 0x172329;
	const WHITE = 0xffffff;
	const POPUP = 0x2e2f32;
	const CELL = 0x06070a;
	// Nunito (static/fonts, OFL) — CJK labels fall through to the system's
	const FONT = BAR_FONT;

	// ── geometry ────────────────────────────────────────────────────────────────
	// Two groups in the standard box (1920x1080 wide, 1080x1920 portrait): LEFT
	// is anchored at the box's bottom-left corner and grows right / up, RIGHT at
	// the bottom-right corner and grows left / up (so its x values are negative).
	// y is measured up from the floor (negative).
	//
	// Portrait keeps the same two groups at phone-thumb sizes: the buttons get
	// bigger, not smaller, because the box is narrower but the screen is a phone.
	// 2026-11-07 (rev. 2): laid out after the Katana Kash capture the user sent —
	// one row along the foot (buy tile in the corner, BALANCE plate, WIN plate in
	// the centre, ▲/▼ stacked, BET plate), the round menu button over the buy
	// tile, and the spin disc in the bottom-right corner with turbo and autoplay
	// on an arc above it. Readouts sit on translucent plates. Icons unchanged.
	// Plates: x/y are the top-left corner; discs: x/y are the centre.
	const WIDE = {
		EDGE: 40,
		FLOOR: 18,
		BUY: { x: 0, y: -176, w: 156, h: 176, r: 20 },
		MENU: { x: 46, y: -232, r: 38 },
		BAL: { x: 172, y: -96, w: 340, h: 96 },
		WIN: { w: 520, h: 96 },
		BET: { x: -500, y: -96, w: 244, h: 96 },
		STEP: { x: -538, y1: -73, y2: -23, w: 60, h: 44, r: 12 },
		// Hypno (2026-11-09), per the template README's "tune WIDE.SPIN / TURBO /
		// AUTO per game": the Hypnotist stands at the board's right with his
		// feet where the template put the turbo disc (template: SPIN -126/-196,
		// TURBO -134/-372, AUTO -22/-330). The cluster hangs from the SCREEN's
		// corner and drops as the window gets taller than 16:9 while the cast
		// stays with the board, so the turbo swept down through his right shoe
		// (touching at 16:9, on the toe at 16:10). Measured over every cast
		// clip at 1280x720: shoes reach x 1146 / y 515, the tail x 1180 /
		// y 439 (CSS px). Spin 10 right and 20 down, turbo 26 right and 20
		// down, autoplay 12 down keeps every disc clear at every aspect —
		// the cast itself is not moved: his gaze arm already reaches the
		// board's frame, so shifting him left would put it over the reels.
		SPIN: { x: -116, y: -176, r: 110 },
		TURBO: { x: -108, y: -352 },
		AUTO: { x: -22, y: -318 },
		SMALL_R: 38,
		AUTOPANEL: { x: -540, y: -726 },
		LBL: 20,
		VAL: 32,
		PAD: 20,
	};
	const PORTRAIT = {
		EDGE: 30,
		FLOOR: 24,
		// the foot row spans the phone: BALANCE | WIN | BET; the buy tile and the
		// spin cluster stand on it in the two corners
		BUY: { x: 0, y: -316, w: 168, h: 186, r: 22 },
		MENU: { x: 52, y: -386, r: 46 },
		BAL: { x: 0, y: -110, w: 330, h: 110 },
		WIN: { w: 300, h: 110 },
		BET: { x: -330, y: -110, w: 330, h: 110 },
		STEP: { x: -362, y1: -330, y2: -262, w: 80, h: 58, r: 14 },
		SPIN: { x: -150, y: -280, r: 128 },
		TURBO: { x: -156, y: -478 },
		AUTO: { x: -26, y: -432 },
		SMALL_R: 46,
		AUTOPANEL: { x: -520, y: -830 },
		LBL: 26,
		VAL: 40,
		PAD: 22,
	};
	const box = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const portrait = $derived(box.height > box.width);
	const G = $derived(portrait ? PORTRAIT : WIDE);
	// Anchored to the SCREEN's corners, not the box's: the box is letterboxed
	// inside the screen (a tall phone leaves a band under it, a 4:3 window one
	// above and below), and floating controls belong in the real corners.
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const spareX = $derived(Math.max(0, (canvas.width / box.scale - box.width) / 2));
	const spareY = $derived(Math.max(0, (canvas.height / box.scale - box.height) / 2));
	const leftX = $derived(G.EDGE - spareX);
	const rightX = $derived(box.width + spareX - G.EDGE);
	const floorY = $derived(box.height + spareY - G.FLOOR);

	const BUY = $derived(G.BUY);
	// Hypno: publish how far the bottom-left cluster reaches in from the screen's
	// left edge (screen px), so the background props can stand clear of it. From
	// the geometry, not from what is visible, so the props do not move when the
	// buy tile hides for free spins.
	$effect(() => {
		barFootprint.left = (G.EDGE + Math.max(G.BUY.x + G.BUY.w, G.MENU.x + G.MENU.r)) * box.scale;
	});
	const SPIN = $derived(G.SPIN);
	const STEP = $derived(G.STEP);
	const SMALL_R = $derived(G.SMALL_R);
	// touch targets reach past the drawn disc: ~44 CSS px on a phone either way
	const HIT_R = $derived(SMALL_R + 18);

	// translucent plates behind the menu and the stake steppers (Vice Heat's dark
	// glass), in v3's console colour
	const PLATE = 0x172329;
	const PLATE_ALPHA = 0.78;
	const PLATE_HOVER = 0x24343c;
	const PLATE_PRESS = 0x0b1114;
	// bare text needs its own edge against a busy scene
	const SHADOW = { color: 0x000000, alpha: 0.85, blur: 4, distance: 2, angle: Math.PI / 2 };

	// ── state that decides how everything looks ───────────────────────────────
	const idle = $derived(context.stateXstateDerived.isIdle());
	const autoRunning = $derived(stateBetDerived.hasAutoBetCounter());
	const replay = $derived(stateReplay.enabled);
	// a replay's mode cost, shown where the balance would be (see the balance plate)
	const replayMultiplierText = $derived(`${stateBetDerived.activeBetMode()?.costMultiplier ?? 1}x`);
	const activation = $derived(stateBetDerived.activeBetMode()?.type === 'activate');
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
	// the run's size, for the pill under the count while autoplay runs
	let autoRunSize = $state('');
	let hover = $state<string | null>(null);
	// the control under a finger or a held mouse button: drawn a step smaller
	let pressed = $state<string | null>(null);
	const down = (k: string) => () => (pressed = k);
	const up = () => (pressed = null);
	// The reference never scales a control on hover or press — every feedback is
	// a colour or a state change (v3's 50 fps frame study, 2026-11-07).
	// small round buttons: white idle, light grey under the cursor, a dark flash
	// for the ~0.1 s the press is held, then whatever state the press set
	const SMALL_IDLE = 0xffffff;
	// Hypno (2026-11-09): the template's 0xe4e4e4 greyed the white disc under
	// the cursor; the house rule is that hover lights a control in the game's
	// own colour and never greys it, so the disc warms to a pale gold instead.
	const SMALL_HOVER = 0xf8e3a3;
	const SMALL_PRESS = 0x4a4a4a;
	const SMALL_PRESS_ICON = 0x6b6233;
	const SPIN_GREY = 0x6f6f6f;
	const over = (k: string) => (e: { pointerType?: string }) => {
		if (e.pointerType !== 'touch') hover = k;
	};
	const out = () => (hover = null);

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
	const winText = $derived(
		bookEventAmountToCountUpString(winTween.current, stateBet.winBookEventAmount),
	);
	const showWin = $derived(stateBet.winBookEventAmount > 0);
	let balanceWidth = $state(150);
	let winWidth = $state(0);
	let betWidth = $state(100);
	// Certification has sent back "labels overlapping on large amounts" before:
	// a nine-figure balance shrinks to fit its plate rather than spilling out.
	const fit = (plateW: number, textW: number) => Math.min(1, (plateW - G.PAD * 2) / Math.max(1, textW));
	const balanceScale = $derived(fit(G.BAL.w, balanceWidth));
	const betScale = $derived(fit(G.BET.w, betWidth));
	const winScale = $derived(fit(G.WIN.w, winWidth));

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
	// ▲ over ▼, stacked beside the BET plate (Katana Kash)
	const steppers = $derived([
		{ dir: 1 as const, y: STEP.y1, dis: upDisabled, rep: upRepeat, k: 'up' },
		{ dir: -1 as const, y: STEP.y2, dis: downDisabled, rep: downRepeat, k: 'down' },
	]);

	// While the feature-buy menu is open the console fades out over ~0.12 s and
	// the menu's own bet pill (BuyMenuBetPill) takes over, as the reference does.
	const buyMenuOpen = $derived(stateModal.modal?.name === 'buyBonus');
	const barFade = new Tween(1, { duration: 120 });
	$effect(() => {
		barFade.set(buyMenuOpen ? 0 : 1);
	});

	const openBetMenu = () => {
		if (!idle || replay) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = { name: 'betAmountMenu' };
	};

	// ── buy tile (ButtonBuyBonus's rules) ──────────────────────────────────────
	// the tile's face colour, which the glyph's cut-outs also take
	const buyTileFill = $derived(pressed === 'buy' ? 0xb8902f : activation ? 0xc99b2e : GOLD);
	const buyDisabled = $derived(!idle);
	const pressBuy = () => {
		if (buyDisabled) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		if (activation) stateBet.activeBetModeKey = 'BASE';
		else stateModal.modal = { name: 'buyBonus' };
	};

	// ── autoplay: an inline rounds panel, started from the spin button ────────
	const AUTO_OPTIONS: AutoSpinsText[] = ['∞', '10', '25', '50', '100', '250', '500', '1000'].filter(
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
		autoPanel = !autoPanel;
		if (autoPanel) fadeIn();
	};
	const pickRounds = (o: AutoSpinsText) => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateUi.autoSpinsText = o;
	};
	const startAuto = () => {
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

	// ── turbo (ButtonTurbo's rules) ────────────────────────────────────────────
	const turbo2 = $derived(stateBet.isTurbo && uiTheme.turboTiers > 1 && stateBet.turboLevel > 1);
	const boltColor = $derived(pressed === 'turbo' ? SMALL_PRESS_ICON : stateBet.isTurbo ? GOLD : INK);
	const pressTurbo = () => {
		if (stateBet.isSpaceHold) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		cycleTurbo();
	};
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
	const MENU = $derived({ x: 0, w: 380, row: 70 });
	const MENU_ROWS = 5;
	// the panel rises from above the round menu button
	// Hypno: while the buy tile is hidden (free spins, replay) the menu button
	// drops into the tile's place, so it does not hang over an empty corner.
	// Wide: level with the BALANCE plate, one row along the foot. Portrait: the
	// tile's own centre (there the plates fill the foot row under it).
	const menuPos = $derived(
		hideBuy || replay
			? { x: G.BUY.x + G.BUY.w / 2, y: portrait ? G.BUY.y + G.BUY.h / 2 : G.BAL.y + G.BAL.h / 2 }
			: { x: G.MENU.x, y: G.MENU.y },
	);
	const menuTop = $derived(menuPos.y - G.MENU.r - 16 - MENU.row * MENU_ROWS - 24);
	// volume sliders: drag along the track, 0..100
	let dragging = $state<'sfx' | 'music' | null>(null);
	const SLIDER = { x0: 96, x1: 340 };
	const sliders = $derived([
		{ k: 'sfx' as const, glyph: '🔊', value: stateSound.volumeValueSoundEffect },
		{ k: 'music' as const, glyph: '♪', value: stateSound.volumeValueMusic },
	]);
	const menuRows = $derived([
		{ k: 'gameRules' as const, label: i18nDerived.info(), glyph: 'i' },
		{ k: 'payTable' as const, label: i18nDerived.payTable(), glyph: '≡' },
		{ k: 'settings' as const, label: i18nDerived.settings(), glyph: '⚙' },
	]);
	const setVolume = (which: 'sfx' | 'music', localX: number) => {
		const v = Math.round(Math.max(0, Math.min(1, (localX - SLIDER.x0) / (SLIDER.x1 - SLIDER.x0))) * 100);
		if (which === 'sfx') stateSound.volumeValueSoundEffect = v;
		else stateSound.volumeValueMusic = v;
	};

	// ── spin icon rotation: turns while the reels run, rests upright after ────
	let spinAngle = $state(0);
	// the reels run whenever the machine is not idle (ButtonBetProvider's stop_* keys)
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
	const text = (size: number, fill: number, weight = '800') => ({
		fontFamily: FONT,
		fontWeight: weight as '800',
		fontSize: size,
		fill,
	});
	// the readouts sit on translucent plates; a light shadow keeps the edge
	const shadowed = (size: number, fill: number, weight = '900') => ({
		...text(size, fill, weight),
		dropShadow: SHADOW,
	});
	// one readout plate (BALANCE / WIN / BET): dark glass, rounded
	const drawReadoutPlate = (g: PixiGraphics, w: number, h: number, lit = false) => {
		g.clear();
		g.roundRect(0, 0, w, h, 14);
		g.fill({ color: lit ? PLATE_HOVER : PLATE, alpha: PLATE_ALPHA });
		g.stroke({ width: 2, color: 0x2b3a42, alpha: 0.9 });
	};

	// ── icons, redrawn off the reference at 5-8x zoom (2026-11-07) ────────────

	// A chevron at a right angle with round caps: the reference's arms meet at
	// ~90°, not the shallow 55° first drawn.
	const drawChevron = (g: PixiGraphics, up: boolean, color: number, k = 1) => {
		g.clear();
		const w = 22 * k;
		const h = 20 * k * (up ? -1 : 1);
		g.moveTo(-w, -h / 2);
		g.lineTo(0, h / 2);
		g.lineTo(w, -h / 2);
		g.stroke({ width: 11 * k, color, cap: 'round', join: 'round' });
	};

	// One arrow of the refresh mark: a crescent that is a hairline at its tail and
	// thickens towards a broad triangular head. Angles in radians, screen
	// convention (y down); a0 -> a1 runs anticlockwise on screen (a1 < a0).
	const crescent = (g: PixiGraphics, r: number, a0: number, a1: number, wMax: number, color: number) => {
		const N = 28;
		const outer: number[] = [];
		const inner: number[] = [];
		for (let i = 0; i <= N; i++) {
			const k = i / N;
			const a = a0 + (a1 - a0) * k;
			// tail -> head: 7% of the max at the tail, full width at the head
			const w = wMax * (0.07 + 0.93 * Math.pow(k, 0.6));
			outer.push(Math.cos(a) * (r + w / 2), Math.sin(a) * (r + w / 2));
			inner.unshift(Math.sin(a) * (r - w / 2));
			inner.unshift(Math.cos(a) * (r - w / 2));
		}
		g.poly([...outer, ...inner]);
		g.fill({ color });
		// head: a wide triangle whose base straddles the arc at a1 and whose tip
		// runs on along the circle
		const span = wMax * 0.92;
		const tipA = a1 - (wMax * 1.45) / r;
		g.poly([
			Math.cos(a1) * (r + span), Math.sin(a1) * (r + span),
			Math.cos(a1) * (r - span), Math.sin(a1) * (r - span),
			Math.cos(tipA) * r, Math.sin(tipA) * r,
		]);
		g.fill({ color });
	};

	// The refresh mark: two anticlockwise crescents, the top one from 2 o'clock
	// over the top to a head at half past 9, the bottom one from 8 under the
	// bottom to a head at half past 3 (matched to the reference at 8x zoom). `play`
	// adds the centred triangle shown while autoplay is armed.
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

	// A loudspeaker, `s` tall, centred: cone + two sound arcs (Hypno; replaces the
	// 🔊 emoji in the menu's effects-volume row, see the sliders below).
	const drawSpeaker = (g: PixiGraphics, s: number, color: number) => {
		g.clear();
		const k = s / 24;
		g.poly([-11, -4, -6, -4, 0, -10, 0, 10, -6, 4, -11, 4].map((v) => v * k));
		g.fill({ color });
		for (const r of [5.5, 10]) {
			const a = 0.75;
			g.moveTo((2 + Math.cos(-a) * r) * k, Math.sin(-a) * r * k);
			g.arc(2 * k, 0, r * k, -a, a);
			g.stroke({ width: 2.4 * k, color, cap: 'round' });
		}
	};

	// Autoplay: the same refresh mark at the small button's size, with the play
	// triangle always in it.
	const drawAutoIcon = (g: PixiGraphics, r: number, color: number) => drawSpinIcon(g, r, color, true);

	// The buy tile's theme glyph (src/game/buyIcon.ts, 100 units = `size`): ink
	// shapes, and 'tile' shapes cut back out in the tile's own colour, so the
	// glyph reads as one black stamp with holes. Same shapes as ui/BarIcon.svelte.
	const drawBuyIcon = (g: PixiGraphics, size: number, color: number, tileColor: number) => {
		g.clear();
		const k = size / 100;
		const m = new Matrix().scale(k, k);
		for (const sh of BUY_ICON) {
			const c = sh.fill === 'ink' ? color : tileColor;
			if ('c' in sh) {
				g.circle(sh.c[0] * k, sh.c[1] * k, sh.c[2] * k);
				g.fill({ color: c });
			} else if ('s' in sh) {
				g.path(new GraphicsPath(sh.s).transform(m));
				g.stroke({ width: sh.w * k, color: c, cap: 'round', join: 'round' });
			} else {
				g.path(new GraphicsPath(sh.d).transform(m));
				g.fill({ color: c });
			}
		}
	};
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>
<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
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

<!-- a click anywhere else closes the menu / autoplay panel.
     Hypno (2026-11-09): mounted for good and only switched on while a panel is
     open. pixi-svelte adds every node with addChild, so the template's
     {#if open} version was appended ABOVE the bar the moment a panel opened:
     it swallowed the clicks on the autoplay panel's round counts and on Spin,
     so autoplay could not be started at all — every press just closed the
     panel. Mounted here once, it stays below the bar and both panels. -->
<Rectangle
	visible={stateUi.menuOpen || autoPanel}
	eventMode={stateUi.menuOpen || autoPanel ? 'static' : 'none'}
	alpha={0.001}
	anchor={0.5}
	backgroundColor={0x000000}
	width={context.stateLayoutDerived.canvasSizes().width}
	height={context.stateLayoutDerived.canvasSizes().height}
	x={context.stateLayoutDerived.canvasSizes().width * 0.5}
	y={context.stateLayoutDerived.canvasSizes().height * 0.5}
	onpointerup={() => {
		stateUi.menuOpen = false;
		autoPanel = false;
		dragging = null;
	}}
/>

<MainContainer standard>
	<Container alpha={barFade.current} visible={barFade.current > 0.01}>
		<!-- ══ LEFT: buy, menu, balance ═══════════════════════════════════════ -->
		<Container x={leftX} y={floorY}>
			{#if !replay && !hideBuy}
				<Container
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
					{#if hover === 'buy' && !buyDisabled}
						<Graphics
							draw={(g: PixiGraphics) => {
								g.clear();
								for (let k = 6; k >= 1; k--) {
									const e = k * 4;
									g.roundRect(-BUY.w / 2 - e, -BUY.h / 2 - e, BUY.w + e * 2, BUY.h + e * 2, BUY.r + e);
									g.fill({ color: GOLD, alpha: 0.09 });
								}
							}}
						/>
					{/if}
					<Graphics
						draw={(g: PixiGraphics) => {
							g.clear();
							g.roundRect(-BUY.w / 2, -BUY.h / 2, BUY.w, BUY.h, BUY.r);
							g.fill({ color: buyTileFill });
							g.stroke({ width: 6, color: INK });
							g.roundRect(-BUY.w / 2 + 9, -BUY.h / 2 + 9, BUY.w - 18, BUY.h - 18, BUY.r - 8);
							g.stroke({ width: 2, color: INK, alpha: 0.35 });
						}}
					/>
					<Graphics draw={(g: PixiGraphics) => drawBuyIcon(g, BUY.h * 0.72, INK, buyTileFill)} />
					{#if activation}
						<!-- an activation is running: the tile turns it off -->
						<Container y={BUY.h / 2 - 22}>
							<Graphics
								draw={(g: PixiGraphics) => {
									g.clear();
									g.roundRect(-44, -15, 88, 30, 15);
									g.fill({ color: INK });
								}}
							/>
							<Text anchor={0.5} text="ON" style={text(20, GOLD)} />
						</Container>
					{/if}
				</Container>
			{/if}

			<!-- menu: three bars on a glass plate, an X while the menu is open -->
			<Container
				x={menuPos.x}
				y={menuPos.y}
				eventMode="static"
				cursor="pointer"
				onpointerover={over('menu')}
				onpointerout={() => {
					out();
					up();
				}}
				onpointerdown={down('menu')}
				onpointerup={(e) => {
					up();
					if (e.pointerType === 'touch') hover = null;
					pressMenu();
				}}
			>
				<Graphics
					draw={(g: PixiGraphics) => {
						g.clear();
						const M = G.MENU;
						g.circle(0, 0, M.r + 14);
						g.fill({ color: 0x000000, alpha: 0.001 });
						g.circle(0, 0, M.r);
						g.fill({
							color: pressed === 'menu' ? PLATE_PRESS : hover === 'menu' ? PLATE_HOVER : PLATE,
							alpha: PLATE_ALPHA,
						});
						g.stroke({ width: 2, color: 0x2b3a42, alpha: 0.9 });
					}}
				/>
				<Graphics
					draw={(g: PixiGraphics) => {
						g.clear();
						const c = pressed === 'menu' ? 0x8a8a8a : hover === 'menu' ? GOLD : 0xe8e8e8;
						// v3's bars / X, scaled into the round button
						const k = G.MENU.r / 62;
						if (stateUi.menuOpen) {
							g.moveTo(-24 * k, -24 * k);
							g.lineTo(24 * k, 24 * k);
							g.moveTo(24 * k, -24 * k);
							g.lineTo(-24 * k, 24 * k);
							g.stroke({ width: 11 * k, color: c, cap: 'round' });
							return;
						}
						for (const y of [-22, 0, 22]) g.roundRect(-34 * k, (y - 5) * k, 68 * k, 10 * k, 5 * k);
						g.fill({ color: c });
					}}
				/>
			</Container>

			<!-- balance plate, right of the buy tile. In a replay it carries the
			     mode's cost multiplier instead (Hypno 2026-11-09, as the shared
			     bar's LabelReplayMultiplier does): a replay never authenticates, so
			     a balance means nothing there, and the multiplier beside the BET
			     plate is what makes the round's real cost legible — guideline
			     #174. The template showed "—" and no multiplier anywhere. -->
			<Container x={G.BAL.x} y={G.BAL.y}>
				<Graphics draw={(g: PixiGraphics) => drawReadoutPlate(g, G.BAL.w, G.BAL.h)} />
				<Text x={G.PAD} y={G.BAL.h * 0.3} anchor={{ x: 0, y: 0.5 }} text={replay ? 'MULTIPLIER' : i18nDerived.balance()} style={shadowed(G.LBL, GOLD, '800')} />
				<Container x={G.PAD} y={G.BAL.h * 0.66} scale={balanceScale}>
					<Text
						anchor={{ x: 0, y: 0.5 }}
						text={replay ? replayMultiplierText : balanceText}
						style={shadowed(G.VAL, WHITE)}
						onresize={({ width }) => (balanceWidth = width)}
					/>
				</Container>
			</Container>
		</Container>

		<!-- ══ CENTRE: the win plate, always there (0 between wins) ═════════════ -->
		<Container x={box.width / 2 - G.WIN.w / 2} y={floorY - G.WIN.h}>
			<Graphics draw={(g: PixiGraphics) => drawReadoutPlate(g, G.WIN.w, G.WIN.h)} />
			<Text x={G.WIN.w / 2} y={G.WIN.h * 0.3} anchor={0.5} text={i18nDerived.win()} style={shadowed(G.LBL, GOLD, '800')} />
			<Container x={G.WIN.w / 2} y={G.WIN.h * 0.66} scale={winScale}>
				<Text
					anchor={0.5}
					text={showWin ? winText : numberToCurrencyString(0)}
					style={shadowed(G.VAL, showWin ? GOLD : WHITE)}
					onresize={({ width }) => (winWidth = width)}
				/>
			</Container>
		</Container>

		<!-- ══ RIGHT: spin, stake, autoplay, turbo ═════════════════════════════ -->
		<Container x={rightX} y={floorY}>
			<!-- the stake plate, the level line along its foot; press it for the list -->
			<Container
				x={G.BET.x}
				y={G.BET.y}
				eventMode="static"
				cursor={idle && !replay ? 'pointer' : 'default'}
				alpha={idle || autoRunning ? 1 : 0.55}
				onpointerover={over('bet')}
				onpointerout={out}
				onpointerup={openBetMenu}
			>
				<Graphics draw={(g: PixiGraphics) => drawReadoutPlate(g, G.BET.w, G.BET.h, hover === 'bet' && idle && !replay)} />
				<Text x={G.PAD} y={G.BET.h * 0.3} anchor={{ x: 0, y: 0.5 }} text={i18nDerived.betAmount()} style={shadowed(G.LBL, GOLD, '800')} />
				<Container x={G.PAD} y={G.BET.h * 0.64} scale={betScale}>
					<Text
						anchor={{ x: 0, y: 0.5 }}
						text={numberToCurrencyString(stateBetDerived.betCost())}
						style={shadowed(G.VAL, hover === 'bet' && idle && !replay ? GOLD : WHITE)}
						onresize={({ width }) => (betWidth = width)}
					/>
				</Container>
				<Graphics
					draw={(g: PixiGraphics) => {
						g.clear();
						const w = G.BET.w - G.PAD * 2;
						const y = G.BET.h - 12;
						g.roundRect(G.PAD, y, w, 5, 2.5);
						g.fill({ color: 0x000000, alpha: 0.45 });
						g.roundRect(G.PAD, y, Math.max(10, w * levelFrac), 5, 2.5);
						g.fill({ color: WHITE });
					}}
				/>
			</Container>

			<!-- stake up / down: chevrons on small glass plates, stacked by BET -->
			{#if !replay}
				{#each steppers as c (c.k)}
					<Container
						x={STEP.x}
						y={c.y}
						eventMode="static"
						cursor={c.dis ? 'default' : 'pointer'}
						alpha={c.dis ? 0.35 : 1}
						onpointerover={over(c.k)}
						onpointerout={() => {
							out();
							up();
							c.rep.stop();
						}}
						onpointerdown={() => {
							pressed = c.k;
							c.rep.start();
						}}
						onpointerup={(e) => {
							up();
							c.rep.stop();
							if (e.pointerType === 'touch') hover = null;
							step(c.dir);
						}}
					>
						<Graphics
							draw={(g: PixiGraphics) => {
								g.clear();
								g.roundRect(-STEP.w / 2, -STEP.h / 2, STEP.w, STEP.h, STEP.r);
								g.fill({
									color: pressed === c.k && !c.dis ? PLATE_PRESS : hover === c.k && !c.dis ? PLATE_HOVER : PLATE,
									alpha: PLATE_ALPHA,
								});
								g.stroke({ width: 2, color: 0x2b3a42, alpha: 0.9 });
							}}
						/>
						<Graphics
							draw={(g: PixiGraphics) =>
								drawChevron(
									g,
									c.dir > 0,
									pressed === c.k && !c.dis ? 0x8a8a8a : hover === c.k && !c.dis ? GOLD : WHITE,
									STEP.h / 80,
								)}
						/>
					</Container>
				{/each}
			{/if}

			<!-- spin -->
			{#if replay}
				<Container x={SPIN.x} y={SPIN.y} scale={0.9}>
					<ButtonReplay anchor={0.5} />
				</Container>
			{:else}
				<ButtonBetProvider>
					{#snippet children({ key, onpress })}
						{@const stopping = key === 'stop_default' || key === 'stop_disabled'}
						<!-- Hypno (2026-11-09): a player who cannot afford the bet is TOLD
						     SO (stateConfig.explainInsufficientBalance, #222), so the
						     disc stays pressable then, as the shared ButtonBet does — the
						     template dropped the press, leaving a grey disc and no word
						     why on the button route (Space already explained). -->
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
						<OnHotkey hotkey="Space" disabled={stateModal.modal !== null || (cannotAfford && !explains)} onpress={press} />
						<Container
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
							<Graphics
								draw={(g: PixiGraphics) => {
									g.clear();
									g.circle(0, 0, SPIN.r);
									g.fill({ color: WHITE });
									g.stroke({ width: 8, color: INK });
								}}
							/>
							{#if autoRunning}
								<Graphics
									draw={(g: PixiGraphics) => {
										g.clear();
										const q = SPIN.r * 0.62;
										g.roundRect(-q, -q, q * 2, q * 2, SPIN.r * 0.16);
										g.fill({ color: hover === 'spin' ? GOLD : INK });
										g.roundRect(-SPIN.r * 0.34, SPIN.r * 0.7, SPIN.r * 0.68, SPIN.r * 0.34, SPIN.r * 0.17);
										g.fill({ color: INK });
									}}
								/>
								<Text
									anchor={0.5}
									text={stateBet.autoSpinsCounter === Infinity ? '∞' : String(stateBet.autoSpinsCounter)}
									style={text(stateBet.autoSpinsCounter > 99 ? SPIN.r * 0.4 : SPIN.r * 0.52, hover === 'spin' ? INK : WHITE, '900')}
								/>
								<Text y={SPIN.r * 0.87} anchor={0.5} text={autoRunSize} style={text(SPIN.r * 0.22, WHITE, '900')} />
							{:else}
								<Container rotation={spinAngle}>
									<Graphics
										draw={(g: PixiGraphics) =>
											drawSpinIcon(
												g,
												SPIN.r * 0.54,
												stopping || dis || pressed === 'spin' ? SPIN_GREY : hover === 'spin' ? GOLD : INK,
												autoPanel && !stopping,
											)}
									/>
								</Container>
							{/if}
						</Container>
					{/snippet}
				</ButtonBetProvider>
			{/if}

			<!-- autoplay + turbo under the spin disc -->
			{#if !replay}
				<Container
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
					onpointerup={(e) => {
						up();
						if (e.pointerType === 'touch') hover = null;
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
								color: pressed === 'auto' ? SMALL_PRESS : autoRunning ? 0xbdbdbd : hover === 'auto' ? SMALL_HOVER : SMALL_IDLE,
							});
							g.stroke({ width: 5, color: INK });
						}}
					/>
					<Graphics
						draw={(g: PixiGraphics) =>
							drawAutoIcon(g, SMALL_R * 0.5, pressed === 'auto' ? SMALL_PRESS_ICON : autoRunning ? 0x6f6f6f : INK)}
					/>
				</Container>
			{/if}
			<Container
				x={replay ? SPIN.x : G.TURBO.x}
				y={replay ? G.AUTO.y : G.TURBO.y}
				eventMode="static"
				cursor="pointer"
				onpointerover={over('turbo')}
				onpointerout={() => {
					out();
					up();
				}}
				onpointerdown={down('turbo')}
				onpointerup={(e) => {
					up();
					if (e.pointerType === 'touch') hover = null;
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
							g.fill({ color: SMALL_PRESS });
							g.stroke({ width: 5, color: 0x6b5a2a });
						} else if (stateBet.isTurbo) {
							g.fill({ color: INK });
							g.stroke({ width: 5, color: GOLD });
						} else {
							g.fill({ color: hover === 'turbo' ? SMALL_HOVER : SMALL_IDLE });
							g.stroke({ width: 5, color: INK });
						}
					}}
				/>
				<!-- Hypno (2026-11-09): turbo 2 shows TWO bolts, as the rules page
				     and the old bar say. The template marked it with a "2" drawn
				     in INK on the INK face of the lit button, which could not be
				     seen, so turbo 1 and turbo 2 looked the same. -->
				{#if turbo2}
					<Container x={-SMALL_R * 0.24}>
						<Graphics draw={(g: PixiGraphics) => drawBolt(g, SMALL_R * 0.46, boltColor)} />
					</Container>
					<Container x={SMALL_R * 0.24}>
						<Graphics draw={(g: PixiGraphics) => drawBolt(g, SMALL_R * 0.46, boltColor)} />
					</Container>
				{:else}
					<Graphics draw={(g: PixiGraphics) => drawBolt(g, SMALL_R * 0.6, boltColor)} />
				{/if}
			</Container>

			<!-- autoplay rounds panel, above the spin cluster -->
			{#if autoPanel}
				{@const P = { ...G.AUTOPANEL, w: 488, h: 288 }}
				<Container x={P.x} y={P.y} eventMode="static" alpha={panelFade}>
					<Graphics
						draw={(g: PixiGraphics) => {
							g.clear();
							g.roundRect(0, 0, P.w, P.h, 12);
							g.fill({ color: POPUP, alpha: 0.96 });
						}}
					/>
					<Text x={P.w / 2} y={30} anchor={0.5} text={i18nDerived.autoSpin()} style={text(26, WHITE)} />
					<Text x={P.w / 2} y={58} anchor={0.5} text={stateI18nDerived.translate('ROUNDS')} style={text(18, 0xb8b8b8, '600')} />
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
							onpointerup={() => pickRounds(o)}
						>
							<Graphics
								draw={(g: PixiGraphics) => {
									g.clear();
									g.roundRect(0, 0, 148, 56, 8);
									g.fill({ color: sel ? GOLD : hover === `r${o}` ? 0x1a1c22 : CELL });
								}}
							/>
							<Text x={74} y={28} anchor={0.5} text={o} style={text(22, sel ? INK : WHITE)} />
						</Container>
					{/each}
				</Container>
			{/if}
		</Container>
	</Container>
</MainContainer>

<!-- ── menu panel: rises above the left column ─────────────────────────────── -->
{#if stateUi.menuOpen}
	<MainContainer standard>
		<Container x={leftX} y={floorY}>
			<Container x={MENU.x} y={menuTop} eventMode="static" alpha={panelFade}>
				<Graphics
					draw={(g: PixiGraphics) => {
						g.clear();
						g.roundRect(0, 0, MENU.w, MENU.row * MENU_ROWS + 24, 12);
						// opaque (Hypno): at 0.96 the circus props behind the panel
						// showed through as dark ghosts
						g.fill({ color: CONSOLE, alpha: 1 });
						g.stroke({ width: 2, color: 0x2b3a42 });
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
						<Rectangle width={MENU.w} height={MENU.row} alpha={hover === row.k ? 0.08 : 0.001} backgroundColor={WHITE} />
						<Text x={44} y={MENU.row / 2} anchor={0.5} text={row.glyph} style={text(28, WHITE)} />
						<Text x={86} y={MENU.row / 2} anchor={{ x: 0, y: 0.5 }} text={row.label} style={text(24, hover === row.k ? GOLD : WHITE, '700')} />
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
						<Rectangle width={MENU.w} height={MENU.row} alpha={0.001} backgroundColor={WHITE} />
						{#if sl.k === 'sfx'}
							<!-- drawn, not the 🔊 emoji: an emoji renders as a grey colour
							     picture that differs per OS, beside white text glyphs -->
							<Container x={44} y={MENU.row / 2}>
								<Graphics draw={(g: PixiGraphics) => drawSpeaker(g, 26, WHITE)} />
							</Container>
						{:else}
							<Text x={44} y={MENU.row / 2} anchor={0.5} text={sl.glyph} style={text(24, WHITE)} />
						{/if}
						<Graphics
							draw={(g: PixiGraphics) => {
								g.clear();
								const y = MENU.row / 2;
								g.roundRect(SLIDER.x0, y - 4, SLIDER.x1 - SLIDER.x0, 8, 4);
								g.fill({ color: 0x3a464d });
								const x = SLIDER.x0 + ((SLIDER.x1 - SLIDER.x0) * sl.value) / 100;
								g.roundRect(SLIDER.x0, y - 4, x - SLIDER.x0, 8, 4);
								g.fill({ color: WHITE });
								g.circle(x, y, 13);
								g.fill({ color: WHITE });
								g.stroke({ width: 3, color: INK });
							}}
						/>
					</Container>
				{/each}
			</Container>
		</Container>
	</MainContainer>
{/if}

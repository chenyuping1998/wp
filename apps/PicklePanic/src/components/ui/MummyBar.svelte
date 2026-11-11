<script lang="ts">
	// THE BET BAR, v3: the connected console (collaborator yuping's "第三版",
	// Mummy Mayhem's MummyBar, origin/main f1f4992a), as Hypno Monkey runs it
	// (wp-hypno 71566881) — the buy tile, then one console holding the menu,
	// BALANCE (and WIN beside it while a win shows), the BET box over its level
	// track, the ▲/▼ steppers, Spin, and Auto Spin over Turbo. Geometry in
	// ./mummyBarGeometry.ts, shared with game/stageLayout.ts so the board and the
	// cast stand clear of exactly what is drawn here.
	//
	// Pickle Panic (2026-11-10, Stone 「也拿來套用在酸黃瓜上」): the layout and
	// behaviour are v3's; the dress is this game's own, the one its old bar wore
	// (game/uiTheme.ts 'print' skin) — a paper console with an ink edge, a
	// dotted inner rule and a hard ink offset like every printed card here; the
	// mustard ring buttons with the green relish icons; the red-capped alarm
	// button for Spin; the Pickle Jar on a mustard buy tile; Bungee captions and
	// Anton figures. Hover lights a control in the game's own red or mustard,
	// never grey (house rule 2026-10-01).
	//
	// Carried over from Hypno's fixes to the template: the click-catcher is
	// mounted for good (an {#if} one is added above the bar by pixi-svelte and
	// swallows Spin and the autoplay panel), Spin stays pressable when the
	// balance is short so the player is told why, the menu's speaker is drawn
	// (no emoji) and its panel is opaque, and the bar stands on the SCREEN's
	// bottom. This workspace's shared state has one turbo tier, so Turbo is on /
	// off, as the old bar's was. The buy menu keeps its own stake control in its
	// header, so the console stays up under it (Mummy fades it out for a pill).
	//
	// The behaviour pieces are the shared package's (ButtonBetProvider decides
	// spin / stop, ButtonReplay drives replays, the stake-change cooldown) — only
	// the FACE is ours. Deep imports: this workspace's components-ui-pixi has no
	// customLayout hook, so the game mounts this bar itself (ui/PickleUI.svelte).
	import { Tween } from 'svelte/motion';
	import { MainContainer } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { Container, Graphics, Rectangle, Text, Sprite, getContextApp } from 'pixi-svelte';
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
	import { i18nDerived, uiTheme } from 'components-ui-pixi';
	import ButtonBetProvider from 'components-ui-pixi/src/components/ButtonBetProvider.svelte';
	import ButtonReplay from 'components-ui-pixi/src/components/ButtonReplay.svelte';
	import { createBetRepeat, markBetChanged } from 'components-ui-pixi/src/platformUx.svelte';
	import type { Snippet } from 'svelte';

	import { getContext } from '../../game/context';
	import { GAME_FONT, NUMBER_FONT } from '../../game/fonts';
	import { inlineBetAnchor } from '../../game/inlineBetAnchor.svelte';
	import { barGroup } from './mummyBarGeometry';

	const props: { gameName: Snippet; logo: Snippet } = $props();
	const context = getContext();
	const pixiApp = getContextApp();

	// ── palette: the game's print inks (game/uiTheme.ts 'print', the cards) ────
	const PAPER = 0xf5e6be;
	const PAPER_DEEP = 0xe8d4a2;
	const INK = 0x171c1a;
	const INK_SOFT = 0x4a4846;
	const RED = 0xc45240;
	const MUSTARD = 0xf0b838;
	const RELISH = 0x6f9f32;
	const RELISH_DARK = 0x3a6a28;

	// ── geometry ── tables and placement in ./mummyBarGeometry.ts (WIDE /
	// PORTRAIT, barGroup), shared with game/stageLayout.ts
	const box = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const group = $derived(barGroup(context.stateLayoutDerived.canvasSizes(), box));
	const portrait = $derived(group.portrait);
	const G = $derived(group.G);
	const s = $derived(group.s);
	const gx = $derived(group.gx);
	const gy = $derived(group.gy);

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
	// the ring buttons' art (ui_button_*.png): the ring fills 236 of 256
	const RING = $derived((SMALL_R * 2 * 256) / 236);
	// the relish icons fill ~82% of their 256 canvas
	const SMALL_ICON = $derived(SMALL_R * 1.32);

	// ── state that decides how everything looks ───────────────────────────────
	const idle = $derived(context.stateXstateDerived.isIdle());
	const autoRunning = $derived(stateBetDerived.hasAutoBetCounter());
	const replay = $derived(stateReplay.enabled);
	const activation = $derived(stateBetDerived.activeBetMode()?.type === 'activate');
	const hideBuy = $derived(uiTheme.buyBonusHideInFreeSpins && stateUi.freeSpinCounterShow);
	const cannotAfford = $derived(!stateBetDerived.isBetCostAvailable());
	const explains = $derived(stateConfig.explainInsufficientBalance);

	let autoPanel = $state(false);
	// both pop-ups fade in over ~70 ms (the reference: three frames at 50 fps)
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
	// the ring buttons' face under the cursor / a held press (the old bar's art)
	const ringKey = (k: string, on = false) =>
		pressed === k ? 'gbUiButtonPressV2' : on ? 'gbUiButtonPrintOn' : hover === k ? 'gbUiButtonHoverV2' : 'gbUiButtonV2';

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
	// WIN starts past the wider of BALANCE's caption and its amount: in a replay
	// the amount is a dash and the template's WIN sat on the caption (Pickle)
	const winX = $derived(Math.max(balanceWidth, balanceLabelWidth) + 26);
	// "Labels overlapping on large amounts" has come back from certification
	// before: a nine-figure Gold Coin balance plus a win can outgrow the span up
	// to the bet box, so both shrink together when they would.
	const readoutRoom = $derived(BETBOX.x - 28 - BAL_X);
	const readoutScale = $derived(
		Math.min(1, readoutRoom / Math.max(1, stateBet.winBookEventAmount > 0 ? winX + winWidth : Math.max(balanceWidth, balanceLabelWidth))),
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
	// one press, one step (Stake review 2026-10-04): the shared repeat is inert
	const upRepeat = createBetRepeat(() => (upDisabled ? upRepeat.stop() : step(1)));
	const downRepeat = createBetRepeat(() => (downDisabled ? downRepeat.stop() : step(-1)));
	const steppers = $derived([
		{ dir: 1 as const, y: MID - 28, dis: upDisabled, rep: upRepeat, k: 'up' },
		{ dir: -1 as const, y: MID + 28, dis: downDisabled, rep: downRepeat, k: 'down' },
	]);

	let betValueWidth = $state(100);
	const betValueScale = $derived(Math.min(1, (BETBOX.w - 18) / Math.max(1, betValueWidth)));
	const betLit = $derived(idle && !replay && (hover === 'bet' || pressed === 'bet'));

	const openBetMenu = (event: FederatedPointerEvent) => {
		if (!idle || replay) return;
		autoPanel = false;
		stateUi.menuOpen = false;
		const target = event.currentTarget;
		inlineBetAnchor.measure = () => {
			const bounds = target.getBounds();
			const app = pixiApp.stateApp.pixiApplication!;
			const canvas = app.canvas.getBoundingClientRect();
			const sx = canvas.width / app.screen.width;
			const sy = canvas.height / app.screen.height;
			return { left: canvas.left + bounds.x * sx, top: canvas.top + bounds.y * sy, width: bounds.width * sx, height: bounds.height * sy };
		};
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = { name: 'betAmountMenu' };
	};

	// ── buy tile (ButtonBuyBonus's rules) ──────────────────────────────────────
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

	// ── turbo (ButtonTurbo's rules: on / off) ──────────────────────────────────
	const pressTurbo = () => {
		if (stateBet.isSpaceHold) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateBetDerived.updateIsTurbo(!stateBet.isTurbo, { persistent: true });
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
	// Pickle: on a phone held upright the template's pop-ups came out ~175px
	// wide with ~20px rows, under a thumb's reach; there they are drawn larger,
	// still rising from the console (menu) and over the controls row (autoplay)
	const POP = $derived(portrait ? 1.6 : 1);
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
	const menuRows = $derived([
		{ k: 'gameRules' as const, label: i18nDerived.info(), icon: 'gbIconInfo' },
		{ k: 'payTable' as const, label: i18nDerived.payTable(), icon: 'gbIconPayTable' },
		{ k: 'settings' as const, label: i18nDerived.settings(), icon: 'gbIconSettings' },
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
	// the alarm button's paper face sits a little under the disc's centre: the
	// red cap takes the top of the art (ui_spin_rest.png, face centroid 274/512)
	const SPIN_FACE_Y = $derived(SPIN.r * 0.07);

	// ── drawing helpers ────────────────────────────────────────────────────────
	const caption = (size: number, fill: number) => ({ fontFamily: GAME_FONT, fontWeight: '400' as const, fontSize: size, fill });
	const figure = (size: number, fill: number) => ({ fontFamily: NUMBER_FONT, fontWeight: '400' as const, fontSize: size, fill });

	// a printed panel: hard ink offset, paper, ink edge, a dotted rule inside
	const drawPrinted = (g: PixiGraphics, x: number, y: number, w: number, h: number, r: number, fill = PAPER) => {
		g.roundRect(x + 7, y + 7, w, h, r);
		g.fill({ color: INK, alpha: 0.42 });
		g.roundRect(x, y, w, h, r);
		g.fill({ color: fill });
		g.stroke({ width: 5, color: INK });
		// dots every ~15 units along a rect 11 inside the edge
		const ix = x + 11;
		const iy = y + 11;
		const iw = w - 22;
		const ih = h - 22;
		const ir = Math.max(2, r - 9);
		const runs: [number, number, number, number][] = [
			[ix + ir, iy, ix + iw - ir, iy],
			[ix + iw, iy + ir, ix + iw, iy + ih - ir],
			[ix + iw - ir, iy + ih, ix + ir, iy + ih],
			[ix, iy + ih - ir, ix, iy + ir],
		];
		for (const [x0, y0, x1, y1] of runs) {
			const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 15));
			for (let i = 0; i <= n; i++) g.circle(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, 1.9);
		}
		g.fill({ color: INK, alpha: 0.5 });
	};

	// ▲/▼ in the relish icons' manner: green over a fat ink line
	const drawChevron = (g: PixiGraphics, upward: boolean, color: number) => {
		g.clear();
		const w = 22;
		const h = 20 * (upward ? -1 : 1);
		for (const [width, c] of [
			[19, INK],
			[9, color],
		] as const) {
			g.moveTo(-w, -h / 2);
			g.lineTo(0, h / 2);
			g.lineTo(w, -h / 2);
			g.stroke({ width, color: c, cap: 'round', join: 'round' });
		}
	};

	// ∞, drawn: neither Bungee nor Anton has the glyph, and the fallback face's
	// sits small and low beside the Anton figures. A lemniscate `w` wide.
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

	// a loudspeaker for the effects-volume row (no emoji: it renders per OS)
	const drawSpeaker = (g: PixiGraphics, size: number) => {
		g.clear();
		const k = size / 24;
		const cone = [-11, -4, -6, -4, 0, -10, 0, 10, -6, 4, -11, 4].map((v) => v * k);
		g.poly(cone);
		g.fill({ color: RELISH });
		g.stroke({ width: 2.6 * k, color: INK, join: 'round' });
		for (const r of [5.5, 10]) {
			const a = 0.75;
			g.moveTo((2 + Math.cos(-a) * r) * k, Math.sin(-a) * r * k);
			g.arc(2 * k, 0, r * k, -a, a);
			g.stroke({ width: 4.6 * k, color: INK, cap: 'round' });
			g.moveTo((2 + Math.cos(-a) * r) * k, Math.sin(-a) * r * k);
			g.arc(2 * k, 0, r * k, -a, a);
			g.stroke({ width: 2 * k, color: RELISH, cap: 'round' });
		}
	};

	// a quaver for the music row, relish on ink like the icon set
	const drawNote = (g: PixiGraphics, size: number) => {
		g.clear();
		const k = size / 24;
		for (const [extra, c] of [
			[2.6, INK],
			[0, RELISH],
		] as const) {
			g.ellipse(-4 * k, 7 * k, 5 * k + extra * k * 0.5, 3.8 * k + extra * k * 0.5);
			g.fill({ color: c });
			g.moveTo(0.6 * k, 7 * k);
			g.lineTo(0.6 * k, -10 * k);
			g.quadraticCurveTo(6 * k, -6 * k, 8 * k, -1 * k);
			g.stroke({ width: (2.6 + extra) * k, color: c, cap: 'round', join: 'round' });
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

<!-- a click anywhere else closes the menu / autoplay panel. Mounted for good
     and only switched on while a panel is open: pixi-svelte adds every node
     with addChild and nothing here sorts by zIndex, so an {#if open} version is
     appended ABOVE the bar the moment a panel opens and swallows the presses on
     the round counts and on Spin (the template's bug, fixed in Hypno first). -->
<Rectangle
	zIndex={1}
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

<Container zIndex={2}>
<MainContainer standard>
	<Container x={gx} y={gy} scale={s}>
		<!-- ── buy tile: the Pickle Jar on mustard ───────────────────────────── -->
		{#if !replay && !hideBuy}
			<Container
				x={BUY.x + BUY.w / 2}
				y={BUY.y + BUY.h / 2}
				eventMode="static"
				cursor={buyDisabled ? 'default' : 'pointer'}
				alpha={buyDisabled ? 0.5 : 1}
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
								g.fill({ color: RED, alpha: 0.1 });
							}
						}}
					/>
				{/if}
				<Graphics
					draw={(g: PixiGraphics) => {
						g.clear();
						g.roundRect(-BUY.w / 2 + 7, -BUY.h / 2 + 7, BUY.w, BUY.h, BUY.r);
						g.fill({ color: INK, alpha: 0.42 });
						g.roundRect(-BUY.w / 2, -BUY.h / 2, BUY.w, BUY.h, BUY.r);
						g.fill({ color: pressed === 'buy' ? 0xd99a26 : hover === 'buy' && !buyDisabled ? 0xf6c95a : MUSTARD });
						g.stroke({ width: 6, color: INK });
						g.roundRect(-BUY.w / 2 + 10, -BUY.h / 2 + 10, BUY.w - 20, BUY.h - 20, BUY.r - 8);
						g.stroke({ width: 2, color: INK, alpha: 0.35 });
					}}
				/>
				<!-- p.png: the jar, ~79% of its canvas -->
				<Sprite key="gbP" anchor={0.5} y={2} width={BUY.h * 0.98} height={BUY.h * 0.98} />
				{#if activation}
					<Container y={BUY.h / 2 - 22}>
						<Graphics
							draw={(g: PixiGraphics) => {
								g.clear();
								g.roundRect(-44, -15, 88, 30, 15);
								g.fill({ color: INK });
							}}
						/>
						<Text anchor={0.5} text="ON" style={caption(20, MUSTARD)} />
					</Container>
				{/if}
			</Container>
		{/if}

		<!-- ── console ────────────────────────────────────────────────────── -->
		<Graphics
			draw={(g: PixiGraphics) => {
				g.clear();
				drawPrinted(g, PANEL.x, PANEL.y, PANEL.w, PANEL.h, PANEL.r);
			}}
		/>

		<!-- menu: the relish bars, the relish cross while the menu is open -->
		<Container
			x={MENU_X}
			y={MID}
			eventMode="static"
			cursor="pointer"
			onpointerover={over('menu')}
			onpointerout={out}
			onpointerup={pressMenu}
		>
			<Rectangle anchor={0.5} width={90} height={90} alpha={0.001} backgroundColor={0x000000} />
			{#if hover === 'menu' || stateUi.menuOpen}
				<Graphics
					draw={(g: PixiGraphics) => {
						g.clear();
						g.circle(0, 0, 40);
						g.fill({ color: MUSTARD, alpha: 0.55 });
					}}
				/>
			{/if}
			<Sprite key={stateUi.menuOpen ? 'gbIconMenuExit' : 'gbIconMenu'} anchor={0.5} width={74} height={74} />
		</Container>

		<!-- balance, and the win beside it while one is showing -->
		<Container x={BAL_X} y={MID} scale={readoutScale}>
			<Text
				y={-25}
				anchor={{ x: 0, y: 0.5 }}
				text={i18nDerived.balance()}
				style={caption(21, INK_SOFT)}
				onresize={({ width }) => (balanceLabelWidth = width)}
			/>
			<Text
				y={14}
				anchor={{ x: 0, y: 0.5 }}
				text={replay ? '—' : balanceText}
				style={figure(40, INK)}
				onresize={({ width }) => (balanceWidth = width)}
			/>
			{#if showWin}
				<Text x={winX} y={-25} anchor={{ x: 0, y: 0.5 }} text={i18nDerived.win()} style={caption(21, RED)} />
				<Text
					x={winX}
					y={14}
					anchor={{ x: 0, y: 0.5 }}
					text={winText}
					style={figure(40, RED)}
					onresize={({ width }) => (winWidth = width)}
				/>
			{/if}
		</Container>

		<!-- bet box: label, stake, level track — an ink stamp on the paper -->
		<Container
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
					g.fill({ color: betLit ? RED : INK });
					// level track
					g.roundRect(8, BETBOX.h - 13, BETBOX.w - 16, 7, 3.5);
					g.fill({ color: INK_SOFT });
					g.roundRect(8, BETBOX.h - 13, Math.max(14, (BETBOX.w - 16) * levelFrac), 7, 3.5);
					g.fill({ color: betLit ? PAPER : MUSTARD });
				}}
			/>
			<Text x={BETBOX.w / 2} y={27} anchor={0.5} text={i18nDerived.betAmount()} style={caption(20, betLit ? PAPER : MUSTARD)} />
			<Text
				x={BETBOX.w / 2}
				y={62}
				anchor={0.5}
				scale={betValueScale}
				text={numberToCurrencyString(stateBetDerived.betCost())}
				style={figure(38, PAPER)}
				onresize={({ width }) => (betValueWidth = width)}
			/>
		</Container>

		<!-- stake up / down -->
		{#if !replay}
			{#each steppers as c (c.k)}
				<Container
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
					<Graphics draw={(g: PixiGraphics) => drawChevron(g, c.dir > 0, pressed === c.k ? RELISH_DARK : hover === c.k && !c.dis ? RED : RELISH)} />
				</Container>
			{/each}
		{/if}

		<!-- ── spin: the red-capped alarm button ────────────────────────────── -->
		{#if replay}
			<Container x={SPIN.x} y={SPIN.y} scale={0.9}>
				<ButtonReplay anchor={0.5} />
			</Container>
		{:else}
			<ButtonBetProvider>
				{#snippet children({ key, onpress })}
					{@const stopping = key === 'stop_default' || key === 'stop_disabled'}
					<!-- a player who cannot afford the bet is TOLD SO
					     (stateConfig.explainInsufficientBalance, #222): the button
					     stays pressable then, as the shared ButtonBet does -->
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
								g.fill({ color: 0x000000, alpha: 0.001 });
							}}
						/>
						<Sprite
							key={dis ? 'gbUiSpinDisabledV2' : pressed === 'spin' ? 'gbUiSpinPressV2' : hover === 'spin' ? 'gbUiSpinHoverV2' : 'gbUiSpinV2'}
							anchor={0.5}
							width={SPIN.r * 2.08}
							height={SPIN.r * 2.08}
						/>
						{#if autoRunning}
							<!-- the rounds left, and under them the run's size, on an ink tag -->
							<Container y={SPIN_FACE_Y}>
								<Graphics
									draw={(g: PixiGraphics) => {
										g.clear();
										const q = SPIN.r * 0.52;
										g.roundRect(-q, -q, q * 2, q * 2, SPIN.r * 0.14);
										g.fill({ color: hover === 'spin' ? RED : INK });
									}}
								/>
								{#if stateBet.autoSpinsCounter === Infinity}
									<Graphics y={-SPIN.r * 0.1} draw={(g: PixiGraphics) => drawInfinity(g, SPIN.r * 0.66, PAPER)} />
								{:else}
									<Text
										y={-SPIN.r * 0.1}
										anchor={0.5}
										text={String(stateBet.autoSpinsCounter)}
										style={figure(stateBet.autoSpinsCounter > 99 ? SPIN.r * 0.4 : SPIN.r * 0.52, PAPER)}
									/>
								{/if}
								{#if autoRunSize === '∞'}
									<Graphics y={SPIN.r * 0.34} draw={(g: PixiGraphics) => drawInfinity(g, SPIN.r * 0.22, MUSTARD)} />
								{:else}
									<Text y={SPIN.r * 0.35} anchor={0.5} text={autoRunSize} style={caption(SPIN.r * 0.15, MUSTARD)} />
								{/if}
							</Container>
						{:else}
							<Container y={SPIN_FACE_Y} rotation={spinAngle} alpha={stopping || dis ? 0.4 : 1}>
								<Sprite key="gbIconSpinV2" anchor={0.5} width={SPIN.r * 1.12} height={SPIN.r * 1.12} />
							</Container>
							{#if autoPanel && !stopping}
								<!-- autoplay armed: Spin now starts the run -->
								<Graphics
									draw={(g: PixiGraphics) => {
										g.clear();
										const tr = SPIN.r * 0.2;
										g.poly([-tr * 0.55, -tr, tr * 0.95, 0, -tr * 0.55, tr]);
										g.fill({ color: RED });
										g.stroke({ width: 4, color: INK, join: 'round' });
									}}
									y={SPIN_FACE_Y}
								/>
							{/if}
						{/if}
					</Container>
				{/snippet}
			</ButtonBetProvider>
		{/if}

		<!-- ── autoplay + turbo: the mustard ring buttons ─────────────────────── -->
		{#if !replay}
			<Container
				x={G.AUTO.x}
				y={G.AUTO.y}
				eventMode="static"
				cursor={autoDisabled && !autoRunning ? 'default' : 'pointer'}
				alpha={autoDisabled && !autoRunning ? 0.5 : 1}
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
					}}
				/>
				<Sprite key={ringKey('auto', autoRunning || autoPanel)} anchor={0.5} width={RING} height={RING} />
				<Sprite key="gbIconAutoSpin" anchor={0.5} width={SMALL_ICON} height={SMALL_ICON} />
			</Container>
		{/if}
		<Container
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
				}}
			/>
			<Sprite key={ringKey('turbo', stateBet.isTurbo)} anchor={0.5} width={RING} height={RING} />
			<Sprite key="gbIconTurboV2" anchor={0.5} width={SMALL_ICON} height={SMALL_ICON} />
		</Container>

		<!-- ── autoplay rounds panel ──────────────────────────────────────── -->
		{#if autoPanel}
			{@const P = { w: 488, h: 288, ...(portrait ? { x: G.W / 2 - 244 * POP, y: G.SPIN.y - G.SPIN.r - 24 - 288 * POP } : G.AUTOPANEL) }}
			<Container x={P.x} y={P.y} scale={POP} eventMode="static" alpha={panelFade} onpointerup={(e) => e.stopPropagation()}>
				<Graphics
					draw={(g: PixiGraphics) => {
						g.clear();
						drawPrinted(g, 0, 0, P.w, P.h, 12);
					}}
				/>
				<Text x={P.w / 2} y={32} anchor={0.5} text={i18nDerived.autoSpin()} style={caption(26, INK)} />
				<Text x={P.w / 2} y={60} anchor={0.5} text={stateI18nDerived.translate('NUMBER OF ROUNDS')} style={caption(15, INK_SOFT)} />
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
								g.fill({ color: sel ? RED : hover === `r${o}` ? MUSTARD : PAPER_DEEP });
								g.stroke({ width: 3, color: INK });
							}}
						/>
						{#if o === '∞'}
							<Graphics x={74} y={28} draw={(g: PixiGraphics) => drawInfinity(g, 40, sel ? PAPER : INK)} />
						{:else}
							<Text x={74} y={30} anchor={0.5} text={o} style={figure(28, sel ? PAPER : INK)} />
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
							g.fill({ color: hover === 'start' ? 0xd8664f : RED });
							g.stroke({ width: 3, color: INK });
						}}
					/>
					<Text x={74} y={30} anchor={0.5} text="START" style={caption(22, PAPER)} />
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
			<Container x={MENU.x} y={menuTop} scale={POP} eventMode="static" alpha={panelFade}>
				<Graphics
					draw={(g: PixiGraphics) => {
						g.clear();
						// opaque: at 0.96 the board's symbols showed through (Hypno)
						drawPrinted(g, 0, 0, MENU.w, MENU.row * MENU_ROWS + 24, 12);
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
						<Rectangle x={8} width={MENU.w - 16} height={MENU.row} alpha={hover === row.k ? 0.45 : 0.001} backgroundColor={MUSTARD} />
						<Sprite key={row.icon} anchor={0.5} x={46} y={MENU.row / 2} width={50} height={50} />
						<Text x={86} y={MENU.row / 2 + 1} anchor={{ x: 0, y: 0.5 }} text={row.label} style={caption(23, hover === row.k ? RED : INK)} />
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
						<Rectangle width={MENU.w} height={MENU.row} alpha={0.001} backgroundColor={PAPER} />
						<Container x={46} y={MENU.row / 2}>
							{#if sl.k === 'sfx'}
								<Graphics draw={(g: PixiGraphics) => drawSpeaker(g, 30)} />
							{:else}
								<Graphics draw={(g: PixiGraphics) => drawNote(g, 30)} />
							{/if}
						</Container>
						<Graphics
							draw={(g: PixiGraphics) => {
								g.clear();
								const y = MENU.row / 2;
								g.roundRect(SLIDER.x0, y - 5, SLIDER.x1 - SLIDER.x0, 10, 5);
								g.fill({ color: PAPER_DEEP });
								g.stroke({ width: 2, color: INK });
								const x = SLIDER.x0 + ((SLIDER.x1 - SLIDER.x0) * sl.value) / 100;
								g.roundRect(SLIDER.x0, y - 5, Math.max(10, x - SLIDER.x0), 10, 5);
								g.fill({ color: RED });
								g.circle(x, y, 13);
								g.fill({ color: MUSTARD });
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

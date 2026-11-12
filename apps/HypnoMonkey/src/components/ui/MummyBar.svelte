<script lang="ts">
	// THE BET BAR, rebuilt after the floating console of the 2026-11-07 reference
	// capture (C:\Users\cheny\Videos\Captures\…08-15-56.mp4). Measured off that
	// capture at 1920x1020 with the game frame 960x540 inside it, so every number
	// below is "capture pixels x 2" in the standard 1920x1080 box:
	//
	//   buy tile      174 x 172, yellow #ecc254, 6 black rim, 22 corner, left
	//   console       x 200..1528 of a 1528-wide group, 142 tall, 40 off the floor,
	//                 #172329 at 92%, 16 corner
	//   menu          three 68 x 10 bars at x 264
	//   balance       label (gold, 22) over value (white, 38) from x 324; the win
	//                 amount appears beside it in gold while a win is showing
	//   bet box       164 x 110 #111111, label / value / a level track under it
	//   up / down     56-wide chevrons at x 1152, 28 above / below the centre
	//   spin          r 96 white disc, 8 black rim, centre 1314 — overhangs the
	//                 console top and bottom
	//   auto / turbo  r 34 white discs stacked at x 1462
	//
	// Uses uiTheme.customLayout (components-ui-pixi): the package hands this
	// component the same snippets every built-in layout gets, and the shared
	// behaviour pieces (ButtonBetProvider, cycleTurbo, createBetRepeat,
	// markBetChanged) so the rules certification already settled — the
	// insufficient-balance message, the stake-change cooldown, stopping an
	// autoplay — are the package's, not re-derived here. Only the FACE is ours.
	//
	//
	// Hypno Monkey (2026-11-09): bet bar v3, ported from Mummy Mayhem
	// (apps/MummyMayhem木乃伊, origin/main f1f4992a) when Stone picked the
	// connected console over v4's split pieces. The face is the template's;
	// the changes, each marked "Hypno" where it is made: the click-catcher is
	// mounted for good (the {#if} one was added above the bar and swallowed
	// Spin and the autoplay panel), turbo 2 shows two gold bolts (the "2" was
	// ink on the ink face), hover warms the white discs to pale gold instead of
	// greying them, Spin stays pressable when the balance is short so the player
	// is told why, the menu's speaker is drawn (no emoji) and its panel is
	// opaque, and the bar tells the background where the props' row starts.
	import { GraphicsPath, Matrix } from 'pixi.js';
	import { BUY_ICON } from '../../game/buyIcon';
	import { Tween } from 'svelte/motion';
	import { MainContainer } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { Container, Graphics, Rectangle, Text, Sprite,getContextApp } from 'pixi-svelte';
	import type { Graphics as PixiGraphics,FederatedPointerEvent } from 'pixi.js';
	import {inlineBetAnchor} from '../../game/inlineBetAnchor.svelte';
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
	import { barGroup, propsAnchor } from './mummyBarGeometry';

	const props: LayoutUiProps = $props();
	const context = getContext();
	const pixiApp=getContextApp();

	// ── palette (sampled from the capture) ─────────────────────────────────────
	const GOLD = 0xecc254;
	const INK = 0x0a0804;
	const CONSOLE = 0x172329;
	const BOX = 0x111111;
	const WHITE = 0xffffff;
	const POPUP = 0x2e2f32;
	const CELL = 0x06070a;
	// Nunito (static/fonts, OFL) — CJK labels fall through to the system's
	const FONT = BAR_FONT;

	// ── geometry ── tables and placement in ./mummyBarGeometry.ts (WIDE /
	// PORTRAIT, barGroup), shared with game/stageLayout.ts and the props
	const box = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const group = $derived(barGroup(context.stateLayoutDerived.canvasSizes(), box));
	const portrait = $derived(group.portrait);
	const G = $derived(group.G);
	const s = $derived(group.s);
	const gx = $derived(group.gx);
	const gy = $derived(group.gy);

	const BUY = $derived(G.BUY);
	// Hypno: tell the background where its props' row stands (game/barFootprint)
	$effect(() => {
		const at = propsAnchor(context.stateLayoutDerived.canvasSizes(), box);
		barFootprint.left = at.left;
		barFootprint.ground = at.ground;
	});
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

	// ── state that decides how everything looks ───────────────────────────────
	const idle = $derived(context.stateXstateDerived.isIdle());
	const autoRunning = $derived(stateBetDerived.hasAutoBetCounter());
	const replay = $derived(stateReplay.enabled);
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
	// a colour or a state change (50 fps frame study of the capture, 2026-11-07).
	// Kept as a function so every control stays wired the same way.
	const look = (_k: string, _dis = false) => 1;
	// small round buttons: white idle, light grey under the cursor, a dark flash
	// for the ~0.1 s the press is held, then whatever state the press set
	const SMALL_IDLE = 0xffffff;
	// Hypno: the template's 0xe4e4e4 greyed the white disc under the cursor; the
	// house rule is that hover lights a control in the game's own colour and
	// never greys it, so the disc warms to a pale gold instead.
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
	let balanceLabelWidth = $state(0);
	let winWidth = $state(0);
	// WIN starts past the wider of BALANCE's caption and its amount: with a dash
	// for the amount (replay) the template's WIN sat on the caption (fixed in
	// Pickle Panic's copy first, 2026-11-10)
	const winX = $derived(Math.max(balanceWidth, balanceLabelWidth) + 26);
	// Certification has sent back "labels overlapping on large amounts" before: a
	// nine-figure Gold Coin balance plus a win can outgrow the span up to the bet
	// box, so both shrink together when they would.
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
	const upRepeat = createBetRepeat(() => (upDisabled ? upRepeat.stop() : step(1)));
	const downRepeat = createBetRepeat(() => (downDisabled ? downRepeat.stop() : step(-1)));
	const steppers = $derived([
		{ dir: 1 as const, y: MID - 28, dis: upDisabled, rep: upRepeat, k: 'up' },
		{ dir: -1 as const, y: MID + 28, dis: downDisabled, rep: downRepeat, k: 'down' },
	]);

	// While the feature-buy menu is open the console fades out over ~0.12 s and
	// the menu's own bet pill (BuyMenuBetPill) takes over, as the reference does.
	const buyMenuOpen = $derived(stateModal.modal?.name === 'buyBonus');
	const barFade = new Tween(1, { duration: 120 });
	$effect(() => {
		barFade.set(buyMenuOpen ? 0 : 1);
	});

	let betValueWidth = $state(100);
	const betValueScale = $derived(Math.min(1, (BETBOX.w - 18) / Math.max(1, betValueWidth)));

	const openBetMenu = (event:FederatedPointerEvent) => {
		if (!idle || replay) return;
		autoPanel=false;
		stateUi.menuOpen=false;
		const target=event.currentTarget;
		inlineBetAnchor.measure=()=>{const bounds=target.getBounds(),app=pixiApp.stateApp.pixiApplication!,canvas=app.canvas.getBoundingClientRect(),sx=canvas.width/app.screen.width,sy=canvas.height/app.screen.height;return{left:canvas.left+bounds.x*sx,top:canvas.top+bounds.y*sy,width:bounds.width*sx,height:bounds.height*sy};};
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = { name: 'betAmountMenu' };
	};

	// ── buy tile (ButtonBuyBonus's rules) ──────────────────────────────────────
	// the tile's face colour, which the glyph's cut-outs also take
	const buyTileFill = $derived(activation ? 0xc99b2e : GOLD);
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
		stateUi.menuOpen=false;
		autoPanel = !autoPanel;
		if (autoPanel) fadeIn();
	};
	const pickRounds = (o: AutoSpinsText) => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateUi.autoSpinsText = o;
	};
	const startAuto = () => {
		if(!idle||replay||autoDisabled)return;
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
	// on a phone held upright the template's pop-ups came out ~175px wide with
	// ~20px rows, under a thumb's reach: there they are drawn 1.6x, still rising
	// from the console (menu) and over the controls row (autoplay) — 2026-11-10
	const POP = $derived(portrait ? 1.6 : 1);
	const MENU = $derived({ x: G.MENU_X0, w: 380, row: 70 });
	const MENU_ROWS = 5;
	const menuTop = $derived(PANEL.y - 16 - (MENU.row * MENU_ROWS + 24) * POP);
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

	// ── icons, redrawn off the reference at 5-8x zoom (2026-11-07) ────────────

	// A chevron at a right angle with round caps: the reference's arms meet at
	// ~90°, not the shallow 55° first drawn.
	const drawChevron = (g: PixiGraphics, up: boolean, color: number) => {
		g.clear();
		const w = 22;
		const h = 20 * (up ? -1 : 1);
		g.moveTo(-w, -h / 2);
		g.lineTo(0, h / 2);
		g.lineTo(w, -h / 2);
		g.stroke({ width: 11, color, cap: 'round', join: 'round' });
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

	// ∞, drawn (2026-11-10): Nunito has no ∞ and the fallback face's sat small
	// and low beside the figures (on the 1.6x portrait panel it read as a dot).
	// A lemniscate `w` wide, as Pickle Panic's bar draws it.
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

	// A loudspeaker, `s` tall, centred: cone + two sound arcs (Hypno: replaces the
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
     Hypno: mounted for good and only switched on while a panel is open.
     pixi-svelte adds every node with addChild and nothing here sorts by
     zIndex, so the template's {#if open} version was appended ABOVE the bar
     the moment a panel opened: it swallowed the presses on the autoplay
     panel's round counts and on Spin, so autoplay could not be started.
     Mounted once, it stays below the bar and both panels. -->
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
	<Container x={gx} y={gy} scale={s} alpha={barFade.current} visible={barFade.current > 0.01}>
		<!-- ── buy tile ───────────────────────────────────────────────────── -->
		{#if !replay && !hideBuy}
			<Container
				x={BUY.x + BUY.w / 2}
				y={BUY.y + BUY.h / 2}
				eventMode="static"
				cursor={buyDisabled ? 'default' : 'pointer'}
				alpha={buyDisabled ? 0.45 : 1}
				scale={look('buy', buyDisabled)}
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

		<!-- ── console ────────────────────────────────────────────────────── -->
		<Graphics
			draw={(g: PixiGraphics) => {
				g.clear();
				g.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, PANEL.r);
				g.fill({ color: CONSOLE, alpha: 0.92 });
				g.stroke({ width: 2, color: 0x2b3a42, alpha: 0.9 });
			}}
		/>

		<!-- menu: three bars, an X while the menu is open -->
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
			<Graphics
				draw={(g: PixiGraphics) => {
					g.clear();
					const c = hover === 'menu' ? GOLD : 0xe8e8e8;
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
				y={-26}
				anchor={{ x: 0, y: 0.5 }}
				text={i18nDerived.balance()}
				style={text(22, GOLD, '700')}
				onresize={({ width }) => (balanceLabelWidth = width)}
			/>
			<Text
				y={12}
				anchor={{ x: 0, y: 0.5 }}
				text={replay ? '—' : balanceText}
				style={text(38, WHITE)}
				onresize={({ width }) => (balanceWidth = width)}
			/>
			{#if showWin}
				<Text x={winX} y={-26} anchor={{ x: 0, y: 0.5 }} text={i18nDerived.win()} style={text(22, GOLD, '700')} />
				<Text
					x={winX}
					y={12}
					anchor={{ x: 0, y: 0.5 }}
					text={winText}
					style={text(38, GOLD)}
					onresize={({ width }) => (winWidth = width)}
				/>
			{/if}
		</Container>

		<!-- bet box: label, stake, level track -->
		<Container
			x={BETBOX.x}
			y={BETBOX.y}
			eventMode="static"
			cursor={idle && !replay ? 'pointer' : 'default'}
			alpha={idle || autoRunning ? 1 : 0.55}
			onpointerover={over('bet')}
			onpointerout={() => {out();up();}}
			onpointerdown={down('bet')}
			onpointerupoutside={up}
			onpointerup={(e) => {up();openBetMenu(e);}}
		>
			<Graphics
				draw={(g: PixiGraphics) => {
					g.clear();
					g.roundRect(0, 0, BETBOX.w, BETBOX.h, BETBOX.r);
					g.fill({ color: idle&&!replay&&(hover==='bet'||pressed==='bet') ? WHITE : BOX });
					// level track
					const tx = 0;
					const tw = BETBOX.w;
					g.roundRect(tx, BETBOX.h - 9, tw, 7, 3.5);
					g.fill({ color: 0x2a2a2a });
					g.roundRect(tx, BETBOX.h - 9, Math.max(14, tw * levelFrac), 7, 3.5);
					g.fill({ color: idle&&!replay&&(hover==='bet'||pressed==='bet') ? INK : WHITE });
				}}
			/>
			<Text x={BETBOX.w / 2} y={28} anchor={0.5} text={i18nDerived.betAmount()} style={text(22, idle&&!replay&&(hover==='bet'||pressed==='bet')?INK:GOLD, '700')} />
			<Text
				x={BETBOX.w / 2}
				y={64}
				anchor={0.5}
				scale={betValueScale}
				text={numberToCurrencyString(stateBetDerived.betCost())}
				style={text(36, idle&&!replay&&(hover==='bet'||pressed==='bet')?INK:WHITE)}
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
					scale={look(c.k, c.dis)}
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
					<Graphics draw={(g: PixiGraphics) => drawChevron(g, c.dir > 0, hover === c.k && !c.dis ? GOLD : WHITE)} />
				</Container>
			{/each}
		{/if}

		<!-- ── spin ───────────────────────────────────────────────────────── -->
		{#if replay}
			<Container x={SPIN.x} y={SPIN.y} scale={0.9}>
				<ButtonReplay anchor={0.5} />
			</Container>
		{:else}
			<ButtonBetProvider>
				{#snippet children({ key, onpress })}
					{@const stopping = key === 'stop_default' || key === 'stop_disabled'}
					<!-- Hypno: a player who cannot afford the bet is TOLD SO
					     (stateConfig.explainInsufficientBalance, #222), so the disc
					     stays pressable then, as the shared ButtonBet does — the
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
						scale={look('spin', dis)}
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
							{#if stateBet.autoSpinsCounter === Infinity}
								<Graphics draw={(g: PixiGraphics) => drawInfinity(g, SPIN.r * 0.78, hover === 'spin' ? INK : WHITE)} />
							{:else}
								<Text
									anchor={0.5}
									text={String(stateBet.autoSpinsCounter)}
									style={text(stateBet.autoSpinsCounter > 99 ? SPIN.r * 0.4 : SPIN.r * 0.52, hover === 'spin' ? INK : WHITE, '900')}
								/>
							{/if}
							{#if autoRunSize === '∞'}
								<Graphics y={SPIN.r * 0.87} draw={(g: PixiGraphics) => drawInfinity(g, SPIN.r * 0.3, WHITE)} />
							{:else}
								<Text
									y={SPIN.r * 0.87}
									anchor={0.5}
									text={autoRunSize}
									style={text(SPIN.r * 0.22, WHITE, '900')}
								/>
							{/if}
						{:else}
							<Container rotation={spinAngle}>
								<Graphics
									draw={(g: PixiGraphics) =>
										drawSpinIcon(
											g,
											SPIN.r * 0.54,
											stopping || dis ? SPIN_GREY : hover === 'spin' ? GOLD : INK,
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
				x={G.AUTO.x}
				y={G.AUTO.y}
				eventMode="static"
				cursor={autoDisabled && !autoRunning ? 'default' : 'pointer'}
				alpha={autoDisabled && !autoRunning ? 0.45 : 1}
				scale={look('auto', autoDisabled && !autoRunning)}
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
							color: pressed === 'auto' ? SMALL_PRESS : autoRunning ? 0xbdbdbd : hover === 'auto' ? SMALL_HOVER : SMALL_IDLE,
						});
						g.stroke({ width: 5, color: INK });
					}}
				/>
				<Graphics draw={(g: PixiGraphics) => drawAutoIcon(g, SMALL_R * 0.5, pressed === 'auto' ? SMALL_PRESS_ICON : autoRunning ? 0x6f6f6f : INK)} />
			</Container>
		{/if}
		<Container
			x={replay && !portrait ? G.AUTO.x : G.TURBO.x}
			y={replay && !portrait ? MID : G.TURBO.y}
			eventMode="static"
			cursor="pointer"
			scale={look('turbo')}
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
			<!-- Hypno: turbo 2 shows TWO bolts, as the rules page says. The
			     template marked it with a "2" drawn in INK on the INK face of the
			     lit button, which could not be seen. -->
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

		<!-- ── autoplay rounds panel ──────────────────────────────────────── -->
		{#if autoPanel}
			{@const P = { w: 488, h: 288, ...(portrait ? { x: G.W / 2 - 244 * POP, y: G.SPIN.y - G.SPIN.r - 24 - 288 * POP } : G.AUTOPANEL) }}
			<Container x={P.x} y={P.y} scale={POP} eventMode="static" alpha={panelFade} onpointerup={(e)=>e.stopPropagation()}>
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
						onpointertap={(e) => {e.stopPropagation();pickRounds(o);}}
					>
						<Graphics
							draw={(g: PixiGraphics) => {
								g.clear();
								g.roundRect(0, 0, 148, 56, 8);
								g.fill({ color: sel ? GOLD : hover === `r${o}` ? 0x1a1c22 : CELL });
							}}
						/>
						{#if o === '∞'}
							<!-- drawn: Nunito has no ∞ (see drawInfinity) -->
							<Graphics x={74} y={28} draw={(g: PixiGraphics) => drawInfinity(g, 34, sel ? INK : WHITE)} />
						{:else}
							<Text x={74} y={28} anchor={0.5} text={o} style={text(22, sel ? INK : WHITE)} />
						{/if}
					</Container>
				{/each}
				<Container x={328} y={216} eventMode="static" cursor="pointer" onpointertap={(e)=>{e.stopPropagation();startAuto();}}>
					<Rectangle width={148} height={56} backgroundColor={GOLD}/>
					<Text x={74} y={28} anchor={.5} text="START" style={text(22,INK)}/>
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
						g.roundRect(0, 0, MENU.w, MENU.row * MENU_ROWS + 24, 12);
						// Hypno: opaque — at 0.96 the board's symbols showed through
						g.fill({ color: CONSOLE });
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
							<!-- Hypno: drawn, not the 🔊 emoji — an emoji renders as a grey
							     colour picture that differs per OS, beside white text glyphs -->
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
	</Container>
{/if}

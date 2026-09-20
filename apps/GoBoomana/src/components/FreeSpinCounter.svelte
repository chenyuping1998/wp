<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { verticalFill } from '../game/gradientFill';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { Graphics, Sprite, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, HOLD_AND_SPIN_MODE_KEY } from '../game/constants';
	import { gameText } from '../game/i18nText';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	// brass plaque left of the board (fs_counter_panel.png, 824×622)
	const PANEL_RATIO = 824 / 622;
	const panelWidth = $derived(SYMBOL_SIZE * 2.1);
	const panelSizes = $derived({ width: panelWidth, height: panelWidth / PANEL_RATIO });
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const position = $derived(
		isPortrait
			? {
					// portrait: centered above the board (no room at the side)
					x: context.stateGameDerived.boardLayout().x - panelSizes.width * 0.5,
					y:
						context.stateGameDerived.boardLayout().y -
						context.stateGameDerived.boardLayout().height * 0.5 -
						panelSizes.height * 1.28 -
						SYMBOL_SIZE * 0.3,
				}
			: {
					x:
						context.stateGameDerived.boardLayout().x -
						context.stateGameDerived.boardLayout().width * 0.5 -
						panelSizes.width -
						SYMBOL_SIZE * 0.6,
					// Pinned near the top of the screen rather than to the board's top
					// edge. With the side-rail UI the Buy Bonus button is centred in
					// the left rail, and the board now fills 94% of the height — the
					// old board-relative position put this plaque straight through it.
					y: context.stateLayoutDerived.mainLayout().height * 0.05,
				},
	);

	let show = $state(false);
	// `current` = spins USED + 1 (set by the updateFreeSpin handler); `total` = window size
	let current = $state(1);
	let total = $state(0);

	const isSuperspin = $derived(stateBet.activeBetModeKey === HOLD_AND_SPIN_MODE_KEY);
	// hold and spin: what matters is how many respins REMAIN
	// (3 → 2 → 1, snapping back to 3 whenever a coin lands)
	const remaining = $derived(Math.max(0, total - (current - 1)));
	const title = $derived(isSuperspin ? gameText('respins') : gameText('freeSpins'));
	const titleSize = $derived(
		Math.min(panelSizes.width * 0.115, (panelSizes.width * 1.35) / Math.max(1, title.length)),
	);

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (emitterEvent) => {
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
		},
	});

	// hold-and-spin pips: one slot per respin in the window, lit while still available
	//
	// v8 path API, not the v7 beginFill/lineStyle shim: with the shim every shape
	// in one Graphics takes the LAST fill set, so lit and spent pips all came out
	// the same colour.
	const drawPips = (g: PixiGraphics) => {
		g.clear();
		if (!isSuperspin || total <= 0) return;
		const gap = panelSizes.width * 0.14;
		const startX = panelSizes.width * 0.5 - ((total - 1) * gap) / 2;
		const y = panelSizes.height * 0.78;
		for (let i = 0; i < total; i++) {
			const lit = i < remaining;
			// stone rim, amber when the respin is still available, slate when spent
			g.circle(startX + i * gap, y, panelSizes.width * 0.035)
				.fill({ color: lit ? 0xffa53a : 0x22252b, alpha: lit ? 1 : 0.85 })
				.stroke({ width: 2, color: 0x6e5e4a });
		}
	};

	// ── THE BLAST LADDER ─────────────────────────────────────────────────────
	//
	// The whole feature is a climb: each rung widens every blast by one reel,
	// and the top rung is a full board of one symbol. The level has been in the
	// state since the first build and nothing drew it, so the climb happened
	// invisibly — a blast would suddenly cover three reels with nothing to say
	// the run had earned that, or how far off five was.
	//
	// Five sticks of dynamite, one per rung, because the level IS the blast's
	// width in reels. Lit sticks are the game's dynamite red; the ones still to
	// earn are slate, the plaque's own colour, so they read as empty slots and
	// not as a second, dimmer kind of dynamite.
	//
	// Only the level, not progress towards the next rung: the book event carries
	// the rung but not the dynamite count, and a bought tier's banked dynamite
	// arrives inside its first event, so the client cannot count it either.
	// Adding it would mean changing the maths' events and republishing books for
	// a smaller thing than the rung itself.
	const level = $derived(Math.max(1, Math.min(stateGame.blastLevel, stateGame.blastMaxLevel)));
	const maxLevel = $derived(Math.max(1, stateGame.blastMaxLevel));
	const isFullBoard = $derived(level >= maxLevel);
	// ONE RUNG AWAY. The last empty stick's fuse smoulders: nothing lit, just an
	// ember at the tip, breathing. It says "the next one could be all five"
	// without promising it, which is what makes the full board a surprise when
	// it does land rather than a thing the player gave up on.
	const isNearFull = $derived(maxLevel > 1 && level === maxLevel - 1);

	// The rung that was just reached pops, then settles. Timed off the clock
	// with setInterval rather than requestAnimationFrame, which stops dead in a
	// hidden tab (see ReelBlast) — nothing awaits this, but the next rung-up
	// should not find a half-finished pop from a minute ago.
	const POP_MS = 520;
	let popRung = $state(-1);
	let popT = $state(1);
	// the full board's sparks and the near-full ember, running only while there
	// is one of them to show
	let sparkT = $state(0);
	let lastLevel = 1;
	let popTimer: ReturnType<typeof setInterval> | undefined;
	$effect(() => {
		const now = level;
		if (now > lastLevel) {
			popRung = now - 1;
			const start = Date.now();
			clearInterval(popTimer);
			popTimer = setInterval(() => {
				popT = Math.min(1, (Date.now() - start) / POP_MS);
				if (popT >= 1) clearInterval(popTimer);
			}, 30);
		}
		lastLevel = now;
	});
	$effect(() => {
		if (!show || !(isFullBoard || isNearFull)) return;
		const start = Date.now();
		const timer = setInterval(() => (sparkT = (Date.now() - start) / 1000), 40);
		return () => clearInterval(timer);
	});
	$effect(() => () => clearInterval(popTimer));

	const drawLadder = (g: PixiGraphics) => {
		g.clear();
		if (isSuperspin) return;
		const w = panelSizes.width;
		const h = panelSizes.height;
		const gap = w * 0.118;
		const startX = w * 0.5 - ((maxLevel - 1) * gap) / 2;
		const stickW = w * 0.052;
		const stickH = h * 0.1;
		const baseY = h * 0.815;

		for (let i = 0; i < maxLevel; i++) {
			const lit = i < level;
			// back-out pop: overshoots to 1.55x and settles
			const k = i === popRung && popT < 1 ? 1 + 0.55 * Math.sin(popT * Math.PI) * (1 - popT * 0.4) : 1;
			const sw = stickW * k;
			const sh = stickH * k;
			const cx = startX + i * gap;
			const top = baseY - sh;

			if (lit) {
				// the stick: dynamite red, lit from the upper left like everything here
				g.roundRect(cx - sw / 2, top, sw, sh, sw * 0.28)
					.fill({ color: 0xc23a2a })
					.stroke({ width: 2, color: 0x4a1410 });
				g.roundRect(cx - sw / 2 + sw * 0.16, top + sh * 0.08, sw * 0.2, sh * 0.8, sw * 0.1).fill({
					color: 0xff8a70,
					alpha: 0.55,
				});
				// the paper band
				g.rect(cx - sw / 2, top + sh * 0.56, sw, sh * 0.13).fill({ color: 0x8a6a48 });
			} else {
				// an empty slot, cut into the plaque
				g.roundRect(cx - sw / 2, top, sw, sh, sw * 0.28)
					.fill({ color: 0x1c1e24, alpha: 0.9 })
					.stroke({ width: 2, color: 0x4c505a });
			}

			// the fuse
			const fx = cx + sw * 0.35;
			const fy = top - sh * 0.26;
			g.moveTo(cx, top)
				.quadraticCurveTo(cx + sw * 0.05, fy, fx, fy)
				.stroke({ width: 2, color: lit ? 0x8a7458 : 0x3e424b, cap: 'round' });

			if (!lit) {
				if (isNearFull && i === level) {
					const breathe = 0.5 + 0.5 * Math.sin(sparkT * 3.2);
					g.circle(fx, fy, stickW * 0.5).fill({ color: 0xff7a10, alpha: 0.12 + 0.18 * breathe });
					g.circle(fx, fy, stickW * 0.16).fill({ color: 0xff9a3a, alpha: 0.45 + 0.45 * breathe });
				}
				continue;
			}
			// the spark. At the top of the ladder every one flickers, out of step
			// with its neighbours, so the plaque looks like five fuses burning
			// rather than five lights on a timer.
			const flicker = isFullBoard ? 0.55 + 0.45 * Math.abs(Math.sin(sparkT * 9 + i * 1.7)) : 0.75;
			const flash = i === popRung && popT < 1 ? 1 - popT : 0;
			const r = stickW * (0.26 + 0.14 * flicker + 0.5 * flash);
			g.circle(fx, fy, r * 2.2).fill({ color: 0xff8a2a, alpha: 0.18 * flicker + 0.4 * flash });
			g.circle(fx, fy, r).fill({ color: 0xffc45a, alpha: 0.9 });
			g.circle(fx, fy, r * 0.45).fill({ color: 0xfff6e0 });
		}
	};
</script>

<MainContainer>
	<FadeContainer {show} {...position}>
		<Sprite key="gbFsPanel" {...panelSizes} />

		<!-- title on the upper plank area, auto-shrunk for long locales -->
		<Text
			anchor={0.5}
			x={panelSizes.width * 0.5}
			y={panelSizes.height * 0.33}
			text={title}
			style={{
				fontFamily: GAME_FONT,
				fontSize: titleSize,
				fontWeight: GAME_FONT_WEIGHT,
				letterSpacing: 2,
				// THE MINE'S PALETTE, not gen-1's jungle brass: the plaque under this
				// is the high symbols' slate now, and gold-on-olive type came with it
				// from a game that was green. Cream into the fuse's amber instead.
				// an array fill is pure white in pixi v8 - see game/gradientFill.ts
				fill: verticalFill([0xfff6e0, 0xffc45a, 0xc07a14], titleSize),
				stroke: 0x2a2016,
				strokeThickness: 4,
				wordWrap: false,
			}}
		/>

		{#if isSuperspin}
			<!-- big remaining-respins number (the hold'n'spin heartbeat) -->
			<GoldText
				x={panelSizes.width * 0.5}
				y={panelSizes.height * 0.55}
				text={remaining}
				fontSize={panelSizes.width * 0.3}
				fill={[0xfff6e0, 0xffc45a, 0xc07a14]}
				stroke={0x2a2016}
			/>
			<Graphics draw={drawPips} />
		{:else}
			<!-- free game: current spin of total, lifted a little to make room
			     for the ladder under it -->
			<GoldText
				x={panelSizes.width * 0.5}
				y={panelSizes.height * 0.545}
				text={`${Math.min(current, total)} / ${total}`}
				fontSize={panelSizes.width * 0.17}
				maxWidth={panelSizes.width * 0.72}
				fill={[0xfff6e0, 0xffc45a, 0xc07a14]}
				stroke={0x2a2016}
			/>
			<Graphics draw={drawLadder} />
		{/if}
	</FadeContainer>
</MainContainer>

<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, HOLD_AND_SPIN_MODE_KEY } from '../game/constants';
	import { gameText } from '../game/i18nText';
	import TextMesh from './TextMesh.svelte';
	import { TITLE_ACT, COUNT_ACT } from '../game/meshWin/textMesh';
	import PropMesh from './PropMesh.svelte';
	import { COUNTER } from '../game/meshWin';
	import { COUNTER_CANVAS, PLATE_CENTRE, plateScale, type CounterEnv } from '../game/meshWin/fsCounter';

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
			// neon cyan while the respin is still available, dark glass when spent
			g.circle(startX + i * gap, y, panelSizes.width * 0.035)
				.fill({ color: lit ? 0x59e3ff : 0x10172d, alpha: lit ? 1 : 0.85 })
				.stroke({ width: 2, color: lit ? 0xd8fbff : 0x465071 });
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

	// THE PLATE ANSWERS THE GAME (game/meshWin/fsCounter.ts): a knock for every
	// spin used, a bulge for a retrigger (or the respins topping back up), and
	// the dynamite icon shuddering for a rung up the ladder. Keyed off
	// `remaining` rather than the raw events, so the free game and the
	// hold-and-spin read the same way. The first fill (0 -> the award) is the
	// counter appearing, not a retrigger.
	let spinAt = -1;
	let retrigAt = -1;
	let levelAt = -1;
	let lastRemaining = 0;
	let lastLevelSeen = 1;
	$effect(() => {
		const now = remaining;
		if (show && lastRemaining > 0) {
			if (now < lastRemaining) spinAt = Date.now();
			else if (now > lastRemaining) retrigAt = Date.now();
		}
		lastRemaining = now;
	});
	$effect(() => {
		const now = level;
		if (now > lastLevelSeen) levelAt = Date.now();
		lastLevelSeen = now;
	});
	let counterEnv = $state<CounterEnv>({ spinT: -1, retrigT: -1, levelT: -1 });
	$effect(() => {
		if (!show) return;
		// setInterval, not the frame loop: it keeps time in a hidden tab
		const timer = setInterval(() => {
			const t = Date.now();
			counterEnv = {
				spinT: spinAt < 0 ? -1 : t - spinAt,
				retrigT: retrigAt < 0 ? -1 : t - retrigAt,
				levelT: levelAt < 0 ? -1 : t - levelAt,
			};
		}, 16);
		return () => clearInterval(timer);
	});
	// the title, the count and the ladder take the plate's own scale about its
	// centre, so they stay on it while it bulges
	const overlay = $derived.by(() => {
		const [sx, sy] = plateScale(counterEnv);
		const cx = (PLATE_CENTRE[0] / COUNTER_CANVAS[0]) * panelSizes.width;
		const cy = (PLATE_CENTRE[1] / COUNTER_CANVAS[1]) * panelSizes.height;
		return { x: cx * (1 - sx), y: cy * (1 - sy), sx, sy };
	});

	// THE LADDER: one neon charge cell per rung, the same drawing as the buy
	// menu's (design/generate_ladder_sticks.mjs), so the ladder the player
	// picked on the card is the one they watch fill. The cells are sprites; the
	// plasma glow round their orbs stays drawn here, because it is what moves.
	const STICK_ASPECT = 28 / 48;
	// the plasma orb in the 28 x 48 drawing
	const ORB = [14 / 28, 24 / 48] as const;
	const ladder = $derived.by(() => {
		if (isSuperspin) return [];
		const w = panelSizes.width;
		const h = panelSizes.height;
		const gap = w * 0.118;
		const startX = w * 0.5 - ((maxLevel - 1) * gap) / 2;
		const baseY = h * 0.85;
		return Array.from({ length: maxLevel }, (_, i) => {
			// the rung that just lit swells and settles
			const k = i === popRung && popT < 1 ? 1 + 0.55 * Math.sin(popT * Math.PI) * (1 - popT * 0.4) : 1;
			const sh = h * 0.19 * k;
			const sw = sh * STICK_ASPECT;
			const cx = startX + i * gap;
			const x = cx - sw / 2;
			const y = baseY - sh;
			return { i, lit: i < level, x, y, w: sw, h: sh, fx: x + ORB[0] * sw, fy: y + ORB[1] * sh };
		});
	});

	const drawSparks = (g: PixiGraphics) => {
		g.clear();
		for (const rung of ladder) {
			const { i, fx, fy } = rung;
			// sized off the stick, so a swelling rung's spark swells with it
			const stickW = rung.w * 0.5;
			if (!rung.lit) {
				// the next rung to charge flickers when the board is one short
				if (isNearFull && i === level) {
					const breathe = 0.5 + 0.5 * Math.sin(sparkT * 3.2);
					const stutter = Math.sin(sparkT * 23) > 0.6 ? 1 : 0.35;
					g.circle(fx, fy, stickW * 0.75).fill({ color: 0xb143ec, alpha: (0.1 + 0.18 * breathe) * stutter });
					g.circle(fx, fy, stickW * 0.32).fill({ color: 0x59e3ff, alpha: (0.3 + 0.4 * breathe) * stutter });
				}
				continue;
			}
			// the plasma in a charged cell: a soft violet bloom that hums, a
			// white flash when the rung charges, and on a full board all five
			// crackle out of step
			const hum = isFullBoard ? 0.55 + 0.45 * Math.abs(Math.sin(sparkT * 9 + i * 1.7)) : 0.7 + 0.15 * Math.sin(sparkT * 4 + i);
			const flash = i === popRung && popT < 1 ? 1 - popT : 0;
			const r = stickW * (0.5 + 0.12 * hum + 0.6 * flash);
			g.circle(fx, fy, r * 1.9).fill({ color: 0xb143ec, alpha: 0.16 * hum + 0.35 * flash });
			g.circle(fx, fy, r * 1.25).fill({ color: 0xd46bff, alpha: 0.18 * hum + 0.3 * flash });
			if (flash > 0) g.circle(fx, fy, r * 0.8).fill({ color: 0xffffff, alpha: 0.7 * flash });
		}
	};
</script>

<MainContainer>
	<FadeContainer {show} {...position}>
		<!-- drawn through its mesh (game/meshWin/fsCounter.ts), same box -->
		<PropMesh spec={COUNTER} env={counterEnv} {...panelSizes} />

		<Container x={overlay.x} y={overlay.y} scale={{ x: overlay.sx, y: overlay.sy }}>

		<!-- title on the upper plank area, auto-shrunk for long locales -->
		<!-- the title acts through a mesh of its own (meshWin/textMesh.ts): a
		     slow neon wave through the letters, a ripple on each spin. NEON:
		     white-hot into cyan, on a deep night-violet stroke (gold is the
		     Scatter's alone in this game) -->
		<TextMesh
			x={panelSizes.width * 0.5}
			y={panelSizes.height * 0.33}
			text={title}
			fontSize={titleSize}
			letterSpacing={2}
			fill={[0xffffff, 0x9ff4ff, 0x35b8ff]}
			stroke={0x140a30}
			env={counterEnv}
			act={TITLE_ACT}
		/>

		{#if isSuperspin}
			<!-- big remaining-respins number (the hold'n'spin heartbeat) -->
			<!-- the respins hop as one goes, and stretch up when a coin resets them -->
			<TextMesh
				bevel
				x={panelSizes.width * 0.5}
				y={panelSizes.height * 0.55}
				text={remaining}
				fontSize={panelSizes.width * 0.3}
				fill={[0xffffff, 0xffb8ef, 0xff3fd0]}
				stroke={0x140a30}
				env={counterEnv}
				act={COUNT_ACT}
			/>
			<Graphics draw={drawPips} />
		{:else}
			<!-- free game: current spin of total, lifted a little to make room
			     for the ladder under it -->
			<!-- the count, through its own mesh: the digits hop in turn as a spin
			     is used, the whole count stretches up and wobbles on a retrigger,
			     and shivers on a new rung -->
			<TextMesh
				bevel
				x={panelSizes.width * 0.5}
				y={panelSizes.height * 0.545}
				text={`${Math.min(current, total)} / ${total}`}
				fontSize={panelSizes.width * 0.17}
				maxWidth={panelSizes.width * 0.72}
				fill={[0xffffff, 0xffb8ef, 0xff3fd0]}
				stroke={0x140a30}
				env={counterEnv}
				act={COUNT_ACT}
			/>
			{#each ladder as rung (rung.i)}
				<Sprite key={rung.lit ? 'gbLadderLit' : 'gbLadderOff'} x={rung.x} y={rung.y} width={rung.w} height={rung.h} />
			{/each}
			<Graphics draw={drawSparks} />
		{/if}
		</Container>
	</FadeContainer>
</MainContainer>

<script lang="ts" module>
	import type { Position } from '../game/types';

	export type EmitterEventLadderHud =
		/** feature HUD: flask (points mod 12), ladder x2..x12 */
		| { type: 'ladderShow' }
		| { type: 'ladderHide' }
		/** orbs from the WILD cells fly to the flask; resolves when the last one lands (SPEC §2.5) */
		| { type: 'pointsFly'; positions: Position[]; points: number }
		/** ladder step: giant "xN" then the fireball to the ladder; resolves at 0.8 s */
		| { type: 'ladderStep'; mult: number }
		/** "+3 FREE SPINS": in at 1.0, hit at 1.3, flask reset at 1.8, resolves at 2.0 (relative to the step) */
		| { type: 'ladderPlus'; totalFs: number };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Rectangle, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { stateUi, stateUrlDerived } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { REF_TIMING } from '../game/refTiming';
	import { featureScaled } from '../game/timeScale';
	import { canvasLine, gameText } from '../game/i18nText';
	import { FEATURE_RULES } from '../game/featureRules';
	import { DISPLAY_FONT, DISPLAY_FONT_WEIGHT, TITLE_FONT, TITLE_FONT_WEIGHT } from '../game/fonts';
	import { HUD_ART } from '../game/assetsHud';
	import { hudLayout } from '../game/hudLayout';

	// The free-game HUD (SPEC §2.5): a distilling flask that fills with the
	// points the WILD cells give (shows points mod 12), and the philosopher's
	// ladder x2 / x3 / x5 / x8 / x12, read bottom-up. Every number is runtime
	// text on a clean plate field — never baked, never on the illustration.
	//
	// Beats (all times from REF_TIMING, unchanged):
	//   pointsFly   energyDelay, then one orb per WILD cell arcs into the flask
	//               mouth over fgEnergyFly; the liquid rises when they land.
	//   ladderStep  the flask flares (flame over the mouth); at multipleIn the
	//               "XN" plate pops over the board; at multipleOut it closes and
	//               a fireball leaves it for the ladder.
	//   ladderPlus  "+3 FREE SPINS" plate at plusIn; at hit the fireball lands,
	//               the rung lights with a flash and the FREE SPINS total takes
	//               its +3; at reset the flame dies and the liquid drains to the
	//               overflow that is left.

	const context = getContext();
	// the rungs above the starting ×1, and the points per rung, from the maths'
	// own rules (game/featureRules.ts), never typed here
	const LADDER: readonly number[] = FEATURE_RULES.ladder.slice(1);
	const POINTS_PER_STEP: number = FEATURE_RULES.pointsPerStep;
	// "+3 FREE SPINS": in Arabic the whole line is a right-to-left isolate and
	// "+3" a left-to-right one inside it, so it reads "+3" (not "3+") at the
	// head of the phrase
	const plusSpinsLabel = () => {
		const plus = `+${FEATURE_RULES.spinsPerStep}`;
		return canvasLine(`${stateUrlDerived.lang() === 'ar' ? `\u2066${plus}\u2069` : plus} ${gameText('freeSpins')}`);
	};

	let show = $state(false);
	let message = $state<null | { text: string; big: boolean; born: number }>(null);
	let orbs = $state<{ key: string; x: number; y: number; delay: number }[]>([]);
	let orbT = $state(0);
	/** points the flask is heading for (0..12); lags the state while orbs fly */
	let vial = $state(0);
	/** what the liquid shows right now, eased toward `vial` every frame */
	let level = $state(0);
	let displayedMult = $state(1);
	let flame = $state(0);
	let flameTarget = 0;
	let hitFlash = $state(0);
	let hitMult = $state(0);
	let fireball = $state<null | { from: { x: number; y: number }; to: { x: number; y: number }; t: number }>(null);
	let clock = $state(0);
	/** 12-point thresholds already turned into ladder steps (-1 = not read yet) */
	let stepsTaken = -1;
	let pendingSteps = 0;
	let stepped = false;
	$effect(() => { if (show && !stateGame.featureStarted) displayedMult = stateGame.ladder.mult; });

	const pause = (seconds: number) => waitForTimeout(featureScaled(seconds * 1000));

	const layout = $derived(context.stateGameDerived.boardLayout());
	const hud = $derived(hudLayout(context));
	const artScale = $derived(hud.flask.width / HUD_ART.flaskBody.w);
	/** main units → board units (what BoardContainer children are drawn in) */
	const toBoard = (x: number, y: number) => ({
		x: (x - layout.x) / layout.scale + layout.width / 2,
		y: (y - layout.y) / layout.scale + layout.height / 2,
	});
	const mouth = $derived({ x: hud.flask.x + hud.flask.width * HUD_ART.flaskMouthX, y: hud.flask.y + hud.flask.height * 0.08 });
	const orbTarget = $derived(toBoard(mouth.x, mouth.y));
	const rungCentre = (mult: number) => {
		const i = Math.max(0, LADDER.indexOf(mult));
		return {
			x: hud.ladder.x + hud.ladder.width / 2,
			y: hud.ladder.y + (4 - i) * hud.ladder.pitch + hud.ladder.rungHeight / 2,
		};
	};

	// one frame clock for the liquid ease, the flame, the flash and the fireball
	let raf = 0;
	let last = 0;
	const tick = (now: number) => {
		const dt = Math.min(0.05, (now - (last || now)) / 1000);
		last = now;
		clock += dt;
		level += (vial - level) * Math.min(1, dt * 6);
		flame += (flameTarget - flame) * Math.min(1, dt * 9);
		if (hitFlash > 0) hitFlash = Math.max(0, hitFlash - dt * 2.2);
		raf = requestAnimationFrame(tick);
	};
	$effect(() => {
		if (!show) return;
		last = 0;
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
	onDestroy(() => cancelAnimationFrame(raf));

	/** run `step(p)` over `ms` on the frame clock; resolves at p = 1 */
	const animate = (ms: number, step: (p: number) => void) =>
		new Promise<void>((resolve) => {
			const start = performance.now();
			const frame = (now: number) => {
				const p = Math.min(1, (now - start) / Math.max(1, ms));
				step(p);
				if (p < 1) requestAnimationFrame(frame);
				else resolve();
			};
			requestAnimationFrame(frame);
		});

	const flyFireball = (mult: number) => {
		const centre = toMain((BOARD_DIMENSIONS.x * SYMBOL_SIZE) / 2, (BOARD_DIMENSIONS.y * SYMBOL_SIZE) / 2);
		fireball = { from: centre, to: rungCentre(mult), t: 0 };
		const ms = featureScaled((REF_TIMING.ladder.hit - REF_TIMING.ladder.multipleOut) * 1000);
		// not awaited: it lands inside ladderPlus, at `hit`
		animate(ms, (p) => {
			if (fireball) fireball = { ...fireball, t: p };
		}).then(() => {
			fireball = null;
			displayedMult = mult;
			hitMult = mult;
			hitFlash = 1;
		});
	};
	/** board units → main units */
	const toMain = (x: number, y: number) => ({
		x: layout.x + (x - layout.width / 2) * layout.scale,
		y: layout.y + (y - layout.height / 2) * layout.scale,
	});

	context.eventEmitter.subscribeOnMount({
		ladderShow: () => {
			show = true;
			vial = stateGame.ladder.points % POINTS_PER_STEP;
			level = vial;
			stepsTaken = -1;
			pendingSteps = 0;
			displayedMult = stateGame.ladder.mult;
			flameTarget = 0;
			flame = 0;
		},
		ladderHide: () => {
			show = false;
			message = null;
			orbs = [];
			fireball = null;
		},
		pointsFly: async ({ positions, points }) => {
			await pause(REF_TIMING.energyDelay);
			// staggered launch, common landing: the last orb still lands at
			// fgEnergyFly, so the beat's length is unchanged
			const spread = Math.min(0.3, 0.06 * (positions.length - 1));
			orbs = positions.map((p, i) => ({
				key: `${p.reel}:${p.row}:${i}`,
				x: (p.reel + 0.5) * SYMBOL_SIZE,
				y: (p.row + 0.5) * SYMBOL_SIZE,
				delay: positions.length > 1 ? (spread * i) / (positions.length - 1) : 0,
			}));
			orbT = 0;
			await animate(featureScaled(REF_TIMING.fgEnergyFly * 1000), (p) => (orbT = p));
			orbs = [];
			// A full flask shows full until the step beat resets it. Steps already
			// taken are read off the ladder the first time (the SUPER buy starts
			// at x2 with 12 points banked, so 13 points is NOT a pending step).
			if (stepsTaken < 0) stepsTaken = Math.max(0, LADDER.indexOf(displayedMult) + 1);
			pendingSteps = Math.max(0, Math.floor(points / POINTS_PER_STEP) - stepsTaken);
			vial = pendingSteps > 0 ? POINTS_PER_STEP : points % POINTS_PER_STEP;
		},
		ladderStep: async ({ mult }) => {
			stepped = true;
			flameTarget = 1;
			await pause(REF_TIMING.ladder.multipleIn);
			message = { text: `X${mult}`, big: true, born: clock };
			await pause(REF_TIMING.ladder.multipleOut - REF_TIMING.ladder.multipleIn);
			message = null;
			flyFireball(mult);
		},
		ladderPlus: async ({ totalFs }) => {
			await pause(REF_TIMING.ladder.plusIn - (stepped ? REF_TIMING.ladder.multipleOut : 0));
			stepped = false;
			message = { text: plusSpinsLabel(), big: false, born: clock };
			await pause(REF_TIMING.ladder.hit - REF_TIMING.ladder.plusIn);
			stateUi.freeSpinCounterTotal = totalFs;
			// the denominator takes its +3 as the fireball lands, not after the beat
			context.eventEmitter.broadcast({ type: 'freeSpinCounterUpdate', total: totalFs });
			await pause(REF_TIMING.ladder.reset - REF_TIMING.ladder.hit);
			stepsTaken = Math.max(0, stepsTaken) + 1;
			pendingSteps = Math.max(0, Math.floor(stateGame.ladder.points / POINTS_PER_STEP) - stepsTaken);
			vial = pendingSteps > 0 ? POINTS_PER_STEP : stateGame.ladder.points % POINTS_PER_STEP;
			if (pendingSteps === 0) flameTarget = 0;
			message = null;
			await pause(REF_TIMING.ladder.nextSpin - REF_TIMING.ladder.reset);
		},
	});

	// liquid: clipped from the bottom; full = the meniscus at the liquid's top
	const liquidTop = $derived.by(() => {
		const { y, h } = HUD_ART.flaskLiquid;
		const empty = HUD_ART.flaskApertureBottom;
		const f = Math.max(0, Math.min(1, level / POINTS_PER_STEP));
		const wobble = f > 0.02 && f < 0.98 ? Math.sin(clock * 2.4) * 2.5 : 0;
		return Math.min(y + h, empty - f * (empty - y) + wobble);
	});

	const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
	const popScale = (age: number) => (age < 0.18 ? 0.6 + 0.55 * (age / 0.18) : 1.15 - 0.15 * Math.min(1, (age - 0.18) / 0.14));

	// text on the plaques: bone on the lit field, near-white on the current one,
	// muted ochre on the unlit brown — all three read on their own ground. Flat
	// colours only: the fill changes with the state, and pixi 8 converts a
	// gradient ARRAY only at construction (a live update to one throws).
	const RUNG_TEXT = {
		current: { fill: 0xfffbe8, stroke: 0x1f3f33 },
		lit: { fill: 0xf1ead8, stroke: 0x1f3f33 },
		unlit: { fill: 0xc9ac78, stroke: 0x2a1d12 },
	};
</script>

{#if show}
	<MainContainer>
		<!-- ── flask ─────────────────────────────────────────────────────────── -->
		<Container x={hud.flask.x} y={hud.flask.y} scale={artScale}>
			<Container>
				<Sprite
					key="waFlaskLiquid"
					x={HUD_ART.flaskLiquid.x}
					y={HUD_ART.flaskLiquid.y}
					width={HUD_ART.flaskLiquid.w}
					height={HUD_ART.flaskLiquid.h}
				/>
				<Rectangle
					isMask
					x={0}
					y={liquidTop}
					width={HUD_ART.flaskBody.w}
					height={Math.max(0, HUD_ART.flaskLiquid.y + HUD_ART.flaskLiquid.h - liquidTop)}
				/>
			</Container>
			<Sprite key="waFlaskBody" width={HUD_ART.flaskBody.w} height={HUD_ART.flaskBody.h} />
			{#if flame > 0.02}
				<Sprite
					key="waFlaskFlame"
					anchor={{ x: 0.5, y: 1 }}
					x={HUD_ART.flaskBody.w * HUD_ART.flaskMouthX}
					y={18}
					width={230 * flame * (1 + 0.04 * Math.sin(clock * 11))}
					height={(230 * HUD_ART.flame.h) / HUD_ART.flame.w * flame * (1 + 0.06 * Math.sin(clock * 7.3))}
					alpha={Math.min(1, flame * 1.3)}
				/>
			{/if}
		</Container>

		<!-- n/12 on its own plate under the flask -->
		<Container x={hud.points.x} y={hud.points.y}>
			<Sprite key="waFsCounter" width={hud.points.width} height={hud.points.height} />
			<GoldText
				x={hud.points.width / 2}
				y={hud.points.height * HUD_ART.fsCounter.fieldCy}
				text={`${Math.min(vial, POINTS_PER_STEP)}/${POINTS_PER_STEP}`}
				fontSize={hud.points.height * 0.46}
				maxWidth={hud.points.width * HUD_ART.fsCounter.fieldW}
				fontFamily={DISPLAY_FONT}
				fontWeight={DISPLAY_FONT_WEIGHT}
			/>
		</Container>

		<!-- ── ladder, x2 at the bottom ─────────────────────────────────────── -->
		<Container x={hud.ladder.x} y={hud.ladder.y}>
			{#each LADDER as mult, i (mult)}
				{@const state = displayedMult === mult ? 'current' : displayedMult > mult ? 'lit' : 'unlit'}
				{@const flash = hitMult === mult ? hitFlash : 0}
				{@const w = hud.ladder.width}
				{@const h = hud.ladder.rungHeight}
				{@const punch = 1 + 0.12 * flash}
				<Container x={w / 2} y={(4 - i) * hud.ladder.pitch + h / 2} scale={punch}>
					<Sprite
						key={state === 'current' ? 'waLadderCurrent' : state === 'lit' ? 'waLadderLit' : 'waLadderUnlit'}
						anchor={0.5}
						width={w}
						height={h}
					/>
					{#if flash > 0}
						<!-- the plaque itself flares on the hit (additive self-copy) -->
						<Sprite key="waLadderCurrent" anchor={0.5} width={w} height={h} blendMode="add" alpha={flash * 0.8} />
					{/if}
					<GoldText
						x={w * (HUD_ART.ladder.fieldCx - 0.5)}
						y={0}
						text={`X${mult}`}
						fontSize={h * (state === 'current' ? 0.66 : 0.58)}
						maxWidth={w * HUD_ART.ladder.fieldW * 0.9}
						fontFamily={DISPLAY_FONT}
						fontWeight={DISPLAY_FONT_WEIGHT}
						fill={RUNG_TEXT[state].fill}
						stroke={RUNG_TEXT[state].stroke}
					/>
				</Container>
			{/each}
		</Container>

		{#if fireball}
			{@const p = ease(fireball.t)}
			{@const dx = fireball.to.x - fireball.from.x}
			{@const dy = fireball.to.y - fireball.from.y}
			{@const lift = Math.min(140, Math.hypot(dx, dy) * 0.3)}
			{@const arc = -Math.sin(Math.PI * p) * lift}
			{@const size = SYMBOL_SIZE * layout.scale * (1.5 - 0.6 * p)}
			<Sprite
				key="waFireball"
				anchor={{ x: 0.78, y: 0.5 }}
				x={fireball.from.x + dx * p}
				y={fireball.from.y + dy * p + arc}
				rotation={Math.atan2(dy - Math.PI * Math.cos(Math.PI * p) * lift, dx)}
				width={size}
				height={(size * HUD_ART.fireball.h) / HUD_ART.fireball.w}
			/>
		{/if}
	</MainContainer>

	<!-- orbs and the step / +3 plates live in board space. BoardContainer's
	     x / y / scale are game-box (MainContainer) units, so it has to sit inside
	     one: bare, it was placed in canvas pixels — right only where the game box
	     happens to map ~1:1 onto the canvas (1422x800-ish desktop). In portrait
	     the +3 / XN plate landed off the board's lower right and the orbs flew
	     from the wrong cells (seen 390x844, QA fix 11-11). -->
	<MainContainer>
	<BoardContainer>
		{#each orbs as orb (orb.key)}
			{@const t = Math.max(0, Math.min(1, (orbT - orb.delay) / Math.max(0.01, 1 - orb.delay)))}
			{@const p = ease(t)}
			{@const lift = -Math.sin(Math.PI * p) * SYMBOL_SIZE * 1.2}
			{@const size = SYMBOL_SIZE * (0.62 - 0.26 * p)}
			<Sprite
				key="waOrb"
				anchor={0.5}
				x={orb.x + (orbTarget.x - orb.x) * p}
				y={orb.y + (orbTarget.y - orb.y) * p + lift}
				width={size}
				height={size}
				rotation={p * 3}
				alpha={t > 0 ? 1 : 0.85}
			/>
		{/each}
		{#if message}
			{@const age = clock - message.born}
			{@const plateW = SYMBOL_SIZE * (message.big ? 3.8 : 4.6)}
			{@const plateH = (plateW * HUD_ART.titlePlate.h) / HUD_ART.titlePlate.w}
			<Container
				x={(BOARD_DIMENSIONS.x * SYMBOL_SIZE) / 2}
				y={(BOARD_DIMENSIONS.y * SYMBOL_SIZE) / 2}
				scale={popScale(age)}
			>
				<Sprite key="waWinTitlePlate" anchor={0.5} width={plateW} height={plateH} />
				<GoldText
					variant="ink"
					text={message.text}
					fontSize={plateH * (message.big ? 0.36 : 0.24)}
					maxWidth={plateW * HUD_ART.titlePlate.fieldW * 0.92}
					fill={message.big ? 0xa53e2b : 0x3b2a1a}
					fontFamily={message.big ? DISPLAY_FONT : TITLE_FONT}
					fontWeight={message.big ? DISPLAY_FONT_WEIGHT : TITLE_FONT_WEIGHT}
				/>
			</Container>
		{/if}
	</BoardContainer>
	</MainContainer>
{/if}

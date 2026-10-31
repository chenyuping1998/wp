<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; extraSpins?: number };
</script>

<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { Container } from 'pixi-svelte';
	import { CanvasSizeRectangle } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';
	import { Sprite, Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';
	import FxBurst from './FxBurst.svelte';
	import SplashMaster from './SplashMaster.svelte';
	import { POUR_MS, STREAM_TRAVEL_MS, masterPlacement } from '../game/splashCast';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import config from '../game/config';
	import { removedLabelAtLevel } from '../game/chefMeter';

	const context = getContext();

	let show = $state(false);
	let freeSpinsFromEvent = $state(0);
	let oncomplete = $state(() => {});
	// The rules lines are for the moment the feature OPENS. A retrigger reuses
	// this splash to stamp "+N" and keeps the old, plain layout: re-explaining the
	// meter in the middle of the feature is noise.
	let isEntry = $state(true);
	let burst = $state(false);

	// What the feature does, on the board's own paper (no second card on top of
	// it — two boards stacked is what the user removed from the sister games).
	// Numbers come from the maths config, like the rules page's, so they cannot
	// drift from it.
	const meter = config.banditMeter as { thresholds: number[]; spinsAdded: number };
	// Two lines, not three (2026-10-31): the third ran off the paper. Each is
	// sized to fit the paper's width, so a longer translation shrinks instead of
	// spilling onto the frame.
	const rules = [
		'Every Tea Master collects every Jade Cup',
		`${meter.thresholds.join(' / ')} Tea Masters: +${meter.spinsAdded} spins, ${meter.thresholds.map((_, i) => removedLabelAtLevel(i + 1)).join(' → ')} become Jade Cups`,
	];

	const title = gameText('freeSpins');
	const subtitle = gameText('spinsAwarded');

	// The count slams onto the plan poster like a rubber stamp once the sign has
	// dropped (FreeSpinAnimation's drop is 700ms), and the title rides in ahead
	// of it. One rAF clock from the moment the intro shows.
	const TITLE_AT = 350;
	// With the Master on screen the count waits for his pour to land on the
	// paper (game/splashCast.ts: the stream leaves the spout POUR_MS.flowFrom
	// into his act and takes STREAM_TRAVEL_MS to arrive); without him (tablet,
	// portrait) it keeps its old beat after the drop.
	const POUR_AT = 300;
	const masterOn = $derived(
		isEntry && masterPlacement(context.stateLayoutDerived.mainLayout(), context.stateGameDerived.boardLayout()) !== null,
	);
	const STAMP_AT = $derived(masterOn ? POUR_AT + POUR_MS.flowFrom + STREAM_TRAVEL_MS - 120 : 750);
	// where the tea lands: on the paper, just left of where the count stamps
	const SIGN_W = SYMBOL_SIZE * BOARD_DIMENSIONS.x * 0.98;
	const pourTarget = $derived({
		x: context.stateGameDerived.boardLayout().x - SIGN_W * 0.12,
		y: context.stateGameDerived.boardLayout().y + (SIGN_W / 1.6) * 0.04,
	});
	let t = $state(0);
	let raf = 0;
	const startClock = () => {
		cancelAnimationFrame(raf);
		const start = performance.now();
		const tick = (now: number) => {
			t = now - start;
			if (t < STAMP_AT + 1800) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
	};
	$effect(() => () => cancelAnimationFrame(raf));
	const titlePose = $derived.by(() => {
		const k = Math.min(1, Math.max(0, (t - TITLE_AT) / 300));
		return { alpha: k, y: (1 - k) * -40 };
	});
	const stampScale = $derived.by(() => {
		const k = (t - STAMP_AT) / 380;
		if (k <= 0) return 0;
		if (k >= 1) return 1;
		return k < 0.45 ? 2.6 - 1.75 * (k / 0.45) : 0.85 + 0.15 * Math.sin(((k - 0.45) / 0.55) * Math.PI * 0.5);
	});
	let stamped = false;
	$effect(() => {
		if (stampScale > 0 && stampScale <= 1 && !stamped && t > STAMP_AT + 150) {
			stamped = true;
			burst = true;
			context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.6 });
			context.eventEmitter.broadcast({ type: 'soundStamp' });
		}
	});

	// low while the board drops, a flare as the count lands, then a steady glow
	const halo = $derived.by(() => {
		const since = t - STAMP_AT - 150;
		if (since < 0) return Math.min(0.35, Math.max(0, t - 300) / 1200);
		return 0.45 + 0.55 * Math.exp(-since / 260);
	});
	const rulesPose = $derived.by(() => {
		const k = Math.min(1, Math.max(0, (t - STAMP_AT - 380) / 360));
		return { alpha: k, y: (1 - k) * 10 };
	});

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => {
			show = true;
			stamped = false;
			burst = false;
			startClock();
		},
		freeSpinIntroHide: () => (show = false),
		freeSpinIntroUpdate: async (emitterEvent) => {
			freeSpinsFromEvent = emitterEvent.extraSpins ?? emitterEvent.totalFreeSpins;
			isEntry = emitterEvent.extraSpins === undefined;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

	<FreeSpinAnimation {halo}>
		{#snippet children({ sizes })}
			<!-- THE BOARD'S LAYOUT (2026-10-31, user: "太粗糙"). The count used to be a
			     thin dark number floating on empty paper with a small "AWARDED" under
			     it. It is now pressed into the paper as a cinnabar CHOP (the mark that
			     says "granted"), the count reversed out of it in the paper's cream;
			     title above, the two rule lines below, everything inside the paper. -->
			{@const ts = Math.min((sizes.width * 0.74) / 854, (sizes.height * 0.2) / 117)}
			<Container y={-sizes.height * 0.36 + titlePose.y} alpha={titlePose.alpha}>
				<Sprite key="v8TitleFree" anchor={0.5} width={1600 * ts} height={500 * ts} />
			</Container>
			{@const seal = isEntry ? sizes.height * 0.42 : sizes.height * 0.56}
			{@const countY = isEntry ? -sizes.height * 0.04 : sizes.height * 0.02}
			{#if stampScale > 0}
				<!-- upright (user, 2026-10-31: the tilted count read as crooked) -->
				<Container y={countY} scale={stampScale}>
					<Sprite key="v8FgSeal" anchor={0.5} width={seal * (512 / 432)} height={seal * (512 / 432)} />
					<Text
						anchor={0.5}
						y={-seal * 0.03}
						text={isEntry ? `${freeSpinsFromEvent}` : `+${freeSpinsFromEvent}`}
						style={{
							fontFamily: GAME_FONT,
							fontWeight: '700',
							fontSize: seal * (`${freeSpinsFromEvent}`.length > 1 ? 0.56 : 0.66),
							fill: 0xfaeed6,
						}}
					/>
				</Container>
			{/if}
			{#if burst}
				<!-- tea leaves and paper slips thrown off the stamp -->
				<FxBurst flavour="tea" y={countY} scale={1.5} oncomplete={() => (burst = false)} />
				<FxBurst flavour="tea" y={countY} scale={2.1} delay={90} />
			{/if}
			<Text
				anchor={0.5}
				y={countY + seal * 0.62}
				alpha={rulesPose.alpha}
				text={subtitle}
				style={{
					fontFamily: GAME_FONT,
					fontSize: Math.min(sizes.height * 0.07, (sizes.width * 0.8) / Math.max(8, subtitle.length * 0.72)),
					fontWeight: '700',
					letterSpacing: 3,
					fill: 0x8f2a20,
				}}
			/>
			{#if isEntry}
				{@const ruleSize = sizes.height * 0.058}
				<Container y={sizes.height * 0.335 + rulesPose.y} alpha={rulesPose.alpha}>
					{#each rules as line, i (i)}
						<!-- each line shrinks to the paper's width if it must -->
						{@const fit = Math.min(1, (sizes.width * 0.9) / (line.length * ruleSize * 0.62))}
						<Text
							anchor={0.5}
							y={i * ruleSize * 1.35}
							text={line}
							style={{
								fontFamily: GAME_FONT,
								fontWeight: i === 0 ? '700' : GAME_FONT_WEIGHT,
								fontSize: ruleSize * fit,
								fill: i === 0 ? 0x234b3f : 0x2a4037,
								align: 'center',
							}}
						/>
					{/each}
				</Container>
			{/if}
		{/snippet}
	</FreeSpinAnimation>

	<!-- after the board, so his stream lands ON the paper -->
	{#if isEntry}
		<SplashMaster cue="pour" cueNow={t > POUR_AT} enterAt={150} target={pourTarget} />
	{/if}

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>

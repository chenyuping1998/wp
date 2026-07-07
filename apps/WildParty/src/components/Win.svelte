<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventWin =
		| { type: 'winShow' }
		| { type: 'winHide' }
		| { type: 'winUpdate'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider, ResponsiveBitmapText } from 'components-pixi';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { OnMount } from 'components-shared';

	import WinCoins from './WinCoins.svelte';
	import WinAnimation from './WinAnimation.svelte';
	import WinLevelSymbolIntro from './WinLevelSymbolIntro.svelte';
	import BigWinFx from './BigWinFx.svelte';
	import BannerMarquee from './BannerMarquee.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';

	const context = getContext();

	let show = $state(false);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});

	// escalating "how big does this FEEL" multiplier — same shake/flash/BigWinFx
	// logic for every big-win tier, just scaled up as the tier climbs. Widened
	// range (0.8 -> 1.9) plus toning big DOWN below the old baseline of 1, so
	// the low and high ends read as clearly different, not just +70%.
	const TIER_INTENSITY: Partial<Record<WinLevelData['alias'], number>> = {
		big: 0.8,
		superwin: 1.0,
		mega: 1.3,
		epic: 1.6,
		max: 2.0,
	};
	// marquee now starts at mega (not just epic/max) so there's a 3-step ramp
	// (sparse/slow -> denser/faster) instead of a hard on/off split
	const MARQUEE_TIERS: Partial<Record<WinLevelData['alias'], { count: number; speed: number }>> = {
		mega: { count: 14, speed: 0.7 },
		epic: { count: 20, speed: 1 },
		max: { count: 26, speed: 1.3 },
	};
	// higher tiers linger noticeably longer on screen — an easy-to-perceive
	// difference that doesn't rely on subtle particle/shake magnitude changes
	const LINGER_MS: Partial<Record<WinLevelData['alias'], number>> = {
		big: 1000,
		superwin: 1200,
		mega: 1500,
		epic: 1850,
		max: 2200,
	};

	// camera shake as the big-win presentation slams in
	let shake = $state({ x: 0, y: 0 });
	const startShake = (intensity: number) => {
		const start = Date.now();
		const id = setInterval(() => {
			const p = (Date.now() - start) / 700;
			if (p >= 1) {
				shake = { x: 0, y: 0 };
				clearInterval(id);
				return;
			}
			const amp = 11 * intensity * (1 - p) ** 2;
			shake = { x: (Math.random() - 0.5) * 2 * amp, y: (Math.random() - 0.5) * 2 * amp };
		}, 16);
	};

	// hit-stop impact frame: white flash + scale punch on the slam-in
	let flash = $state(0);
	let punch = $state(1);
	const startImpact = (intensity: number, echo: boolean) => {
		const start = Date.now();
		const id = setInterval(() => {
			const p = (Date.now() - start) / 280;
			if (p >= 1) {
				flash = 0;
				punch = 1;
				clearInterval(id);
				// epic/max get a second, smaller flash beat ~90ms later — a
				// distinct "double impact" feel, not just a bigger single flash
				if (echo) setTimeout(() => startEchoFlash(intensity), 90);
				return;
			}
			flash = Math.max(0, 0.8 * intensity * (1 - p * 1.4));
			punch = 1 + 0.14 * intensity * (1 - p) ** 2;
		}, 16);
	};

	const startEchoFlash = (intensity: number) => {
		const start = Date.now();
		const id = setInterval(() => {
			const p = (Date.now() - start) / 180;
			if (p >= 1) {
				flash = 0;
				clearInterval(id);
				return;
			}
			flash = Math.max(0, 0.5 * intensity * (1 - p * 1.6));
		}, 16);
	};

	const WIN_LEVEL_SYMBOL_MAP: Partial<
		Record<WinLevelData['alias'], 'wpSpH1' | 'wpSpH2' | 'wpSpH3' | 'wpSpH4'>
	> = {
		big: 'wpSpH4',
		superwin: 'wpSpH3',
		mega: 'wpSpH2',
		epic: 'wpSpH1',
	};

	context.eventEmitter.subscribeOnMount({
		winShow: () => (show = true),
		winHide: () => (show = false),
		winUpdate: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			if (emitterEvent.winLevelData.type === 'big') {
				const alias = emitterEvent.winLevelData.alias;
				const intensity = TIER_INTENSITY[alias] ?? 1;
				startShake(intensity);
				startImpact(intensity, alias === 'epic' || alias === 'max');
			}
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	{#if winLevelData}
		{@const isBigWin = winLevelData.type === 'big'}
		{@const duration = winLevelData.presentDuration}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				{#if isBigWin}
					<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />
				{/if}

				<OnMount
					onmount={async () => {
						// impact hold: freeze a few frames under the white flash before
						// the numbers start rolling
						if (isBigWin) await waitForTimeout(90);
						await startCountUp();
						// higher tiers linger longer after the count-up finishes — an
						// easy-to-perceive escalation on top of the shake/flash/fx scaling
						await waitForTimeout(isBigWin ? (LINGER_MS[winLevelData.alias] ?? 1300) : 300);
						oncomplete();
					}}
				/>

				{#if isBigWin}
					{@const intensity = TIER_INTENSITY[winLevelData.alias] ?? 1}
					<MainContainer>
						<BigWinFx
							x={context.stateGameDerived.boardLayout().x + shake.x * 0.4}
							y={context.stateGameDerived.boardLayout().y + shake.y * 0.4}
							{intensity}
						/>
					</MainContainer>
				{/if}

				<MainContainer>
					<Container
						x={context.stateGameDerived.boardLayout().x + shake.x}
						y={context.stateGameDerived.boardLayout().y + shake.y}
						scale={punch}
					>
						{@const winLevelSymbolKey = WIN_LEVEL_SYMBOL_MAP[winLevelData.alias]}
						{@const marquee = MARQUEE_TIERS[winLevelData.alias]}
						{#snippet bannerFxSnippet()}
							{#if marquee}
								<BannerMarquee dotCount={marquee.count} speed={marquee.speed} />
							{/if}
						{/snippet}
						{#if winLevelData?.animation}
							<WinAnimation
								animationMap={winLevelData.animation}
								bannerFx={marquee ? bannerFxSnippet : undefined}
							>
								{#if winLevelSymbolKey}
									<!-- slot children are provider-scaled ×0.5, so -640 puts the icon
									     ~250px above board center — clear of the banner at center -->
									<Container y={-640}>
										<WinLevelSymbolIntro symbolKey={winLevelSymbolKey} />
									</Container>
								{/if}
								<!-- plaque + text share this container so they always move together,
								     instead of the plaque tracking a spine slot that doesn't know
								     about the conditional 270 offset below -->
								<Container y={winLevelSymbolKey ? 270 : 0}>
									<Sprite
										key="countPlaque"
										anchor={0.5}
										width={SYMBOL_SIZE * 9.4}
										height={SYMBOL_SIZE * 2.4}
									/>
									<ResponsiveBitmapText
										anchor={0.5}
										maxWidth={SYMBOL_SIZE * 8.4}
										text={bookEventAmountToCurrencyString(countUpAmount)}
										style={{
											fontFamily: 'gold',
											fontSize: SYMBOL_SIZE * 1.6,
											align: 'center',
											fontWeight: 'bold',
											letterSpacing: 0,
										}}
									/>
								</Container>
							</WinAnimation>
						{:else}
							<ResponsiveBitmapText
								anchor={0.5}
								maxWidth={context.stateLayoutDerived.canvasSizes().width /
									context.stateLayoutDerived.mainLayout().scale}
								text={bookEventAmountToCurrencyString(countUpAmount)}
								style={{
									fontFamily: 'gold',
									fontSize: SYMBOL_SIZE,
									align: 'center',
									fontWeight: 'bold',
									letterSpacing: 0,
								}}
							/>
						{/if}
					</Container>
				</MainContainer>

				<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />

				{#if flash > 0}
					<CanvasSizeRectangle backgroundColor={0xffffff} backgroundAlpha={flash} />
				{/if}

				<PressToContinue
					position="betweenBoardAndBottom"
					onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())}
				/>
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>

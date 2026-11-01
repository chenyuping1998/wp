<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT, NUMBER_FONT } from '../game/fonts';
	import { Container, Text } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import { bookEventAmountToCurrencyString, bookEventAmountToCountUpString } from 'utils-shared/amount';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { OnMount } from 'components-shared';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import { fitFontSize } from '../game/fitTitle';
	// the title stays inside the paper card, not just the sign's plank area
	const TITLE_MAX = 0.74;
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import WinCoins from './WinCoins.svelte';
 import BigWinFx from './BigWinFx.svelte';
 import config from '../game/config';
 import {SIGN_LAND_MS} from '../game/meshWin/fsSign';

	const context = getContext();

	let show = $state(true);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});

	// Silence the coin loop the moment the total stops counting.
	//
	// winLevelSoundsStop() — which is what normally stops it — only runs after
	// freeSpinOutroCountUp resolves, and that resolves on the player's PRESS, not
	// when the count-up finishes. A player who leaves this screen up (reading the
	// total, taking a screenshot) therefore heard the 2.4s coin shimmer loop over
	// and over with nothing else going on. The loop belongs to the count-up, so it
	// ends with the count-up.
	const onCountUpComplete = () => {
		context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	};

	const isMax=$derived(amount>=config.betModes.base.max_win*100);
 const title=$derived(isMax?gameText('introMaxWinTitle'):gameText('totalWin'));
 const contact=()=>{
  if(!winLevelData)return;
  if(winLevelData.type==='big'){
   context.eventEmitter.broadcast({type:'soundBigWinBlast'});
   context.eventEmitter.broadcast({type:'soundWinTier',tier:winLevelData.alias});
  }
  context.eventEmitter.broadcast({type:'boardFrameImpact',kind:'win',strength:isMax?1.8:winLevelData.type==='big'?.85:.35});
  performance.mark('staticshift:outro-contact:'+(isMax?'max':winLevelData.alias));
 };

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => (show = true),
		freeSpinOutroHide: async () => (show = false),
		freeSpinOutroCountUp: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	{#if winLevelData}
		{@const duration = winLevelData.presentDuration}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				<OnMount onmount={async () => {await waitForTimeout(SIGN_LAND_MS+60);await startCountUp();}} />

				<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

				<!-- behind the plaque, so the bananas never bury the total -->
				{#if isMax || winLevelData?.alias==='epic'}<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />{/if}
                {#if isMax}<MainContainer><BigWinFx x={context.stateGameDerived.boardLayout().x} y={context.stateGameDerived.boardLayout().y} intensity={2.2}/></MainContainer>{/if}

				<FreeSpinAnimation oncontact={contact}>
					{#snippet children({ sizes })}
						<!-- the intro plaque's type: a flat green title and the amount in
						     red over an ink pass. It was a gold gradient with a soft shadow
						     and a cream amount — cream on the plaque's own paper, so the
						     total the whole feature built up to was the faintest thing on it. -->
						<Text
							anchor={0.5}
							y={-sizes.height * 0.26}
							text={title}
							style={{
								fontFamily: GAME_FONT,
								fontSize: fitFontSize(title, { fontFamily: GAME_FONT, fontSize: sizes.width * 0.12, fontWeight: GAME_FONT_WEIGHT, letterSpacing: 6 }, sizes.width * TITLE_MAX),
								fontWeight: GAME_FONT_WEIGHT,
								letterSpacing: 6,
								fill: 0x535e88,
							}}
						/>
						{@const amountText = bookEventAmountToCountUpString(countUpAmount, amount)}
						{@const amountSize = Math.min(sizes.width * 0.15, (sizes.width * 1.3) / Math.max(1, amountText.length))}
						{#if isMax}<Text anchor={.5} y={-sizes.height*.045} text={`${config.betModes.base.max_win.toLocaleString()}×`} style={{fontFamily:NUMBER_FONT,fontSize:sizes.width*.075,fill:0x535e88}}/>{/if}
                        <Container y={sizes.height * (isMax?.18:.1)}>
							<Text
								anchor={0.5}
								x={6}
								y={6}
								text={amountText}
								style={{ fontFamily: NUMBER_FONT, fontSize: amountSize, fontWeight: '400', fill: 0x15191f }}
							/>
							<Text
								anchor={0.5}
								text={amountText}
								style={{ fontFamily: NUMBER_FONT, fontSize: amountSize, fontWeight: '400', fill: 0xe7aa53 }}
							/>
						</Container>
					{/snippet}
				</FreeSpinAnimation>

				<PressToContinue
					position="betweenBoardAndBottom"
					onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())}
				/>
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>

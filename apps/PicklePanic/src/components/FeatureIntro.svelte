<script lang="ts">
	import config from '../game/config';
	import PickleLogo from './PickleLogo.svelte';
	import { getSocialTerms } from '../game/socialTerms';
	const terms = getSocialTerms();
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { getContext } from '../game/context';
	import { GAME_FONT } from '../game/fonts';
	const context = getContext();
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const stacked = $derived(layout.width / layout.height < 1.2);
	const cardW = $derived(layout.width * (stacked ? 0.84 : 0.25));
	const cardH = $derived(stacked ? layout.height * 0.195 : Math.min(layout.height * 0.55, cardW * 1.35));
	const panels = [
		{ key: 'gbW', title: 'THE PICKLE COOK', body: 'Every Cook collects every Pickle Jar at ×1.' },
		{ key: 'gbS', title: 'FREE SPINS', body: `${config.banditMeter.thresholds.join(' / ')} Cooks: +${config.banditMeter.spinsAdded} spins. All 10, then J, then Q become Jars.` },
		{ key: 'gbL1', title: 'MAX WIN', body: `The total win is capped at ${config.betModes.base.max_win.toLocaleString('en-US')}× your base ${terms.bet}.` },
	] as const;
</script>

<MainContainer>
	<PickleLogo x={layout.width*.5} y={layout.height*.16} width={Math.min(layout.width*.6,650)}/>
	{#each panels as panel, i}
		{@const cx = stacked ? layout.width * 0.5 : layout.width * (0.23 + i * 0.27)}
		{@const cy = stacked ? layout.height * (0.36 + i * 0.21) : layout.height * 0.53}
		<Container x={cx} y={cy}>
			<Sprite key="v8MenuFrame" anchor={0.5} width={cardW} height={cardH} />
			{#if i===2}<Text text={`${config.betModes.base.max_win.toLocaleString("en-US")}×`} anchor={0.5} x={stacked?-cardW*.27:0} y={stacked?0:-cardH*.15} style={{fontFamily:GAME_FONT,fontSize:cardW*(stacked?.053:.12),fill:0xc45240}}/>{:else}<Sprite key={panel.key} anchor={0.5} x={stacked ? -cardW * 0.27 : 0} y={stacked ? 0 : -cardH * 0.12}
				width={stacked ? cardW * 0.32 : cardW * 0.57} height={stacked ? cardW * 0.32 : cardW * 0.57} />{/if}
			<Text text={panel.title} anchor={0.5} x={stacked ? cardW * 0.13 : 0} y={stacked ? -cardH * 0.24 : cardH * 0.12}
				style={{ fontFamily: GAME_FONT, fontSize: cardW * (stacked ? 0.042 : 0.065), fill: 0x20231d }} />
			<Text text={panel.body} anchor={{ x: 0.5, y: 0 }} x={stacked ? cardW * 0.13 : 0} y={stacked ? -cardH * 0.08 : cardH * 0.21}
				style={{ fontFamily: GAME_FONT, fontSize: cardW * (stacked ? 0.03 : 0.043), fill: 0x20231d, align: 'center', wordWrap: true, breakWords: true, wordWrapWidth: cardW * (stacked ? 0.43 : 0.76) }} />
		</Container>
	{/each}
</MainContainer>

<script lang="ts">
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { onMount } from 'svelte';
	import { getContext } from '../game/context';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import config from '../game/config';
	import InkNumber from './InkNumber.svelte';

	const context = getContext();
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const stacked = $derived(layout.width / layout.height < 1.2);
	const logoWidth = $derived(Math.min(layout.width * 0.82, 760)); // 680 -> 760 for the free-standing wordmark (2026-10-31)
	const cardW = $derived(stacked ? layout.width * 0.87 : Math.min(layout.width * 0.25, 490));
	const cardH = $derived(stacked ? layout.height * 0.19 : Math.min(layout.height * 0.57, cardW * 1.38));
	const panels = [
		{ key: 'v8IntroCollect', title: 'TEA MASTER', body: 'Each Tea Master collects all Jade Cups.' },
		{ key: 'v8IntroSlice', title: 'FREE SPINS', body: '4 / 8 / 12 Tea Masters: +10 spins.\n10 / J / Q → Jade Cups.' },
		{ key: 'v8IntroReceipt', title: 'MAX WIN', body: 'Up to 10,000× your bet per round.' },
	];
	let t = $state(0);
	onMount(() => {
		const start = performance.now();
		let frame = 0;
		const tick = (now: number) => {
			t = now - start;
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});
	// Sushi Monkey's row of five dishes under the logo. No invented rating: they
	// stay empty unless the maths config ever supplies a volatility.
	const volatility = (config as unknown as { volatility?: number }).volatility;
</script>

<MainContainer>
	<!-- the free-standing jade wordmark (design/build_logo_wordmark.py, 2026-10-31).
	     The board it replaced swayed on a sine and swung its painted lantern;
	     a title standing on its own holds still. -->
	<Container x={layout.width * 0.5} y={layout.height * (stacked ? 0.115 : 0.15)}>
		<Sprite key="v8LogoBoard" anchor={0.5} width={logoWidth} height={logoWidth * 0.375} />
	</Container>
	{#each panels as panel, i}
		{@const cx = stacked ? layout.width * 0.5 : layout.width * (0.23 + i * 0.27)}
		{@const cy = stacked ? layout.height * (0.35 + i * 0.225) : layout.height * 0.57}
		{@const progress = Math.max(0, Math.min(1, (t - i * 105) / 480))}
		{@const tail = (1 - progress) ** 2}
		<Container x={cx} y={cy + 18 * tail} scale={1 - 0.05 * tail} rotation={stacked ? 0 : Math.sin(t / 2000 + i) * 0.005} alpha={1 - tail}>
			<Sprite key="v8MenuFrame" anchor={0.5} width={cardW} height={cardH} />
			<Sprite key={panel.key} anchor={0.5}
				x={stacked ? -cardW * 0.25 : 0} y={stacked ? 0 : -cardH * 0.16}
				width={stacked ? cardW * 0.38 : cardW * 0.79}
				height={stacked ? cardW * 0.2375 : cardW * 0.49375} />
			{#if i === 2}
				<!-- typeset on the bill's clear paper, between the items and the right
				     roller: image x 0.45..0.85, centred at (0.63, 0.48) of the art
				     (design/build_intro_scenes.py receipt) -->
				<InkNumber text="10,000×" role="count"
					x={stacked ? -cardW * 0.2 : cardW * 0.103}
					y={stacked ? -cardW * 0.005 : -cardH * 0.16 - cardW * 0.011}
					fontSize={cardW * (stacked ? 0.05 : 0.1)} maxWidth={cardW * (stacked ? 0.145 : 0.3)} />
			{/if}
			<Text text={panel.title} anchor={0.5}
				x={stacked ? cardW * 0.17 : 0} y={stacked ? -cardH * 0.23 : cardH * 0.12}
				style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT,
					fontSize: stacked ? Math.max(17, cardW * 0.046) : cardW * 0.075,
					fill: 0x2c5c4d }} />
			<Text text={panel.body} anchor={{ x: 0.5, y: 0 }}
				x={stacked ? cardW * 0.17 : 0} y={stacked ? -cardH * 0.12 : cardH * 0.23}
				style={{ fontFamily: GAME_FONT, fontSize: stacked ? Math.max(12, cardW * 0.028) : cardW * 0.046,
					lineHeight: stacked ? Math.max(16, cardW * 0.04) : cardW * 0.064,
					fill: 0x2a4037, align: 'center', wordWrap: true, breakWords: false,
					wordWrapWidth: cardW * (stacked ? 0.48 : 0.75) }} />
		</Container>
	{/each}
	<!-- in the gap between the logo board and the cards (Jade's board is larger
	     than Sushi Monkey's), drawn last so the cards' rails cannot cover it -->
	{@const logoBottom = layout.height * (stacked ? 0.115 : 0.15) + logoWidth * 0.1875}
	{@const cardsTop = stacked ? layout.height * 0.35 - cardH / 2 : layout.height * 0.57 - cardH / 2}
	<Container x={layout.width * 0.5 - 55} y={(logoBottom + cardsTop) / 2 - 10}>
		{#each [0, 1, 2, 3, 4] as i}
			<Sprite key={volatility !== undefined && i < volatility ? 'v8SoyFull' : 'v8SoyEmpty'} x={i * 23} width={20} height={20} />
		{/each}
	</Container>
</MainContainer>

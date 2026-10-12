<script lang="ts">
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { onMount } from 'svelte';
	import { getContext } from '../game/context';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import InkNumber from './InkNumber.svelte';

	const context = getContext();
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const stacked = $derived(layout.width / layout.height < 1.2);
	const logoWidth = $derived(Math.min(layout.width * 0.82, 680));
	const cardW = $derived(stacked ? layout.width * 0.87 : Math.min(layout.width * 0.25, 490));
	const cardH = $derived(stacked ? layout.height * 0.19 : Math.min(layout.height * 0.57, cardW * 1.38));
	const panels = [
		{ key: 'v8IntroCollect', title: 'CHEF', body: 'Each Chef collects all Order Trays.' },
		{ key: 'v8IntroSlice', title: 'FREE SPINS', body: '4 / 8 / 12 Chefs: +10 spins.\n10 / J / Q → Order Trays.' },
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
</script>

<MainContainer>
	<Container x={layout.width * 0.5} y={layout.height * (stacked ? 0.115 : 0.15)} rotation={0.006 * Math.sin(t / 2900 * Math.PI * 2)}>
		<Sprite key="v8LogoBoard" anchor={0.5} width={logoWidth} height={logoWidth * 0.375} />
		<Text text="DINER MONKEY" anchor={0.5}
			style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT,
				fontSize: logoWidth * 0.115, fill: 0xe2342b,
				stroke: { color: 0x1b1b1b, width: Math.max(2, logoWidth * 0.005), join: 'round' } }} />
	</Container>
	{#each panels as panel, i}
		{@const cx = stacked ? layout.width * 0.5 : layout.width * (0.23 + i * 0.27)}
		{@const cy = stacked ? layout.height * (0.35 + i * 0.225) : layout.height * 0.57}
		{@const progress = Math.max(0, Math.min(1, (t - i * 105) / 480))}
		{@const tail = (1 - progress) ** 2}
		<Container x={cx + (i - 1) * 38 * tail} y={cy + 12 * tail} rotation={(stacked ? 0 : Math.sin(t / 2000 + i) * 0.005) + (i - 1) * 0.04 * tail} alpha={1 - tail}>
			<Sprite key="v8MenuFrame" anchor={0.5} width={cardW} height={cardH} />
			<!-- a plain sprite, not a mesh (user, 2026-10-10) -->
			<Sprite key={panel.key} anchor={0.5}
				x={stacked ? -cardW * 0.25 : 0} y={stacked ? 0 : -cardH * 0.16}
				width={stacked ? cardW * 0.38 : cardW * 0.79}
				height={stacked ? cardW * 0.2375 : cardW * 0.49375} />
			{#if i === 2}
				<!-- typeset on the guest check's clear paper: centred at (600, 290) of
				     the 1024 x 640 scene, tilted 5° with the check
				     (design/build_diner_intro_scenes.py CHECK_CENTRE / CHECK_TILT) -->
				{@const pw = stacked ? cardW * 0.38 : cardW * 0.79}
				<Container
					x={(stacked ? -cardW * 0.25 : 0) + pw * (600 / 1024 - 0.5)}
					y={(stacked ? 0 : -cardH * 0.16) + pw * 0.625 * (290 / 640 - 0.5)}
					rotation={0.087}>
					<InkNumber text="10,000×" role="count" fontSize={pw * 0.11} maxWidth={pw * 0.42} />
				</Container>
			{/if}
			<Text text={panel.title} anchor={0.5}
				x={stacked ? cardW * 0.17 : 0} y={stacked ? -cardH * 0.23 : cardH * 0.12}
				style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT,
					fontSize: stacked ? Math.max(20, cardW * 0.054) : cardW * 0.09,
					fill: 0xe2342b, stroke: {color: 0x1b1b1b, width: 1, join: 'round'} }} />
			<Text text={panel.body} anchor={{ x: 0.5, y: 0 }}
				x={stacked ? cardW * 0.17 : 0} y={stacked ? -cardH * 0.12 : cardH * 0.23}
				style={{ fontFamily: GAME_FONT, fontSize: stacked ? Math.max(15, cardW * 0.035) : cardW * 0.058,
					lineHeight: stacked ? Math.max(19, cardW * 0.047) : cardW * 0.074,
					fill: 0x1b1b1b, align: 'center', wordWrap: true, breakWords: false,
					wordWrapWidth: cardW * (stacked ? 0.5 : 0.8) }} />
		</Container>
	{/each}
</MainContainer>

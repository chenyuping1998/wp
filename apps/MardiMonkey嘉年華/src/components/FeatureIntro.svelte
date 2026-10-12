<script lang="ts">
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { onMount } from 'svelte';
	import { getContext } from '../game/context';
	import InkNumber from './InkNumber.svelte';
	import { GAME_FONT, GAME_FONT_WEIGHT, BODY_FONT } from '../game/fonts';

	const context = getContext();
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const stacked = $derived(layout.width / layout.height < 1.2);
	const logoWidth = $derived(Math.min(layout.width * 0.82, 680));
	const cardW = $derived(stacked ? layout.width * 0.87 : Math.min(layout.width * 0.25, 490));
	const cardH = $derived(stacked ? layout.height * 0.21 : Math.min(layout.height * 0.57, cardW * 1.38));
	let introMs = $state(0);
	onMount(() => {
		const start = performance.now();
		let frame = 0;
		const tick = (now: number) => {
			introMs = Math.min(1100, now - start);
			if (introMs < 1100) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});
	const entryTail = (index: number) => {
		const progress = Math.max(0, Math.min(1, (introMs - index * 105) / 480));
		return (1 - progress) ** 2;
	};
	const panels = [
		{ key: 'v8IntroCollect', title: 'MARSHAL', body: 'Each Marshal collects all Beads.' },
		{ key: 'v8IntroSlice', title: 'FREE SPINS', body: '4 / 8 / 12 Marshals: +10 spins.\n10 / J / Q → Beads.' },
		{ key: 'v8IntroReceipt', title: 'MAX WIN', body: 'Up to 10,000× your bet per round.' },
	];
</script>

<MainContainer>
	<Container x={layout.width * 0.5} y={layout.height * (stacked ? 0.115 : 0.15)}>
		<Sprite key="v8LogoBoard" anchor={0.5} width={logoWidth} height={logoWidth * 0.375} />
		<Text text="MARDI MONKEY" anchor={0.5}
			style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT,
				fontSize: logoWidth * 0.095, fill: 0x27133d,
				stroke: { color: 0xfff4de, width: 3, join: 'round' } }} />
	</Container>
	{#each panels as panel, i}
		{@const cx = stacked ? layout.width * 0.5 : layout.width * (0.23 + i * 0.27)}
		{@const cy = stacked ? layout.height * (0.35 + i * 0.225) : layout.height * 0.57}
		{@const tail = entryTail(i)}
		<Container x={cx + (1 - i) * 60 * tail} y={cy + 14 * tail} rotation={(i - 1) * 0.08 * tail} alpha={1 - tail}>
			<Sprite key={stacked ? 'v8MenuFrameWide' : 'v8MenuFrame'} anchor={0.5} width={cardW} height={cardH} />
			<Sprite key={panel.key} anchor={0.5}
				x={stacked ? -cardW * 0.25 : 0} y={stacked ? 0 : -cardH * 0.16}
				width={stacked ? cardW * 0.38 : cardW * 0.79}
				height={stacked ? cardW * 0.2375 : cardW * 0.49375} />
			{#if i === 2}
				<!-- typeset on the MAX WIN paper's clear band: centred at (600, 290) of
				     the 1024 x 640 scene, tilted 5° with it
				     (design/build_intro_scenes.py CHECK_CENTRE / CHECK_TILT) -->
				{@const pw = stacked ? cardW * 0.38 : cardW * 0.79}
				<Container
					x={(stacked ? -cardW * 0.25 : 0) + pw * (600 / 1024 - 0.5)}
					y={(stacked ? 0 : -cardH * 0.16) + pw * 0.625 * (290 / 640 - 0.5)}
					rotation={0.087}>
					<InkNumber text="10,000×" role="count" fontSize={pw * 0.11} maxWidth={pw * 0.42} />
				</Container>
			{/if}
			<Text text={panel.title} anchor={0.5}
				x={stacked ? cardW * 0.20 : 0} y={stacked ? -cardH * 0.28 : cardH * 0.12}
				style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT,
					fontSize: stacked ? Math.max(19, cardW * 0.05) : cardW * 0.082,
					fill: 0x170b26 }} />
			<Text text={panel.body} anchor={{ x: 0.5, y: 0 }}
				x={stacked ? cardW * 0.20 : 0} y={stacked ? -cardH * 0.12 : cardH * 0.23}
				style={{ fontFamily: BODY_FONT, fontSize: stacked ? Math.max(16, cardW * 0.035) : cardW * 0.052,
					lineHeight: stacked ? Math.max(21, cardW * 0.046) : cardW * 0.067,
					fill: 0x170b26, align: 'center', wordWrap: true, breakWords: false,
					wordWrapWidth: cardW * (stacked ? 0.46 : 0.75) }} />
		</Container>
	{/each}
</MainContainer>

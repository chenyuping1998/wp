<script lang="ts">
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { onMount } from 'svelte';
	import { getContext } from '../game/context';
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
		{ key: 'v8IntroCollect', title: 'BOSS', body: 'Each Boss collects all Chicken Baskets.' },
		{ key: 'v8IntroSlice', title: 'FREE SPINS', body: '4 / 8 / 12 Bosses: +10 spins.\n10 / J / Q → Chicken Baskets.' },
		{ key: 'v8IntroReceipt', title: 'MAX WIN', body: 'Up to 10,000× your bet per round.' },
	];
</script>

<MainContainer>
	<Container x={layout.width * 0.5} y={layout.height * (stacked ? 0.115 : 0.15)}>
		<Sprite key="v8LogoBoard" anchor={0.5} width={logoWidth} height={logoWidth * 0.375} />
	</Container>
	{#each panels as panel, i}
		{@const cx = stacked ? layout.width * 0.5 : layout.width * (0.23 + i * 0.27)}
		{@const cy = stacked ? layout.height * (0.35 + i * 0.225) : layout.height * 0.57}
		{@const tail = entryTail(i)}
		<Container x={cx} y={cy + 28 * tail} rotation={(i - 1) * 0.03 * tail} alpha={1 - tail}>
			<Sprite key={stacked ? 'v8MenuFrameWide' : 'v8MenuFrame'} anchor={0.5} width={cardW} height={cardH} />
			<Sprite key={panel.key} anchor={0.5}
				x={stacked ? -cardW * 0.25 : 0} y={stacked ? 0 : -cardH * 0.16}
				width={stacked ? cardW * 0.38 : cardW * 0.79}
				height={stacked ? cardW * 0.2375 : cardW * 0.49375} />
			<Text text={panel.title} anchor={0.5}
				x={stacked ? cardW * 0.20 : 0} y={stacked ? -cardH * 0.28 : cardH * 0.12}
				style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT,
					fontSize: stacked ? Math.max(19, cardW * 0.05) : cardW * 0.082,
					fill: 0x202638 }} />
			<Text text={panel.body} anchor={{ x: 0.5, y: 0 }}
				x={stacked ? cardW * 0.20 : 0} y={stacked ? -cardH * 0.12 : cardH * 0.23}
				style={{ fontFamily: BODY_FONT, fontSize: stacked ? Math.max(16, cardW * 0.035) : cardW * 0.052,
					lineHeight: stacked ? Math.max(21, cardW * 0.046) : cardW * 0.067,
					fill: 0x202638, align: 'center', wordWrap: true, breakWords: false,
					wordWrapWidth: cardW * (stacked ? 0.46 : 0.75) }} />
		</Container>
	{/each}
</MainContainer>

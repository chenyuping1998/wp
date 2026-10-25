<script lang="ts">
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { MainContainer } from 'components-layout';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { GAME_FONT, GAME_FONT_WEIGHT, BODY_FONT } from '../game/fonts';
	import { socialTerms } from '../game/socialTerms';
	import config from '../game/config';
import {parrotText} from '../game/parrotText';

	
	const context = getContext();
	const T = socialTerms();

	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const stacked = $derived(layout.width / layout.height < 1.2);
	const logoWidth = $derived(stacked ? Math.min(layout.width * 0.82, 680) : Math.min(layout.width * 0.6, 520));
	const cardW = $derived(stacked ? layout.width * 0.87 : Math.min(layout.width * 0.25, 490));
	const cardH = $derived(stacked ? layout.height * 0.21 : Math.min(layout.height * 0.57, cardW * 1.38));

	// a short staggered drop-in, then everything holds still
	let introMs = $state(0);
	onMount(() => {
		const start = performance.now();
		let frame = 0;
		const tick = (now: number) => {
			introMs = Math.min(1100, now - start);
			if (introMs < 1100) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		const fallback = setTimeout(() => (introMs = 1100), 1500);
		return () => {
			cancelAnimationFrame(frame);
			clearTimeout(fallback);
		};
	});
	const entryTail = (index: number) => {
		const progress = Math.max(0, Math.min(1, (introMs - index * 105) / 480));
		return (1 - progress) ** 2;
	};

	
	const panels = [
		{
			key: 'mgIntro1',
			title: parrotText('clusterTitle'),
			body: parrotText('cluster'),
		},
		{
			key: 'mgIntro2',
			title: parrotText('encoreTitle'),
			body: parrotText('encoreRule'),
		},
		{
			key: 'mgIntro3',
			title: parrotText('freeTitle'),
			body: parrotText('featureRule'),
		},
	];

	const INK = 0x2a1f24;
	const drawCard = (g: PixiGraphics) => {
		g.clear();
		g.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 18).fill({ color: 0xefe8d8 }).stroke({ width: 5, color: INK });
		g.roundRect(-cardW / 2 + 9, -cardH / 2 + 9, cardW - 18, cardH - 18, 12).stroke({ width: 2.5, color: 0xf2b632 });
	};
</script>

<MainContainer>
	<Container x={layout.width * 0.5} y={layout.height * (stacked ? 0.115 : 0.15)}>
		<Sprite key="mgLogo" anchor={0.5} width={logoWidth} height={logoWidth * 0.375} />
	</Container>
	{#each panels as panel, i (panel.key)}
		{@const cx = stacked ? layout.width * 0.5 : layout.width * (0.23 + i * 0.27)}
		{@const cy = stacked ? layout.height * (0.35 + i * 0.225) : layout.height * 0.57}
		{@const tail = entryTail(i)}
		{@const pw = cardW * (stacked ? 0.4 : 0.82)}
		{@const sceneX = stacked ? -cardW * 0.25 : 0}
		{@const sceneY = stacked ? 0 : -cardH * 0.16}
		{@const textX = stacked ? cardW * 0.2 : 0}
		<Container x={cx} y={cy - 34 * tail} rotation={(i - 1) * 0.02 * tail} alpha={1 - tail}>
			<Graphics draw={drawCard} />
			<Sprite key={panel.key} anchor={0.5} x={sceneX} y={sceneY} width={pw} height={pw * 0.75} />
			<Text
				text={panel.title}
				anchor={0.5}
				x={textX}
				y={stacked ? -cardH * 0.28 : cardH * 0.17}
				style={{
					fontFamily: GAME_FONT,
					fontWeight: GAME_FONT_WEIGHT,
					fontSize: stacked ? Math.max(19, cardW * 0.05) : cardW * 0.08,
					fill: 0xc85a4a,
				}}
			/>
			<Text
				text={panel.body}
				anchor={{ x: 0.5, y: 0 }}
				x={textX}
				y={stacked ? -cardH * 0.12 : cardH * 0.25}
				style={{
					fontFamily: BODY_FONT,
					fontSize: stacked ? Math.max(16, cardW * 0.035) : cardW * 0.052,
					lineHeight: stacked ? Math.max(21, cardW * 0.046) : cardW * 0.067,
					fill: INK,
					align: 'center',
					wordWrap: true,
					breakWords: false,
					wordWrapWidth: cardW * (stacked ? 0.46 : 0.8),
				}}
			/>
		</Container>
	{/each}
</MainContainer>

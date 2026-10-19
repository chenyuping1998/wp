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
	// the title's own clock: a small hop every few seconds for as long as the
	// intro is up, then it holds still
	let signMs = $state(0);
	onMount(() => {
		const start = performance.now();
		let frame = 0;
		const tick = (now: number) => {
			signMs = now - start;
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});
	// the hop: up, a little over, settled — 420 ms out of every 5 s
	const titleHop = $derived.by(() => {
		const t = (signMs - 1400) % 5000;
		if (signMs < 1400 || t > 420) return { y: 0, s: 1, r: 0 };
		const k = t / 420;
		const lift = Math.sin(Math.PI * k);
		return { y: -logoWidth * 0.03 * lift, s: 1 + 0.05 * lift, r: -0.02 * Math.sin(2 * Math.PI * k) };
	});
	const entryTail = (index: number) => {
		const progress = Math.max(0, Math.min(1, (introMs - index * 105) / 480));
		return (1 - progress) ** 2;
	};
	const panels = [
		{ key: 'v8IntroCollect', title: 'BOWLER', body: 'Each Bowler collects all Pins.' },
		{ key: 'v8IntroSlice', title: 'FREE SPINS', body: '4 / 8 / 12 Bowlers: +10 spins.\n10 / J / Q → Pins.' },
		{ key: 'v8IntroReceipt', title: 'MAX WIN', body: 'Up to 10,000× your bet per round.' },
	];
</script>

<MainContainer>
	<Container x={layout.width * 0.5} y={layout.height * (stacked ? 0.115 : 0.15)}>
		<!-- the title alone, no signboard (user, 2026-10-18; was the LOGO_BOARD
		     mesh on sushiV8/logo_board_titled.png) — design/bake_loading_title.py -->
		<Container y={titleHop.y} scale={titleHop.s} rotation={titleHop.r}>
			<Sprite key="v8LogoTitle" anchor={0.5} width={logoWidth} height={logoWidth / 7.15} />
		</Container>
	</Container>
	{#each panels as panel, i}
		{@const cx = stacked ? layout.width * 0.5 : layout.width * (0.23 + i * 0.27)}
		{@const cy = stacked ? layout.height * (0.35 + i * 0.225) : layout.height * 0.57}
		{@const tail = entryTail(i)}
		<Container x={cx} y={cy - 34 * tail} rotation={(i - 1) * 0.02 * tail} alpha={1 - tail}>
			<Sprite key="v8MenuFrame" anchor={0.5} width={cardW} height={cardH} />
			<Sprite key={panel.key} anchor={0.5}
				x={stacked ? -cardW * 0.25 : 0} y={stacked ? 0 : -cardH * 0.16}
				width={stacked ? cardW * 0.38 : cardW * 0.79}
				height={stacked ? cardW * 0.2375 : cardW * 0.49375} />
			<Text text={panel.title} anchor={0.5}
				x={stacked ? cardW * 0.20 : 0} y={stacked ? -cardH * 0.28 : cardH * 0.12}
				style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT,
					fontSize: stacked ? Math.max(19, cardW * 0.05) : cardW * 0.082,
					fill: 0x10222a }} />
			<Text text={panel.body} anchor={{ x: 0.5, y: 0 }}
				x={stacked ? cardW * 0.20 : 0} y={stacked ? -cardH * 0.12 : cardH * 0.23}
				style={{ fontFamily: BODY_FONT, fontSize: stacked ? Math.max(16, cardW * 0.035) : cardW * 0.052,
					lineHeight: stacked ? Math.max(21, cardW * 0.046) : cardW * 0.067,
					fill: 0x10222a, align: 'center', wordWrap: true, breakWords: false,
					wordWrapWidth: cardW * (stacked ? 0.46 : 0.75) }} />
		</Container>
	{/each}
</MainContainer>

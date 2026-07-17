<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { Container, Graphics, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { Tween } from 'svelte/motion';
	import { backOut } from 'svelte/easing';

	import { getContext } from '../game/context';

	// Programmatic win-level presentation (replaces the MM template bigwin
	// spine): rotating gold rays behind a slamming title, children = count-up.
	type Props = {
		animationMap: {
			intro:
				| 'big_win_intro'
				| 'epic_win_intro'
				| 'max_win_intro'
				| 'mega_win_intro'
				| 'super_win_intro';
			idle: 'big_win_idle' | 'epic_win_idle' | 'max_win_idle' | 'mega_win_idle' | 'super_win_idle';
			outro: 'big_win_exit' | 'epic_win_exit' | 'max_win_exit' | 'mega_win_exit' | 'super_win_exit';
		};
		children: Snippet;
	};

	const props: Props = $props();
	const context = getContext();

	const TITLE_MAP: Record<string, string> = {
		big: 'BIG WIN',
		super: 'SUPER WIN',
		mega: 'MEGA WIN',
		epic: 'EPIC WIN',
		max: 'MAX WIN',
	};
	const alias = $derived(props.animationMap.intro.split('_win_')[0]);
	const title = $derived(TITLE_MAP[alias] ?? 'BIG WIN');
	// hotter palette the higher the level
	const RAY_COLOR_MAP: Record<string, number> = {
		big: 0xffd75e,
		super: 0xffc04a,
		mega: 0xffa63d,
		epic: 0xff8a2e,
		max: 0xff6a26,
	};
	const rayColor = $derived(RAY_COLOR_MAP[alias] ?? 0xffd75e);

	const width = $derived(context.stateGameDerived.boardLayout().width);

	// intro slam + idle pulse
	const titleScale = new Tween(0.001);
	let rayRotation = $state(0);
	let pulse = $state(0);
	onMount(() => {
		titleScale.set(1, { duration: 550, easing: backOut });
		const id = setInterval(() => {
			rayRotation += 0.006;
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / 420);
		}, 33);
		return () => clearInterval(id);
	});

	const drawRays = (g: PixiGraphics) => {
		const count = 12;
		const len = width * 0.75;
		g.clear();
		for (let i = 0; i < count; i++) {
			const a = rayRotation + (i / count) * Math.PI * 2;
			const halfW = 0.11;
			g.beginFill(rayColor, i % 2 === 0 ? 0.13 + 0.05 * pulse : 0.07);
			g.moveTo(0, 0);
			g.lineTo(Math.cos(a - halfW) * len, Math.sin(a - halfW) * len);
			g.lineTo(Math.cos(a + halfW) * len, Math.sin(a + halfW) * len);
			g.closePath();
			g.endFill();
		}
		// hot core glow behind the title
		g.beginFill(rayColor, 0.14 + 0.08 * pulse);
		g.drawEllipse(0, 0, width * 0.34, width * 0.17);
		g.endFill();
	};
</script>

<Container>
	<Graphics draw={drawRays} />
	<Container scale={titleScale.current}>
		<Text
			anchor={0.5}
			y={-width * 0.09}
			text={title}
			style={{
				fontFamily: 'proxima-nova, Arial, sans-serif',
				fontSize: width * 0.13,
				fontWeight: '900',
				letterSpacing: 8,
				fill: [0xfff3bd, 0xffd75e, 0xc9821a],
				stroke: 0x54330a,
				strokeThickness: 8,
				dropShadow: true,
				dropShadowColor: 0x000000,
				dropShadowBlur: 12,
				dropShadowDistance: 4,
			}}
		/>
		<Container y={width * 0.05}>
			{@render props.children()}
		</Container>
	</Container>
</Container>

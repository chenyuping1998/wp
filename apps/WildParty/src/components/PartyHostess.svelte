<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';

	const context = getContext();

	// party_hostess_v2.png source proportions (role3, legs stretched)
	const ASPECT = 284 / 884;
	// approximate champagne-glass mouth in sprite space (from bottom-center anchor)
	const GLASS_OFFSET = { x: -0.38, y: -0.85 };

	const layout = $derived.by(() => {
		const board = context.stateGameDerived.boardLayout();
		const main = context.stateLayoutDerived.mainLayout();
		const canvas = context.stateLayoutDerived.canvasSizes();
		// feet on the visible canvas bottom edge, head near the canvas top —
		// the figure fills the whole right side (full body always visible
		// because the height is derived from the visible canvas itself)
		const visibleHeight = canvas.height / main.scale;
		const feetY = main.height * 0.5 + visibleHeight * 0.5;
		const height = visibleHeight * 0.94;
		const width = height * ASPECT;
		return {
			width,
			height,
			// just clear of the reel frame's right edge
			x: board.x + board.width * 0.5 + SYMBOL_SIZE * 0.9 + width * 0.45,
			y: feetY,
		};
	});

	let now = $state(0);
	let sparkles = $state<{ id: number; born: number; dx: number; dy: number }[]>([]);
	let nextSparkleAt = 0;
	let nextSparkleId = 0;

	onMount(() => {
		let raf = 0;
		const tick = (t: number) => {
			now = t;
			if (t >= nextSparkleAt) {
				// occasional champagne-bubble glint at the glass
				sparkles = [
					...sparkles.filter(({ born }) => t - born < 700),
					{
						id: nextSparkleId++,
						born: t,
						dx: (Math.random() - 0.5) * 0.05,
						dy: (Math.random() - 0.5) * 0.04,
					},
				];
				nextSparkleAt = t + 2400 + Math.random() * 1800;
			} else {
				const alive = sparkles.filter(({ born }) => t - born < 700);
				if (alive.length !== sparkles.length) sparkles = alive;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	// idle: slow breathing + a gentle weight sway around the feet
	const pose = $derived.by(() => {
		const breath = Math.sin((now / 3100) * Math.PI * 2);
		const sway = Math.sin((now / 5400) * Math.PI * 2);
		return {
			scaleX: 1 - 0.004 * breath,
			scaleY: 1 + 0.007 * breath,
			rotation: 0.008 * sway,
		};
	});

	const sparkleState = (born: number) => {
		const p = Math.min(1, (now - born) / 700);
		return {
			size: SYMBOL_SIZE * 0.34 * Math.sin(p * Math.PI),
			alpha: Math.sin(p * Math.PI),
			rot: p * 1.8,
		};
	};
</script>

{#if ['desktop', 'landscape'].includes(context.stateLayoutDerived.layoutType())}
	<MainContainer>
		<Container x={layout.x} y={layout.y}>
			<!-- soft ground-contact shadow so she doesn't float on the scene -->
			<Sprite
				key="fxGlow"
				anchor={0.5}
				y={-layout.width * 0.02}
				tint={0x000000}
				width={layout.width * 1.15}
				height={layout.width * 0.28}
				alpha={0.38}
			/>
			<!-- magenta rim light: additive copy peeking out on the lit side,
			     ties her into the club spotlights behind -->
			<Sprite
				key="partyHostess"
				anchor={{ x: 0.5, y: 1 }}
				x={-layout.width * 0.022}
				y={-layout.height * 0.006}
				width={layout.width * pose.scaleX}
				height={layout.height * pose.scaleY}
				rotation={pose.rotation}
				tint={0xb04ef0}
				blendMode="add"
				alpha={0.5}
			/>
			<!-- slight lavender grade pulls the artwork toward the scene palette -->
			<Sprite
				key="partyHostess"
				anchor={{ x: 0.5, y: 1 }}
				width={layout.width * pose.scaleX}
				height={layout.height * pose.scaleY}
				rotation={pose.rotation}
				tint={0xf2e9fb}
			/>
			{#each sparkles as sparkle (sparkle.id)}
				{@const state = sparkleState(sparkle.born)}
				<Sprite
					key="fxStar"
					anchor={0.5}
					x={layout.width * (GLASS_OFFSET.x + sparkle.dx)}
					y={layout.height * (GLASS_OFFSET.y + sparkle.dy)}
					rotation={state.rot}
					tint={0xffe9a8}
					blendMode="add"
					width={state.size}
					height={state.size}
					alpha={state.alpha}
				/>
			{/each}
		</Container>
	</MainContainer>
{/if}

<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';

	const context = getContext();

	// party_hostess.png source proportions
	const ASPECT = 545 / 818;
	// approximate champagne-glass mouth in sprite space (from bottom-center anchor)
	const GLASS_OFFSET = { x: -0.36, y: -0.78 };

	const layout = $derived.by(() => {
		const board = context.stateGameDerived.boardLayout();
		const height = board.height * 0.9;
		const width = height * ASPECT;
		return {
			width,
			height,
			// mirror of the FreeSpinCounter column: just right of the reel frame
			x: board.x + board.width * 0.5 + SYMBOL_SIZE * 0.7 + width * 0.5,
			// feet planted on the board's bottom edge
			y: board.y + board.height * 0.5,
		};
	});

	let now = $state(0);
	let bounceStart = -1;
	let bounceHops = 1;
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

	const startBounce = (hops: number) => {
		bounceStart = now;
		bounceHops = hops;
	};

	context.eventEmitter.subscribeOnMount({
		winShow: () => startBounce(1),
		freeSpinIntroShow: () => startBounce(2),
		freeSpinOutroShow: () => startBounce(2),
	});

	// idle: slow breathing + a gentle weight sway around the feet
	const pose = $derived.by(() => {
		const breath = Math.sin((now / 3100) * Math.PI * 2);
		const sway = Math.sin((now / 5400) * Math.PI * 2);

		// celebration hop(s): lift + squashy scale punch, decaying
		let hopLift = 0;
		let hopPunch = 0;
		if (bounceStart >= 0) {
			const HOP_MS = 420;
			const p = (now - bounceStart) / (HOP_MS * bounceHops);
			if (p < 1) {
				const hop = Math.abs(Math.sin(p * Math.PI * bounceHops));
				const decay = 1 - p * 0.45;
				hopLift = 14 * hop * decay;
				hopPunch = 0.05 * hop * decay;
			}
		}

		return {
			scaleX: 1 - 0.004 * breath - hopPunch * 0.6,
			scaleY: 1 + 0.007 * breath + hopPunch,
			rotation: 0.008 * sway,
			lift: hopLift,
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
		<Container x={layout.x} y={layout.y - pose.lift}>
			<Sprite
				key="partyHostess"
				anchor={{ x: 0.5, y: 1 }}
				width={layout.width * pose.scaleX}
				height={layout.height * pose.scaleY}
				rotation={pose.rotation}
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

<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import type { WinLevelAlias } from '../game/winLevelMap';

	/**
	 * The big-win celebration: molten metal thrown up out of the forge.
	 *
	 * This was `ParticleEmitter key="coins"` over SD2_Coin.json — a spritesheet of
	 * gold coins from the Stake sample game. Coins are the wrong object for this
	 * game (nothing in Ember Forge is a coin; the theme is smithing), and it was
	 * 2.4MB of another game's art on the most important screen this game has.
	 *
	 * A fixed pool rather than a spawner. Every droplet is a phase offset into one
	 * shared cycle, so there is no allocation, no emitter state to keep in sync
	 * with the win presentation, and the whole thing is a pure function of the
	 * clock — starting and stopping is just an alpha ramp.
	 */
	type Props = {
		emit?: boolean;
		levelAlias?: WinLevelAlias;
	};

	const props: Props = $props();
	const context = getContext();

	// Bigger wins throw more, higher, and hotter.
	const TIERS: Record<string, { count: number; reach: number; spread: number }> = {
		big: { count: 26, reach: 1, spread: 0.8 },
		superwin: { count: 38, reach: 1.12, spread: 0.9 },
		mega: { count: 52, reach: 1.24, spread: 1 },
		epic: { count: 68, reach: 1.36, spread: 1.1 },
		max: { count: 88, reach: 1.5, spread: 1.2 },
	};
	const tier = $derived(TIERS[props.levelAlias ?? ''] ?? TIERS.big);

	// The pool is sized for the largest tier once, and each tier draws the first N
	// of it. Re-deriving the array per tier would reshuffle every droplet the
	// moment the win level ticks up mid-count.
	const POOL = 88;
	const droplets = Array.from({ length: POOL }, (_, i) => {
		const r = (salt: number) => ((Math.sin((i + 1) * salt) + 1) / 2) % 1;
		return {
			// Launched from a wide mouth across the foot of the board, not a point:
			// a point source reads as a firework, and this is a forge boiling over.
			originX: (r(12.9898) - 0.5) * 2,
			lift: 0.75 + r(78.233) * 0.5,
			drift: (r(43.11) - 0.5) * 1.4,
			size: 0.16 + r(21.7) * 0.22,
			spin: (r(5.31) - 0.5) * 7,
			// Golden-ratio stagger keeps the stream even without a spawn timer.
			offset: (i * 0.6180339887) % 1,
			speed: 0.42 + r(33.7) * 0.22,
			hot: r(61.2),
		};
	});

	let clock = $state(0);
	// Ramped rather than switched, so the fountain dies down over a beat instead of
	// every droplet vanishing on one frame when the celebration ends.
	let strength = $state(0);

	onMount(() => {
		let raf = 0;
		let last = performance.now();
		const step = (now: number) => {
			const dt = Math.min(now - last, 100) / 1000;
			last = now;
			clock += dt;
			const target = props.emit ? 1 : 0;
			strength += (target - strength) * Math.min(1, dt * (props.emit ? 7 : 2.5));
			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	});

	const layout = $derived(context.stateGameDerived.boardLayout());
	const boardW = $derived(layout.width);
	const boardH = $derived(layout.height);

	const placed = $derived.by(() => {
		if (strength < 0.01) return [];
		return droplets.slice(0, tier.count).map((drop) => {
			const t = (drop.offset + clock * drop.speed) % 1;
			// A ballistic arc: up fast, over the top, down under gravity. `4t(1-t)`
			// peaks at the halfway point, which is what puts the hang at the top of
			// the throw where it belongs.
			const rise = 4 * t * (1 - t) * drop.lift * tier.reach;
			return {
				x: (drop.originX * tier.spread * boardW) / 2 + drop.drift * boardW * 0.25 * t,
				y: boardH * 0.62 - rise * boardH * 0.95,
				size: SYMBOL_SIZE * drop.size,
				rotation: drop.spin * t,
				// White-hot leaving the crucible, cooling to red as it falls.
				tint: t < 0.35 ? 0xfff3cf : t < 0.7 ? 0xffa63a : 0xd9541a,
				alpha: strength * Math.min(1, t * 6) * (1 - Math.max(0, (t - 0.8) / 0.2)),
			};
		});
	});
</script>

{#if placed.length > 0}
	<MainContainer>
		<Container x={layout.x} y={layout.y}>
			{#each placed as drop, index (index)}
				<!-- the droplet itself -->
				<Sprite
					key="fxStreak"
					anchor={0.5}
					x={drop.x}
					y={drop.y}
					width={drop.size}
					height={drop.size * 0.5}
					rotation={drop.rotation}
					tint={drop.tint}
					blendMode="add"
					alpha={drop.alpha}
				/>
				<!-- and the light it carries with it -->
				<Sprite
					key="fxGlow"
					anchor={0.5}
					x={drop.x}
					y={drop.y}
					width={drop.size * 2.1}
					height={drop.size * 2.1}
					tint={drop.tint}
					blendMode="add"
					alpha={drop.alpha * 0.4}
				/>
			{/each}
		</Container>
	</MainContainer>
{/if}

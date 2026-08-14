<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';

	/**
	 * A symbol being taken by the tumble: struck white, blown apart, and carried
	 * off as slag and sparks.
	 *
	 * This replaces `explosion`, a Spine skeleton out of the Stake sample game's
	 * `symbols3` atlas. It was the single most-repeated animation in Ember Forge —
	 * it fires once per cell of every winning cluster, dozens of times a round —
	 * and it was somebody else's artwork, in somebody else's palette, playing over
	 * a forge.
	 *
	 * Built the same way as SymbolWinAnim, which it hands over from: a one-shot
	 * timeline over the shared FX textures, driven by the symbol's own sprite so it
	 * costs nothing per symbol and keeps working for whatever art lands next.
	 */
	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	// Shorter than the win animation it follows. TumbleLayer time-boxes the whole
	// burn-out with its own timeout and the fall starts on that timer, so anything
	// still running past it would be cut off by the incoming symbols rather than
	// finishing.
	const DURATION = 420;

	// Deterministic per instance. Seven cells of one cluster running the identical
	// blast is what makes a board read as a machine rather than a fire.
	const seed = Math.random();
	const rand = (i: number, salt: number) => ((Math.sin((i + 1) * salt + seed * 97) + 1) / 2) % 1;

	// Slag: heavier, fewer, thrown wide and pulled down hard.
	const SHARDS = 7;
	const shards = Array.from({ length: SHARDS }, (_, i) => ({
		angle: (i / SHARDS) * Math.PI * 2 + rand(i, 12.9898) * 0.7,
		speed: 0.5 + rand(i, 43.11) * 0.45,
		size: 0.16 + rand(i, 21.7) * 0.14,
		spin: (rand(i, 5.31) - 0.5) * 5,
	}));

	// Sparks: light, many, and they hang in the draught instead of falling.
	const SPARKS = 13;
	const sparks = Array.from({ length: SPARKS }, (_, i) => ({
		angle: rand(i, 78.233) * Math.PI * 2,
		speed: 0.35 + rand(i, 33.7) * 0.85,
		size: 0.05 + rand(i, 61.2) * 0.06,
		delay: rand(i, 17.4) * 0.18,
	}));

	let t = $state(0);

	onMount(() => {
		// Resolved immediately, for the same reason SymbolWinAnim does: the tumble
		// owns the timing of the board, and making it wait on every cell's animation
		// is what turned a long chain into half a minute of standing still.
		props.oncomplete?.();

		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now;
			t = Math.min(1, (now - start) / DURATION);
			if (t < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const easeOut = (v: number) => 1 - (1 - v) ** 3;

	// The symbol goes in the first fifth: a hard flash out to white, then gone. It
	// does not shrink — a symbol that shrinks reads as being put away, and this one
	// is being destroyed.
	const bodyT = $derived(Math.min(1, t / 0.22));
	const bodyAlpha = $derived(1 - bodyT);
	const bodyScale = $derived(1 + bodyT * 0.45);

	// The flash outlives the symbol slightly, so there is light where it was.
	const flash = $derived(t < 0.1 ? t / 0.1 : Math.max(0, 1 - (t - 0.1) / 0.5));

	const width = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width);
	const height = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height);
</script>

<Container x={props.x} y={props.y}>
	<!-- the blast core, behind everything -->
	<Sprite
		key="fxGlow"
		anchor={0.5}
		width={SYMBOL_SIZE * (0.9 + easeOut(t) * 1.5)}
		height={SYMBOL_SIZE * (0.9 + easeOut(t) * 1.5)}
		tint={0xffb149}
		blendMode="add"
		alpha={0.85 * flash}
	/>

	{#if bodyAlpha > 0}
		<Container scale={bodyScale}>
			<Sprite anchor={0.5} key={props.symbolInfo.assetKey} {width} {height} alpha={bodyAlpha} />
			<!-- blown through to white on the way out, following its own silhouette -->
			<Sprite
				anchor={0.5}
				key={props.symbolInfo.assetKey}
				{width}
				{height}
				blendMode="add"
				tint={0xfff6e0}
				alpha={bodyAlpha}
			/>
		</Container>
	{/if}

	<!-- slag thrown out of the break, tumbling and falling -->
	{#each shards as shard, index (index)}
		{@const travel = easeOut(t) * SYMBOL_SIZE * shard.speed}
		<Sprite
			key="fxStreak"
			anchor={0.5}
			x={Math.cos(shard.angle) * travel}
			y={Math.sin(shard.angle) * travel + SYMBOL_SIZE * 0.75 * t * t}
			width={SYMBOL_SIZE * shard.size * (1 - t * 0.35)}
			height={SYMBOL_SIZE * shard.size * 0.42 * (1 - t * 0.35)}
			rotation={shard.angle + shard.spin * t}
			tint={t < 0.4 ? 0xffd48a : 0xd8551a}
			blendMode="add"
			alpha={(1 - t) ** 1.4}
		/>
	{/each}

	<!-- and sparks, which do not fall -->
	{#each sparks as spark, index (index)}
		{@const st = Math.max(0, Math.min(1, (t - spark.delay) / (1 - spark.delay)))}
		{#if st > 0}
			<Sprite
				key="fxStar"
				anchor={0.5}
				x={Math.cos(spark.angle) * easeOut(st) * SYMBOL_SIZE * spark.speed}
				y={Math.sin(spark.angle) * easeOut(st) * SYMBOL_SIZE * spark.speed -
					SYMBOL_SIZE * 0.12 * st}
				width={SYMBOL_SIZE * spark.size * (1 - st * 0.6)}
				height={SYMBOL_SIZE * spark.size * (1 - st * 0.6)}
				tint={0xffe9b0}
				blendMode="add"
				alpha={(1 - st) * 0.95}
			/>
		{/if}
	{/each}
</Container>

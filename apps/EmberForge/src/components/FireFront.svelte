<script lang="ts">
	import { Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';

	/**
	 * A wall of fire climbing the screen from below.
	 *
	 * Pure presentation: it owns no clock. The caller drives `t` from 0 to 1 and
	 * decides how long that takes, which is what lets the opening and the
	 * free-game transition share one flame and still feel different — the opening
	 * is a quick flare that clears, the feature is a bigger, slower eruption.
	 *
	 * The flame is a stack of soft glow sprites at different speeds rather than a
	 * drawn shape. Fire has no silhouette; anything with an outline reads as a
	 * coloured blob climbing the screen. A slow dark body underneath keeps the
	 * fast bright tongues above it from looking like separate objects.
	 */
	type Props = {
		/** 0 to 1 through the eruption. */
		t: number;
		/** Overall opacity and spark count multiplier. */
		intensity?: number;
		/** How far past the top of the screen the front travels. */
		reach?: number;
		/** Seeded per instance so two plays are not frame-identical. */
		tongues?: number;
	};

	const props: Props = $props();
	const context = getContext();

	const intensity = $derived(props.intensity ?? 1);
	const reach = $derived(props.reach ?? 1.35);
	const count = $derived(props.tongues ?? 14);

	const flames = $derived.by(() =>
		Array.from({ length: count }, (_, i) => ({
			xFrac: (i + 0.5) / count + (Math.sin(i * 12.9898) * 0.5 - 0.25) * 0.09,
			speed: 0.78 + Math.abs(Math.sin(i * 78.233)) * 0.5,
			width: 0.18 + Math.abs(Math.sin(i * 43.11)) * 0.22,
			delay: Math.abs(Math.sin(i * 21.7)) * 0.22,
			warm: Math.abs(Math.sin(i * 5.31)),
		})),
	);

	const sizes = $derived(context.stateLayoutDerived.canvasSizes());
	const easeOutCubic = (v: number) => 1 - (1 - Math.min(Math.max(v, 0), 1)) ** 3;
	const erupt = $derived(Math.max(0, Math.min(1, props.t)));
</script>

{#if erupt > 0}
	<!-- body: one wide, slow, dark-orange mass holding the tongues together -->
	<Sprite
		key="fxGlow"
		anchor={{ x: 0.5, y: 1 }}
		x={sizes.width * 0.5}
		y={sizes.height + sizes.height * 0.25 - easeOutCubic(erupt) * sizes.height * reach * 1.1}
		width={sizes.width * 1.6}
		height={sizes.height * 1.5}
		tint={0xc23a12}
		blendMode="add"
		alpha={0.75 * intensity * Math.min(1, erupt * 3)}
	/>

	{#each flames as flame, index (index)}
		{@const local = Math.max(0, Math.min(1, (erupt - flame.delay) / (1 - flame.delay)))}
		{#if local > 0}
			<Sprite
				key="fxGlow"
				anchor={{ x: 0.5, y: 1 }}
				x={sizes.width * flame.xFrac}
				y={sizes.height + sizes.height * 0.15 - easeOutCubic(local) * sizes.height * reach * flame.speed}
				width={sizes.width * flame.width}
				height={sizes.height * (0.55 + local * 0.6)}
				tint={flame.warm > 0.5 ? 0xffb04a : 0xff7a18}
				blendMode="add"
				alpha={0.85 * intensity * (1 - local * 0.25)}
			/>
		{/if}
	{/each}

	<!-- white-hot core arriving last, so the peak is a colour shift, not just more orange -->
	{@const corePhase = Math.max(0, (erupt - 0.2) / 0.8)}
	<Sprite
		key="fxGlow"
		anchor={{ x: 0.5, y: 1 }}
		x={sizes.width * 0.5}
		y={sizes.height + sizes.height * 0.1 - easeOutCubic(corePhase) * sizes.height * reach}
		width={sizes.width * 0.9}
		height={sizes.height * 0.9}
		tint={0xfff0c0}
		blendMode="add"
		alpha={0.8 * intensity * corePhase}
	/>

	<!-- sparks carried up in the draught -->
	{#each flames as flame, index (index)}
		{@const local = Math.max(0, Math.min(1, erupt - flame.delay * 0.5))}
		{#if local > 0.1}
			<Sprite
				key="fxStar"
				anchor={0.5}
				x={sizes.width * flame.xFrac + Math.sin(local * 6 + index) * sizes.width * 0.04}
				y={sizes.height * (1.05 - local * (reach * 1.04) * flame.speed)}
				width={sizes.width * 0.02 * (1 - local * 0.4)}
				height={sizes.width * 0.02 * (1 - local * 0.4)}
				tint={0xffe6a0}
				blendMode="add"
				alpha={(1 - local) * 0.9 * intensity}
			/>
		{/if}
	{/each}
{/if}

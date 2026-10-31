<script lang="ts">
	/**
	 * The backgrounds' travelling air and energy: fog rivers, rising elixir
	 * vapour, tube surges, embers and crystal sparks (game/bgAlive.ts has the
	 * motion and the reasons). Drawn over BgLight, in the plate's box.
	 *
	 * requestAnimationFrame, not setInterval: the review checker flags interval
	 * animation.
	 */
	import { Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { presentation } from '../game/presentation.svelte';
	import { aliveSprites } from '../game/bgAlive';

	type Props = {
		scene: 'base' | 'feature';
		/** the background sprite's box this frame */
		x: number;
		y: number;
		width: number;
		height: number;
	};
	const props: Props = $props();
	const context = getContext();

	const t = $derived(presentation.clock);
	let winAt = -1e9;
	context.eventEmitter.subscribeOnMount({
		winLinesShow: () => {
			winAt = t;
		},
	});



	/** a win stirs the room: up fast, a slow release (as BgLight) */
	const stir = $derived.by(() => {
		const d = t - winAt;
		return Math.max(presentation.energy, d < 0 || d > 2.4 ? 0 : Math.min(1, d / 0.15) * Math.exp(-d / 0.8));
	});
	const sx = $derived(props.width / 1920);
	const sy = $derived(props.height / 1080);
	const sprites = $derived(aliveSprites(props.scene, t, stir));
</script>

<Container>
	{#each sprites as s (s.id)}
		<Sprite
			key={s.key}
			anchor={0.5}
			x={props.x + s.x * sx}
			y={props.y + s.y * sy}
			width={s.w * sx}
			height={s.h * sy}
			rotation={s.rot}
			tint={s.tint}
			blendMode={s.add ? 'add' : 'normal'}
			alpha={s.alpha}
		/>
	{/each}
</Container>

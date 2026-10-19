<script lang="ts">
	import { onMount } from 'svelte';
	import type { Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { createReagentBoilLayer } from '../game/reagentBoilLayer';
	import type { ReagentVariant } from '../game/reagentBoil';
	type Props = {
		x?: number;
		y?: number;
		width: number;
		height: number;
		rotation?: number;
		alpha?: number;
		intensity?: number;
		variant?: ReagentVariant;
	};
	const props: Props = $props(),
		app = getContextApp(),
		parent = getContextParent();
	onMount(() => {
		const variant = props.variant ?? 'tile';
		const texture = app.stateApp.loadedAssets?.[variant === 'tile' ? 'gbB' : 'gbDynamite'] as
			| Texture
			| undefined;
		if (!texture) return;
		const layer = createReagentBoilLayer(texture, variant);
		parent.parent.addChild(layer.view);
		const started = performance.now();
		let previous = started,
			phase = 0;
		const tick = () => {
			const now = performance.now(),
				intensity = Math.max(0, Math.min(1, props.intensity ?? 0.4));
			phase += Math.min(0.08, (now - previous) / 1000) * (0.8 + intensity * 2.4);
			previous = now;
			layer.view.position.set(props.x ?? 0, props.y ?? 0);
			layer.view.scale.set(props.width / layer.width, props.height / layer.height);
			layer.view.rotation = props.rotation ?? 0;
			layer.view.alpha = props.alpha ?? 1;
			layer.step(phase, intensity * Math.min(1, (now - started) / 90));
		};
		tick();
		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);
		return () => {
			ticker?.remove(tick);
			layer.destroy();
		};
	});
</script>

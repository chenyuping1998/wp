<script lang="ts">
	import { onMount } from 'svelte';
	import { getContextApp } from 'pixi-svelte';

	const context = getContextApp();
	// Supersample fine symbol outlines on 1x displays, within a fixed pixel budget.
	// Keep this local to Neon: other games retain their own rendering settings.
	onMount(() => {
		const renderer = context.stateApp.pixiApplication?.renderer;
		if (!renderer) return;
		const update = () => {
			const native = Math.min(2, window.devicePixelRatio || 1);
			const budget = Math.sqrt(5_000_000 / Math.max(1, window.innerWidth * window.innerHeight));
			const resolution = Math.max(1, Math.min(Math.max(1.5, native), budget));
			if (Math.abs(renderer.resolution - resolution) < 0.01) return;
			renderer.resolution = resolution;
			renderer.resize(window.innerWidth, window.innerHeight);
		};
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	});
</script>

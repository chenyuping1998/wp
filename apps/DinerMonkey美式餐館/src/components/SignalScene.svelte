<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { Container } from 'pixi-svelte';
	import { PixelateFilter, GlitchFilter, CRTFilter, RGBSplitFilter } from 'pixi-filters';
	import { signal } from '../game/signal.svelte';
	let { children }: { children: Snippet } = $props();
	const pixel = new PixelateFilter(1);
	const glitch = new GlitchFilter({ slices: 12, offset: 0, fillMode: 1, sampleSize: 32 });
	const crt = new CRTFilter({ curvature: 0, noise: 0, lineContrast: 0, vignettingAlpha: 0 });
	const rgb = new RGBSplitFilter({ red: [0,0], green: [0,0], blue: [0,0] });
	const filters = [pixel, glitch, crt, rgb];
	onMount(() => {
		let raf = 0, frame = 0;
		const tick = (now: number) => {
			const [x,y,z,w] = signal.amounts;
			pixel.enabled = x > .01; pixel.size = 1 + x * 28;
			glitch.enabled = y > .01; glitch.offset = y * 110;
			if (y > .01 && ++frame % 4 === 0) glitch.refresh();
			crt.enabled = signal.crt || z > .01;
			crt.noise = z * .4 + (signal.crt ? .025 : 0);
			crt.lineContrast = z * .15 + (signal.crt ? .035 : 0);
			crt.time = now / 1000; crt.seed = (now % 997) / 997;
			rgb.enabled = w > .01; rgb.redX = w * 8; rgb.blueX = -w * 8;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => { cancelAnimationFrame(raf); filters.forEach(f => f.destroy()); };
	});
</script>
<Container {filters}>{@render children()}</Container>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Rectangle, Sprite } from 'pixi-svelte';
	import { getContext } from '../game/context';

	// Fade through black: 420 ms in, 330 ms held (the swap happens here), 650 ms
	// out. Same timings as before, now eased and on the display's frame clock —
	// it was a linear ramp stepped by setInterval(16), which banded on the way in
	// and stuttered on the way out. A vignette closes in slightly ahead of the
	// black so the edges go first, the way a scene dims rather than a switch.
	let props: { onblack?: () => void; oncomplete?: () => void } = $props();
	const c = getContext();
	let alpha = $state(0);
	let edge = $state(0);

	const IN = 420;
	const HOLD = 330;
	const OUT = 650;
	const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);

	onMount(() => {
		const start = performance.now();
		let black = false;
		let raf = 0;
		const tick = (now: number) => {
			const t = now - start;
			if (t < IN) {
				const p = t / IN;
				alpha = easeInOut(p);
				edge = Math.min(1, p * 1.6);
			} else if (t < IN + HOLD) {
				alpha = 1;
				edge = 1;
			} else {
				const p = Math.min(1, (t - IN - HOLD) / OUT);
				alpha = 1 - easeInOut(p);
				edge = 1 - p;
			}
			if (t >= IN && !black) {
				black = true;
				props.onblack?.();
			}
			if (t >= IN + HOLD + OUT) {
				props.oncomplete?.();
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<Sprite
	key="fxVignette"
	anchor={0.5}
	x={c.stateLayoutDerived.canvasSizes().width / 2}
	y={c.stateLayoutDerived.canvasSizes().height / 2}
	width={c.stateLayoutDerived.canvasSizes().width * 1.15}
	height={c.stateLayoutDerived.canvasSizes().height * 1.15}
	alpha={edge}
/>
<Rectangle {...c.stateLayoutDerived.canvasSizes()} backgroundColor={0x041412} {alpha} />

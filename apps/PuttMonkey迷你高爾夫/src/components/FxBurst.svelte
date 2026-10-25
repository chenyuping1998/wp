<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	type Props = {
		x?: number;
		y?: number;
		scale?: number;
		delay?: number;
		oncomplete?: () => void;
	};
	const props: Props = $props();

	// Flat ink objects rather than the template glow, rings and star particles.
	// Keep this burst small enough to frame a symbol without hiding its drawing.
	const INK = 0x18262c;
	const PAPER = 0xf4eacb;
	const ACCENT = 0xe5432f;
	const SECOND = 0x3e7a45;
	const DURATION = 760;
	const pieces = Array.from({ length: 9 }, (_, i) => ({
		angle: (i * Math.PI * 2) / 9 + ((i * 7) % 5 - 2) * 0.06,
		delay: (i % 3) * 34,
		life: 530 + (i % 3) * 55,
	}));
	let t = $state(-1);

	onMount(() => {
		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now + (props.delay ?? 0);
			const elapsed = now - start;
			t = elapsed < 0 ? -1 : Math.min(1, elapsed / DURATION);
			if (t >= 1) {
				props.oncomplete?.();
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const pose = (piece: (typeof pieces)[number], index: number) => {
		const age = t * DURATION - piece.delay;
		const p = age / piece.life;
		if (p <= 0 || p >= 1) return null;
		const s = props.scale ?? 1;
		const distance = (12 + 76 * p) * s;
		return {
			x: Math.cos(piece.angle) * distance * (1 + .18 * p),
			y: Math.sin(piece.angle) * distance + 82 * p * p * s,
			size: (13 + (index % 3) * 4) * s * (1 - 0.18 * p),
			rotation: piece.angle * 0.12 + (index % 2 ? -2.1 : 2.1) * p,
			alpha: Math.min(1, p / 0.13) * (1 - p) ** 1.15,
		};
	};

	const drawPiece = (g: PixiGraphics, index: number, size: number) => {
  g.clear();
  const color=index%3===0?ACCENT:index%3===1?SECOND:PAPER;
  if(index%3===0){
   g.moveTo(-size*.16,size*.4).lineTo(-size*.16,-size*.4).stroke({color:INK,width:1.8});
   g.poly([-size*.16,-size*.4,size*.35,-size*.23,-size*.16,-size*.05]).fill(color).stroke({color:INK,width:1.2});
  }else if(index%3===1){
   g.circle(0,0,size*.28).fill(PAPER).stroke({color:INK,width:1.5});
   for(let i=0;i<3;i++)g.circle((i-1)*size*.1,-size*.02,size*.022).fill(SECOND);
   g.moveTo(-size*.22,size*.08).lineTo(size*.22,size*.08).stroke({color:ACCENT,width:1.4});
  }else{
   g.moveTo(-size*.3,size*.25).lineTo(-size*.08,-size*.24).lineTo(0,size*.22).lineTo(size*.2,-size*.3).lineTo(size*.25,size*.25).stroke({color:SECOND,width:2});
  }
	};

</script>

<Container x={props.x ?? 0} y={props.y ?? 0}>
	{#if t >= 0 && t < 1}
		{#each pieces as piece, index (index)}
			{@const p = pose(piece, index)}
			{#if p}
				<Container x={p.x} y={p.y} rotation={p.rotation} alpha={p.alpha}>
					<Graphics draw={(g) => drawPiece(g, index, p.size)} />
				</Container>
			{/if}
		{/each}
	{/if}
</Container>

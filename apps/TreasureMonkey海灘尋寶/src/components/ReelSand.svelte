<script lang="ts">
 import { onMount } from 'svelte';
 import { Graphics } from 'pixi-svelte';
 import type { Graphics as PixiGraphics } from 'pixi.js';
 import { ReelSand } from '../game/reelSand';
 let { spinning, centers, floor, turbo = false }: { spinning: boolean[]; centers: number[]; floor: number; turbo?: boolean } = $props();
 const sand = new ReelSand();
 let frame = $state(0);
 onMount(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0, previous = performance.now();
  const tick = (now: number) => {
   const visible = sand.grains.length > 0 || spinning.some(Boolean);
   if (document.hidden) sand.clear();
   else {
    sand.step((now - previous) / 1000, spinning, centers, floor, turbo, preference.matches);
    if (visible || sand.grains.length) frame = now;
   }
   previous = now;
   raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); sand.clear(); };
 });
 const drawSand = (g: PixiGraphics, _frame: number) => {
  g.clear();
  for (const grain of sand.grains) {
   const alpha = Math.min(1, grain.age / .035) * Math.min(1, (grain.life - grain.age) / .18) * .9;
   const tilt = grain.spin + grain.age * 5;
   const dx = Math.cos(tilt) * grain.size, dy = Math.sin(tilt) * grain.size;
   g.poly([grain.x-dx,grain.y-dy,grain.x+dy*.6,grain.y-dx*.6,grain.x+dx,grain.y+dy,grain.x-dy*.6,grain.y+dx*.6]).fill({color:grain.color,alpha});
  }
 };
</script>

<Graphics draw={(graphics) => drawSand(graphics, frame)} />

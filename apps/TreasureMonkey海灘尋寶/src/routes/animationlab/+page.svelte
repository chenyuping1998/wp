<script lang="ts">
 import { onDestroy } from 'svelte';
 import { dev } from '$app/environment';
 import { Container, Graphics } from 'pixi-svelte';
 import { innerWidth } from 'svelte/reactivity/window';
 import type { Graphics as PixiGraphics } from 'pixi.js';
 import ReelSand from '../../components/ReelSand.svelte';
 import SandPreviewStage from '../../components/SandPreviewStage.svelte';
 const scale = $derived(Math.min(.9, ((innerWidth.current ?? 650) - 48) / 590));
 let spinning = $state([false,false,false,false,false]);
 let turbo = $state(false);
 let timers: ReturnType<typeof setTimeout>[] = [];
 const centers = [59,177,295,413,531];
 const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
 const run = () => {
  clearTimers(); spinning = centers.map(() => true);
  centers.forEach((_, reel) => timers.push(setTimeout(() => {
   spinning = spinning.map((value, index) => index === reel ? false : value);
  }, turbo ? 450 + reel * 70 : 1500 + reel * 210)));
 };
 const stop = () => { clearTimers(); spinning = centers.map(() => false); };
 onDestroy(clearTimers);
 const grid = (g: PixiGraphics) => {
  g.roundRect(0,0,590,472,8).fill(0xedd9ab).stroke({width:4,color:0x6e4b2d});
  for(let i=1;i<5;i++) g.moveTo(i*118,0).lineTo(i*118,472).stroke({width:2,color:0xc8aa76});
  for(let j=1;j<4;j++) g.moveTo(0,j*118).lineTo(590,j*118).stroke({width:2,color:0xc8aa76});
 };
</script>

<svelte:head><title>Treasure Monkey · 沙粒動畫檢視</title></svelte:head>
{#if dev}
 <SandPreviewStage><Container x={24} y={160} {scale}><Graphics draw={grid} /><ReelSand {spinning} {centers} floor={469} {turbo} /></Container></SandPreviewStage>
 <nav><strong>沙粒動畫 · 第一版</strong><button onclick={run}>轉動並依序停輪</button><button onclick={stop}>全部急停</button><label><input type="checkbox" bind:checked={turbo} /> Turbo</label><a href="/setup">返回開案預覽</a><p>直接使用遊戲的 Pixi 沙粒元件；檢視轉動捲沙、停輪噴沙與尾端回落。</p></nav>
{:else}<a href="/">Treasure Monkey</a>{/if}
<style>:global(body){margin:0;background:#fff7e5;font-family:'Segoe UI','Microsoft JhengHei',sans-serif;color:#2a1a12}nav{position:fixed;top:15px;left:20px;right:20px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;font-size:13px}button{border:2px solid #2a1a12;border-radius:6px;padding:9px 14px;background:#f3d397;color:#2a1a12;cursor:pointer}a{color:#217f87}p{flex-basis:100%;margin:0}button:focus-visible,a:focus-visible{outline:3px solid #217f87}</style>

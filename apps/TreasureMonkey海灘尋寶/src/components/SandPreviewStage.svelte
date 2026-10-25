<script lang="ts">
 import { onMount, type Snippet } from 'svelte';
 import { Application, Assets } from 'pixi.js';
 import { createApp, setContextApp } from 'pixi-svelte';
 import PreviewScene from './PreviewScene.svelte';
 let { children,assets={} }: { children: Snippet;assets?:Record<string,{type:string;src:unknown}> } = $props();
 let host: HTMLDivElement;
 let ready = $state(false);
 const app = new Application();
 const appContext=createApp({assets:{}});setContextApp(appContext);
 onMount(() => {
  let disposed = false;
  void app.init({preference:'webgl',resizeTo:window,resolution:Math.min(window.devicePixelRatio,2),autoDensity:true,antialias:true,backgroundAlpha:0}).then(async () => {
   const entries=await Promise.all(Object.entries(assets).filter(([,entry])=>entry.type==='sprite'&&typeof entry.src==='string').map(async([key,entry])=>[key,await Assets.load(entry.src as string)]));
   appContext.stateApp.loadedAssets=Object.fromEntries(entries);
   await document.fonts.load('400 16px "Titan One"');
   if(disposed) { app.destroy(true); return; }
   host.appendChild(app.canvas);
   ready = true;
  }).catch(console.error);
  return () => { disposed = true; if(ready) app.destroy(true); };
 });
</script>
<div bind:this={host}>{#if ready}<PreviewScene stage={app.stage}>{@render children()}</PreviewScene>{/if}</div>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Container,Graphics } from 'pixi-svelte';
 import type {Graphics as PixiGraphics} from 'pixi.js';
 import {subscribePresentationFrame} from '../game/presentationClock';
 import {lineTravel,linePose} from '../game/treasureLineMotion';

	// A detector readout follows one payline, left to right. Deliberately quiet:
	// no blast on arrival — the job is to draw the eye along the line so the
	// player can read which symbols paid, not to put on a show.
	type Point = { x: number; y: number };

	type Props = {
		points: Point[];
		playbackRate?:number;
		previewTime?:number;
		color: number;
		// ms before this runner starts (volley stagger)
		delay?: number;
		// shrinks when many lines run at once so the board stays readable
		scale?: number;
		entryMs?: number;
		travelMs?: number;
		settleMs?: number;
		// Fired as the detector crosses each reel, so symbols light up in its wake.
		onreel?: (reelIndex: number) => void;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const entryMs = $derived(props.entryMs ?? 80);
	const travelMs = $derived(props.travelMs ?? 540);
	const settleMs = $derived(props.settleMs ?? 140);
	const size = $derived(46 * (props.scale ?? 1));

	let clock = $state(-1);
 const t=$derived(props.previewTime??clock); // ms since this runner's own start; < 0 while delayed
	let lastReel = -1;let reduced=$state(false);

	// Emit every reel between the last one reported and `reel`. Back-filling
	// matters on a dropped frame: the detector can jump two reels in one tick and
	// the skipped reel's symbols would otherwise never light up.
	const reportReelsUpTo = (reel: number) => {
		for (let r = lastReel + 1; r <= reel; r++) props.onreel?.(r);
		if (reel > lastReel) lastReel = reel;
	};

	onMount(() => {
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>reduced=preference.matches;update();preference.addEventListener('change',update);
  if(props.previewTime!==undefined)return()=>preference.removeEventListener('change',update);
  let elapsed=0,stop=()=>{};
  const total=entryMs+travelMs+settleMs;
  stop=subscribePresentationFrame(delta=>{
   elapsed+=delta*(props.playbackRate??1);clock=elapsed-(props.delay??0);
   if(t>=entryMs)reportReelsUpTo(reelAt(travelAt(t)));
   if(t>=total){reportReelsUpTo(props.points.length-1);stop();props.oncomplete?.();}
  });
  return()=>{stop();preference.removeEventListener('change',update);};
 });

	const easeOutCubic = (p: number) => 1 - (1 - Math.min(Math.max(p, 0), 1)) ** 3;

 const travel=$derived(lineTravel(t,entryMs,travelMs));
 const travelAt=(ms:number)=>lineTravel(ms,entryMs,travelMs);
 const reelAt=(progress:number)=>linePose(props.points,progress).reel;
 const pose=$derived(linePose(props.points,travel));

	// entry: drops in from the left of reel 1 and settles onto the start point
	const entryOffset = $derived(!reduced&&t < entryMs ? -(1 - easeOutCubic(Math.max(0, t) / entryMs)) * size * 2.2 : 0);

	// after arriving it fades out and leaves the finished line behind
	const alpha = $derived.by(() => {
		if (t < 0) return 0;
		const arriveAt = entryMs + travelMs;
		if (t < arriveAt) return 1;
		return Math.max(0, 1 - (t - arriveAt) / settleMs);
	});

 const draw=(g:PixiGraphics)=>{
  g.clear();const unit=size/46;
  // A compact detector readout follows the sand path. Motion is carried by
  // its arc and a few trailing grains, without a generic additive star/glow.
  for(let i=0;!reduced&&i<4;i++){
   const x=(-16-i*6)*unit,y=Math.sin(t/90+i*1.7)*(2+i*.5)*unit;
   g.ellipse(x,y,(2.2-i*.25)*unit,1.3*unit).fill({color:i%2?0xd3ab70:0xfff0c8,alpha:.55-i*.1});
  }
  g.circle(0,0,10*unit).fill({color:0x278891,alpha:.18}).stroke({color:0x278891,width:1.6*unit,alpha:.8});
  const angle=reduced?0:t/160;
  g.arc(0,0,13*unit,angle,angle+Math.PI*1.25).stroke({color:0xffefc8,width:2*unit,alpha:.85});
  g.circle(0,0,4.5*unit).fill(0xfff4d7).stroke({color:0x278891,width:1.5*unit});
  if(t>entryMs+travelMs){
   const settle=Math.min(1,(t-entryMs-travelMs)/Math.max(1,settleMs));
   g.ellipse(0,0,(14+12*settle)*unit,(6+5*settle)*unit).stroke({color:0xfff1ce,width:1.2*unit,alpha:(1-settle)*.65});
  }
 };
</script>
{#if t>=0&&alpha>0}
 <Container x={pose.x+entryOffset} y={pose.y} rotation={pose.angle} {alpha}><Graphics draw={draw}/></Container>
{/if}

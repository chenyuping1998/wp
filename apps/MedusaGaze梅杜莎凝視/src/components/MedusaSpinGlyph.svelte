<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container,Graphics } from 'pixi-svelte';
	import type {Graphics as PixiGraphics} from 'pixi.js';
	const props=$props<{spinning:boolean;radius:number;color?:number}>();
	let rotation=$state(0),raf=0;
	$effect(()=>{cancelAnimationFrame(raf);let last=performance.now();const end=()=>Math.ceil((rotation+0.001)/(Math.PI*2))*Math.PI*2;
		let stoppingAt=props.spinning?Infinity:end();const tick=(now:number)=>{const dt=(now-last)/1000;last=now;rotation=Math.min(stoppingAt,rotation+dt*7.5);if(props.spinning||rotation<stoppingAt)raf=requestAnimationFrame(tick);else rotation=0;};
		if(props.spinning||rotation>0)raf=requestAnimationFrame(tick);
	});
	onDestroy(()=>cancelAnimationFrame(raf));
	const draw=(g:PixiGraphics)=>{
		const r=props.radius,c=props.color??0x173a40;g.clear();
		g.arc(0,0,r*.80,-Math.PI*.82,Math.PI*.72).stroke({width:r*.35,color:c,cap:'round'});
		const a=Math.PI*.72,x=Math.cos(a)*r*.80,y=Math.sin(a)*r*.80,tx=-Math.sin(a),ty=Math.cos(a),nx=Math.cos(a),ny=Math.sin(a);
		g.poly([x+tx*r*.40,y+ty*r*.40,x-tx*r*.26+nx*r*.30,y-ty*r*.26+ny*r*.30,x-tx*r*.26-nx*r*.30,y-ty*r*.26-ny*r*.30]).fill(c);
		g.circle(x-tx*r*.03+nx*r*.10,y-ty*r*.03+ny*r*.10,r*.055).fill(0xefe8d8);
	};
</script>
<Container {rotation}><Graphics draw={draw}/></Container>

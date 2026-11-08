<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { Container,Graphics } from 'pixi-svelte';
	import type {Graphics as PixiGraphics} from 'pixi.js';
	const props=$props<{spinning:boolean;radius:number;color?:number}>();
	let rotation=$state(0),raf=0;
	$effect(()=>{cancelAnimationFrame(raf);let last=performance.now();const from=untrack(()=>rotation);const spinning=props.spinning;
		const stoppingAt=spinning?Infinity:Math.ceil((from+0.001)/(Math.PI*2))*Math.PI*2;const tick=(now:number)=>{const dt=Math.min(.1,(now-last)/1000);last=now;rotation=Math.min(stoppingAt,rotation+dt*7.5);if(spinning||rotation<stoppingAt)raf=requestAnimationFrame(tick);else rotation=0;};
		if(spinning||from>0)raf=requestAnimationFrame(tick);
	});
	onDestroy(()=>cancelAnimationFrame(raf));
	const draw=(g:PixiGraphics)=>{
		const r=props.radius,c=props.color??0xffedc2;g.clear();
		g.arc(0,0,r*.80,-Math.PI*.82,Math.PI*.72).stroke({width:r*.35,color:c,cap:'round'});
		const a=Math.PI*.72,x=Math.cos(a)*r*.80,y=Math.sin(a)*r*.80,tx=-Math.sin(a),ty=Math.cos(a),nx=Math.cos(a),ny=Math.sin(a);
		g.poly([x+tx*r*.40,y+ty*r*.40,x-tx*r*.26+nx*r*.30,y-ty*r*.26+ny*r*.30,x-tx*r*.26-nx*r*.30,y-ty*r*.26-ny*r*.30]).fill(c);
	};
</script>
<Container {rotation}><Graphics draw={draw}/></Container>

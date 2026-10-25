<script lang="ts">
 import { Container, Sprite, Text } from 'pixi-svelte';
 import glyphs from '../game/v8Digits';
 import { NUMBER_FONT } from '../game/fonts';
 type Role='count'|'fs'|'plate'|'receipt';
 type Props={text:string|number; fontSize:number; role?:Role; x?:number;y?:number;maxWidth?:number;anchor?:number|{x:number;y:number};onresize?:(s:{width:number;height:number})=>void};
 const props:Props=$props();
 const table=$derived(glyphs[props.role??'count'] as Record<string,{key:string;width:number;advance:number;height:number}>);
 const letters=$derived(Array.from(String(props.text)));
 const unit=$derived(props.fontSize/256);
 const spans=$derived(letters.map(c=>(table[c]?.advance??150)*unit));
 const total=$derived(spans.reduce((a,b)=>a+b,0));
 const fit=$derived(Math.min(1,(props.maxWidth??Infinity)/Math.max(1,total)));
 const ax=$derived(typeof props.anchor==='object'?props.anchor.x:props.anchor??.5);
 const ay=$derived(typeof props.anchor==='object'?props.anchor.y:props.anchor??.5);
 $effect(()=>{props.onresize?.({width:total,height:props.fontSize});});
</script>
<Container x={props.x??0} y={props.y??0} scale={fit}>
 {#each letters as c,i (i)}
  {@const x=spans.slice(0,i).reduce((a,b)=>a+b,0)-total*ax}
  {#if table[c]}<Sprite key={table[c].key} x={x} y={-props.fontSize*ay} width={table[c].width*unit} height={props.fontSize}/>
  {:else if c!==' '}<Text text={c} x={x} y={-props.fontSize*ay} style={{fontFamily:NUMBER_FONT,fontSize:props.fontSize*.75,fill:0x282828}}/>{/if}
 {/each}
</Container>

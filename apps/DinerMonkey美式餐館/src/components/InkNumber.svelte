<script lang="ts">
 import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
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
  {#if c==='.' || c===','}
   <!-- The baked punctuation sits against the bitmap's bottom edge and loses half
        its dot. Draw it inside the same 256-unit glyph box instead. -->
   <Graphics x={x+spans[i]*.52} y={props.fontSize*(.77-ay)} draw={(g)=>{
    const r=props.fontSize*.105;
    g.clear();g.circle(0,0,r).fill(0xe1392d).stroke({color:0x171918,width:Math.max(1.5,props.fontSize*.035)});
    if(c===',')g.moveTo(r*.2,r*.65).lineTo(-r*.45,r*1.95).stroke({color:0x171918,width:Math.max(1.5,props.fontSize*.07)});
   }}/>
  {:else if table[c]}<Sprite key={table[c].key} x={x} y={-props.fontSize*ay} width={table[c].width*unit} height={props.fontSize}/>
  {:else if c!==' '}<Text text={c} x={x} y={-props.fontSize*ay} style={{fontFamily:NUMBER_FONT,fontSize:props.fontSize*.75,fill:0x282828}}/>{/if}
 {/each}
</Container>

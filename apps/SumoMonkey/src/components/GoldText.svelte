<script lang="ts">
 import InkNumber from './InkNumber.svelte';
 type Props={text:string|number;fontSize:number;x?:number;y?:number;anchor?:number|{x:number;y:number};maxWidth?:number;letterSpacing?:number;alpha?:number;fill?:number|number[];stroke?:number};
 const props:Props=$props();
</script>
<InkNumber text={props.text} fontSize={props.fontSize} x={props.x} y={props.y} anchor={props.anchor} maxWidth={props.maxWidth}/>

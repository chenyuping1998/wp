<script lang="ts">
 import {onMount} from 'svelte';
 import {getContextParent} from 'pixi-svelte';
 import {DustView} from '../game/dustView';
 const {time,width=0,height=0,mix=0,kind='ambient'}:{time:number;width?:number;height?:number;mix?:number;kind?:'ambient'|'transition'}=$props();
 const parent=getContextParent(),dust=new DustView(kind);
 onMount(()=>{parent.parent.addChild(dust.view);return()=>dust.destroy();});
 $effect(()=>dust.draw(time,width,height,mix));
</script>

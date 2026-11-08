<script lang="ts">
 import {onMount,untrack} from 'svelte';
 import {getContextParent} from 'pixi-svelte';
 import {EnergyView} from '../game/energyView';
 const {board,clock,active}:{board:number[][];clock:number;active:boolean}=$props();
 const parent=getContextParent(),energy=new EnergyView();
 onMount(()=>{parent.parent.addChild(energy.view);return()=>energy.destroy();});
 $effect(()=>{const next=board;untrack(()=>energy.configure(next));});
 $effect(()=>{board;energy.draw(clock,active);});
</script>

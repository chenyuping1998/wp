<script lang="ts">
 import NineSliceArt from '../NineSliceArt.svelte';
 const props:{assetKey:string;x:number;y:number;width:number;height:number;slice:number}=$props();
</script>
<NineSliceArt {...props} inset={80} top={32} bottom={32}/>

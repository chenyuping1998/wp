<script lang="ts">
 import { base } from '$app/paths';
 const { kind, accent }: {kind:'coins'|'arch'|'scarab'|'sure'|'sun';accent:string}=$props();
 const names={coins:'holdandspin',arch:'bonus',scarab:'scarab',sure:'scarab',sun:'sun'};
</script>
<img src={`${base}/assets/sprites/mummyUi/buy_art_${names[kind]}.webp`} alt="" class="scene-art" />
<style>.scene-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}</style>

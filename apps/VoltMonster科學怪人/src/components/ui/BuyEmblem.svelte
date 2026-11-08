<script lang="ts">
 import { base } from '$app/paths';
 const { kind, accent }: {kind:'coins'|'arch'|'scarab'|'sure'|'sun';accent:string}=$props();
 const names={coins:'holdandspin',arch:'bonus',scarab:'volt',sure:'volt',sun:'tesla'};
 const heroes={coins:'holdandspin',arch:'bonus',scarab:'volt5',sure:'volt10',sun:'tesla'};
</script>
<img src={`${base}/assets/sprites/voltUi/buy_art_${names[kind]}.webp`} alt="" class="scene-art" />
<img src={`${base}/assets/sprites/voltUi/buy_hero_${heroes[kind]}.webp`} alt="" class="hero-art" />
<style>
 .scene-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}
 .hero-art{position:absolute;right:3%;bottom:1%;width:42%;height:86%;object-fit:contain;display:block;filter:drop-shadow(0 5px 6px #101820aa);}
</style>

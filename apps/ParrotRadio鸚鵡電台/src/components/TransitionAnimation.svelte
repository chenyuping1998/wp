<script lang="ts">
 import {onMount} from 'svelte';
 const props:{oncomplete:()=>void;oncover?:()=>void}=$props();
 onMount(()=>{const a=setTimeout(()=>props.oncover?.(),200);const b=setTimeout(props.oncomplete,400);return()=>{clearTimeout(a);clearTimeout(b);};});
</script>

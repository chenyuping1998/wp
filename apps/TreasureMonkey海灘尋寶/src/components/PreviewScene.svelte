<script lang="ts">
 import type { Snippet } from 'svelte';
 import type { Container } from 'pixi.js';
 import { createContextParent } from 'pixi-svelte';
 let { stage, children }: { stage: Container; children: Snippet } = $props();
 createContextParent(stage);
</script>
{@render children()}

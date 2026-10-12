<script>
  import { onMount } from 'svelte';
  import { mountGame } from '../main.js';

  onMount(() => {
    const root = document.querySelector('#app');
    try {
      mountGame(root);
    } catch (error) {
      console.error('Game startup failed:', error);
      if (root) root.innerHTML = '<div style="color:#fff;text-align:center;padding:24px;font:20px sans-serif">Loading failed. Please refresh the game.</div>';
    } finally {
      document.querySelector('#boot-loader')?.remove();
    }
  });
</script>

<div id="app"></div>

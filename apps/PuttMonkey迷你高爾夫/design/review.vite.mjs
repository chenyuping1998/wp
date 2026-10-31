// Isolated art review; no authentication or game state is required.
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({ plugins: [svelte({ configFile: false })], publicDir: 'static', server: { host: '127.0.0.1', port: 3041 } });

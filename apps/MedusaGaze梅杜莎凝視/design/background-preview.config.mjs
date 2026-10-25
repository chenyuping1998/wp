// @ts-nocheck -- standalone local art review, no SvelteKit application plugins.
import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export default defineConfig({
  base: './', publicDir: false,
  plugins: [{ name: 'mark-generated-review', enforce: 'post', generateBundle(_options, bundle) {
    for (const output of Object.values(bundle)) if (output.type === 'chunk') output.code = '// @ts-nocheck\n// Generated offline review. Original TypeScript is checked separately.\n' + output.code;
  } }],
  build: { outDir: path.join(app, 'design/source/medusagaze/background/preview'), emptyOutDir: false,
    lib: { entry: path.join(app, 'design/backgroundPreview.ts'), formats: ['es'], fileName: () => 'scene.js' },
    rollupOptions: { output: { inlineDynamicImports: true, banner: '// @ts-nocheck\n// Generated offline Pixi review bundle; source TypeScript is checked separately.' } }, chunkSizeWarningLimit: 1600 },
});

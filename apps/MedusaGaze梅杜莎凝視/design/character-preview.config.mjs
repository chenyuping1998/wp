// @ts-nocheck -- standalone review build, without SvelteKit's generated files.
import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export default defineConfig({base:'./',publicDir:false,plugins:[{name:'generated-review-marker',enforce:'post',generateBundle(_options,bundle){for(const output of Object.values(bundle))if(output.type==='chunk')output.code='// @ts-nocheck\n// Generated review; source is checked separately.\n'+output.code;}}],build:{outDir:path.join(app,'design/source/medusagaze/cast/preview'),emptyOutDir:false,lib:{entry:path.join(app,'design/characterPreview.ts'),formats:['es'],fileName:()=> 'scene.js'},rollupOptions:{output:{inlineDynamicImports:true,banner:'// @ts-nocheck\n// Generated review bundle; authored source is checked separately.'}},chunkSizeWarningLimit:1800}});

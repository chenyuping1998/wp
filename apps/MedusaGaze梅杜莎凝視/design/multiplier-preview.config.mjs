// @ts-nocheck -- isolated local animation review.
import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export default defineConfig({base:'./',publicDir:false,plugins:[{name:'generated-review',enforce:'post',generateBundle(_,bundle){for(const output of Object.values(bundle))if(output.type==='chunk')output.code='// @ts-nocheck\n'+output.code;}}],build:{outDir:path.join(app,'design/source/medusagaze/multiplier/preview'),emptyOutDir:false,lib:{entry:path.join(app,'design/multiplierPreview.ts'),formats:['es'],fileName:()=> 'scene.js'},rollupOptions:{output:{inlineDynamicImports:true}},chunkSizeWarningLimit:1800}});

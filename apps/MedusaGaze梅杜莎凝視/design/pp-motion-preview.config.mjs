// @ts-nocheck -- standalone art review, outside the SvelteKit build.
import {defineConfig} from 'vite';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export default defineConfig({base:'./',publicDir:false,plugins:[{name:'review-marker',generateBundle(_,bundle){for(const out of Object.values(bundle))if(out.type==='chunk')out.code='// @ts-nocheck\n'+out.code;}}],build:{outDir:path.join(app,'design/source/medusagaze/pp-motion/preview'),emptyOutDir:false,lib:{entry:path.join(app,'design/ppMotionPreview.ts'),formats:['es'],fileName:()=> 'scene.js'},rollupOptions:{output:{inlineDynamicImports:true}},chunkSizeWarningLimit:1800}});

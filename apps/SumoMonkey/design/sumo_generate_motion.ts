/** Rebuild the current cast with the official spine-motion CLI.
 * Recipes live beside the installed source layers. Never regenerate from the
 * superseded 10-24 staging folder or silently substitute a different recipe.
 */
import {readFileSync,copyFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const design=dirname(fileURLToPath(import.meta.url));
const noGif=process.argv.includes('--no-gif');
for(const cast of ['mg','fg']){
 const source=join(design,'sumo_cast',cast,'layers');
 const output=join(design,'sumo_cast',cast,`${cast}_spine`);
 const cli=spawnSync(process.execPath,[
  '/Users/stone/tools/spine-generator/bin/spine-motion.js','character',source,
  '--name',cast,'-o',output,'--joints',join(source,'joints.json'),
  '--params',join(source,'motion.params.json'),
  ...(noGif?['--no-gif']:[]),
 ],{stdio:'inherit'});
 if(cli.status!==0)throw new Error(`${cast}: spine-motion CLI failed`);
 copyFileSync(join(source,'motion.params.json'),join(output,'motion.params.json'));
 copyFileSync(join(source,'layers.json'),join(output,'layers.json'));
 // The superseded API wrapper emitted this with hard-coded recipes. The CLI
 // report above is authoritative; never ship the old parameter/check record.
 rmSync(join(output,'motion-check.json'),{force:true});
 rmSync(join(output,`${cast}.check.md`),{force:true});
 if(noGif)rmSync(join(output,'預覽.gif'),{force:true});
 const report=readFileSync(join(output,'報告.md'),'utf8');
 if(!report.includes('**結論：可以用。**'))
  throw new Error(`${cast}: inspect and repair art/rig warnings in ${output}/報告.md`);
}

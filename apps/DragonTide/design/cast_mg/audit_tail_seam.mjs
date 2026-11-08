import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {homedir} from 'node:os';
import {createRequire} from 'node:module';
const root=dirname(fileURLToPath(import.meta.url));
const kit=process.env.SPINE_MOTION_KIT??join(homedir(),'tools/spine-generator');
const load=path=>import(pathToFileURL(join(kit,path)).href);
const require=createRequire(join(kit,'package.json'));
const {Skeleton,Physics}=await import(pathToFileURL(require.resolve('@esotericsoftware/spine-core')).href);
const {decodePngAlpha}=await load('src/png.ts');
const {parseSkeleton}=await load('src/spineJson.ts');
const {layersFromRig,renderMask,intendedOutline,opaqueBox}=await load('src/seams.ts');
const alphas=new Map(readdirSync(join(root,'layers')).filter(n=>n.endsWith('.png')).map(n=>[
 n.slice(0,-4),decodePngAlpha(new Uint8Array(readFileSync(join(root,'layers',n))))]));
const json=JSON.parse(readFileSync(join(root,'cast_mg_spine/cast_mg.json'),'utf8'));
const sk=new Skeleton(parseSkeleton(json));sk.setupPose();sk.updateWorldTransform(Physics.none);
const layers=layersFromRig(json,alphas);
const parent=layers.find(l=>l.bone==='tail2');
const closed=intendedOutline(parent.alpha,4,40);
const intended={...parent,alpha:closed,box:opaqueBox(closed)};
const reference=decodePngAlpha(new Uint8Array(readFileSync(join(root,'qa/whole-tail-reference.png'))));
const full={...parent,alpha:reference,box:opaqueBox(reference)};
const pivot=sk.findBone('tail3').getAppliedPose();
const grid={x0:pivot.worldX-58,y0:pivot.worldY-58,cell:4,w:29,h:29};
const union=renderMask(sk,layers,grid),expected=renderMask(sk,[intended],grid),design=renderMask(sk,[full],grid);
const flagged=[];
for(let y=0;y<29;y++)for(let x=0;x<29;x++) {
 if((x-14)**2+(y-14)**2>14**2)continue;
 const k=y*29+x;
 if(expected[k]&&!union[k])flagged.push({x:512+grid.x0+(x+.5)*4,y:1456-grid.y0-(y+.5)*4,insideOriginalTail:!!design[k]});
}
const refGrid={x0:60,y0:300,cell:2,w:190,h:190};
const refMask=renderMask(sk,[full],refGrid);
const tailUnion=renderMask(sk,layers.filter(l=>l.bone.startsWith('tail')),refGrid);
let missing=0,painted=0;
for(let k=0;k<refMask.length;k++)if(refMask[k]){painted++;if(!tailUnion[k])missing++;}
const result={flaggedAreaPx:flagged.length*16,flaggedInsideDesignedTail:flagged.filter(p=>p.insideOriginalTail).length,flaggedOutsideDesignedTail:flagged.filter(p=>!p.insideOriginalTail).length,wholeTailReferenceSamples:painted,referenceSamplesMissingFromParts:missing,points:flagged,scope:'Rest-pose false-positive audit only; animated frames still require visual review'};
writeFileSync(join(root,'qa/tail-seam-audit.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,points:undefined}));

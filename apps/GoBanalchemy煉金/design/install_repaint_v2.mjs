import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire('E:/stake/tools/gen/package.json');
const { PNG } = require('pngjs');
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(app, 'design/source/repaint_v2');
const dst = path.join(app, 'static/assets/sprites/goBanalchemySymbols');
const backup = path.join(app, 'design/source/before_repaint_v2');
fs.mkdirSync(backup, { recursive: true });
// Bicubic resampling in premultiplied alpha keeps transparent edges clean.
const cubic = x => { x = Math.abs(x); return x <= 1 ? 1.5*x*x*x-2.5*x*x+1 : x < 2 ? -.5*x*x*x+2.5*x*x-4*x+2 : 0; };
function resize(im, width, height) {
 const out = new PNG({width,height});
 for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
  const u=(x+.5)*im.width/width-.5,v=(y+.5)*im.height/height-.5;
  let sum=0,a=0,r=0,g=0,b=0;
  for(let j=Math.floor(v)-1;j<=Math.floor(v)+2;j++) for(let i=Math.floor(u)-1;i<=Math.floor(u)+2;i++) {
   const w=cubic(u-i)*cubic(v-j), k=(Math.max(0,Math.min(im.height-1,j))*im.width+Math.max(0,Math.min(im.width-1,i)))*4;
   const alpha=im.data[k+3]/255; sum+=w;a+=alpha*w;r+=im.data[k]*alpha*w;g+=im.data[k+1]*alpha*w;b+=im.data[k+2]*alpha*w;
  }
  const k=(y*width+x)*4;
  out.data[k]=a>1e-6?r/a:0;out.data[k+1]=a>1e-6?g/a:0;out.data[k+2]=a>1e-6?b/a:0;out.data[k+3]=Math.max(0,Math.min(255,a/sum*255));
 }
 return out;
}
for(const n of ['h1','h2','h3','h4','w','s','b','p','x','l1','l2','l3','l4','l5']) {
 const file=path.join(dst,n+'.png'),old=PNG.sync.read(fs.readFileSync(file));
 if(!fs.existsSync(path.join(backup,n+'.png')))fs.copyFileSync(file,path.join(backup,n+'.png'));
 const im=resize(PNG.sync.read(fs.readFileSync(path.join(src,n+'.png'))),512,512);
 const silhouette=resize(PNG.sync.read(fs.readFileSync(path.join(backup,n+'.png'))),512,512);
 // Match the tile silhouette. The circular scatter retains generated alpha.
 if(n!=='s')for(let i=3;i<im.data.length;i+=4)im.data[i]=Math.min(im.data[i],silhouette.data[i]);
 fs.writeFileSync(file,PNG.sync.write(im));
}
const fx=path.join(app,'static/assets/sprites/goBanalchemyFx');fs.mkdirSync(fx,{recursive:true});
fs.writeFileSync(path.join(fx,'potion_vapor.png'),PNG.sync.write(resize(PNG.sync.read(fs.readFileSync(path.join(src,'smoke.png'))),512,512)));
const propSource=path.join(src,'reagent_prop.png');
if(fs.existsSync(propSource)){
 const propPath=path.join(dst,'reagent_prop.png');
 if(!fs.existsSync(path.join(backup,'reagent_prop.png')))fs.copyFileSync(propPath,path.join(backup,'reagent_prop.png'));
 const prop=resize(PNG.sync.read(fs.readFileSync(propSource)),672,618);
 fs.writeFileSync(propPath,PNG.sync.write(prop));
 const atlasPath=path.join(app,'static/assets/spines/goBananasMonkey/monkey.png');
 if(!fs.existsSync(path.join(backup,'monkey.png')))fs.copyFileSync(atlasPath,path.join(backup,'monkey.png'));
 const atlas=PNG.sync.read(fs.readFileSync(atlasPath));
 for(let row=0;row<618;row++)prop.data.copy(atlas.data,((row+2)*atlas.width+2)*4,row*672*4,(row+1)*672*4);
 fs.writeFileSync(atlasPath,PNG.sync.write(atlas));
}
console.log('Installed all 14 symbol repaints and vapor texture; previous art preserved.');

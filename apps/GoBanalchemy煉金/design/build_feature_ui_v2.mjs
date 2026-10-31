import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require=createRequire('E:/stake/tools/gen/package.json');
const { Resvg }=require('@resvg/resvg-js');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ninja=root.includes('ninja');
const out=path.join(root,'static/assets/sprites/featureUiV2');
const source=path.join(root,'design/source/feature_ui_v2');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(source,{recursive:true});
const C=ninja?{dark:'#081723',mid:'#183445',rim:'#bd9860',light:'#f8dfa0',lit:'#a93a45',edge:'#fbd18c'}:{dark:'#09272a',mid:'#165052',rim:'#a66d42',light:'#efd5a0',lit:'#208c73',edge:'#8eeac5'};
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="rim" x2=".2" y2="1"><stop stop-color="${C.light}"/><stop offset=".25" stop-color="${C.rim}"/><stop offset=".58" stop-color="#5f4536"/><stop offset="1" stop-color="${C.light}"/></linearGradient><linearGradient id="face" x2=".3" y2="1"><stop stop-color="${C.mid}"/><stop offset=".5" stop-color="${C.dark}"/><stop offset="1" stop-color="${C.mid}"/></linearGradient><radialGradient id="lit"><stop stop-color="${ninja?'#dc5960':'#4bcea4'}"/><stop offset="1" stop-color="${C.lit}"/></radialGradient></defs>${body}</svg>`;
const render=(name,w,h,body)=>{const text=svg(w,h,body);fs.writeFileSync(path.join(source,name+'.svg'),text);fs.writeFileSync(path.join(out,name+'.png'),new Resvg(text).render().asPng());};
for(const name of ['button','button_active','spin']){
 const active=name!=='button',spin=name==='spin';
 let body=`<circle cx="128" cy="132" r="119" fill="#010709" opacity=".65"/><circle cx="128" cy="126" r="118" fill="url(#rim)"/><circle cx="128" cy="126" r="112" fill="${C.dark}"/><circle cx="128" cy="126" r="107" fill="${active?'url(#lit)':'url(#face)'}" stroke="${C.rim}" stroke-width="2"/><path d="M38 86A100 100 0 0 1 217 88" fill="none" stroke="${C.light}" opacity=".25" stroke-width="3"/><circle cx="128" cy="126" r="96" fill="none" stroke="${active?C.edge:C.rim}" stroke-width="1" opacity=".4"/>`;
 for(let i=0;i<24;i++) {const a=i*Math.PI/12;const r1=i%3?111:108;body+=`<path d="M${128+Math.sin(a)*r1} ${126-Math.cos(a)*r1}L${128+Math.sin(a)*115} ${126-Math.cos(a)*115}" stroke="${C.light}" stroke-width="${i%3?1:2}" opacity=".65"/>`;}
 if(ninja){for(let i=0;i<4;i++){const a=i*90;body+=`<path transform="rotate(${a} 128 126)" d="M128 34l5 8-5 8-5-8z" fill="${C.light}" opacity=".8"/>`;}}
 else {body+=`<path d="M49 160h14m130 0h14M48 151h9m142 0h9" stroke="${C.edge}" opacity=".55"/>`;if(spin)body+=`<path d="M65 181Q128 194 191 181" stroke="${C.edge}" fill="none" opacity=".4"/><circle cx="80" cy="180" r="3" fill="${C.edge}" opacity=".7"/>`;}
 render(name,256,256,body);
}
render('bar',1024,128,`<rect x="2" y="6" width="1020" height="118" rx="18" fill="#010608" opacity=".7"/><rect x="2" y="2" width="1020" height="118" rx="18" fill="url(#rim)"/><rect x="5" y="5" width="1014" height="112" rx="15" fill="url(#face)"/><path d="M27 10H997M27 112H997" stroke="${C.rim}" opacity=".55"/><path d="M30 15H994" stroke="${C.light}" opacity=".16"/><path d="M15 27V95M1009 27V95" stroke="${C.light}" opacity=".35"/><path d="M25 23L43 41M25 41l18-18M981 23l18 18M981 41l18-18" stroke="${C.rim}" opacity=".6"/>`);
render('ticker',640,160,`<rect x="3" y="5" width="634" height="150" rx="18" fill="url(#rim)"/><rect x="6" y="8" width="628" height="144" rx="15" fill="url(#face)"/><path d="M25 16H615M25 144H615" stroke="${C.light}" opacity=".16"/><path d="M20 34v92m600-92v92" stroke="${C.rim}" opacity=".5"/>`);
render('crest',256,256,ninja?`<circle cx="128" cy="128" r="104" fill="url(#face)" stroke="url(#rim)" stroke-width="5"/><path d="M128 29l23 67 76 32-67 23-32 76-23-67-76-32 67-23z" fill="url(#rim)"/><circle cx="128" cy="128" r="36" fill="${C.dark}" stroke="${C.light}" stroke-width="3"/><path d="M109 141l37-37m-33 42 37-37" stroke="${C.light}" stroke-width="4"/>`:`<circle cx="128" cy="128" r="104" fill="url(#face)" stroke="url(#rim)" stroke-width="5"/><path d="M105 57h46v18h-8v43l35 59q8 21-15 23H93q-23-2-15-23l35-59V75h-8z" fill="${C.dark}" stroke="${C.light}" stroke-width="5"/><path d="M99 150h58l18 32q4 13-12 13H93q-16 0-12-13z" fill="url(#lit)"/><circle cx="120" cy="158" r="6" fill="${C.edge}"/><circle cx="143" cy="173" r="4" fill="${C.edge}"/>`);
console.log('feature UI V2: six original SVG/PNG assets generated');

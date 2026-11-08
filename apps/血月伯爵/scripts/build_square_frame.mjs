// Square, vector-native obsidian frame. The 648×648 aperture is exact.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire('E:/stake/tools/gen/package.json');
const {Resvg}=require('@resvg/resvg-js');
const out=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../static/bloodmoon/frame');
fs.mkdirSync(out,{recursive:true});
function save(name,body){
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="704" height="704" viewBox="0 0 704 704">${body}</svg>`;
 fs.writeFileSync(path.join(out,`${name}.svg`),svg);
 fs.writeFileSync(path.join(out,`${name}.png`),new Resvg(svg).render().asPng());
}
for(const [name,dark,light,accent] of [
 ['base','#101d27','#b6a174','#785366'],['free','#281321','#d9b77a','#be526d'],['red','#37101e','#d98a95','#ec466b'],
]){
 const defs=`<defs>
 <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${light}"/><stop offset=".18" stop-color="#6e5d49"/><stop offset=".48" stop-color="#2b2528"/><stop offset=".72" stop-color="${light}"/><stop offset="1" stop-color="#49363c"/></linearGradient>
 <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#3c3039"/><stop offset=".16" stop-color="${dark}"/><stop offset=".8" stop-color="#0a0e17"/><stop offset="1" stop-color="#30202c"/></linearGradient>
 <radialGradient id="ruby" cx=".3" cy=".25"><stop stop-color="#edb4b8"/><stop offset=".18" stop-color="#9d3657"/><stop offset=".7" stop-color="#4e102b"/><stop offset="1" stop-color="#190b1a"/></radialGradient>
 </defs>`;
 const corner=`<path d="M0 21V0H21L12 6H6V12Z" fill="url(#metal)" stroke="#b59b72" stroke-width=".8"/><path d="M3 3 15 15M8 3 20 15M3 8 15 20" stroke="${accent}" stroke-width="1"/><path d="M2 2 9 2 13 7 7 13 2 9Z" fill="url(#ruby)" stroke="${light}" stroke-width="1"/>`;
 let body=defs+`<path d="M12 1H692L703 12V692L692 703H12L1 692V12Z M28 28V676H676V28Z" fill="url(#stone)" fill-rule="evenodd" stroke="#05070c" stroke-width="2"/>
 <path d="M15 6H689L698 15V689L689 698H15L6 689V15Z" fill="none" stroke="url(#metal)" stroke-width="5"/>
 <rect x="15" y="15" width="674" height="674" fill="none" stroke="${accent}" stroke-width="1.4"/>
 <rect x="23" y="23" width="658" height="658" fill="none" stroke="#060810" stroke-width="7"/>
 <rect x="26.5" y="26.5" width="651" height="651" fill="none" stroke="url(#metal)" stroke-width="3"/>
 <path d="M44 11H316M388 11H660M44 693H316M388 693H660M11 44V316M11 388V660M693 44V316M693 388V660" stroke="${light}" stroke-opacity=".4" stroke-width="1"/>
 <path d="M64 19H309M395 19H640M64 685H309M395 685H640" stroke="#e7cf9c" stroke-opacity=".12"/>`;
 for(const [x,y,r] of [[20,20,0],[684,20,90],[684,684,180],[20,684,270]])body+=`<g transform="translate(${x} ${y}) rotate(${r})">${corner}</g>`;
 for(const [x,y,r] of [[352,14,0],[690,352,90],[352,690,180],[14,352,270]])body+=`<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-27-3-13-6 0-3 13-6 27-3 18 0 25 3 10 1 0 7-10 1-25 3-18 0Z" fill="url(#metal)" stroke="#27202b"/><path d="M0-9 7 0 0 9-7 0Z" fill="url(#ruby)" stroke="${light}" stroke-width="1"/></g>`;
 save(name,body);
}
for(const [name,color] of [['gold','#e2bc78'],['red','#e83d68']])save(`glow-${name}`,`<defs><filter id="b" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="4"/></filter></defs><rect x="11" y="11" width="682" height="682" rx="2" fill="none" stroke="${color}" stroke-width="9" opacity=".65" filter="url(#b)"/><rect x="27" y="27" width="650" height="650" fill="none" stroke="${color}" stroke-width="2" opacity=".9"/>`);
console.log('Built square frames: 704×704, 648×648 aperture; NG / FG / WILD + two glows.');

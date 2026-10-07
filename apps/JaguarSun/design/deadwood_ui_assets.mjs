/** Reproducible, original railway UI: charcoal enamel, brass trim, spectral teal. */
import {mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('../static/assets/deadwood/',import.meta.url));
mkdirSync(out,{recursive:true});
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const save=(name,s)=>writeFileSync(`${out}${name}.svg`,s+'\n');
const defs=`<defs><linearGradient id="metal" x2="0" y2="1"><stop stop-color="#f0d8a0"/><stop offset=".4" stop-color="#a77738"/><stop offset=".65" stop-color="#e0b665"/><stop offset="1" stop-color="#6f4e29"/></linearGradient><linearGradient id="enamel" x2="0" y2="1"><stop stop-color="#183e3b"/><stop offset=".5" stop-color="#0e201f"/><stop offset="1" stop-color="#070e10"/></linearGradient></defs>`;
function plate(w,h){return `${defs}<path d="M ${w*.09} 16 H ${w*.91} L ${w-16} ${h*.18} V ${h*.82} L ${w*.91} ${h-16} H ${w*.09} L 16 ${h*.82} V ${h*.18} Z" fill="url(#enamel)" stroke="url(#metal)" stroke-width="12"/><path d="M ${w*.11} 36 H ${w*.89} L ${w-36} ${h*.21} V ${h*.79} L ${w*.89} ${h-36} H ${w*.11} L 36 ${h*.79} V ${h*.21} Z" fill="none" stroke="#6da396" stroke-width="2"/>${[.10,.9].flatMap(x=>[.18,.82].map(y=>`<circle cx="${w*x}" cy="${h*y}" r="6" fill="#d8b879"/><path d="M ${w*x-3} ${h*y+3} l 6 -6" stroke="#4c3924" stroke-width="2"/>`)).join('')}`;}
for(const [name,title] of Object.entries({big:'BIG WIN',superwin:'SUPER WIN',mega:'MEGA WIN',epic:'EPIC WIN',max:'MAX WIN'})){
 save(`win_${name}`,svg(1000,560,plate(1000,560)+`<path d="M190 140 H400 M600 140 H810 M190 470 H400 M600 470 H810" stroke="#b68a49" stroke-width="4"/><path d="M460 140 L500 118 L540 140 L500 162 Z" fill="#8bddd0"/><text x="500" y="232" text-anchor="middle" font-family="Georgia,serif" font-size="${title.length>8?104:125}" font-weight="bold" letter-spacing="3" fill="#f0d8a0" stroke="#322616" stroke-width="2">${title}</text><path d="M450 490 H550 M470 506 H530" stroke="#8bddd0" stroke-width="4"/>`));
}
save('fs_sign',svg(920,720,plate(920,720)));
save('fs_panel',svg(1280,966,plate(1280,966)));
const icons={
 menu:'<path d="M16 20H48 M16 32H48 M16 44H48"/>',
 menuExit:'<path d="M19 19L45 45 M45 19L19 45"/>',
 settings:'<path d="M15 12V28 M15 38V52 M32 12V19 M32 29V52 M49 12V35 M49 45V52"/><circle cx="15" cy="33" r="5"/><circle cx="32" cy="24" r="5"/><circle cx="49" cy="40" r="5"/>',
 info:'<circle cx="32" cy="32" r="21"/><path d="M32 29V45 M32 20V21"/>',
 payTable:'<rect x="14" y="12" width="36" height="40" rx="4"/><path d="M14 25H50 M27 25V52 M39 25V52 M14 39H50"/>',
 soundOn:'<path d="M12 25H21L32 16V48L21 39H12Z M40 24Q49 32 40 40 M46 16Q61 32 46 48"/>',
 soundOff:'<path d="M12 25H21L32 16V48L21 39H12Z M42 25L54 39 M54 25L42 39"/>',
 autoSpin:'<path d="M14 27A20 20 0 0 1 49 18 M49 10V20H39 M50 37A20 20 0 0 1 15 46 M15 54V44H25"/><path d="M28 25L39 32L28 39Z"/>',
};
for(const [name,body] of Object.entries(icons))save(`icon_${name}`,svg(64,64,`<g fill="none" stroke="#eed6a5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${body}</g>`));
console.log('Generated 15 original Deadwood UI SVG assets.');

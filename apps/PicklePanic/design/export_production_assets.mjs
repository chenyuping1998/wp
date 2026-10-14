// Technical export of original raster art plus code-native UI shapes.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire('/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/noop.js');
const sharp = require('sharp');
const src = path.join(app,'design/source/production');
const out = path.join(app,'static/assets/pickle');
fs.mkdirSync(out,{recursive:true});
const ink='#171C1A', paper='#F5E6BE', yellow='#DDA831', red='#C45240', plum='#57465E';
const svg = (w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const draw = async(name,w,h,body)=>sharp(Buffer.from(svg(w,h,body))).png().toFile(path.join(out,name+'.png'));
for(const name of ['h1','h2','h3','h4','w','p','s']){
 const image=await sharp(path.join(src,name+'.png')).trim().resize(420,420,{fit:'inside'}).png().toBuffer();
 const info=await sharp(image).metadata();
 await sharp({create:{width:512,height:512,channels:4,background:'#00000000'}}).composite([{input:image,left:Math.round((512-info.width)/2),top:Math.round((512-info.height)/2)}]).png().toFile(path.join(out,name+'.png'));
}
for(const name of ['bg_base','bg_feature'])await sharp(path.join(src,name+'.png')).resize(1920,1080).webp({quality:90}).toFile(path.join(out,name+'.webp'));
await sharp(path.join(src,'frame.png')).resize(1280,1280).png().toFile(path.join(out,'frame.png'));
await sharp(path.join(src,'panel.png')).resize(1000,560).png().toFile(path.join(out,'panel.png'));
await sharp(path.join(src,'upgrade_cutin.png')).trim().resize(768,768,{fit:'contain',background:'#00000000'}).png().toFile(path.join(out,'upgrade_cutin.png'));
await draw('low_label',512,512,`<path d="M48 43L455 49L461 455L50 462L43 231Z" fill="${paper}" stroke="${ink}" stroke-width="13" stroke-linejoin="round"/><path d="M419 49L455 49L457 88Z" fill="${plum}"/><path d="M51 64L76 56M438 439L453 420M55 407L50 426" stroke="${ink}" stroke-width="4"/>`);
await draw('frame_bg',1280,1280,`<rect x="120" y="120" width="1040" height="1040" fill="${paper}"/>`);
await draw('bar_strip',2400,180,`<path d="M10 9L2387 14L2395 171L15 176Z" fill="${paper}" stroke="${ink}" stroke-width="16"/><path d="M30 21L54 17M2366 139L2381 130M230 164L255 162" stroke="${ink}" stroke-width="4"/>`);
await draw('ticker',900,130,`<path d="M12 10L881 15L891 118L17 121Z" fill="${paper}" stroke="${ink}" stroke-width="9"/>`);
for(const [name,fill] of [['button',paper],['button_on',yellow]])await draw(name,256,256,`<path d="M130 16C194 10 239 62 240 122C242 191 194 240 125 240C60 239 14 191 17 123C18 61 62 20 130 16Z" fill="${fill}" stroke="${ink}" stroke-width="10"/><path d="M52 38L65 29M220 190L211 203" stroke="${ink}" stroke-width="4"/>`);
for(const [name,fill] of [['buybonus',paper],['buybonus_hover',yellow]])await draw(name,480,480,`<g transform="translate(0 120)"><path d="M30 35L451 28L461 214L24 222Z" fill="${fill}" stroke="${ink}" stroke-width="14"/><path d="M69 7L67 45M410 5L411 43" stroke="${ink}" stroke-width="12"/><path d="M30 187L49 173M428 212L451 195" stroke="${ink}" stroke-width="5"/></g>`);
for(const mode of ['bonus','superbonus']){
 const hero=await sharp(path.join(src,mode==='bonus'?'mg.png':'fg.png')).trim().resize(300,410,{fit:'inside'}).png().toBuffer();
 const panel=await sharp(path.join(out,'panel.png')).resize(640,480).png().toBuffer();
 await sharp(panel).composite([{input:hero,left:320,top:35}]).png().toFile(path.join(out,'card_'+mode+'.png'));
}
await draw('stamp',512,512,`<path d="M253 18L287 91L370 48L369 143L467 138L416 218L494 267L402 299L440 389L343 375L337 475L262 418L195 491L169 398L75 424L102 333L14 306L90 251L30 183L128 169L116 73L207 110Z" fill="${yellow}" stroke="${ink}" stroke-width="12"/>`);
await draw('star',128,128,`<path d="M65 4L79 40L118 24L91 60L126 76L87 86L94 125L65 96L35 121L42 83L4 72L38 54L15 20L51 39Z" fill="${paper}"/>`);
await draw('streak',128,128,`<path d="M62 0L75 96L66 128L55 95Z" fill="${paper}"/>`);
await draw('chip',128,128,`<path d="M26 40L102 28L90 91L33 101Z" fill="${paper}" stroke="${ink}" stroke-width="6"/>`);
await draw('ray',256,256,`<path d="M0 114L119 113L256 6L143 123L256 240L126 139L0 145Z" fill="${paper}"/>`);
await draw('clear',8,8,'');
await draw('door',1400,1080,`<rect width="1400" height="1080" fill="#9D8DB7"/><path d="M13 10L1388 20L1389 1065L12 1074Z" fill="none" stroke="${ink}" stroke-width="24"/><path d="M45 58L1354 46L1339 1013L54 1027Z" fill="none" stroke="${paper}" stroke-width="28"/><path d="M110 147H1230V928H121Z" fill="${plum}" stroke="${ink}" stroke-width="20"/><path d="M200 320L568 155L863 927L1195 666" fill="none" stroke="${yellow}" stroke-width="96"/><path d="M0 534H1400M684 0V1080" stroke="${ink}" stroke-width="22"/><circle cx="1223" cy="521" r="60" fill="${red}" stroke="${ink}" stroke-width="14"/>`);
await draw('warning_bar',1920,420,`<path d="M0 0H1920V420H0Z" fill="${ink}"/><path d="M0 26H1920V397H0Z" fill="${yellow}"/>${Array.from({length:12},(_,i)=>`<path d="M${i*190-140} 397L${i*190+100} 26H${i*190+185}L${i*190-55} 397Z" fill="${ink}"/>`).join('')}`);
const icons={
 spin:'<path d="M99 47A40 40 0 1 0 100 80M83 24L104 47L78 51"/>',
 decrease:'<path d="M34 64H94"/>',
 increase:'<path d="M34 64H94M64 34V94"/>',
 turbo:'<path d="M71 17L34 70H60L54 112L97 53H71Z"/>',
 menu:'<path d="M38 47H90M38 64H90M38 81H90"/>',
 menuExit:'<path d="M39 39L89 89M89 39L39 89"/>',
 info:'<path d="M64 58V90"/><circle cx="64" cy="37" r="4"/>',
 payTable:'<path d="M43 34H92M43 54H92M43 74H92M43 94H92"/><path d="M29 34H31M29 54H31M29 74H31M29 94H31"/>',
 settings:'<circle cx="64" cy="64" r="15"/><path d="M54 22H75L78 36L91 43L104 40L114 58L102 69L101 81L106 94L88 106L75 98L62 99L49 105L33 93L36 79L28 66L16 58L24 40L40 39L49 34Z"/>',
 soundOn:'<path d="M28 53H46L65 35V93L46 75H28Z"/><path d="M80 48Q96 64 80 80M92 34Q120 64 92 94"/>',
 soundOff:'<path d="M23 53H41L60 35V93L41 75H23Z"/><path d="M82 47L108 81M108 47L82 81"/>',
 autoSpin:'<path d="M99 47A40 40 0 1 0 100 80M83 24L104 47L78 51"/>',
 replay:'<path d="M39 24H87V101H39Z"/><path d="M53 44L77 63L53 83Z"/>',
};
for(const [name,body]of Object.entries(icons))await draw('icon_'+name,128,128,`<g fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">${body}</g>`);
const jar=await sharp(path.join(out,'p.png')).resize(104,104).png().toBuffer();
const composite=Array.from({length:10},(_,i)=>({input:jar,left:(i%5)*128+12,top:Math.floor(i/5)*128+12}));
await sharp({create:{width:640,height:256,channels:4,background:'#00000000'}}).composite(composite).png().toFile(path.join(out,'jar_particles.png'));
const frames={};for(let i=0;i<10;i++)frames['banana_'+i]={frame:{x:(i%5)*128,y:Math.floor(i/5)*128,w:128,h:128},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:128,h:128},sourceSize:{w:128,h:128}};
fs.writeFileSync(path.join(out,'jar_particles.json'),JSON.stringify({frames,meta:{image:'jar_particles.png',format:'RGBA8888',size:{w:640,h:256},scale:'1'}}));
console.log('Exported original gameplay art, sprite sheet and thin-line code-native UI.');

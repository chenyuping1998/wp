// Code-native Gothic chrome for the existing GoBoomana controls.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire('E:/stake/tools/gen/package.json');
const {Resvg}=require('@resvg/resvg-js');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'static/bloodmoon/chrome');fs.mkdirSync(out,{recursive:true});
const defs=`<defs>
 <linearGradient id="iron" x2="0" y2="1"><stop stop-color="#27212d"/><stop offset=".18" stop-color="#101319"/><stop offset=".8" stop-color="#090c13"/><stop offset="1" stop-color="#291322"/></linearGradient>
 <linearGradient id="gold" x2=".1" y2="1"><stop stop-color="#e3c99b"/><stop offset=".22" stop-color="#957452"/><stop offset=".49" stop-color="#493b33"/><stop offset=".7" stop-color="#ba976a"/><stop offset="1" stop-color="#5e493b"/></linearGradient>
 <radialGradient id="ruby" cx=".45" cy=".3" r=".8"><stop stop-color="#bc4b65"/><stop offset=".33" stop-color="#7a1735"/><stop offset=".8" stop-color="#330b22"/><stop offset="1" stop-color="#160c19"/></radialGradient>
 <linearGradient id="velvet" x2=".8" y2="1"><stop stop-color="#381b2d"/><stop offset=".5" stop-color="#120f1a"/><stop offset="1" stop-color="#4e152a"/></linearGradient>
 </defs>`;
const bat=`<path d="M0 1Q-14-18-49-15L-39-2-52 5Q-32-1-25 11Q-15 3-7 14L0 8 7 14Q15 3 25 11Q32-1 52 5L39-2 49-15Q14-18 0 1Z" fill="url(#gold)" stroke="#29202a" stroke-width="2"/><path d="M0-7 8 4 0 15-8 4Z" fill="url(#ruby)" stroke="#d5ab79" stroke-width="1.5"/>`;
function asset(name,w,h,body){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}${body}</svg>`;fs.writeFileSync(path.join(out,name+'.svg'),svg);fs.writeFileSync(path.join(out,name+'.png'),new Resvg(svg).render().asPng());}
asset('bar',1536,128,`<path d="M18 3H1518L1533 18V110L1518 125H18L3 110V18Z" fill="url(#iron)" stroke="#0a090d" stroke-width="6"/>
 <path d="M20 8H1516L1527 20V108L1516 120H20L9 108V20Z" fill="none" stroke="url(#gold)" stroke-width="2"/>
 <path d="M25 14H1511L1520 23V105L1511 114H25L16 105V23Z" fill="none" stroke="#492b3d" stroke-width="2"/>
 <path d="M23 24H1513M23 103H1513" stroke="#a63850" stroke-opacity=".28"/>
 <path d="M30 13 18 29V98L30 111M1506 13 1518 29V98L1506 111" fill="none" stroke="#b7986a" stroke-width="2"/>
 <path d="M41 28 28 64 41 100 49 64Z M1495 28 1508 64 1495 100 1487 64Z" fill="#220f1c" stroke="#735b48"/>
 <path d="M768 4 777 12 768 20 759 12Z M768 108 776 116 768 124 760 116Z" fill="#7a203d" stroke="#c3a172"/>
 <path d="M94 18H1442M94 110H1442" stroke="#d4b181" stroke-opacity=".12"/>`);
for(const [name,active] of [['button',false],['button-active',true],['spin',true]]){
 asset(name,384,384,`<circle cx="192" cy="192" r="184" fill="#06080e"/>
  <circle cx="192" cy="192" r="179" fill="url(#iron)" stroke="url(#gold)" stroke-width="6"/>
  <circle cx="192" cy="192" r="164" fill="${active?'url(#ruby)':'#11121c'}" stroke="#40323b" stroke-width="3"/>
  <circle cx="192" cy="192" r="156" fill="none" stroke="${active?'#cf8390':'#967f68'}" stroke-width="1.5" opacity=".5"/>
  <path d="M192 8 201 25 192 42 183 25Z M192 342 201 359 192 376 183 359Z M8 192 25 183 42 192 25 201Z M342 192 359 183 376 192 359 201Z" fill="${active?'#b84460':'#59434d'}" stroke="#bc9e76"/>
  <path d="M65 106Q105 51 162 42M222 342Q286 334 322 277" fill="none" stroke="#e3c7a0" stroke-opacity=".3" stroke-width="3"/>`);
}
for(const [name,lit] of [['buy',false],['buy-lit',true]]){
 asset(name,512,600,`<path d="M122 61H390L478 162 446 516 393 574H119L66 516 34 162Z" fill="#06070e" stroke="#090710" stroke-width="10"/>
  <path d="M126 70H386L466 166 435 509 388 564H124L77 509 46 166Z" fill="url(#iron)" stroke="url(#gold)" stroke-width="7"/>
  <path d="M135 87H377L446 175 418 499 377 545H135L94 499 66 175Z" fill="${lit?'url(#ruby)':'url(#velvet)'}" stroke="#86664f" stroke-width="2"/>
  <path d="M147 108H365L422 184 399 487 366 522H146L113 487 90 184Z" fill="none" stroke="${lit?'#d7a27c':'#87576b'}" opacity=".55"/>
  <g transform="translate(256 106) scale(2.25)">${bat}</g>
  <path d="M149 456Q190 447 224 467L256 489 288 467Q322 447 363 456M177 480Q207 480 230 498L256 515 282 498Q305 480 335 480" fill="none" stroke="url(#gold)" stroke-width="3"/>
  <path d="M256 458 268 475 256 494 244 475Z" fill="url(#ruby)" stroke="#c5a16b"/>
  <path d="M78 179 89 201 85 223M434 179 423 201 427 223" fill="none" stroke="#d1b282" stroke-width="3"/>`);
}
console.log('Vampire chrome: bar, spin, idle/active discs, coffin buy plates (SVG + PNG)');

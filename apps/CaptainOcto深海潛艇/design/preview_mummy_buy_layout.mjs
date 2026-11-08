/** Offline HTML style review using the actual card definitions, images and CSS. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
import config from '../src/game/config.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'design/preview_mummy_20261107/seven_fixes');fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync(path.join(root,'src/components/ui/ModalBuyBonus.svelte'),'utf8');
const cards=Function('config','return ('+source.match(/const CARDS:[\s\S]*?=\s*({[\s\S]*?\n\t});/)[1]+')')(config);
const css=source.match(/<style>([\s\S]*)<\/style>/)[1],url=p=>pathToFileURL(path.join(root,p)).href;
const scene={coins:'holdandspin',arch:'bonus',scarab:'scarab',sure:'scarab',sun:'sun'};
function card(key){const c=cards[key],activate=!['HOLDANDSPIN','BONUS'].includes(key),cost=config.betModes[key.toLowerCase()].cost;
 return `<section class="card" style="--accent:${c.accent}"><div class="scene"><img class="scene-art" src="${url('static/assets/sprites/mummyUi/buy_art_'+scene[c.emblem]+'.webp')}"/><span class="tag">${c.tag}</span></div><div class="body"><h3>${c.title}</h3><div class="meter">${'<span class="pip"></span>'.repeat(c.meter.pips)}</div><div class="meterlabel">${c.meter.label}</div><ul>${c.points.map(p=>`<li>${p}</li>`).join('')}</ul><div class="cost"><span class="price-label">${activate?'PRICE PER SPIN':'FEATURE PRICE'}</span><strong class="price-amount">$${cost.toFixed(2)}</strong><span class="price-factor">${cost}× BASE BET</span></div><button class="buy">${activate?'ACTIVATE':'BUY'}</button></div></section>`;
}
for(const [name,keys]of [['buy',['HOLDANDSPIN','BONUS']],['activate',['SCARAB5','SCARAB10','SUNBOOST']]]){
 fs.writeFileSync(path.join(out,`prices_${name}.html`),`<!doctype html><meta charset="utf-8"><style>@font-face{font-family:'Lilita One';src:url('${url('static/fonts/LilitaOne.ttf')}')}body{margin:0;background:#071a20;display:grid;place-items:center;min-height:100vh;--gb-display-font:'Lilita One'}${css}.scene-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.review{color:#e3c58d;text-align:center;font:700 14px Arial;margin:12px}.menu{margin:0;max-height:calc(100dvh - 64px)}</style><main><p class="review">OFFLINE CARD STYLE REVIEW · BASE BET $1.00</p><div class="menu"><div class="head"><h2>${name==='buy'?'BUY FEATURE':'ACTIVATE'}</h2></div><div class="cards">${keys.map(card).join('')}</div></div></main>`);
}
console.log('Created exact card CSS review HTML',out);

// Syntax, accessibility structure, focus/scroll lifecycle and local theme assets.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(new URL('../package.json',import.meta.url));
const ts=require('typescript'),{compile}=require('svelte/compiler');
const root=new URL('../',import.meta.url);
const read=file=>fs.readFileSync(new URL(file,root),'utf8');
for(const file of ['InfoPopup','InfoShell','MechanicGuide','ModalGameRules','ModalPayTable']){
 const source=read(`src/components/ui/${file}.svelte`);
 const result=compile(source,{filename:file+'.svelte',generate:'client'});
 const warnings=result.warnings.filter(x=>x.code.startsWith('a11y_')&&!['a11y_no_noninteractive_tabindex'].includes(x.code));
 assert.equal(warnings.length,0,JSON.stringify(warnings));
}
const popup=read('src/components/ui/InfoPopup.svelte');
assert.equal((popup.match(/\{@render children\(\)\}/g)||[]).length,1,'info content must mount exactly once');
assert.match(popup,/aria-modal="true"/);assert.match(popup,/aria-labelledby="information-title"/);
let mounted,closed=0;
const doc={activeElement:null,body:{style:{overflow:'auto'}}};
class HTMLElement {constructor(id){this.id=id;this.offsetParent={};}focus(){doc.activeElement=this;}}
const prior=new HTMLElement('prior'),close=new HTMLElement('close'),tab=new HTMLElement('tab'),demo=new HTMLElement('demo');doc.activeElement=prior;
const sandbox={HTMLElement,document:doc,onMount:fn=>mounted=fn,$props:()=>({children(){},zIndex:100,onclose:()=>closed++})};
const code=ts.transpileModule(popup.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1],{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/^import[\s\S]*?from\s+['"][^'"]+['"];\s*/gm,'').replace(/^export\s*\{\s*\};?\s*$/gm,'');
vm.createContext(sandbox);vm.runInContext(code+'\nglobalThis.api={keyboard,bind:(d,c)=>{dialog=d;closeButton=c;}};',sandbox);
sandbox.api.bind({querySelectorAll:()=>[close,tab,demo]},close);
const cleanup=mounted();assert.equal(doc.activeElement,close);assert.equal(doc.body.style.overflow,'hidden');
const key=(name,shift=false)=>{let prevented=false;sandbox.api.keyboard({key:name,shiftKey:shift,preventDefault(){prevented=true;}});return prevented;};
assert(key('Tab',true));assert.equal(doc.activeElement,demo);assert(key('Tab'));assert.equal(doc.activeElement,close);assert(key('Escape'));assert.equal(closed,1);cleanup();assert.equal(doc.body.style.overflow,'auto');assert.equal(doc.activeElement,prior);
for(const file of ['ModalGameRules','ModalPayTable']){
 const source=read(`src/components/ui/${file}.svelte`);
 assert.match(source,/import Popup from '\.\/InfoPopup.svelte'/);
 assert.match(source,/<InfoShell kind="(?:rules|paytable)">/);
}
const rules=read('src/components/ui/ModalGameRules.svelte');
assert(rules.includes('LEGAL_NOTICE')&&rules.includes('Free Spins cannot be retriggered')&&rules.includes('Max Win by mode'),'required rules text lost');
const shell=read('src/components/ui/InfoShell.svelte');assert.match(shell,/stateModal.modal=\{name\}/);assert.match(shell,/config\.numRows/);assert.match(shell,/aria-current/);
const theme=read('src/game/uiTheme.ts');assert(theme.includes("barSpriteSlice: 72"));
for(const name of ['bar','button','button_active','spin','ticker','crest'])assert(fs.existsSync(new URL(`static/assets/sprites/featureUiV2/${name}.png`,root)));
assert.notEqual(fs.readFileSync(new URL('static/assets/sprites/featureUiV2/button.png',root)).toString('base64'),fs.readFileSync(new URL('static/assets/sprites/featureUiV2/button_active.png',root)).toString('base64'),'active state must remain visibly distinct');
console.log('PASS: Info components compile; labelled dialog, single mount, Escape, Tab trap, restored focus/scroll; rules preserved, real assets and distinct bar states');

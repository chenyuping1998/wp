<script lang="ts" module>
 export type EmitterEventBoardFrame={type:'boardFrameGlowShow'}|{type:'boardFrameGlowHide'}|{type:'boardFrameImpact';strength?:number;kind?:'landing'|'collect'|'upgrade'|'win'};
</script>
<script lang="ts">
 import { Graphics,Text } from 'pixi-svelte';
 import { getContext } from '../game/context';
 import { GAME_FONT } from '../game/fonts';
 import { gameText } from '../game/i18nText';
 const c=getContext();
 const b=$derived(c.stateGameDerived.boardLayout());
 // the free-spins intro/outro faceplate covers the board; its "1,024 WAYS"
 // label poked out above the plate, so it steps out while one is up; on a
 // phone the free-spins ticket sits where the label is, so it yields there too
 let covered=$state(false);
 c.eventEmitter.subscribeOnMount({freeSpinIntroShow:()=>(covered=true),freeSpinIntroHide:()=>(covered=false),freeSpinOutroShow:()=>(covered=true),freeSpinOutroHide:()=>(covered=false)});

// Deterministic ink marks: texture never crawls while the room idles.
const marks=Array.from({length:20},(_,cell)=>{
 let seed=894+cell*971; const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 return Array.from({length:76},()=>({x:7+rand()*125,y:7+rand()*125,w:.4+rand()*1.8,h:.3+rand()*.9,light:rand()>.55}));
});
const drawWorld=(g: import('pixi.js').Graphics)=>{g.clear();const s=b.scale;for(let x=0;x<5;x++)for(let y=0;y<4;y++){
 const px=b.x-b.width*s/2+x*140*s,py=b.y-b.height*s/2+y*140*s;
 g.poly([px+3*s,py+2*s,px+72*s,py+3*s,px+137*s,py+2*s,px+136*s,py+72*s,px+137*s,py+137*s,px+70*s,py+136*s,px+2*s,py+137*s,px+3*s,py+66*s]).fill((x+y)%2?0x6b718e:0x727b98).stroke({width:3*s,color:0x15191f});
 // Broad rubbed-paper patches, rather than a glossy bevel.
 g.poly([px+7*s,py+8*s,px+127*s,py+6*s,px+101*s,py+16*s,px+9*s,py+20*s]).fill({color:0xb2b5ca,alpha:.09});
 g.poly([px+8*s,py+121*s,px+131*s,py+110*s,px+132*s,py+131*s,px+7*s,py+130*s]).fill({color:0x22252e,alpha:.10});
 for(const m of marks[x*4+y])g.rect(px+m.x*s,py+m.y*s,m.w*s,m.h*s).fill({color:m.light?0xd3ced6:0x22252e,alpha:m.light?.17:.20});
 g.moveTo(px+8*s,py+10*s).lineTo(px+29*s,py+9*s).stroke({width:.8*s,color:0xc0bfcd,alpha:.35});
}};
</script>
<!-- Independent paper cards; deliberately no housing or outer reel frame. -->
<Graphics draw={drawWorld} />
<Text anchor={{x:.5,y:1}} x={b.x} y={b.y-b.height*b.scale/2-12} alpha={covered||(c.stateLayoutDerived.layoutType()==='portrait'&&c.stateGame.gameType==='freegame')?0:1} text={gameText('ssWaysBoard',{ways:(1024).toLocaleString('en-US')})} style={{fontFamily:GAME_FONT,fontSize:18,fill:0xe5e2d6,stroke:{color:0x15191f,width:3}}}/>

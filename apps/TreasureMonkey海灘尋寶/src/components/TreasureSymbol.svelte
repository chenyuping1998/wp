<script lang="ts">
 import {Container,Sprite,Graphics} from 'pixi-svelte';
 import type {Graphics as PixiGraphics} from 'pixi.js';
 import {treasurePartPose} from '../game/treasureMotion';
 import TreasureSymbolSkin from './TreasureSymbolSkin.svelte';
 import {SYMBOL_RIGS} from '../game/treasureSymbolRig';
 import TreasureLowSymbol from './TreasureLowSymbol.svelte';
 import TreasureScroll from './TreasureScroll.svelte';
 import TreasureCoconut from './TreasureCoconut.svelte';
 import TreasureKeyShine from './TreasureKeyShine.svelte';
 import TreasureMonkeyBlink from './TreasureMonkeyBlink.svelte';
 import {chestHinge,chestLight,chestCoin} from '../game/treasureChestMotion';
 let {name='',assetKey,width=108,height=108,mode='none',time=0,tint,alpha=1,overlay=false,reduced=false,debugBones=false}:{name?:string;assetKey:string;width?:number;height?:number;mode?:'none'|'land'|'win';time?:number;tint?:number;alpha?:number;overlay?:boolean;reduced?:boolean;debugBones?:boolean}=$props();
 const source=$derived(treasurePartPose(name,time,mode));
 const pose=$derived({lid:mode==='win'?chestHinge(time,reduced):0,flag:source.flag*(reduced?.25:1)});
 const innerLight=(g:PixiGraphics)=>{
  g.clear();if(overlay||mode!=='win')return;const a=chestLight(time,reduced);
  // The warm reveal is confined to the painted opening, beneath the lid.
  const opening=[[-.295,-.038],[.133,-.137],[.292,-.077],[.084,-.023],[.034,-.024],[-.050,-.028],[-.110,-.006],[-.156,-.009]];
  for(let layer=0;layer<8;layer++){
   const k=1-layer*.085;
   g.poly(opening.flatMap(([x,y])=>[(x*.98)*width*k,(y+.065)*height*k-height*.065])).fill({color:layer<3?0xffcc53:0xffedac,alpha:a*.038});
  }
 };
 const accents=(g:PixiGraphics)=>{
  g.clear();if(overlay||mode!=='win'||reduced)return;
  if(name==='H1')for(let i=0;i<5;i++){
   const p=chestCoin(i,time,reduced);if(p.opacity<=0)continue;
   const x=p.x*width,y=p.y*height,rx=p.rx*width,ry=p.ry*height,fade=p.opacity;
   // Soft concentric light follows each flip, keeping a clear metallic centre.
   const glow=fade*(.85+.15*p.face);
   for(let layer=0;layer<6;layer++){
    const spread=2.5-layer*.25;
    g.ellipse(x,y,rx*spread,ry*spread).fill({color:layer<3?0xffd363:0xffe8ac,alpha:(.012+layer*.007)*glow});
   }
   g.ellipse(x,y,rx,ry).fill({color:0xffd34f,alpha:fade}).stroke({color:0xffefac,width:.8,alpha:fade});
   g.ellipse(x+rx*.15,y+ry*.08,rx*.68,ry*.75).fill({color:0xe9a52e,alpha:.72*fade});
   g.ellipse(x-rx*.28,y-ry*.18,rx*.24,ry*.53).fill({color:0xfff5c5,alpha:.96*fade});
   g.moveTo(x-rx*.35,y-ry*.76).lineTo(x+rx*.12,y-ry*.65).stroke({color:0xfffbea,width:.75,alpha:fade});
   const glint=p.glint,r=height*.016,gx=x-rx*.24,gy=y-ry*.4;
   g.poly([gx,gy-r,gx+r*.2,gy-r*.2,gx+r*.65,gy,gx+r*.2,gy+r*.2,gx,gy+r,gx-r*.2,gy+r*.2,gx-r*.65,gy,gx-r*.2,gy-r*.2]).fill({color:0xfffbea,alpha:glint});
  }
  if(name==='H3')for(let i=0;i<3;i++){
   const age=Math.max(0,Math.min(1,(time-250-i*85)/330));if(age<=0||age>=1)continue;
   const x=-width*.15+Math.sin(age*2+i)*width*.035,y=-height*(.12+age*.27),r=width*(.017+i*.007);
   g.circle(x,y,r).fill({color:0xd1f3ec,alpha:.24*(1-age)}).stroke({color:0xfffdf2,width:1.2,alpha:(1-age)*.85});
  }
 };
</script>
{#if name.startsWith('L')}
 <TreasureLowSymbol {name} {width} {height} {time} {mode} {reduced} {tint} {alpha} {debugBones}/>
{:else if name==='S'}
 <TreasureScroll {width} {height} {time} active={mode==='win'} {reduced} {tint} {alpha} {debugBones}/>
{:else if name==='H4'}
 <TreasureCoconut {width} {height} {time} active={mode==='win'} {reduced} {tint} {alpha} {debugBones}/>
{:else if name==='H1'}
 <Sprite key="treasureChestBody" anchor={.5} {width} {height} {tint} {alpha} blendMode={overlay?'add':undefined}/>
 <Graphics draw={innerLight}/>
 <Container x={-width*.30} y={-height*.12} rotation={-.36*pose.lid} scale={{x:1,y:1-.26*pose.lid}}>
  <Sprite key="treasureChestLid" x={width*.30} y={height*.12} anchor={.5} {width} {height} {tint} {alpha} blendMode={overlay?'add':undefined}/>
 </Container>
 <Graphics draw={accents}/>
{:else if name==='H2'}
 <Container x={0} y={-height*.17} rotation={pose.flag*.065} skew={{x:pose.flag*.08,y:0}} scale={{x:1+pose.flag*.035,y:1}}>
  {#if mode==='win'}<Container y={height*.17}><TreasureSymbolSkin name="castleFlag" assetKey="treasureCastleFlag" {width} {height} {time} {reduced} {debugBones} {tint} {alpha} {overlay}/></Container>
  {:else}<Sprite key="treasureCastleFlag" y={height*.17} anchor={.5} {width} {height} {tint} {alpha} blendMode={overlay?'add':undefined}/>{/if}
 </Container>
 <Sprite key="treasureCastleBody" anchor={.5} {width} {height} {tint} {alpha} blendMode={overlay?'add':undefined}/>
{:else}
 {#if mode==='win'&&SYMBOL_RIGS[name]}
  {#key name}<TreasureSymbolSkin {name} {assetKey} {width} {height} {tint} {alpha} {overlay} {time} {reduced} {debugBones}/>{/key}
 {:else}<Sprite key={assetKey} anchor={.5} {width} {height} {tint} {alpha} blendMode={overlay?'add':undefined}/>{/if}
 <Graphics draw={accents}/>
{/if}
{#if name==='H5'&&mode==='win'&&!overlay}<TreasureKeyShine {width} {height} {time} {reduced}/>{/if}
{#if name==='W'&&mode==='win'&&!overlay}<TreasureMonkeyBlink {width} {height} {time} {reduced}/>{/if}

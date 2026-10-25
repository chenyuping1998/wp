from pathlib import Path
import shutil
ROOT=Path('E:/stake/wp/apps');cat=ROOT/'Purrfia喵菲亞家族';bird=ROOT/'ParrotRadio鸚鵡電台'
# Claw and cardboard performances replace the reference game's stone effects.
p=cat/'src/components/Crumble.svelte';s=p.read_text(encoding='utf-8');start=s.index('{#if props.assetKey}')
s=s[:start]+'''{#if props.assetKey}<Container x={props.x} y={props.y}>
 <Sprite key={props.assetKey} anchor={.5} y={-SYMBOL_SIZE*.45*t} width={(props.width??SYMBOL_SIZE)*(1-.7*t)} height={(props.height??SYMBOL_SIZE)*(1-.7*t)} alpha={1-t}/>
 <Sprite key="catPaw" anchor={.5} y={-SYMBOL_SIZE*.52-SYMBOL_SIZE*.45*t} width={SYMBOL_SIZE*.8} height={SYMBOL_SIZE*.8} alpha={Math.sin(Math.min(1,t)*Math.PI)}/>
</Container>{/if}
''';p.write_text(s,encoding='utf-8')
shutil.copy2(cat/'design/source/purrfia/cast/parts/paw_back.png',cat/'static/assets/sprites/purrfiaMechanics/cat_paw.png')
p=cat/'src/game/assets.ts';s=p.read_text(encoding='utf-8').replace('export default {',"export default {\n catPaw:{type:'sprite',src:new URL('../../assets/sprites/purrfiaMechanics/cat_paw.png',import.meta.url).href,preload:true},");p.write_text(s,encoding='utf-8')
p=cat/'src/components/TumbleLayer.svelte';s=p.read_text(encoding='utf-8').replace("const board = context.stateGame.board;","const board = context.stateGame.board;\n        explodingSymbols=[...new Map(explodingSymbols.map(p=>[p.reel+':'+p.row,p])).values()];\n        context.eventEmitter.broadcast({type:'soundCue',cue:'sfx_swipe'});")
s=s.replace("const stoneFilter = new ColorMatrixFilter(); stoneFilter.brightness(1, false);","const stoneFilter = new ColorMatrixFilter(); stoneFilter.brightness(1, false);stoneFilter.resolution='inherit';stoneFilter.antialias='inherit';")
p.write_text(s,encoding='utf-8')
# Fixed territory beneath falling symbols is drawn in material tiers.
p=cat/'src/components/Territory.svelte';s=p.read_text(encoding='utf-8').replace("g.roundRect(x+3,y+3,SYMBOL_SIZE-6,SYMBOL_SIZE-6,7).fill({color:color(cell.mult),alpha:0.10}).stroke({color:color(cell.mult),width:2,alpha:0.75});","g.roundRect(x+3,y+3,SYMBOL_SIZE-6,SYMBOL_SIZE-6,7).fill({color:color(cell.mult),alpha:cell.mult>=2?.32:.12}).stroke({color:color(cell.mult),width:2,alpha:.8});for(let i=0;i<3;i++)g.moveTo(x+21+i*9,y+27-i*3).lineTo(x+34+i*9,y+49-i*3).stroke({color:color(cell.mult),width:2,alpha:.65});")
p.write_text(s,encoding='utf-8')
# Box cells share one clock; no stagger and no skip of the authoritative replacement.
p=cat/'src/components/TerritoryTags.svelte';s=p.read_text(encoding='utf-8').replace('{Container,Graphics,Text}','{Container,Graphics,Text,Sprite}').replace(" import {getContext}"," import {untrack} from 'svelte';\n import {getContext}")
s=s.replace(' const context=getContext();',""" const context=getContext();let openingAge=$state(0);
 $effect(()=>{if(!context.stateGame.openingBoxes.length)return;let raf=0;const start=performance.now();const tick=(now:number)=>{openingAge=(now-start)/(context.stateBet?.isTurbo?400:780);raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);});
 const frames=['art_box_closed','art_box_peek_1','art_box_peek_2','art_box_open_1','art_box_open_2','art_box_open_3','art_box_open_4'];
 """).replace('context.stateBet?.isTurbo','stateBet.isTurbo').replace(" import {untrack}"," import {stateBet} from 'state-shared';\n import {untrack}")
start=s.index('  <Graphics draw=',s.index('{#each context.stateGame.openingBoxes'));end=s.index('\n {/each}',start)
s=s[:start]+'''  <Sprite key={frames[Math.min(6,Math.floor(openingAge*7))]} anchor={.5} x={getSymbolX(box.reel)} y={(box.row-.5)*SYMBOL_SIZE} width={SYMBOL_SIZE*1.1} height={SYMBOL_SIZE*1.1} alpha={Math.max(0,1-Math.max(0,openingAge-.75)*4)}/>
''' +s[end:];p.write_text(s,encoding='utf-8')
# Stamp art follows its actual authoritative multiplier.
p=cat/'src/components/Symbol.svelte';s=p.read_text(encoding='utf-8').replace("import {Text}","import {Text,Sprite}")
s=s.replace("{:else if isSprite}","{:else if props.rawSymbol.name==='W'}\n<Sprite key={'art_stamp_x'+(props.rawSymbol.multiplier??2)} anchor={.5} x={props.x} y={props.y} width={84} height={84}/>\n{:else if isSprite}")
s=s.replace("fill:0x2a1e1a","fill:0x281c20,stroke:{color:0xffe6a0,width:2}")
p.write_text(s,encoding='utf-8')
# Winning bird symbols act through their part meshes before becoming notes.
p=bird/'src/components/ScatterWins.svelte';s=p.read_text(encoding='utf-8').replace("wins=e.wins;await", "wins=e.wins;for(const win of e.wins)for(const p of win.positions){const cell=context.stateGame.board[p.reel]?.reelState.symbols[p.row];if(cell)cell.symbolState='win';}await")
p.write_text(s,encoding='utf-8')
# Separate volume and counter from the title/encore line in portrait.
p=bird/'src/components/FreeSpinCounter.svelte';s=p.read_text(encoding='utf-8').replace('y={-95}','y={BOARD_SIZES.height+33}');p.write_text(s,encoding='utf-8')
for app in [cat,bird]:
 p=app/'src/components/SymbolMeshWin.svelte';s=p.read_text(encoding='utf-8').replace('p.index?.12:.025','p.index ? .12 : .025');p.write_text(s,encoding='utf-8')
 # Icons on black leather / navy discs remain legible.
 p=app/'src/game/uiTheme.ts';s=p.read_text(encoding='utf-8').replace('buttonIconFill: 0x141826','buttonIconFill: 0xfff3dc').replace('buttonIconStroke: 0x141826','buttonIconStroke: 0xfff3dc').replace('buyBonusLabelOffsetY: 0.2','buyBonusLabelOffsetY: 0.22');p.write_text(s,encoding='utf-8')
 print(app.name,'FX updated')

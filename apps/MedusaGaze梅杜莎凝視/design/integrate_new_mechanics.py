from pathlib import Path
import re,json,hashlib
APP=Path(__file__).resolve().parent.parent
src=APP/'src'
protected=src/'game/bookEventHandlerMap.ts'
before=hashlib.sha256(protected.read_bytes()).hexdigest()
p=src/'game/assets.ts';s=p.read_text(encoding='utf-8')
assets={'mgLadderPanel':'medusaUi/ladder_panel.png','mgSnakePipOn':'medusaUi/snake_pip_on.png','mgSnakePipOff':'medusaUi/snake_pip_off.png','mgGazeSweep':'medusaFx/gaze_sweep.png'}
assets.update({f'mgLadderLv{i}':f'medusaUi/ladder_lv{i}.png' for i in range(1,5)})
assets.update({f'mgStoneCrack{i}':f'medusaFx/stone_crack_{i}.png' for i in range(1,4)})
for key,path in assets.items():
 if key+':' not in s:s=s.replace('export default {',f"export default {{\n {key}: {{type:'sprite',src:new URL('../../assets/sprites/{path}',import.meta.url).href,preload:true}},",1)
p.write_text(s,encoding='utf-8')
p=src/'game/betModeMeta.ts';s=p.read_text(encoding='utf-8')
if 'const cardArt' not in s:
 s="import { base } from '$app/paths';\nconst cardArt = (name: string) => `${base}/assets/sprites/medusaUi/card_${name}.png`;\n"+s
 for mode,name in [('ANTE','ante'),('PETRIFY','petrify'),('BONUS','bonus'),('SUPER','super')]:
  start=s.index('\n\t'+mode+': {');end=s.index('\n\t\ttext:',start)
  s=s[:start]+s[start:end].replace('assets: { ...emptyAssets }',f"assets: {{ ...emptyAssets, dialogImage: cardArt('{name}') }}")+s[end:]
p.write_text(s,encoding='utf-8')
p=src/'components/SerpentLadder.svelte';s=p.read_text(encoding='utf-8')
s=s.replace('Container, Graphics, Text','Container, Sprite, Text')
s=s.replace("import type { Graphics as PixiGraphics } from 'pixi.js';",'')
a=s.index('\tconst draw = (g:');b=s.index('\n\tconst levelUp',a);s=s[:a]+s[b:]
s=s.replace('<Graphics {draw} />','''<Sprite key="mgLadderPanel" anchor={0.5} width={W} height={H}/>
            {#each Array.from({length:maxSnakes},(_,i)=>i) as i}
             <Sprite key={i < snakes ? 'mgSnakePipOn' : 'mgSnakePipOff'} anchor={.5} x={pipX(i)} y={14} width={13} height={13} scale={i < snakes && i === snakes-1 ? 1+.35*pop : 1}/>
            {/each}
            <Sprite key={(['mgLadderLv1','mgLadderLv2','mgLadderLv3','mgLadderLv4'] as const)[Math.min(3,Math.max(0,level-1))]} anchor={.5} y={-H/2-62} width={82} height={82} visible={banner!==null} alpha={banner ? 1-Math.max(0,banner.t-.6)/.4 : 0} scale={1+.18*pop}/>''')
s=s.replace('y={-H / 2 - 18 - 26 * banner.t}','y={-H / 2 - 112 - 16 * banner.t}')
p.write_text(s,encoding='utf-8')
p=src/'components/PetrifyLayer.svelte';s=p.read_text(encoding='utf-8')
s=s.replace('import { SYMBOL_SIZE }','import { BOARD_SIZES, SYMBOL_SIZE }')
s=s.replace('dx: number };','dx: number; crack?:number };')
s=s.replace('let nextId = 0;',"let nextId = 0;\n let sweep=$state(-1);")
anchor="context.eventEmitter.broadcast({ type: 'soundMedusa', cue: 'gazeBeam' });"
s=s.replace(anchor,anchor+"\n const lightSweep=tween(600,t=>sweep=t).then(()=>{sweep=-1;});")
s=s.replace('await sleep(fast() ? 120 : 380);','await sleep(fast() ? 120 : 380);\n await lightSweep;')
# Preserve the original total presentation budget: the sweep runs concurrently.
s=s.replace('await lightSweep;','void lightSweep;')
s=s.replace('scale: 1 + 0.04 * t','scale: 1 + 0.04 * t, crack: Math.max(0,Math.min(3,1+Math.floor((t*(fast()?220:520)-((fast()?220:520)-(fast()?135:270)))/(fast()?45:90))))')
s=re.sub(r"\s*context.eventEmitter.broadcast\(\{ type: 'boardFrameImpact', strength: [\d.]+ \}\);",'',s)
s=s.replace('<BoardContainer>','''<BoardContainer>
 <Sprite key="mgGazeSweep" anchor={.5} x={-220+(BOARD_SIZES.width+440)*Math.max(0,sweep)} y={BOARD_SIZES.height/2} width={400} height={BOARD_SIZES.height} blendMode="add" visible={sweep>=0} alpha={sweep<0?0:.5*Math.sin(Math.PI*sweep)}/>''',1)
s=s.replace('key="mgST" anchor={0.5} x={o.x',"key={o.crack ? (['mgStoneCrack1','mgStoneCrack2','mgStoneCrack3'] as const)[o.crack-1] : 'mgST'} anchor={0.5} x={o.x")
p.write_text(s,encoding='utf-8')
assert hashlib.sha256(protected.read_bytes()).hexdigest()==before
print('Integrated art only; event handler SHA256 unchanged:',before)

from pathlib import Path
import json,re,shutil
ROOT=Path('E:/stake/wp/apps')
for folder,slug,rig in [('Purrfia喵菲亞家族','purrfia','donWhiskers43'),('ParrotRadio鸚鵡電台','parrot','squawk43')]:
 app=ROOT/folder;cat=slug=='purrfia';sprites=app/'static/assets/sprites';assets=app/'src/game/assets.ts'
 text=assets.read_text(encoding='utf-8');entries={m[0]:m[1] for m in re.findall(r"(\w+):\s*\{\s*type:\s*'sprite',\s*src:\s*new URL\('([^']+)'",text)}
 def add(key,path):entries[key]='../../assets/'+path
 ui=['button_disc','button_disc_on','buybonus_plate','buybonus_plate_lit','bar_strip','fs_sign','fs_counter_panel','frame_corner','frame_edge_h','frame_edge_v','buy_card_bonus','buy_card_super']
 keys=['mgUiButton','mgUiButtonOn','mgUiBuyBonus','mgUiBuyBonusLit','mgUiBarStrip','mgFsSign','mgFsPanel','frameCorner','frameEdgeH','frameEdgeV','cardBonus','cardSuper']
 for key,name in zip(keys,ui):add(key,f'sprites/{slug}Ui/{name}.png')
 for name in ['big','superwin','mega','epic','max']:add('mgWinBanner'+name.capitalize(),f'sprites/{slug}WinBanners/{name}.png')
 add('mgLogo',f'sprites/{slug}Brand/logo.png')
 for i in range(1,4):add('mgIntro'+str(i),f'sprites/{slug}Intro/intro_{i}.png')
 for file in (sprites/(slug+'Mechanics')).glob('*.png'):add('art_'+file.stem,f'sprites/{slug}Mechanics/{file.name}')
 source=app/'design/source'/slug/'symbols/parts'
 for file in source.glob('*.png'):add('part_'+file.stem,f'sprites/{slug}Symbols/{file.name}')
 pages=json.loads((app/'src/game/characterRigPages.json').read_text())
 for i,page in enumerate(pages):add('castAtlas'+str(i),f'spines/{rig}/{page}')
 if cat:
  for src,dst in [('box_closed','m'),('stamp_x2','w')]:shutil.copy2(sprites/'purrfiaMechanics'/(src+'.png'),sprites/'purrfiaSymbols'/(dst+'.png'))
 else:
  # The white UI glyph set is original app-owned geometry, shared by these two new titles.
  sourceIcons=ROOT/'Purrfia喵菲亞家族/static/assets/sprites/purrfiaUiIcons';target=sprites/'parrotUiIcons';target.mkdir(exist_ok=True)
  for file in sourceIcons.glob('*.png'):shutil.copy2(file,target/file.name)
  for key,name in [('Menu','menu'),('MenuExit','menuExit'),('Settings','settings'),('Info','info'),('PayTable','payTable'),('SoundOn','soundOn'),('SoundOff','soundOff'),('Increase','increase'),('Decrease','decrease'),('AutoSpin','autoSpin')]:add('mgIcon'+key,f'sprites/parrotUiIcons/{name}.png')
 assets.write_text('// Original production artwork; prompts and source layers are preserved in design/source.\nexport default {\n'+''.join(f" {k}: {{type:'sprite',src:new URL('{v}',import.meta.url).href,preload:true}},\n" for k,v in entries.items())+'} as const;\n',encoding='utf-8')
 # Put the card illustrations into the existing feature selection flow.
 meta=app/'src/game/betModeMeta.ts';s=meta.read_text(encoding='utf-8');s="import assetsArt from './assets';\n"+s
 s=s.replace('assets:{...emptyAssets}','assets:{...emptyAssets,dialogImage:key===\'super\'?assetsArt.cardSuper.src:assetsArt.cardBonus.src}').replace('assets:{...assets}','assets:{...assets,dialogImage:key===\'super\'?assetsArt.cardSuper.src:assetsArt.cardBonus.src}')
 meta.write_text(s,encoding='utf-8')
 # Source checks run before bundling; shared diagnostics are reported separately.
 package=app/'package.json';data=json.loads(package.read_text(encoding='utf-8'));data['scripts']['check:types']='node design/check_source_types.mjs'
 if 'check_source_types' not in data['scripts']['build']:data['scripts']['build']=data['scripts']['build'].replace(' && vite build',' && node design/check_source_types.mjs && vite build')
 package.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 sfile=app/'src/components/Sound.svelte';s=sfile.read_text(encoding='utf-8').replace('if(!v.loop)stop(v)','if(!v.loop||v.priority>0)stop(v)');sfile.write_text(s,encoding='utf-8')
 # The same simple gold frames use each title's painted corner and edge pieces.
 frame='''<script lang="ts">
 import {Graphics,Sprite} from 'pixi-svelte';
 import {BOARD_SIZES,BOARD_DIMENSIONS,SYMBOL_SIZE} from '../game/constants';
 const w=BOARD_SIZES.width,h=BOARD_SIZES.height;
 const corners=[{x:0,y:0,sx:1,sy:1},{x:w,y:0,sx:-1,sy:1},{x:0,y:h,sx:1,sy:-1},{x:w,y:h,sx:-1,sy:-1}];
</script>
<Graphics draw={g=>{g.clear();g.roundRect(-14,-14,w+28,h+28,12).fill(BODY).stroke({color:0xb78b42,width:4});for(let x=0;x<BOARD_DIMENSIONS.x;x++)for(let y=0;y<BOARD_DIMENSIONS.y;y++)g.roundRect(x*SYMBOL_SIZE+2,y*SYMBOL_SIZE+2,SYMBOL_SIZE-4,SYMBOL_SIZE-4,5).fill(CELL).stroke({color:LINE,width:1});}}/>
<Sprite key="frameEdgeH" anchor={.5} x={w/2} y={-9} width={w+22} height={28}/>
<Sprite key="frameEdgeH" anchor={.5} x={w/2} y={h+9} width={w+22} height={28} scale={{x:1,y:-1}}/>
<Sprite key="frameEdgeV" anchor={.5} x={-9} y={h/2} width={28} height={h+22}/>
<Sprite key="frameEdgeV" anchor={.5} x={w+9} y={h/2} width={28} height={h+22} scale={{x:-1,y:1}}/>
{#each corners as c}<Sprite key="frameCorner" anchor={{x:.25,y:.25}} x={c.x} y={c.y} width={64} height={64} scale={{x:c.sx,y:c.sy}}/>{/each}
<Sprite key="mgLogo" anchor={.5} x={w/2} y={-62} width={260} height={98}/>
'''.replace('BODY','0x39251f' if cat else '0x1d4557').replace('CELL','0x281c1b' if cat else '0x12364a').replace('LINE','0x634632' if cat else '0x235b70')
 (app/'src/components/BoardFrameArt.svelte').write_text(frame,encoding='utf-8')
 if not cat:
  p=app/'src/components/BoardFrame.svelte';s=p.read_text(encoding='utf-8');end=s.index('<BoardContainer>');s=s[:end]+'<BoardContainer><BoardFrameArt/></BoardContainer>\n';s=s.replace(" import {Graphics,Text}"," import BoardFrameArt from './BoardFrameArt.svelte';\n import {Graphics,Text}");p.write_text(s,encoding='utf-8')
  # Keep the proven shared controls and apply the parrot art locally.
  theme=(ROOT/'Purrfia喵菲亞家族/src/game/uiTheme.ts').read_text(encoding='utf-8').replace('0x2a1e1a','0x16334a').replace('0x1e1714','0x102b40').replace('0xefe8d8','0xfff3dc')
  (app/'src/game/uiTheme.ts').write_text(theme,encoding='utf-8')
  intro=(ROOT/'Purrfia喵菲亞家族/src/components/FeatureIntro.svelte').read_text(encoding='utf-8').replace("import {purrfiaText} from '../game/purrfiaText';","import {parrotText} from '../game/parrotText';").replace('purrfiaText','parrotText').replace("parrotText('boxesTitle')","parrotText('encoreTitle')").replace("parrotText('boxes')","parrotText('encoreRule')").replace("parrotText('super')","parrotText('featureRule')")
  (app/'src/components/FeatureIntro.svelte').write_text(intro,encoding='utf-8')
  (app/'src/components/LoadingScreen.svelte').write_text('''<script lang="ts">
 import {MainContainer} from 'components-layout';import {Sprite} from 'pixi-svelte';
 import FeatureIntro from './FeatureIntro.svelte';import PressToContinue from './PressToContinue.svelte';import {getContext} from '../game/context';
 const props:{onloaded:()=>void}=$props();const context=getContext();
 const layout=$derived(context.stateLayoutDerived.mainLayout());
</script>
{#if context.stateApp.loaded}<FeatureIntro/><PressToContinue onpress={props.onloaded}/>
{:else}<MainContainer><Sprite key="mgLogo" anchor={.5} x={layout.width*.5} y={layout.height*.35} width={Math.min(680,layout.width*.8)} height={Math.min(680,layout.width*.8)*.375}/></MainContainer>{/if}
''',encoding='utf-8')
  p=app/'src/game/parrotText.ts';s=p.read_text(encoding='utf-8').replace('const strings={',"""const strings={
 clusterTitle:['SCATTER ANYWHERE','任意位置得分'],cluster:['8+ matching symbols anywhere win. Winning symbols disappear and new symbols drop in.','任意位置 8 個相同圖案得分，得分圖案消除後補入新圖案。'],
 encoreTitle:['ONE MORE TIME','再來一首'],encoreRule:['ENCORE flips more tiles into the highest contributing symbol, once per winning round.','安可每個得分回合最多一次，將其他格子翻成得分最高的圖案。'],
 freeTitle:['TURN IT UP','音量全開'],featureRule:['Free rounds build volume up to ×20. Platinum records multiply one round only.','免費遊戲的安可累積音量，最高 ×20。白金唱片只乘本回合。'],
 """);p.write_text(s,encoding='utf-8')
  p=app/'src/components/FreeSpinAnimation.svelte';s=p.read_text(encoding='utf-8').replace('{Container,Graphics}','{Container,Graphics,Sprite}');start=s.index(' <Graphics draw=');end=s.index('\n {@render',start);s=s[:start]+' <Sprite key="mgFsSign" anchor={.5} width={sizes.width*1.2} height={sizes.height*1.35}/>'+s[end:];p.write_text(s,encoding='utf-8')
 # Production banner canvases all have one stable text well.
 layout={name:{'width':1352,'height':194,'textY':0,'textHeight':90,'textWidth':790} for name in ['big','superwin','mega','epic','max']}
 (app/'src/game'/('purrfiaBannerLayout.json' if cat else 'parrotBannerLayout.json')).write_text(json.dumps(layout),encoding='utf-8')
 print(folder,':',len(entries),'art assets registered')

p=ROOT/'Purrfia喵菲亞家族/src/components/ui/ModalPayTable.svelte';s=p.read_text(encoding='utf-8').replace("?.[String(n)]"," as Record<string,number>|undefined)?.[String(n)]")
# Keep the optional table entry cast outside the lookup itself.
s=s.replace("Number((entry.paytable??[]).find(p=>String(n) in p) as Record<string,number>|undefined)?.[String(n)]??0)","Number(((entry.paytable??[]).find(p=>String(n) in p) as Record<string,number>|undefined)?.[String(n)]??0)")
p.write_text(s,encoding='utf-8')

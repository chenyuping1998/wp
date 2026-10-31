"""Produce local review bundles from verified frontends and existing published math."""
from pathlib import Path
from PIL import Image
from zipfile import ZipFile,ZIP_DEFLATED,ZIP_STORED
import os,json,hashlib,shutil,re,sys
WORK=Path('E:/stake');WP=WORK/'wp';OUT=WORK/'deliverables/new-games-20261026';OUT.mkdir(parents=True,exist_ok=True)
SKIP={'node_modules','.svelte-kit','.git','.turbo','build','__pycache__'}
TOOLS=['build_new_game_audio.py','build_new_game_cast.py','import_new_game_art.py','install_new_game_sound.py','integrate_new_game_art.py','finish_new_game_presentation.py','install_new_symbol_mesh.py','polish_new_game_fx.py','audit_new_game_audio.py','new_game_motion_v2.py','new_game_skin_v3.py','new_game_motion_v3.py','new_game_background_scene.ts','new_game_background_motion.ts','new_game_info_panel.svelte','refine_new_game_ui.py','export_new_game_cast_frames.mjs','render_new_game_cast_frames.py','check_new_game_motion_v2.mjs','check_new_game_soft_skin.mjs']
TOOLS += ['new_game_motion_flow.py','new_game_character_player_v6.ts','check_new_game_flow.mjs','finalize_new_game_v6.py']
TOOLS += ['new_game_articulation_v4.py','new_game_motion_v4.py','check_new_game_anatomy.mjs']
TOOLS += ['new_game_buy_bonus.svelte','new_game_symbol_performance.ts','new_game_symbol_win.svelte','refine_new_game_v5.py','check_new_game_prize_motion.mjs','render_new_game_prize_review.py']
def digest(file):
 h=hashlib.sha256()
 with file.open('rb') as stream:
  for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def write(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def files(root):
 for parent,dirs,names in os.walk(root,followlinks=False):
  dirs[:]=[d for d in dirs if d not in SKIP and not (Path(parent)/d).is_symlink()]
  for name in names:
   p=Path(parent)/name
   if not p.is_symlink() and name not in ['.env','.env.local','.env.production'] and not name.endswith('.log'):yield p
def archive(path,entries):
 with ZipFile(path,'w',ZIP_DEFLATED,compresslevel=6) as z:
  for file,name in entries:z.write(file,str(name).replace('\\','/'),compress_type=ZIP_STORED if file.suffix.lower() in {'.png','.jpg','.jpeg','.ogg','.zst','.zip','.gif'} else ZIP_DEFLATED)
 with ZipFile(path) as z:assert z.testzip() is None
 return {'file':path.name,'bytes':path.stat().st_size,'sha256':digest(path)}
reports=[]
for folder,slug in [('Purrfia喵菲亞家族','purrfia'),('ParrotRadio鸚鵡電台','parrot')]:
 app=WP/'apps'/folder;source=app/'design/source'/slug;target=OUT/folder;target.mkdir(exist_ok=True);build=app/'build'
 logFile=WORK/'tmp/new-games-anatomy-20261027'/f'{slug}-build.log'
 log=logFile.read_text(encoding='utf-8',errors='replace')
 assert '✔ done' in log and 'Source type check: 0 app errors' in log,folder+' build incomplete'
 html=(build/'index.html').read_text(encoding='utf-8');assert 'mock.local' not in html and 'LOCAL MECHANICS REVIEW' not in html and 'baseBoxes' not in html,'Dev fixtures in production'
 latest=max(p.stat().st_mtime for root in [app/'src',app/'static'] for p in root.rglob('*') if p.is_file());assert (build/'index.html').stat().st_mtime>=latest,'Build is older than source/static assets'
 for src,dst in [('DELIVERY.txt','DELIVERY.txt')]:pass
 inventory=[]
 for p in sorted((app/'static/assets').rglob('*')):
  if not p.is_file():continue
  item={'path':p.relative_to(app/'static').as_posix(),'bytes':p.stat().st_size,'sha256':digest(p)}
  if p.suffix.lower() in ['.png','.jpg']:
   with Image.open(p) as im:item['size']=list(im.size);item['mode']=im.mode
  inventory.append(item)
 write(source/'asset-manifest.json',inventory)
 originals=[]
 for p in sorted((source/'originals').glob('*.png')):originals.append({'file':p.name,'bytes':p.stat().st_size,'sha256':digest(p),'prompt':p.stem+'_prompt.txt'})
 write(source/'originals/manifest.json',{'tool':'built-in image_gen','edits':'Sheet cell registration, canvas normalization and alpha-preserving aligned assembly. Original outputs retained.','images':originals})
 report={'project':folder,'date':'2026-10-26','stage':'local_frontend_build_ready_pending_engine_validation','backgrounds':'Brighter base and feature scenes integrated; no separate preview site.','requirements':str(WORK/'proposals'/folder),'art':{'source':str(source),'originalImageCount':len(originals),'prompts':'originals/*_prompt.txt','characterPSD':'cast/don_whiskers.psd' if slug=='purrfia' else 'cast/squawk.psd','turnaround':'cast/turnaround.png','cover':'brand/cover_16x9.jpg','tileLayers':['brand/tile_background.jpg','brand/tile_foreground.png'],'logo':'brand/logo.png','assetManifest':'asset-manifest.json'},'animation':json.loads((source/'cast/rig-report.json').read_text(encoding='utf-8')),'audio':{k:v for k,v in json.loads((source/'audio/validation.json').read_text()).items() if k!='measurements'},'math':{'publishedDataUnchanged':True,'modes':['base','bonus','super'],'costMultipliers':[1,100,300],'publishedAudit':str(WORK/'tmp/new-games-20261025/published-math-audit.json'),'RTP':.96,'maxWinMultiplier':10000},'validation':{'fullBuild':'passed','sourceTypes':'0 app errors; 7 shared dependency diagnostics','eventContracts':'passed','castMeshSampling':'passed','productionHasMockCode':False,'engineUpload':'not performed'},'productionNotes':['Character vocal cues are original synthesized nonverbal sounds, not recorded voice acting.','Backgrounds currently use flattened painted scenes; fully separated painted depth layers are not included.','Primary character layers are editable; small costume accents also remain painted into the body artwork.','Live RGS, device audio and Stake Engine acceptance still require platform validation.']}
 write(source/'delivery-status.json',report);write(app/'design/completion-progress.json',report)
 shutil.copy2(source/'delivery-status.json',target/'delivery-status.json')
 for name in ['cover_16x9.jpg','tile_background.jpg','tile_foreground.png','logo.png','favicon.png','loader.gif']:shutil.copy2(source/'brand'/name,target/name)
 for name in ['published-math-audit.json','lut-sidecar-audit.json','math-contract-notes.json']:
  shutil.copy2(WORK/'tmp/new-games-20261025'/name,target/name)
 report['date']='2026-10-31'
 report['backgrounds']='Bright painted scenes with local receiver masks. Cat: passing cloud illumination and moving window slat shadows, restrained lamp glow, dust and wet neon reflections. Parrot: sea-only UV waves with travelling crests, fixed horizon/architecture, rare gull and feature light string. Focus holds motion; reduced motion remains static.'
 report['animation']['motionVersion']=6
 report['animation']['respiration']='Independent track 1: nonrigid weighted abdomen, ribs, neck and cheeks; two unequal breaths with pauses over 11.6s cat / 10.2s macaw. Feet remain planted.'
 report['animation']['limbRepair']='Cat V6: native jacket shoulder facings cover the moving sleeve roots; both shoulders and cuffs use contact-patch checks. V5 sleeve opening centre registered to rear wrist, palm inserted into cuff, head lowered 32 source pixels onto collar, head pivot moved to neckline and lower ruff pinned to neck. Includes both cuffs, active stamp and collar contact checks. Parrot retains V4 registered feather roots, fold/raise/unfold corridors and layered props.'
 report['animation']['review']='cast/motion-review/motion.gif: shipped character player with continuous breath, crossfades and return to idle. Both V6 captures at 20fps, with actual player crossfades, held loops and returns. Full move list in all-actions.png.'
 report['animation']['prizes']='Object-specific part and mesh performances: fish/water, lid/tail, yarn/thread, leaves, record/label, cord, telescope eye, straw/umbrella and scatter accents. Winning clip 640ms / scatter 820ms, with reduced-motion path and single completion.'
 report['validation']['motionStateRegression']='passed: independent respiration, feature rest, protected actions, max-win hold, fidget cancellation, reduced motion'
 report['validation']['softSkinRegression']='passed: official Spine runtime; nonrigid torso deformation beyond similarity transform, planted feet, zero rest-joint offsets, modal pause and fixed background geometry'
 report['validation']['latestBrowserRegression']=json.loads((source/'browser-validation.json').read_text(encoding='utf-8'))
 report['validation']['prizes']=json.loads((source/'prize-motion/validation.json').read_text(encoding='utf-8'))
 anatomy=json.loads((source/'cast/anatomy-validation.json').read_text(encoding='utf-8'))
 assert anatomy['totalFolded']==0 and anatomy['seamFailures']==0 and anatomy['rigSha256']==digest(app/'src/game/characterRigData.json'),'Anatomy check is stale or failed'
 assert anatomy['playerSha256']==digest(app/'src/game/characterRigCore.ts'),'Player validation is stale'
 flow=json.loads((source/'cast/motion-flow-validation.json').read_text(encoding='utf-8'))
 assert flow['rigSha256']==digest(app/'src/game/characterRigData.json') and flow['playerSha256']==digest(app/'src/game/characterRigCore.ts'),'Flow validation is stale'
 report['validation']['motionFlow']=flow
 report['validation']['anatomy']={k:v for k,v in anatomy.items() if k not in ['clips','transitionFailures']}
 report['validation']['supersededReview']='V3 finite-vertex and limited frame checks missed visible limb inversions. V4 supersedes those character-appearance claims with all-mesh orientation, seam and 360 crossfade-pair checks per title, plus continuous visual review.'
 report['ui']='Larger localized Buy Bonus entry with a separate high-contrast caption: 21px desktop / 18px portrait, keyboard focus and a full button hit area. Opens the existing feature menu; disabled during play and hidden in features, replay and dialogs. Compact toolbar and shared Info/pay table retained.'
 report['backgrounds']+=' V5 strengthens clipped passing cloud/window illumination, sea UV displacement and depth-dependent moving wave crests; fixed architecture is preserved.'
 report['productionNotes'][1]='Backgrounds combine painted plates with local mesh/procedural motion; full separately painted depth layers are not included.'
 write(source/'delivery-status.json',report);write(app/'design/completion-progress.json',report);write(target/'delivery-status.json',report)
 shutil.copy2(logFile,target/'build-validation.log')
 shutil.copy2(source/'browser-validation.json',target/'browser-validation.json')
 shutil.copy2(source/'cast/anatomy-validation.json',target/'anatomy-validation.json')
 shutil.copy2(source/'cast/motion-flow-validation.json',target/'motion-flow-validation.json')
 for name in ['motion.gif','contact.png','all-actions.png']:
  review=source/'cast/motion-review'/name
  if review.exists():shutil.copy2(review,target/('character-'+name))
 for name in ['prizes.gif','prizes.png','validation.json']:shutil.copy2(source/'prize-motion'/name,target/('prize-'+name))
 frontend=archive(target/(slug+'_frontend.zip'),[(p,p.relative_to(build)) for p in build.rglob('*') if p.is_file()]);print(folder,'frontend',frontend['bytes'],flush=True)
 published=WORK/'math-sdk/games'/folder/'library/publish_files';mathPath=target/(slug+'_math.zip')
 if '--reuse-math' in sys.argv and mathPath.exists():
  prior=next(v for v in json.loads((target/'checksums.json').read_text()) if v['file']==mathPath.name)
  assert digest(mathPath)==prior['sha256'],'Previously verified math archive changed'
  math=prior
 else:math=archive(mathPath,[(p,p.relative_to(published)) for p in sorted(published.iterdir()) if p.is_file()])
 print(folder,'published math',math['bytes'],flush=True)
 entries=[(p,Path('wp/apps')/folder/p.relative_to(app)) for p in files(app)]
 entries += [(p,Path('wp/packages')/p.relative_to(WP/'packages')) for p in files(WP/'packages')]
 for name in ['package.json','pnpm-lock.yaml','pnpm-workspace.yaml','turbo.json']:
  p=WP/name
  if p.is_file():entries.append((p,Path('wp')/name))
 entries +=[(WP/'tools'/name,Path('wp/tools')/name) for name in TOOLS]
 srczip=archive(target/(slug+'_source.zip'),entries);print(folder,'editable source',srczip['bytes'],flush=True)
 text=f'''{folder} — 本機建置交付（2026-10-31）

{frontend['file']}：正式前端，解壓後的 index.html 與 assets 一起上傳。
{math['file']}：既有發佈數學檔，含 base / bonus / super；沒有重新模擬或修改結果。
{srczip['file']}：app 原始碼、共用工作區套件快照、PSD、Spine 4.3 編輯資料、分件、美術原始輸出／提示詞、音樂母帶與製作工具。

前端啟動沿用 Stake Engine 的 sessionID、rgs_url、lang、currency、device、social、replay 等參數。
成本 1 / 100 / 300 倍；RTP 96%；最高 10,000 倍。
開發測試用 fixture 與控制列已由正式版本排除。
只在現有 wp monorepo 使用共用套件；未改動共用套件行為。

建置：E:/stake/tools/node-v22.23.1-win-x64/corepack.cmd pnpm --dir E:/stake/wp/apps/{folder} build
美術由 built-in image_gen 生成，原始圖及提示詞在 design/source/{slug}/originals。
背景維持亮色場景，貓咪新增移動窗影、雲影與日光變化；鸚鵡海面使用局部 UV 波動與向岸流動的浪紋，地平線、船桅、欄杆固定。沒有另建展示或預覽網站。
角色使用 Spine 4.3；V6 在貓咪兩肩加入沿用外套美術的網格肩片，覆蓋袖根；保留手肘與袖口連續權重。兩款改用連續曲線與平滑混合；延長慶祝姿勢收回，避免重複反應重啟動作。鸚鵡抬翅穿過中間姿勢時保持連續。連續動態及全動作逐格圖在 cast/motion-review。
建置新增角色解剖檢查，逐幀檢查全部有畫面的網格與每款 360 組動作切換，並以 60Hz 檢查接縫周圍的重疊區域；貓咪額外檢查兩肩。V3 只檢查有限影格與頂點有效性，漏掉的翻面問題已由本輪檢查補足；詳見 anatomy-validation.json。
UI bar 已整理按鈕與金額資訊；Info／賠率表整合為同一視窗，支援手機捲動；直式角色移至盤面上方。
兩款 Buy Bonus 改用較大的完整點擊範圍及高對比獨立文字牌，桌面字級 21px、手機 18px；開啟既有選單。獎圖依物件使用不同的分件與網格動作，詳見 prize-motion。窗影、雲影、海面波動及浪紋均已加強，仍維持固定建築幾何。
角色聲音為原創非語言合成音。背景採繪製場景加局部網格及程式動畫，未包含完整繪製深度分層；角色服飾細節部分仍烘焙於身體圖。
已完成本機建置、事件合約、角色網格、動畫狀態與音訊峰值檢查。本輪桌面／手機瀏覽器及本機 fixture 檢查詳見 browser-validation.json；正式 RGS／Stake Engine 上傳驗證尚未進行。
完整狀態請看 delivery-status.json；壓縮檔雜湊請看 checksums.json。
'''
 (target/'DELIVERY.txt').write_text(text,encoding='utf-8');write(target/'checksums.json',[frontend,math,srczip]);reports.append({'project':folder,'folder':str(target),'artifacts':[frontend,math,srczip]})
write(OUT/'manifest.json',reports);print('Local delivery folder:',OUT,flush=True)

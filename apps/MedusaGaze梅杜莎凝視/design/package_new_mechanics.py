from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import json,hashlib,re
APP=Path(__file__).resolve().parent.parent;OUT=APP/'design/delivery';ROOT=APP/'design/source/medusagaze'
log=Path('E:/stake/tmp/medusa-new-mechanics-build-20261107.log').read_text(encoding='utf-8');assert 'adapter-static' in log and log.rstrip().endswith('Exit: 0')
types=Path('E:/stake/tmp/medusa-new-mechanics-types-20261107.log').read_text(encoding='utf-8');assert 'found 0 errors' in types
sha=hashlib.sha256((APP/'src/game/bookEventHandlerMap.ts').read_bytes()).hexdigest();assert sha=='a438dcda201673a0fbe0de19d765f7768fcc6061117cba7fe57a7a73240451a5'
note='''梅杜莎凝視 — 新機制美術／動畫／音效 — 2026-11-07

依 MEDUSA_新機制_Codex需求單.md 交付：
[x] st.png：灰色石塊、小蛇浮雕、青綠眼睛，512×512 RGBA。
[x] stone_crack_1～3.png：細裂、大裂、碎散，接入原有碎前搖晃時段。
[x] gaze_sweep.png：柔邊青綠掃光，僅石像自身演出，保留原事件時序。
[x] ladder_panel.png、snake_pip_on/off.png、ladder_lv1～4.png：正式貼圖與升階徽章接線。
[x] 五支原創合成音效：逐格石化、碎前搖晃、碎石揭露、蛇頭冒出、升階短樂句。
[x] 四張 720×1040 買入卡封面與接線：ante／petrify／bonus／super。
[x] 新封面操作卡專用遮罩與文字對比修正，保留價格及文案。
[x] 完整 production build；型別檢查 0 錯誤、1 個既有設定警告。
[ ] 選做 petrify_gaze 專屬骨架動作：沿用既有 gaze。
[ ] 選做讀取頁第四張說明：維持既有三張。

圖像：內建 imagegen，逐張附核准 style_ref；保留 RGBA、原稿與提詞。
來源：design/source/medusagaze/new-mechanics；提詞：design/new_mechanics_generations.json。
五支音訊為原創確定性合成，44.1kHz／16-bit／mono，附 48kHz／24-bit 母帶與可編輯 float 來源。
完整音訊庫 70 支，載入路徑、音量量測及檔頭靜音檢查通過。
本輪額外擴充掉落測試對 petrify／stoneReveal 的讀取，涵蓋真實新事件樣本。
未改動數學專案，bookEventHandlerMap.ts 的 SHA256 與開始前相同。
本機 mock 檢查非真實 RGS／金流驗證；無影片輸出。
最後視覺驗收尚未完成：Work 已停用本機瀏覽器控制，待複查蛇髮階梯升階、封面對比修正與手機排版。
新石化樣本已完成 $14.30 並返回待機；不將未完成的 UI 驗收標成通過。
'''
(OUT/'README_新機制_20261107.txt').write_text(note,encoding='utf-8')
manifest=[]
for name,folders in [('frontend',['build']),('sources',['src','static','design/source/medusagaze/new-mechanics'])]:
 target=OUT/f'MedusaGaze_{name}_20261107.zip'
 with ZipFile(target,'w',ZIP_DEFLATED,compresslevel=6) as z:
  for folder in folders:
   for p in sorted((APP/folder).rglob('*')):
    if p.is_file():z.write(p,p.relative_to(APP/'build' if name=='frontend' else APP).as_posix())
  if name=='sources':
   for p in (APP/'design').iterdir():
    if p.is_file() and p.suffix in ['.py','.mjs','.ts','.json']:z.write(p,p.relative_to(APP).as_posix())
   for folder in ['design/source/medusagaze/audio/new-mechanics-stems','design/source/medusagaze/audio/masters']:
    for p in (APP/folder).glob('*.wav'):
     if p.stem.startswith(('sfx_stone_','sfx_snake_grow','sfx_ladder_up')):z.write(p,p.relative_to(APP).as_posix())
   for n in ['package.json','svelte.config.js','vite.config.js','tsconfig.json']:z.write(APP/n,n)
   for n in ['audio_metadata.json','NEW_MECHANICS_AUDIO.json']:
    p=ROOT/'audio'/n;z.write(p,p.relative_to(APP).as_posix())
   for p in (ROOT/'_sheets').glob('new_mechanics*.png'):z.write(p,p.relative_to(APP).as_posix())
   for n in ['review.html','delivery-status.json']:
    p=ROOT/n;z.write(p,p.relative_to(APP).as_posix())
  z.writestr('README_新機制_20261107.txt',note)
 with ZipFile(target) as z:assert z.testzip() is None
 manifest.append({'file':target.name,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
(OUT/'new-mechanics-manifest-20261107.json').write_text(json.dumps({'archives':manifest,'protectedEventHandlerSha256':sha,'typeErrors':0,'typeWarnings':1},indent=2)+'\n',encoding='utf-8')
print(json.dumps(manifest,indent=2))

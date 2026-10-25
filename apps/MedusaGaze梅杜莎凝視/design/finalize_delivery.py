"""Package the verified app and its editable sources, without online publishing."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import json,re,hashlib

APP=Path(__file__).resolve().parent.parent;ROOT=APP/'design/source/medusagaze';OUT=APP/'design/delivery';OUT.mkdir(exist_ok=True)
buildlog=Path('E:/stake/tmp/medusa-completion-final-build-20261025.log').read_text(encoding='utf-8')
assert 'adapter-static' in buildlog and 'Exit: 1' not in buildlog and buildlog.rstrip().endswith('Exit: 0')
typelog=Path('E:/stake/tmp/medusa-completion-final-types-20261025.log').read_text(encoding='utf-8')
summary=re.search(r'svelte-check found (\d+) errors and (\d+) warnings in (\d+) files',typelog);assert summary
source_errors=[]
for block in re.split(r'\n(?=[A-Za-z]:\\)',typelog):
    if re.search(r'\\src\\(?:components|game)\\',block.split('\n',1)[0]) and re.search(r'\nError:',block):source_errors.append(block[:450])
assert not source_errors,source_errors
cast=json.loads((ROOT/'cast/spine43-validation.json').read_text(encoding='utf-8'));assert cast['passed'] and len(cast['clips'])==24
performance=json.loads((APP/'design/multiplier-performance-validation.json').read_text(encoding='utf-8'));assert performance['passed']
browser=json.loads((APP/'design/multiplier-browser-validation.json').read_text(encoding='utf-8'));assert browser['passed']
assets=(APP/'src/game/assets.ts').read_text(encoding='utf-8');verified=[]
for relative in re.findall(r"new URL\(\s*['\"]([^'\"]+)['\"]\s*,\s*import\.meta\.url",assets):
    relative=re.sub(r'^(?:\.\./)+','',relative);a=APP/'static'/relative;b=APP/'build'/relative
    assert a.is_file() and b.is_file(),relative
    assert a.read_bytes()==b.read_bytes(),relative
    verified.append(relative)
for name in ['medusa.json','medusa.atlas','medusa.png']:
    assert (APP/'static/assets/spines/medusa43'/name).read_bytes()==(APP/'build/assets/spines/medusa43'/name).read_bytes()

readme='''MEDUSA GAZE／梅杜莎凝視 — 2026-10-25 可交付版

遊戲建置：MedusaGaze_frontend_20261025.zip，ZIP 根目錄為 index.html、assets、_app、fonts、licenses。
美術與程式來源：MedusaGaze_sources_20261025.zip，保留 app 目錄結構；此遊戲仍使用現有 wp 工作區的共用套件。

本版完成
・10 張正式獎圖，以及得分、石化消除、碎片與重力掉落。
・梅杜莎分層 PSD（1024×2048，63 層）、關節資料、轉面、10 種表情與可編輯分件。
・Spine 4.3.13 原創骨架：74 骨、9 條各自五節骨骼的蛇髮、24 段動作。每條蛇獨立錯拍，沒有整頭髮一起晃。
・拉墨鏡、凝視、失敗倍率反應、小獎拇指、FG、各級大獎、蛇尾與待機動作；前臂遮擋與捏鏡框位置已檢查。
・招牌倍率演出 v3：雙眼獨立綁定瞳孔骨骼，聚焦、雙光束前緣、石化紋理、聚能寶珠、加速弧線、命中壓縮與原畫碎片。
・倍率數字維持正向；中央明示「原得分 × 倍率 = 加倍後得分」，結果停留後退場；FG 累積牌加上 TOTAL 標示。
・MG／FG 場景、慢雲、火焰、石像碎裂重組；盤框與鏡頭固定。
・正式盤框、按鈕、Buy Bonus 神盾、三色倍率球、三級累積牌、FG 牌、五級大獎牌與同款金章撒幣。
・三張說明插畫、字標、無字 16:9 封面、分層商店縮圖、favicon、12 格蛇環讀取動畫來源。
・57 支原創合成音樂／音效已接入，含神盾 hover、confirm 與蛇髮哈欠。角色語音是合成預聽，並非真人配音。
・13 支倍率音效重新製作：鏡框摩擦、綠光聚焦、沿飛行軌跡聲像移動的掠空聲、三級命中、石化碎裂與細緻跳數；附 48k/24bit 母帶及可編輯分軌。

Spine 編輯來源
design/source/medusagaze/cast/spine43_editor/medusa.json
images/ 是保留原畫尺寸的分件；匯入 Spine 4.3 後可繼續編輯。交付為 JSON 與圖像來源，不冒充原生 .spine 二進位專案。
遊戲使用 static/assets/spines/medusa43 的 JSON、atlas、2048×2048 貼圖，搭配本款自己的官方 4.3 core 渲染接線；共用 4.2 載入器未改動。

檢查結果
・package.json 的完整建置流程通過；正式 build 已更新。
・24 段動作經官方 4.3 core 重播，沒有可見網格翻面；握持位置與 MG／FG／減少動態切換通過。
・8 連消時序、63 種欄位消除形狀、255492 個已發布中獎位置的掉落驗證通過。
・本地 bonusBigTotal 跑完 15 次免費遊戲：累積 ×110，TOTAL WIN $198.90，按繼續可回 MG。
・1280×720、390×844、320×568 排版已檢查，驗收截圖位於 _sheets。
・商店縮圖 200px 曝光與透明前景檢查通過。
・完整 svelte-check 仍有工作區原有的工具／依賴／舊靜態來源錯誤；本款 src/components 與 src/game 本次修改沒有型別錯誤。數量見 delivery-status.json。

範圍
以上是本地離線／mock 驗證，未宣稱 Stake Engine 驗證。mock 的餘額換算不能作為金流驗證。上傳 Stake Engine、真實 RGS 與送審由使用者進行。
依使用者最後指示，不另外提供影片作為交付主體。

本機開發入口（使用 E 槽 Node 22）：
E:/stake/tools/node-v22.23.1-win-x64/node.exe node_modules/vite/bin/vite.js dev --host 127.0.0.1 --port 3045
本地 mock URL：http://127.0.0.1:3045/?mock=1&sessionID=dev&rgs_url=mock.local&currency=USD&device=desktop&book=baseThrow
本地檢查：design/build_local.mjs；角色檢查：design/check_medusa43.mjs。
倍率逐格檢視：design/source/medusagaze/multiplier/preview/index.html（透過本機 HTTP 開啟）。
倍率動態驗證：design/multiplier-performance-validation.json；音效量測：design/source/medusagaze/audio/MULTIPLIER_V2_SOUND_DESIGN.json。
重建音訊時先執行原始 generate_audio.py，再執行 audio/upgrade_multiplier.py 與 audio/build_preview.py，保留本版混音。
'''
(OUT/'README_交付說明.txt').write_text(readme,encoding='utf-8')
status=json.loads((ROOT/'delivery-status.json').read_text(encoding='utf-8'))
status.update({'date':'2026-10-25','stage':'complete_local_deliverable_pending_user_engine_upload','userRequestedVideo':False,
 'art':{'status':'production_art_integrated','symbols':10,'newUiAssets':27,'characterPSD':'cast/medusa.psd','editableLayers':63,'turnaround':'cast/medusa_turnaround.png','sourcePrompts':['completion-prompts-v2.json','completion-additions.json'],'cover':'ui/MedusaGaze_cover.jpg','tile':'ui/MedusaGaze_tile.jpg'},
 'animation':{'status':'original_spine43_integrated_and_locally_verified','spine':'4.3.13','bones':cast['bones'],'independentSnakeChains':9,'snakeBonesEach':5,'clips':24,'editor':'cast/spine43_editor/medusa.json','validation':'cast/spine43-validation.json','runtime':'static/assets/spines/medusa43','scope':'App-owned renderer; shared Spine 4.2 loader unchanged','noVisibleMeshFolds':True,'pinchContactVisualReview':True,'sceneCamera':'fixed','multiplierSignature':{'version':3,'eyeMarkers':2,'performanceValidation':'../../multiplier-performance-validation.json','review':'multiplier/preview/index.html','timing':'glasses contact, quiet hold, pupil focus, twin advancing beams, mineral veins, charged orb, curved flight, contact hold, result count and readable result hold','readout':'Upright orb multiplier, large central multiplier, base amount times multiplier equals final amount, labelled cumulative TOTAL plaque'}},
 'validation':{'fullBuild':'passed','buildLog':'E:/stake/tmp/medusa-completion-final-build-20261025.log','typeCheckLog':'E:/stake/tmp/medusa-completion-final-types-20261025.log','svelteCheckErrors':int(summary[1]),'svelteCheckWarnings':int(summary[2]),'svelteCheckProblemFiles':int(summary[3]),'changedGameSourceTypeErrors':0,'typeCheckBaseline':'Existing tools, shared dependencies and legacy static imports still fail full workspace check.','runtimePathsByteMatched':len(verified),'browser':'1280x720, 390x844, 320x568 local mock UI checked; 15-spin feature completed; total x110 / $198.90; returned to MG','screenshots':['_sheets/game_desktop.png','_sheets/game_mobile_320.png'],'devWatchdogNotes':'Two existing 15s watchdog messages occurred while deliberately holding click-to-continue FG panels; both continued normally.','engineVerification':'not_performed_user_will_upload'},
 'delivery':{'frontend':'../../delivery/MedusaGaze_frontend_20261025.zip','sources':'../../delivery/MedusaGaze_sources_20261025.zip','readme':'../../delivery/README_交付說明.txt'}})
status['audio']['notes']=['57 original synthesized audio files integrated.','Hover, confirm and snake-yawn event wiring complete.','Character vocal sounds remain synthetic preview, not professional human voice acting.']
status['audio']['status']='integrated_original_synthesis_voice_preview'
status['audio']['multiplierUpgrade']={'version':2,'cues':13,'spatialFlight':True,'masters':'48k PCM24','editableStems':'audio/multiplier-v2-stems','report':'audio/MULTIPLIER_V2_SOUND_DESIGN.json','runtimeBytes':json.loads((ROOT/'audio/audio_metadata.json').read_text(encoding='utf-8'))['runtime_bytes']}
status['validation']['multiplierBrowserReview']=browser
(ROOT/'delivery-status.json').write_text(json.dumps(status,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
inventory=[]
def archive_file(z,p,name):
    z.write(p,name);inventory.append({'path':name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
frontend=OUT/'MedusaGaze_frontend_20261025.zip'
with ZipFile(frontend,'w',ZIP_DEFLATED,compresslevel=6) as z:
    for p in sorted((APP/'build').rglob('*')):
        if p.is_file():archive_file(z,p,p.relative_to(APP/'build').as_posix())
source=OUT/'MedusaGaze_sources_20261025.zip'
with ZipFile(source,'w',ZIP_DEFLATED,compresslevel=6) as z:
    for folder in ['src','static','design/source/medusagaze']:
        for p in sorted((APP/folder).rglob('*')):
            if not p.is_file() or any(s in p.parts for s in ['__pycache__','legacy-placeholders']):continue
            if p.suffix.lower() in ['.zip','.webm','.mp4','.gif'] or 'rejected' in p.name:continue
            archive_file(z,p,p.relative_to(APP).as_posix())
    for p in sorted((APP/'design').iterdir()):
        if p.is_file() and p.suffix in ['.py','.mjs','.ts','.json']:archive_file(z,p,p.relative_to(APP).as_posix())
    for name in ['package.json','vite.config.js','svelte.config.js','tsconfig.json']:
        p=APP/name
        if p.exists():archive_file(z,p,name)
    z.writestr('README_交付說明.txt',readme)
for p in [frontend,source]:
    with ZipFile(p) as z:assert z.testzip() is None
report={'date':'2026-10-25','archives':[{'name':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [frontend,source]],'contents':inventory}
(OUT/'delivery-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'archives':report['archives'],'sourceTypeErrors':0,'existingWorkspaceTypeErrors':int(summary[1])},indent=2))

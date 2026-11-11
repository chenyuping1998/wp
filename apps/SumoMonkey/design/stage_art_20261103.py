"""Stage the verified review-art revision without restoring pruned assets."""
from pathlib import Path
import hashlib
import json
import shutil
import tarfile

APP = Path(__file__).resolve().parents[1]
ROOT = APP.parents[2]
U = ROOT/'upload/SumoMonkey'
QA = APP/'design/qa/art_20261103'
DELIVERY = ROOT/'角色生圖_相撲猴/交件/美術_20261103'
BACKUP = ROOT/'_upload_backups/SumoMonkey-before-art-20261103'
h = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
runtime=json.loads((QA/'runtime.json').read_text())
assert runtime['roundEnds']==2 and not runtime['errors'] and not runtime['httpErrors']
assert {4,5,6,7}.issubset(runtime['rows'])
assert '✔ done' in (QA/'build.log').read_text()
build=APP/'build'
assert (QA/'runtime.json').stat().st_mtime >= (build/'index.html').stat().st_mtime, 'Runtime evidence predates this build'
assert b'stub-data.js' not in (build/'index.html').read_bytes()
assert b'__SUMO_QA__' not in (build/'index.html').read_bytes()
report = '''# 相撲猴新美術驗收 — 2026-11-04

對應需求：ART_REQUEST_2026-11-03.md，B1–B4 全部實作。

- B1：1280×1280 木紋盤框、底邊草繩、上緣注連繩與四條紙垂；框內襯為低對比和紙。開口固定 x/y 140–1140（含），中心 alpha=0。框外界 64–1215，寬度維持原規格。
- B2：五張 512×512 毛筆 A/K/Q/J/10，獨立札形；最長邊佔 84%。程式已停止疊印預設字體，靜態、轉動、中獎共用同一套圖。
- B3：1600×600 主字標與 800×200 簡化字標，接上讀取、開場及遊戲兩側頁首。已修正桌機開場上緣及免費遊戲卡片遮住左上字標的問題。
- B4：三張 640×400 完整場景，下緣留紙面；10,000× 仍由程式排字。

素材由內建 ImageGen 製作；完整提示詞、原始圖、最終 sRGB RGBA PNG 位於交件資料夾。匯出程式僅做尺寸、框開口九宮格對齊與透明雜點清理。逐張亮／暗底證據及 96px 小圖聯絡表見本資料夾。

最終正式 build 的本機 Chrome 實測：一個 BASE collect 回合、一個 BONUS level3 真實 book 全程播完，各收到 wallet/end-round；觀察盤面 4→5→6→7，桌機 1440×810、直式 390×844 都有實際盤面截圖，另測 400×225 小視窗。程式錯誤 0、HTTP 錯誤 0。正式 build 與 upload 不含 stub 或 QA hook；本機測試殼有假 RGS，這不是線上 RGS 驗證。

建置、198 項素材及 sprite keys、39 音效、社群文字、reel motion、symbol idle guards 通過；型別檢查維持既有 13 項基線，沒有新增錯誤。角色 bakes／定位與本次開工備份相同；角色來源及 runtime 裁圖沒有修改。

12 張交件圖、static、build、upload 的 SHA-256 一致。數學、縮圖及封面維持原檔案；沒有新的縮圖／封面需求。本次僅更新本機 upload/SumoMonkey，未上傳、發布平台或重新送審。
'''
(QA/'驗收報告.md').write_text(report)
baseline=json.loads((BACKUP/'baseline.json').read_text())
assert all(h(U/n)==v for n,v in baseline.items())
backup=BACKUP/'frontend.tgz'
if not backup.exists():
    with tarfile.open(backup,'w:gz') as t:t.add(U/'frontend',arcname='frontend')
changed=[]
for p in build.rglob('*'):
    if not p.is_file():continue
    n=p.relative_to(build);dest=U/'frontend'/n
    if not dest.exists() or h(dest)!=h(p):
        dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest);changed.append(str(n))
# Remove only obsolete hashed code, not any staging-only artwork.
removed=[]
for p in (U/'frontend/_app/immutable').rglob('*'):
    if p.is_file() and not (build/p.relative_to(U/'frontend')).exists():
        removed.append(str(p.relative_to(U/'frontend')));p.unlink()
assert all(h(p)==h(U/'frontend'/p.relative_to(build)) for p in build.rglob('*') if p.is_file())
assert all(h(U/n)==v for n,v in baseline.items())
for name,info in json.loads((QA/'asset-manifest.json').read_text()).items():
    assert h(DELIVERY/(name+'.png'))==info['sha256']
    folder='sumoFrame' if name.startswith('frame_') else 'sumoV8' if name.startswith(('logo','intro')) else 'sumoSymbols'
    assert h(U/'frontend/assets/sprites'/folder/(name+'.png'))==info['sha256']
dest=U/'art-source/review-art-20261103'
shutil.copytree(DELIVERY,dest/'delivery',dirs_exist_ok=True)
shutil.copytree(QA,dest/'qa',dirs_exist_ok=True)
for name in ['export_review_art_20261103.py','stage_art_20261103.py','qa_art_20261103.cjs','sumo_prepare_local_qa.py','ART_REQUEST_2026-11-03.md']:
    shutil.copy2(APP/'design'/name,dest/name)
for name in ['components/LoadingScreen.svelte','components/FeatureIntro.svelte','components/Game.svelte','components/GameNameClock.svelte','components/Symbol.svelte','game/assets.ts']:
    target=dest/'source/src'/name
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(APP/'src'/name,target)
shutil.copy2(APP/'HANDOFF.md',dest/'HANDOFF.md')
result={'changed':changed,'removed':removed,'math_thumbnail_cover_unchanged':True,'platform_updated':False}
(QA/'staging.json').write_text(json.dumps(result,indent=2))
shutil.copy2(QA/'staging.json',dest/'qa/staging.json')
print(json.dumps(result,indent=2))

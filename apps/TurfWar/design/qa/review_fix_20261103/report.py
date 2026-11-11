from pathlib import Path
import json,hashlib,html
from PIL import Image,ImageDraw,ImageFont
D=Path(__file__).resolve().parent;A=D.parents[2];R=A.parents[2];preview=R/'dist/turfwar-review-20261103'
source=json.loads((D/'final-source-sha256.json').read_text());assert all(hashlib.sha256((A/p).read_bytes()).hexdigest()==v for p,v in source.items()),'Source changed after tested build'
manifest={str(p.relative_to(A/'build')):hashlib.sha256(p.read_bytes()).hexdigest() for p in (A/'build').rglob('*') if p.is_file()}
assert all(hashlib.sha256((preview/p).read_bytes()).hexdigest()==v for p,v in manifest.items() if p!='index.html'),'Preview does not match production assets'
(D/'final-build-sha256.json').write_text(json.dumps(manifest,indent=2))
ui=json.loads((D/'ui-report.json').read_text());sync=json.loads((D/'multiplier-sync.json').read_text())
reports=[json.loads(p.read_text()) for p in [D/'after-390-report.json',D/'after-1280-report.json'] if p.exists()]
for r in reports:
 assert all(x['complete'] and not x['errors'] for x in r['rounds']);assert not r['consoleErrors'] and not r['networkErrors'];assert r['mix']['clipped']==0
# Contact sheet uses the final rendered image, not the provisional draft.
font=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',22)
canvas=Image.new('RGB',(804,894),'#17191c');draw=ImageDraw.Draw(canvas)
for i,(name,label) in enumerate([('before-390-idle.png','BEFORE'),('final-390x844.png','AFTER')]):
 canvas.paste(Image.open(D/name).convert('RGB'),(8+i*398,42));draw.text((14+i*398,10),label,font=font,fill='#f7f5f0')
canvas.save(D/'mobile-before-after.png')
rows=''.join(f'<tr><td>{r["viewport"]["w"]}×{r["viewport"]["h"]}</td><td>{x["id"]}</td><td>{x["duration"]/1000:.1f}s</td><td>{"PASS" if x["complete"] else "FAIL"}</td></tr>' for r in reports for x in r['rounds'])
summary={
 'platform_updated':False,'upload_package_updated':False,'math_changed':False,
 'scope':['Turf app-local portrait console','4 native stencil glyphs +4 native control plates','boombox scatter waves','frame entry weighting and value-impact audio','BGM crossfade and shared mix dynamics'],
 'full_volume_stress':ui['fullVolumeMix'],'mute':ui['mutedMix'],
 'replay': {'book':64,'complete':True,'wallet_rounds':json.loads((D/'replay-report.json').read_text())['stats']['rounds']},
 'multiplier_sync':[{'type':x['type'],'first_value_ms':x['firstShown'],'first_cue_ms':x['firstCue']} for x in sync],
 'gameplay':[{'viewport':r['viewport'],'books':[x['id'] for x in r['rounds']],'complete':all(x['complete'] for x in r['rounds']),'mix':r['mix'],'errors':r['consoleErrors'],'network_errors':r['networkErrors']} for r in reports],
 'limits':['Local published-book fixtures, not a live player RGS session','Chrome touch/viewport emulation, not physical iOS/Android hardware','No claim of reviewer approval or subjective audio acceptance','4 intentional flat-fill warnings retained: board ground, typography logo, sticky marker, spin plate']}
(D/'SUMMARY.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
(D/'report.html').write_text(f'''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>Turf War 改善與驗證</title><style>body{{background:#17191c;color:#f7f5f0;font:16px/1.6 system-ui;margin:30px auto;max-width:1120px;padding:0 20px}}h1,h2{{color:#ffc38a}}img{{max-width:100%}}video{{max-width:100%;max-height:650px}}table{{border-collapse:collapse;width:100%}}td,th{{padding:7px;border-bottom:1px solid #555}}a{{color:#ffc38a}}pre{{white-space:pre-wrap;background:#2b2e33;padding:18px}}</style>
<h1>Turf War｜審查回饋改善</h1><p>2026-11-03。本機修正版；未更新 upload 包、未上傳或重新送審，數學與角色素材不變。</p>
<h2>修改內容</h2><ul><li>手機改為整合操作區，餘額／贏分並列，下注與主要旋轉靠近；整塊下注區可觸控開選單。桌機與 replay 沿用原有版面。</li><li>四顆低賠符號保留原註冊與輪廓，改用多層原生筆觸；四款按鈕加入刻線與明暗邊緣。來源：design/build_review_glyphs.py。</li><li>音響 Scatter 金色通用星芒換為左右喇叭波紋與音量條；Frame 動態與靜態使用相同尺寸權重，等待其實際到位。</li><li>更新／加倍音效移到數字換值的落點。BGM 換曲交叉淡化 360ms；聽牌循環加入80ms起音、100ms收音，移除舊播放器無效的淡入呼叫。</li><li>Wild 同時落地的相同和弦去重，所有 Turf 音源共用壓縮與餘裕；重疊不再未經控制地加到輸出。</li></ul>
<h2>手機前後比較</h2><img src="mobile-before-after.png" alt="相同初始盤面的前後比較">
<h2>實播驗證</h2><p>真實 fixture books，正常手機與桌機 Turbo；包含一般中獎、Bruiser、Big Score、Lookout、Muscle、Kingpin 完整進出。這不是平台真實玩家連線或實體手機驗證。</p><table><tr><th>Viewport</th><th>Book</th><th>時間</th><th>結束</th></tr>{rows}</table>
<h2>量測</h2><pre>{html.escape(json.dumps(summary,ensure_ascii=False,indent=2))}</pre>
<p>型別 0 errors / 0 warnings；完整 build 與 guard 通過。320×568、390×844、640×420、1280×720 無頁面捲動與執行例外；觸控選 $2 並以 $2 開局；社交模式金額選單無 BET 用語。靜音測得0輸出。倍數換值與聲音在同一個8ms取樣窗。手機 replay book64 完成至 finalWin，wallet rounds=0。</p>
<p>素材掃描仍有4個低色數警告，分別是盤面底色、文字Logo、sticky記號、spin plate；保留清楚的底色與形狀，沒有加雜訊去消除警告。這項檢查不代表人工審核結果。</p>
<h2>最終回放影音</h2><video src="after-390-gameplay.webm" controls></video><video src="after-1280-gameplay.webm" controls></video><p><a href="before-390-gameplay.webm">原版同盤面中獎／Lookout</a> · <a href="mix-full-volume-and-mute.webm">滿音量重疊與即時靜音</a></p>
<p>完整資料：ui-report.json、multiplier-sync.json、after-390-report.json、after-1280-report.json、final-source-sha256.json、final-build-sha256.json。preview 的正式資產逐檔與 build 比對相同；stub 只注入 dist 的 index。</p></html>''')
print(json.dumps(summary,ensure_ascii=False,indent=2))

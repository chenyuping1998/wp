"""Record the locally verified temple UI revision before packaging."""
from pathlib import Path
import json

APP=Path(__file__).resolve().parent.parent
ROOT=APP/'design/source/medusagaze'
report=json.loads((APP/'design/temple-ui-browser-validation.json').read_text(encoding='utf-8'))
for name in report['screenshots']:
    assert (APP/'design'/name).is_file(),name
progress_path=APP/'design/completion-progress.json'
progress=json.loads(progress_path.read_text(encoding='utf-8'))
progress['revision']=report['revision']
progress['templeInterfaceRefinement']=report
progress['validation']='Full production build passed; svelte-check 0 errors / 1 existing tsconfig warning. Greek INFO/paytable checked at desktop, 390 and 320px; BET/AUTO selection and local mock round verified.'
progress['audio']='65 original synthesized files; Spine gesture events retained. Quiet interface cues and normalized one-to-three orb wind voices. Character vocals remain synthetic.'
progress_path.write_text(json.dumps(progress,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

page=ROOT/'review.html'
html=page.read_text(encoding='utf-8')
panel='''<section id="temple-ui"><h2>希臘神殿 INFO、操作列與音效節奏 · 2026-10-31</h2><p>參考高爾夫說明的封面、章節索引與三步圖解結構，轉成青綠、金邊與大理石的希臘神殿。遊戲說明與賠付表在同一視窗互切，提供章節跳轉、叉號關閉、Escape 與鍵盤焦點限制。手機叉號 44px，賠付以固定三欄清楚列出數量與 ×數，320px 也能完整顯示 100×。</p><p>操作列改用較清楚的數字字體，降低數值彈跳；點選、開啟、切頁與關閉有較輕的提示。多顆倍率球共用飛行風聲增益預算，避免疊加過響，保留人物出手與重擊的層次。三種 TURBO 的人物與倍率演出使用相同時序。</p><nav><a href="http://127.0.0.1:3045/?mock=1&amp;sessionID=dev&amp;rgs_url=mock.local&amp;currency=USD&amp;device=desktop&amp;book=baseThrow">開啟本地遊戲</a><a href="../../temple-ui-browser-validation.json">本輪驗收紀錄</a><a href="multiplier/preview/index.html?revision=9d847e68e381">倍率聲畫檢視</a></nav><p>完整建置通過；型別檢查 0 錯誤、1 個既有設定警告。桌面、390／320px 排版、BET／AUTO 選中反饋與本地倍率回放已檢查。本輪未重跑先前的 15 次免費遊戲，角色發聲仍為原創合成。無影片輸出。</p><img src="_sheets/temple_ui_20261031_guide_desktop.png" alt="希臘神殿風格 INFO 封面與章節導覽"><img src="_sheets/temple_ui_20261031_paytable_desktop.png" alt="桌面固定三欄獎圖賠付表"><div class="screens"><img src="_sheets/temple_ui_20261031_bet_selected.png" alt="BET 金色選中狀態"><img src="_sheets/temple_ui_20261031_paytable_320.png" alt="320px 手機清楚顯示 100× 與賠付數字"></div></section>'''
if '<section id="temple-ui">' not in html:
    html=html.replace('<section id="character-sound-v9">',panel+'<section id="character-sound-v9">',1)
html=html.replace('revision=fa22aa9ef9de','revision=9d847e68e381')
page.write_text(html,encoding='utf-8')
print('Temple UI review, progress and screenshot inventory updated.')

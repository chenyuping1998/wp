"""Record the user's nine requested refinements in the editable handoff."""
from pathlib import Path
import json
APP=Path(__file__).resolve().parent.parent
ROOT=APP/'design/source/medusagaze'
browser=json.loads((APP/'design/refinement-browser-validation.json').read_text(encoding='utf-8'))
assert browser['passed']
notes='''九項體驗修正 · 2026-10-26
1. INFO 與各選單加入高對比圓形叉號，已驗證點擊關閉。
2. BET／AUTO 選項亮金色、顯示勾號；保留伺服器金額與可負擔檢查。
3. 設定與選單數字調整對比；手機淺色石板採深墨色讀數。
4. 獎圖先下壓蓄力、跳起、回位，再石化與裂開；碎片向外散開。破碎播放增益提高 15%。
5. 六秒全身呼吸加強，胸腹、腰部、尾節、裙片與飾鏈分層跟隨；接地錨點固定。九條蛇的五節骨骼皆活動，每條有獨立後縮、前探咬擊、回收動作。
6. BUY BONUS 文字收回盾牌淺色區，與盾牌一起接受懸停縮放。
7. 日夜火焰、飄葉、光點、飛鳥與慢雲；鏡頭和建築固定。
8. BET 懸停時有金色標題、箭頭與整格底色反饋。
9. 每次倍率球出手前有一次原創合成的非語言施法發聲；不是新增真人配音。三種速度的角色／倍率／音效時序保持一致。

本地 mock 已回放，未宣稱 Stake Engine 驗證；未產出新影片。
'''
(ROOT/'REFINEMENT_20261026.txt').write_text(notes,encoding='utf-8')
p=ROOT/'review.html';s=p.read_text(encoding='utf-8')
if 'id="nine-refinements"' not in s:
    section='<section id="nine-refinements"><h2>九項體驗修正 · 2026-10-26</h2><p>INFO 叉號、BET／AUTO 金色選取、數字對比與手機深色讀數、先跳動再石化碎裂、破碎增益 +15%、全身呼吸及九條蛇的威嚇咬擊、盾牌內文字、日間火焰與花園風動、BET 懸停反饋、倍率出手發聲。</p><nav><a href="REFINEMENT_20261026.txt">修正明細</a><a href="motion/review.html">跳動與石化逐格檢視</a><a href="cast/preview/index.html">全身呼吸與九條蛇</a></nav><img src="_sheets/refinement_bet_selected.png" alt="金色 BET 選取與清楚的關閉叉號"><p>手機石板讀數改為深墨色；角色接地錨點固定，胸腹、腰尾及九條蛇分層活動。出手發聲為既有原創合成素材。</p></section>'
    s=s.replace('<section>',section+'<section>',1)
    p.write_text(s,encoding='utf-8')
p=ROOT/'delivery-status.json';d=json.loads(p.read_text(encoding='utf-8'));d['ninePointRefinement']=browser;d['revision']='20261026-nine-point-refinement';p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=APP/'design/completion-progress.json';d=json.loads(p.read_text(encoding='utf-8'));d['ninePointRefinement']={'status':'complete_locally_verified','report':'refinement-browser-validation.json','items':9};p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Updated nine-point refinement notes, review and handoff records.')

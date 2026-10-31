"""Record the requested statue, toolbar and idle corrections in the handoff."""
from pathlib import Path
import json
APP=Path(__file__).resolve().parent.parent
ROOT=APP/'design/source/medusagaze'
for relative in ['design/build_local.mjs','design/finalize_delivery.py','design/source/medusagaze/review.html']:
    p=APP/relative
    text=p.read_text(encoding='utf-8').replace('20261025','20261026').replace('2026-10-25','2026-10-26')
    if relative.endswith('finalize_delivery.py'):
        if '本次版面修正' not in text:
            text=text.replace('本版完成\n','本次版面修正\n・兩側石像依目前梅杜莎高度的 1/5 顯示，隨畫面比例調整，腳底保持在操作列上方。\n・操作列加高、文字留出上下邊距；TURBO 採深藍描邊／實心與雙閃電三級狀態。\n・MG／FG 六秒呼吸循環：胸腹擴張、肩頸延遲與九條蛇髮的輕微跟隨；骨盆與盤框不浮動。\n\n本版完成\n')
    if relative.endswith('review.html') and '操作列與待機修正' not in text:
        text=text.replace('<section><h2>倍率招牌演出 v3','<section><h2>操作列與待機修正 · 2026-10-26</h2><p>左右石像縮為梅杜莎高度的 1/5；底部操作列加高並改善文字邊距、TURBO 三級狀態對比。角色加入胸腹呼吸與肩頸、蛇髮延遲，骨盆固定。</p><img src="_sheets/presentation_20261026_desktop.png" alt="石像比例與操作列修正版"></section><section><h2>倍率招牌演出 v3')
    if relative.endswith('review.html'):
        text=text.replace('_sheets/game_desktop.png','_sheets/presentation_20261026_desktop.png').replace('_sheets/game_mobile_320.png','_sheets/presentation_20261026_mobile320.png')
    p.write_text(text,encoding='utf-8')
p=APP/'design/completion-progress.json';progress=json.loads(p.read_text(encoding='utf-8'))
progress['date']='2026-10-26'
progress['presentationCorrection']={'statueToMedusaHeight':.2,'toolbarHeight':210,'darkInkControlGlyphs':10,'turbo':'High-contrast outline, solid single bolt, solid double bolt','idle':'Six-second ribcage breath in MG and FG; grounded hips; delayed shoulders, neck and nine snakes','validation':'design/presentation-validation.json'}
p.write_text(json.dumps(progress,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Updated dated build log, delivery filenames, review and completion record.')

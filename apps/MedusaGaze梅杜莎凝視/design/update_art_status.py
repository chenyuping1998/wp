"""Keep local art review and delivery evidence in sync with installed symbols."""
from pathlib import Path
import json
from zipfile import ZipFile, ZIP_DEFLATED

app = Path(__file__).resolve().parent.parent
root = app / 'design/source/medusagaze'
symbols = root / 'symbols'
status_file = root / 'delivery-status.json'
status = json.loads(status_file.read_text(encoding='utf-8'))
status['stage'] = 'approved_style_production_symbols'
status['art'].update({
    'status': 'style_approved_ten_production_symbols_installed',
    'approvalEvidence': '使用者：風格樣張沒問題；獎圖要做的精緻一點達到專業美術師的程度，像樣張那樣；繼續處理，獎圖要像樣張那樣子。',
    'styleReference': 'style_ref.png', 'productionSpritesInstalled': ['s','h1','h2','h3','h4','h5','l1','l2','l3','l4'],
    'symbolReview': 'symbols/review.html', 'symbolManifest': 'symbols/manifest.json',
    'symbolContactSheet': '_sheets/symbols_v2_contact.jpg', 'symbolDownload': 'symbols/MedusaGaze_symbols_v2.zip',
    'next': ['高分獎圖完整獨立分件演技與遮擋補畫', '製作1024×2048人物混搭全身樣張',
             '人物轉面、表情、每條蛇獨立分件、關節資料及Spine 4.3骨架',
             '寶珠、特效、背景分層、盤框零件、UI、說明插畫、字標與封面']})
status['motionV2'].update({'referenceTitle': 'Gates of Olympus / 奧林匹斯之門 (Pragmatic Play)',
    'referenceSource': 'https://www.pragmaticplay.com/en/games/gates-of-olympus/',
    'art': 'ten_approved_style_production_symbols',
    'guides': 'Remeasured from generated 1254px source art, normalized using symbols/manifest.json.',
    'previousStandInVideo': 'motion/MedusaGaze_motion_v2.webm',
    'video': 'motion/MedusaGaze_symbols_v2_motion.webm',
    'contactSheet': '_sheets/symbols_v2_motion_contact.jpg',
    'recordingSeconds': None})
status['animation']['rigRuntime'] = 'Target Spine 4.3 for this new game, explicitly authorized by user. App-local 4.3 integration and character replay still pending; shared 4.2 runtime untouched.'
status['animation']['snakeHair'] = 'Every front snake requires its own body/head layers and independently staggered bone chains; no single whole-hair wobble.'
status['validation']['build'] = 'production_symbols_build_pending'
status_file.write_text(json.dumps(status, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

review = root / 'review.html'
text = review.read_text(encoding='utf-8')
text = text.replace('風格樣張待確認', '風格已核准・精緻獎圖已接入')
text = text.replace('<p><a href="motion/review.html">', '<p><a href="symbols/review.html">觀看 10 款精緻獎圖與下載 PNG →</a></p>\n<p><a href="motion/review.html">') if '觀看 10 款精緻獎圖' not in text else text
text = text.replace('此張為風格概念圖；正式遊戲仍使用原有佔位圖。', '此張為已核准的風格概念圖；10款獎圖已換成同方向正式素材，人物、背景與介面仍分批製作。')
text = text.replace('這次需要確認的方向', '已核准的風格方向')
text = text.replace('最需要確認：臉部卡通感與華麗身體的反差，是否符合你要的喜劇女王。', '使用者已確認整體風格。人物後續以每條蛇獨立活動、金框墨鏡可拉下的結構製作。')
text = text.replace('已製作・待核准', '使用者已核准')
text = text.replace('整體風格確認後', '下一階段製作')
text = text.replace('圖案、背景、UI、封面', '10款獎圖 / 其他場景與介面')
text = text.replace('風格核准後量產', '獎圖已完成・其他製作中')
text = text.replace('遊戲 Spine runtime 為 4.2.74，正式人物骨架以 4.2 相容匯出。現有 4.3 kit 不能直接套入；目前人物姿勢圖仍是佔位素材。', '使用者已允許使用 Spine 4.3。本新遊戲的人物採專用三分之四視角蛇尾模板，每條蛇獨立分件與骨鏈；4.3執行環境限本 app 接入並重播驗證。人物目前仍為佔位素材。')
text = text.replace('美術需求單第 1 節：「使用者核准後才進入第 2 節之後的量產。」本頁不將樣張視為已核准。', '整體風格已由使用者核准。人物全身混搭樣張依需求單第2-10節另行檢視，符號量產已進行。')
review.write_text(text, encoding='utf-8')

motion = root / 'motion/review.html'
text = motion.read_text(encoding='utf-8')
text = text.replace('使用現有佔位圖的離線動作預演。盤面取自真實數學書；動作曲線與遊戲程式共用。正式美術、人物 Spine 與 Stake Engine 實機另行驗收。', '已使用10款樣張風格精緻獎圖。盤面取自真實數學書；動作曲線與遊戲程式共用。完整分件演技、人物 Spine 4.3 與 Stake Engine 實機另行驗收。')
text = text.replace('MedusaGaze_motion_v2.webm', 'MedusaGaze_symbols_v2_motion.webm')
text = text.replace('_sheets/motion_v2_contact.jpg', '_sheets/symbols_v2_motion_contact.jpg')
text = text.replace('頭盔・驚眼眨眼', '頭盔・凸眼反應')
text = text.replace('載入佔位圖與連消資料', '載入精緻獎圖與連消資料')
text = text.replace('離線預演・佔位美術', '離線預演・精緻獎圖')
text = text.replace('參考方向依你的「Hacksaw 奧林匹斯」描述；確切遊戲版本仍待確認。本版為原創動作調整，未套用競品圖像、骨架或關鍵幀。', '參考方向已確認為 <a href="https://www.pragmaticplay.com/en/games/gates-of-olympus/" target="_blank" rel="noreferrer">Pragmatic Play《奧林匹斯之門》</a>的中獎消除與補位節奏。本版動作為原創，仍保留本款石化碎裂特色。')
text = text.replace('const n=8,point=', 'const n=12,point=')
motion.write_text(text, encoding='utf-8')

assets = app / 'src/game/assets.ts'
text = assets.read_text(encoding='utf-8')
old = '// Every sprite under assets/sprites/medusa* is drawn by\n// design/generate_placeholders.py until the commissioned art arrives; delivered\n// art overwrites the same files at the same sizes, so nothing here changes.'
text = text.replace(old, '// medusaSymbols: approved-style image_gen artwork, 512px RGBA (2026-10-24).\n// Other medusa* sprite groups retain stand-ins until individually replaced.')
assets.write_text(text, encoding='utf-8')

with ZipFile(symbols / 'MedusaGaze_symbols_v2.zip', 'w', ZIP_DEFLATED) as z:
    for key in ['s','h1','h2','h3','h4','h5','l1','l2','l3','l4']:
        z.write(symbols / f'{key}.png', f'symbols/{key}.png')
    for name in ['SYMBOL_PROMPTS.md', 'manifest.json']:
        z.write(symbols / name, name)
    z.write(root / '_sheets/symbols_v2_contact.jpg', 'symbols_v2_contact.jpg')
print('Art review, runtime provenance, delivery state and symbol ZIP synchronized.')

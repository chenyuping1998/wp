"""Package the verified app and its editable sources, without online publishing."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import json,re,hashlib

APP=Path(__file__).resolve().parent.parent;ROOT=APP/'design/source/medusagaze';OUT=APP/'design/delivery';OUT.mkdir(exist_ok=True)
buildlog=Path('E:/stake/tmp/medusa-orb-power-build-20261031.log').read_text(encoding='utf-8')
assert 'adapter-static' in buildlog and 'Exit: 1' not in buildlog and buildlog.rstrip().endswith('Exit: 0')
typelog=Path('E:/stake/tmp/medusa-orb-power-types-20261031.log').read_text(encoding='utf-8')
summary=re.search(r'svelte-check found (\d+) errors? and (\d+) warnings? in (\d+) files?',typelog);assert summary
source_errors=[]
for block in re.split(r'\n(?=[A-Za-z]:\\)',typelog):
    if re.search(r'\\src\\(?:components|game)\\',block.split('\n',1)[0]) and re.search(r'\nError:',block):source_errors.append(block[:450])
assert not source_errors,source_errors
cast=json.loads((ROOT/'cast/spine43-validation.json').read_text(encoding='utf-8'));assert cast['passed'] and len(cast['clips'])==24
performance=json.loads((APP/'design/multiplier-performance-validation.json').read_text(encoding='utf-8'));assert performance['passed']
browser=json.loads((APP/'design/multiplier-browser-validation.json').read_text(encoding='utf-8'));assert browser['passed']
presentation=json.loads((APP/'design/presentation-validation.json').read_text(encoding='utf-8'));assert presentation['passed']
presentation_browser=json.loads((APP/'design/presentation-browser-validation.json').read_text(encoding='utf-8'));assert presentation_browser['passed']
refinement=json.loads((APP/'design/refinement-browser-validation.json').read_text(encoding='utf-8'));assert refinement['passed']
revision=json.loads((APP/'design/revision5-browser-validation.json').read_text(encoding='utf-8'));assert revision['passed']
revision6=json.loads((APP/'design/revision6-browser-validation.json').read_text(encoding='utf-8'));assert revision6['passed']
sky=json.loads((APP/'design/left-sky-browser-validation.json').read_text(encoding='utf-8'));assert sky['passed']
polish=json.loads((APP/'design/character-symbol-polish-validation.json').read_text(encoding='utf-8'));assert polish['passed']
fluency=json.loads((APP/'design/fluency-browser-validation.json').read_text(encoding='utf-8'));assert fluency['passed']
fluency_native=json.loads((ROOT/'cast/fluency-validation.json').read_text(encoding='utf-8'));assert fluency_native['passed']
pp=json.loads((APP/'design/pp-motion-browser-validation.json').read_text(encoding='utf-8'));assert pp['passed']
pp_native=json.loads((APP/'design/pp-motion-validation.json').read_text(encoding='utf-8'));assert pp_native['passed']
character_sound=json.loads((APP/'design/character-sound-browser-validation.json').read_text(encoding='utf-8'));assert character_sound['passed']
character_native=json.loads((APP/'design/character-sound-validation.json').read_text(encoding='utf-8'));assert character_native['passed']
temple_ui=json.loads((APP/'design/temple-ui-browser-validation.json').read_text(encoding='utf-8'));assert temple_ui['passed']
orb_power=json.loads((APP/'design/orb-power-browser-validation.json').read_text(encoding='utf-8'));assert orb_power['passed']
tour=json.loads((APP/'design/overall-refine-browser-validation.json').read_text(encoding='utf-8'));assert tour['passed']
hand=json.loads((APP/'design/hand-windup-browser-validation.json').read_text(encoding='utf-8'));assert hand['passed']
hand_native=json.loads((ROOT/'cast/hand-anticipation-validation.json').read_text(encoding='utf-8'));assert hand_native['passed']
casting8=json.loads((APP/'design/casting-v8-browser-validation.json').read_text(encoding='utf-8'));assert casting8['passed']
casting_audio=json.loads((ROOT/'audio/CASTING_V8_SOUND_DESIGN.json').read_text(encoding='utf-8'));assert casting_audio['version']==8
snake=json.loads((APP/'design/snake-presence-browser-validation.json').read_text(encoding='utf-8'));assert snake['passed']
snake_native=json.loads((ROOT/'cast/snake-presence-validation.json').read_text(encoding='utf-8'));assert snake_native['passed']
casting=json.loads((APP/'design/casting-v7-browser-validation.json').read_text(encoding='utf-8'));assert casting['passed']
landing=json.loads((APP/'design/landing-impact-browser-validation.json').read_text(encoding='utf-8'));assert landing['passed']
overall=json.loads((APP/'design/overall-dynamics-browser-validation.json').read_text(encoding='utf-8'));assert overall['passed']
motion=json.loads((APP/'design/motion-validation.json').read_text(encoding='utf-8'));assert motion['fracturePieces']==8 and motion['directionalStone']
assets=(APP/'src/game/assets.ts').read_text(encoding='utf-8');verified=[]
for relative in re.findall(r"new URL\(\s*['\"]([^'\"]+)['\"]\s*,\s*import\.meta\.url",assets):
    relative=re.sub(r'^(?:\.\./)+','',relative);a=APP/'static'/relative;b=APP/'build'/relative
    assert a.is_file() and b.is_file(),relative
    assert a.read_bytes()==b.read_bytes(),relative
    verified.append(relative)
for name in ['medusa.json','medusa.atlas','medusa.png']:
    assert (APP/'static/assets/spines/medusa43'/name).read_bytes()==(APP/'build/assets/spines/medusa43'/name).read_bytes()
audio_metadata=json.loads((ROOT/'audio/audio_metadata.json').read_text(encoding='utf-8'))
for item in audio_metadata['files']:
    assert (APP/'static/assets/audio/medusa'/item['file']).read_bytes()==(APP/'build/assets/audio/medusa'/item['file']).read_bytes(),item['file']

readme='''MEDUSA GAZE／梅杜莎凝視 — 2026-10-31 可交付版

遊戲建置：MedusaGaze_frontend_20261031.zip，ZIP 根目錄為 index.html、assets、_app、fonts、licenses。
美術與程式來源：MedusaGaze_sources_20261031.zip，保留 app 目錄結構；此遊戲仍使用現有 wp 工作區的共用套件。

倍率球由低倍至高倍的漸層（2026-10-31）
・2×～500× 十一種倍率使用平順的強度曲線，光色由翡翠、青綠、紫光過渡到金色與淡金。
・球體、凝聚光點、飛行尾流與出手光環隨倍率增加；250×／500× 另有金色火冠與環繞的希臘刻紋。
・高倍命中分三層錯時擴散衝擊波，兩側有金光釋放，固定鏡頭與盤框不晃動。
・晶石命中音色採平順混合，蓄力、出手與風壓也隨倍率增強；多球風聲仍共享音量預算。
・人物、350ms 聚球、600ms 飛行與三種 TURBO 的聲畫時序維持；九蛇、全身呼吸與 FG 額頭墨鏡保留。
・新增 2×／25×／100×／500× 音效對照 ORB_POWER_V10_AUDITION.wav；65 支原創合成音訊檔維持。
・本輪 OFF／TURBO 2 本地回放各完成 $12.50 並回到待機；完整建置與低高倍、三球、效果回收檢查通過。

希臘神殿 INFO、操作列與聲音節奏（2026-10-31）
・參考高爾夫說明的封面、章節索引與三步圖解結構，改為原創青綠、金邊與大理石神殿風格。
・遊戲說明與賠付表可在同一視窗互切；加入章節跳轉、關閉叉號、Escape 與 Tab 焦點限制。
・桌面與 390／320px 手機檢查通過；手機叉號 44px，賠付以固定三欄列出數量與 ×數，100× 不截斷。
・操作列改用清晰的數字字體、降低數值彈跳，保留既有深色字與金色選取反饋。
・一般點選聲降低，說明頁開啟／切頁／關閉各有輕量提示，80ms 內避免重疊。
・1～3 顆球的飛行風聲按聲部數分配增益，避免同時出球突然過響；施法聲、命中與三種 TURBO 的人物時序維持。
・完整建置通過，型別檢查 0 錯誤、1 個既有設定警告；本輪本地 mock 完成一局 $12.50 並返回待機。

人物聲音與動作對拍（2026-10-31）
・新增收肘摩擦、甩腕、金飾碰觸、蛇尾掠動、蛇咬五種原創合成細節音效，音訊庫共 65 支。
・人物聲音由骨架關鍵影格觸發；20 段動作共 60 個事件，包含施法發聲、墨鏡與獨立蛇髮雙咬。
・得意拇指補上甩腕與金飾輕響，短促發聲有 3.5 秒間隔，減少連消重複叫聲。
・施法嘴型涵蓋整段發聲，收勢演完才接回呼吸；中途切換動作不會晚冒出上一段音效。
・角色語音仍為原創合成預聽，非真人錄音；三種 TURBO 的人物／倍率時序相同。
・新增 CHARACTER_V9_AUDITION.wav 同期聲音示例與可編輯分軌；人物檢視頁可勾選同步音效，逐格拖曳不發聲。

整場動態巡視與修整（2026-10-31）
・八塊碎片改為不等大的凸多邊石塊；短暫撞擊停頓後錯時分離，保留原圖 UV 與裂紋銜接。
・細石屑與薄塵配合崩裂時刻，維持既有消除時間。
・中獎暗幕與得分文字平順進退，避免連消切換時突然閃黑或跳字。
・鳥群短促拍翼後滑翔，保留左側雲流、兩群鳥與原有固定鏡頭。
・原圖覆蓋 1681 個取樣點無缺口或重疊，八連消預算仍為 9870ms。

PP 動作語彙優化（2026-10-31）
・依 slot-motion-recipes：獎圖減少整張跳動，蛇冠、盔冠、琴弦與花環改用局部錯時，邊光跟隨節拍。
・高獎與散佈加入高斯深度轉向，沿用十款正式繪圖；不含 PP 的圖像或骨架。
・人物新增 face_look 控制骨與 841 點臉部加權網格；小中獎有預備、看向、停留與收勢，慶祝停留有軀幹錯時。
・人物共 84 骨、24 段動作；丟球蓄力、九蛇威嚇、FG 墨鏡規則均保留。
・所有補位同時開始、同時接地，掉落曲線內含兩次遞減回彈，不再疊第二次落地擠壓。
・連消以梅杜莎的快節奏改編：表演 567ms、掉落 360ms，八連消總預算 9870ms；TURBO 僅縮放盤面時間。

手臂蓄力與甩腕（2026-10-31）
・配合球體 350ms 蓄力，手臂先收肘回拉，再短停 55ms，向前上方甩出。
・蓄力肘彎曲變化約 30 度，回拉手部行程約 126 rig px，放球前後甩出約 187 rig px。
・手腕延遲跟進，手掌有過衝與回彈；肩胸隨回拉蓄勢，保留另一手捏住墨鏡的接觸。
・一般／免費遊戲及三種 TURBO 維持相同出手時刻，沿用 v8 蓄力、出手與命中音效。

倍率丟球與音效精修（2026-10-30）
・球體離手即帶動量，沿蛇形弧線飛行；釋放點有貼合飛行方向的壓力光環、六道碎光與短閃。
・蓄力時曲線碎光向掌心聚攏，倍率文字仍維持清晰。
・新增 350ms 蓄力、160ms 出手爆點與合成角色發聲；重製 600ms 風壓與三段晶石重擊。
・出手與數字撞擊短暫壓低配樂，再平順恢復；三種 TURBO 聲畫演出速度相同。
・預覽改用 Web Audio 與共用混音比例，拖動時間軸不發聲，重新播放會停止上一輪試聽。

蛇髮張牙舞爪加強（2026-10-30）
・九條蛇錯開縮頸、探頭、張嘴與雙咬，蛇頸五節骨骼傳遞回彈。
・待機與免費遊戲保留更強的攻擊節奏，施法加入二次探頭與咬合。
・九條蛇的嘴端活動幅度逐一與上一版比較，24 段動作檢查無可見網格翻折。

流暢度與自然動作精修（2026-10-30）
・路徑改用連續速度曲線，保留停留與反向動作，手臂不再每到一個路徑點就停住。
・逐格解算手腕弧線，限制過度折肘，放慢收手；MG／FG 收勢最高手腕速度約降低 40%。
・蛇髮小動作改為淡出接入施法；量測的瞬間骨骼位移由 13.17 降至 0 rig px。
・動作接回呼吸的混合延長至 320ms，呼吸時鐘持續。
・球體蓄力至放出保持方向與輪廓連續，命中保留飛入軸向，不瞬間翻轉。

有趣演繹、倍率飛行與接地加強（2026-10-29）
・角色以揮臂勾手聚球、甩手放出、尾尖跟隨與得意表情構成一段完整演繹。
・倍率球先放大，再回拉 14px 壓縮蓄力，釋放後拉伸並沿蛇形弧線加速。
・雙股交纏尾流、飛散碎光、球緣弧光與同色柔光冠，數字保持正向；多顆球上下錯開蓄力，倍率文字位於所有球體之前。
・補位落地加入接地亮邊、向外短弧與細屑，依落差調整強度；每欄最多兩個落點。
・一般／TURBO 1／TURBO 2 皆保留短促落地回饋，連消等待時間不變。
・倍率命中後加入延遲擴散的柔光波與弧光，保留原本碰撞停頓、跳數與結果停留。
・出手動作沿兩段尾圈傳遞至尾尖甩回，後手手腕補上跟隨收勢。
・原生特效逐格頁增加接地與回彈檢視。

整場動態加強（2026-10-27）
・中獎格出現短暫弧形聚光與向內匯聚光點，得分文字以輕微彈性入場。
・石化碎裂增加六枚細石屑與四組薄塵，隨碎片階段淡出，不延長連消。
・人物待機加入短暫偏頭與手腕放鬆，保留呼吸進度、蛇髮活動與額頭墨鏡規則。
・花園兩側加入錯開的陣風，曲面葉片旋轉、前進並輕微上揚；垂直循環先淡出再補入。
・倍率命中後新增六枚短暫綠金光點，在加乘過程中淡出，不改變三種 TURBO 的人物／倍率時序。
・新增原生 Pixi 聚光／石化／碎裂逐格檢視頁，無影片輸出。

人物與獎圖精修（2026-10-27）
・人物動作混合延長至 180ms；出手加入胸肩、後手、腰尾的分段回彈，裙片延遲收勢。
・FG 指向手勢增加短暫過衝與回收；出手嘴型延長，接回原本呼吸時鐘。
・頭盔／陶瓶較沉、豎琴／花環較輕，得分跳動依材質調整重量。
・石化由上向下蔓延，前緣有短暫綠白光，再接裂紋。
・原圖保留為八塊石色碎片，加入側面厚度、翻轉縮短與先爆開後下墜。
・人物與倍率球在三種 TURBO 下仍使用相同速度；盤面掉落／消除依原設定加速。

左側天空修正（2026-10-27）
・雲層主要集中在盤面左側露出的天空，三條雲流持續循環補入，淡入淡出避開柱緣。
・提高雲層對比，加入兩組左側小鳥群與三隻遠景鳥；鳥群共九隻。
・寬螢幕裁切時重新安排左側雲鳥高度，保留在可見天空內。

前次八項修正
・開始轉輪延續原本呼吸進度，不再重設姿勢；動作結束平順接回同一呼吸時鐘。
・腹部擴張、腰尾與上段蛇尾加強，尾尖加入反向蓄勢與甩回；尾部權重改為連續銜接。
・兩座火盆改為獨立熱流與漸細火舌，搭配微弱暖光與火星，固定於盆口。
・上方雲層減淡、柔化並採四層不同速度，建築與鏡頭固定。
・AUTO 的 ADVANCED 與箭頭改深色；BUY BONUS 押注金額改淺色。
・BUY BONUS 字體縮小並上移，完整放進盾牌白色區域。
・出手吼聲播放增益 2.10、降調至 0.87，搭配獨立蛇嘶聲層。
・移動倍率改為「×N」；碰撞增益 1.65、傳遞聲 1.30、加乘跳數 0.78。

前次五項修正
・右側石像左移，位於梅杜莎尾巴與篝火之間。
・九條蛇加強獨立擺動／蓄勢／咬擊，新增九個下顎骨骼與可開合嘴型；出手同步人物嘴型。
・FG 全程墨鏡固定額頭，待機與得獎動作不再反覆拉下。
・倍率球飛行播放增益 0.8 → 1.35（+4.55 dB）；出手發聲 0.82 → 1.10（+2.55 dB）。
・左側「×N」數字飛至盤面中央，與原得分碰撞、發出綠金閃光與撞擊聲，再顯示加倍結果。

先前版面修正
・兩側石像依目前梅杜莎高度的 1/5 顯示，隨畫面比例調整，腳底保持在操作列上方。
・操作列加高、文字留出上下邊距；10 個控制圖示重繪為深墨色，TURBO 採高對比描邊／實心與雙閃電三級狀態。
・MG／FG 六秒全身呼吸循環加強：胸腹擴張、腰尾／裙片／飾鏈跟隨；接地錨點與盤框固定。
・九條蛇的五節骨骼皆有獨立動態，輪流後縮蓄勢、前探咬擊再回收；60 秒待機涵蓋全部九條蛇。
・INFO 高對比關閉叉號；BET／AUTO 選中格亮金色並顯示勾號；選單與手機淺色石板的數字對比修正。
・獎圖先下壓跳動、回位後石化、裂開再碎散；破碎播放增益提高 15%。
・BUY BONUS 文字回到盾牌內；BET 懸停採金色標題、箭頭與整格底色反饋。
・日間火焰、花園飄葉與光點、天空飛鳥；倍率出手前加入一次原創合成的非語言發聲。

本版完成
・10 張正式獎圖，以及得分、石化消除、碎片與重力掉落。
・梅杜莎分層 PSD（1024×2048，63 層）、關節資料、轉面、10 種表情與可編輯分件。
・Spine 4.3.13 原創骨架：84 骨、9 條各自五節骨骼的蛇髮與9個下顎、24 段動作。每條蛇獨立錯拍，沒有整頭髮一起晃。
・拉墨鏡、凝視、失敗倍率反應、小獎拇指、FG、各級大獎、蛇尾與待機動作；前臂遮擋與捏鏡框位置已檢查。
・招牌倍率演出 v6：雙眼轉綠、近眼放射光芒、弧光與粒子匯聚倍率球、飛行、命中壓縮與原畫碎片。
・一般／TURBO 1／TURBO 2 的角色、魔法、倍率球、音效、跳數與結果停留使用同一時序；速度差異只保留在盤面消除／掉落。
・倍率數字維持正向；中央明示「原得分 × 倍率 = 加倍後得分」，結果停留後退場；FG 累積牌加上 TOTAL 標示。
・MG／FG 場景、慢雲、日夜火焰、飄葉／光點／飛鳥、石像碎裂重組；盤框與鏡頭固定。
・正式盤框、按鈕、Buy Bonus 神盾、三色倍率球、三級累積牌、FG 牌、五級大獎牌與同款金章撒幣。
・三張說明插畫、字標、無字 16:9 封面、分層商店縮圖、favicon、12 格蛇環讀取動畫來源。
・65 支原創合成音樂／音效已接入，含神盾 hover、confirm 與蛇髮哈欠。角色語音是合成預聽，並非真人配音。
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
・本次完整 svelte-check 為 0 錯誤、1 個 tsconfig 設定警告（allowImportingTsExtensions 與 noEmit）；數量與檢查紀錄見 delivery-status.json。

範圍
以上是本地離線／mock 驗證，未宣稱 Stake Engine 驗證。mock 的餘額換算不能作為金流驗證。上傳 Stake Engine、真實 RGS 與送審由使用者進行。
依使用者最後指示，不另外提供影片作為交付主體。

本機開發入口（使用 E 槽 Node 22）：
E:/stake/tools/node-v22.23.1-win-x64/node.exe node_modules/vite/bin/vite.js dev --host 127.0.0.1 --port 3045
本地 mock URL：http://127.0.0.1:3045/?mock=1&sessionID=dev&rgs_url=mock.local&currency=USD&device=desktop&book=baseThrow
本地檢查：design/build_local.mjs；角色檢查：design/check_medusa43.mjs。
倍率逐格檢視：design/source/medusagaze/multiplier/preview/index.html（透過本機 HTTP 開啟）。
倍率動態驗證：design/multiplier-performance-validation.json；音效量測：design/source/medusagaze/audio/MULTIPLIER_V4_SOUND_DESIGN.json。
重建音訊時先執行原始 generate_audio.py，再執行 audio/upgrade_multiplier.py 與 audio/build_preview.py，保留本版混音。
'''
readme=readme.replace('255492 個已發布中獎位置',f"{motion['publishedWinningPositions']} 個目前開發書中獎位置")
(OUT/'README_交付說明.txt').write_text(readme,encoding='utf-8')
status=json.loads((ROOT/'delivery-status.json').read_text(encoding='utf-8'))
status.update({'date':'2026-10-31','stage':'complete_local_deliverable_pending_user_engine_upload','userRequestedVideo':False,
 'art':{'status':'production_art_integrated','symbols':10,'newUiAssets':27,'characterPSD':'cast/medusa.psd','editableLayers':63,'turnaround':'cast/medusa_turnaround.png','sourcePrompts':['completion-prompts-v2.json','completion-additions.json'],'cover':'ui/MedusaGaze_cover.jpg','tile':'ui/MedusaGaze_tile.jpg'},
 'animation':{'status':'original_spine43_integrated_and_locally_verified','spine':'4.3.13','bones':cast['bones'],'independentSnakeChains':9,'snakeBonesEach':5,'independentSnakeJaws':9,'fgGlassesForeheadSamples':cast['foreheadSamples'],'clips':24,'editor':'cast/spine43_editor/medusa.json','validation':'cast/spine43-validation.json','runtime':'static/assets/spines/medusa43','scope':'App-owned renderer; shared Spine 4.2 loader unchanged','noVisibleMeshFolds':True,'pinchContactVisualReview':True,'sceneCamera':'fixed','multiplierSignature':{'version':8,'eyeMarkers':2,'performanceValidation':'../../multiplier-performance-validation.json','review':'multiplier/preview/index.html','timing':'glasses contact, emerald eyes, local radiating fan, curved strands and gathering motes, condensed orb, curved flight, contact hold, count and result hold; identical at all three turbo tiers','readout':'Left ×N numeral travels to centre and collides with base win; foreground flash, impact sound, count-up and full multiplication equation; labelled TOTAL plaque'}},
 'validation':{'fullBuild':'passed','buildLog':'E:/stake/tmp/medusa-character-sound-build-20261031.log','typeCheckLog':'E:/stake/tmp/medusa-character-sound-types-20261031.log','svelteCheckErrors':int(summary[1]),'svelteCheckWarnings':int(summary[2]),'svelteCheckProblemFiles':int(summary[3]),'changedGameSourceTypeErrors':0,'typeCheckBaseline':'Existing tools, shared dependencies and legacy static imports still fail full workspace check.','runtimePathsByteMatched':len(verified),'browser':'1280x720, 390x844, 320x568 local mock UI checked; 15-spin feature completed; total x110 / $198.90; returned to MG','screenshots':['_sheets/game_desktop.png','_sheets/game_mobile_320.png'],'devWatchdogNotes':'Two existing 15s watchdog messages occurred while deliberately holding click-to-continue FG panels; both continued normally.','engineVerification':'not_performed_user_will_upload'},
 'delivery':{'frontend':'../../delivery/MedusaGaze_frontend_20261031.zip','sources':'../../delivery/MedusaGaze_sources_20261031.zip','readme':'../../delivery/README_交付說明.txt'}})
status['audio']['notes']=['65 original synthesized audio files integrated; v8 palm charge, release pressure, synthetic casting shout, wind and weighted crystal impacts.','Hover, confirm and snake-yawn event wiring complete.','Character vocal sounds remain synthetic preview, not professional human voice acting.']
status['audio']['status']='integrated_original_synthesis_voice_preview'
status['audio']['files']=len(audio_metadata['files'])
status['audio']['runtimeBytes']=audio_metadata['runtime_bytes']
status['validation']['runtimeAudioByteMatched']=len(audio_metadata['files'])
status['validation']['typeCheckBaseline']='Current check: 0 errors; one tsconfig allowImportingTsExtensions/noEmit warning. Earlier reports retain their historical counts.'
status['audio']['multiplierUpgrade']={'version':4,'cues':13,'spatialFlight':True,'masters':'48k PCM24','editableStems':'audio/multiplier-v2-stems','report':'audio/MULTIPLIER_V4_SOUND_DESIGN.json','runtimeBytes':json.loads((ROOT/'audio/audio_metadata.json').read_text(encoding='utf-8'))['runtime_bytes']}
status['validation']['multiplierBrowserReview']=browser
status['ninePointRefinement']=refinement
status['revision']='20261031-orb-power-v10'
status['orbPowerRefinement']=orb_power
status['animation']['multiplierSignature']['version']=10
status['animation']['multiplierSignature']['powerGradient']=performance['powerGradient']
status['audio']['orbPowerV10']={'mix':'audio/ORB_POWER_V10_MIX.json','audition':'audio/ORB_POWER_V10_AUDITION.wav','measurement':'audio/ORB_POWER_V10_AUDITION.json','runtimeAudioFiles':65,'noExtraAnimationDelay':True}
status['templeInterfaceRefinement']=temple_ui
status['validation']['buildLog']='E:/stake/tmp/medusa-orb-power-build-20261031.log'
status['validation']['typeCheckLog']='E:/stake/tmp/medusa-orb-power-types-20261031.log'
status['validation']['currentBrowser']='Greek INFO and paytable at desktop/390/320; BET and AUTO selection feedback; one local baseThrow round returned to idle at $12.50. Earlier feature reports are historical.'
status['audio']['interfaceMix']={'cues':3,'pressGain':.45,'antiStackMs':80,'volleyFlight':'gain divided by sqrt(active orbs), 1–3 voices; constant summed squared-gain budget'}
status['characterSoundRefinement']=character_sound
status['animation']['soundEvents']=character_native
status['audio']['characterV9']={'cues':5,'report':'audio/CHARACTER_V9_SOUND_DESIGN.json','editableStems':'audio/character-v9-stems','audition':'audio/CHARACTER_V9_AUDITION.wav'}
status['overallMotionRefinement']=tour
status['overallDynamics']=overall
status['landingImpactRefinement']=landing
status['castingV7']=casting
status['castingV8']=casting8
status['ppMotionRefinement']=pp
status['animation']['ppRecipe']=pp_native
status['handWindupRefinement']=hand
status['animation']['handAnticipation']=hand_native
status['audio']['castingV8']={'version':8,'cues':len(casting_audio['cues']),'report':'audio/CASTING_V8_SOUND_DESIGN.json','editableStems':'audio/casting-v8-stems','musicDucking':True,'mix':'src/game/castingSoundDesign.ts'}
status['snakePresenceRefinement']=snake
status['animation']['snakePresence']=snake_native
status['fluencyRefinement']=fluency
status['animation']['fluency']=fluency_native
status['characterSymbolPolish']=polish
status['animation']['symbols']={'fracturePieces':8,'directionalStone':True,'materialSpecificHop':True,'geometryValidation':'../../motion-validation.json'}
status['leftSkyRefinement']=sky
status['eightPointRefinement']=revision6
status['animation']['seamlessRestSamples']=cast['seamlessRestSamples']
status['animation']['tailSwishRigPixels']=cast['tailSwishRigPixels']
status['audio']['runtimeMixV6']={'castGain':2.1,'castRate':.87,'castHissGain':.55,'collisionGain':1.65,'transferGain':1.30,'countGain':.78}
status['fivePointRefinement']=revision
status['presentationCorrection']={'date':'2026-10-26','statueToMedusaHeight':.2,'toolbarHeight':210,'readoutPadding':'Raised toolbar with vertical breathing room and complete status text','turbo':'High-contrast outline, filled single bolt and filled double bolt','breathing':cast['breathing'],'geometryValidation':presentation,'browserValidation':presentation_browser}
(ROOT/'delivery-status.json').write_text(json.dumps(status,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
inventory=[]
def archive_file(z,p,name):
    z.write(p,name);inventory.append({'path':name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
frontend=OUT/'MedusaGaze_frontend_20261031.zip'
with ZipFile(frontend,'w',ZIP_DEFLATED,compresslevel=6) as z:
    for p in sorted((APP/'build').rglob('*')):
        if p.is_file():archive_file(z,p,p.relative_to(APP/'build').as_posix())
source=OUT/'MedusaGaze_sources_20261031.zip'
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
report={'date':'2026-10-31','archives':[{'name':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [frontend,source]],'contents':inventory}
(OUT/'delivery-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'archives':report['archives'],'sourceTypeErrors':0,'existingWorkspaceTypeErrors':int(summary[1])},indent=2))

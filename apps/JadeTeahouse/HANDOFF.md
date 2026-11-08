# Jade Teahouse 交接

## 2026-10-10 RTP 更新

- base、bonus、superbonus 的現行目標及已發布 LUT 均為 **96.00%**；三模式各 10,000 本 books 的 SDK 驗證通過。以下舊機率與舊目標數字是歷史紀錄，以本段及 `game_config.py` 為準。正式外部認證仍待完成。

## 路徑

- 前端：`E:\stake\wp\apps\JadeTeahouse`
- 數學：`E:\stake\math-sdk\games\JadeTeahouse`

## 已完成

- 複製 Sushi Monkey 前端至獨立專案，保留原專案。
- 重畫背景、獎圖、青瓷框、角色服裝、轉場、購買卡、免費轉盤／大獎面板與 UI bar；新角色重新切圖並生成 Spine atlas。
- 更新名稱、規則、Pay Table、購買卡及主要多語文字；接入 JadeTeahouse 數學的 FE config。
- 數學模型實作 Ways、W 收集 P、Scatter 免費轉盤、免費轉盤階梯、兩種購買模式與 10,000× cap。

## 指令

```powershell
# from E:\stake\math-sdk
.\env\Scripts\python.exe games/JadeTeahouse/smoke.py
.\env\Scripts\python.exe games/JadeTeahouse/run.py --books 100

# from E:\stake\wp\apps\JadeTeahouse
E:\stake\tools\node-v22.23.1-win-x64\node.exe design/sync_math_config.mjs
E:\stake\tools\node-v22.23.1-win-x64\corepack.cmd pnpm preview:build
```

## 發行前

此為可運作的換皮與數學模型草案，還需完成大樣本 RTP 調參、正式權重、RGS 驗證、茶樓專屬音樂／音效與角色表情圖。音效檔名、若干程式內部 asset key 仍保留 `sushi` 以維持原互動載入路徑，玩家畫面以新主題為準。

依使用者核准的規則調整，玉杯已加入 15／20／30／40／50×，免費轉盤另有 100／150／200／250×；上限仍分別是 50×、250×。使用正常 FR0 輪帶與計數達 12 的替換規則，可以組成觸及 10,000× 上限的盤面，沒有指定或強制封頂書本。玉杯權重是新遊戲待調整數學草案，正式 RTP 與觸頂頻率尚待大量抽樣與優化。

目前抽樣：三模式各 10,000 本。`run.py` 會把 LUT 權重校到目標 RTP：base 94.5%（解出 feature 觸發機率 0.406%，約 1/246；純基礎遊戲 70.72%、feature 平均 59.26×）；bonus／superbonus 95%（原始 92.1%／96.4%，以 (1+賠付)^λ 平滑傾斜權重，λ = +0.018／−0.013，最大權重比 1.23／1.16）。三模式書本、LUT hash 和金額格式均通過 SDK 驗證。1 萬本仍不足以認證 RTP，正式版本需要大量抽樣。

## 送審前修正（2026-10-09，Claude，與 Pocha／MonkeyKingRush／SwingMonkey 同一組）

- **FG 結算金額含觸發轉**：`src/game/featureTotal.ts`（從 Boat 移植）。books 實測：主遊戲觸發的 FG 有 245／1,000 本結算面板少了觸發轉的獎金（付款本身一直是對的）。
- **Spin 鈕呼吸光暈關閉**（`uiTheme.ts` `spinButtonGlow: false`）。
- **限制字詞形變化**：`design/check_social_words.mjs` 加上 buys／paying／wagered 等。
- **重播面板金額全精度**：`ReplayIntro.svelte` 用 6 位小數。
- **說明對照 books**：`design/check_copy_claims.py`（`pnpm check:claims`）驗 9 條規則說法，全部成立。
  - 買入模式的進場盤只放 Scatter、不結算（22.9% 看得到連線、4.8% Wild 旁有玉杯卻沒收），規則頁「模式」下已補一句說明，沒動數學。
  - 樣本最高一局 1,138.8×，**沒有觸頂 10,000× 的 book**，正式重跑數學時要處理。

## 2026-10-10 收集音效只留在該手（Claude）

- 使用者回報：Wild 收分後，收集的音效拖到下一手還在響。原因是一次性音效（收集叮噹、大聖/主角笑聲、算盤跑分 2.2s、大獎號角 2–6s）都會播到結束，沒人停。
- 修法：每手 reveal 送 `soundSpinCut`，`Sound.svelte` 的 `cutSpinSounds()` 把 `SPIN_SCOPED` 清單裡的音效（含 `coin_in` 的疊播複本）在 160ms 內淡出停止。轉輪、停輪、Scatter、FG 觸發鈴、過場門不在清單內。
- 茶樓底七款（Jade／Diner／Pocha／MK／Swing／Mardi／Strike）同步修；未上機。

## 人物網格重切（2026-10-10，Claude）

- 使用者回報擺動時衣服重疊、身體跑掉。原因：多數角色沿用別款的方框切線與關節點（壽司猴的 neck 207、hand 118,558），手臂層帶走了身體、尾巴、鞋尖，關節不在畫上的位置。
- 修法：在 `design/cut_cast_layers.py` 依本款原圖逐列掃描墨線重切（袖子沿腋下縫線、前臂沿身體間隙、大腿從衣襬／肚子下緣、鞋子完整）；rig.json 加 `joints`（實測肩肘髖膝踝）、`sleeveHem:false`、`gusset`、`legBlend`／`kneeBlend`（無衣襬的連身褲）、`underlay`（被手臂遮住的身體改填乾淨衣色並描邊；`hidden` 補畫被手遮住的尾巴段）。
- 流程：`python design/cut_cast_layers.py <mg|fg>` → `python design/fill_cast_underlay.py <mg|fg>` →（Diner mg 另跑 `clean_cast_trunk.py` + `fix_apron_hem.py`）→ `CAST=<mg|fg> node design/generate_monkey_spine.mjs E:/stake/tools/gen`。頭部切線保留（笑臉表情對齊頭框）。
- 驗證：`check_cast_flow` 全過；離線逐格渲染量「脫離身體的碎片」，各角色最大值降到 ≤300px（原本茶樓 ~470、Diner 31,000、Pocha 11,000、Swing 30,000）。未上機。
- 原版備份在 session scratchpad（cast_backup/），未進 git。

## 2026-10-18 笑聲對齊 10 拍 HA!（Claude）
- 笑臉動畫照 `laughTiming.json` 跑 10 拍（首拍 480ms、每 280ms、3650ms 收），舊 `sushi/voice_laugh.wav` 太短（≤1.2s）且無分明音節，第三個 HA! 之後無聲張嘴。比照保齡球猴重做。
- `design/generate_laugh_voice.py`（從 StrikeMonkey 移植，原創共振峰合成，讀 laughTiming.json）：10 聲各對一拍，每聲個別拉平音量、音高中段最高，尾巴吸氣；3.73s。本款音色：溫和的師傅「呵呵」帶微顫音（基頻 245Hz、/ə-a/、每聲 0.2s）；注意本款路徑叫 sushi/ 但是獨立實體檔，不是連到壽司猴（已核對）。舊檔備份在 session scratchpad。改 laughTiming 後要重跑。接法未動；未上機聽過。

## 2026-10-31 優化（Claude，比照 Swing／Strike／Putt／Saucer）

**獎圖動態**
- `meshWin/meshRig.ts` 新增 `strongLeap(t, beats, height)`（照 Putt/Strike/Swing：蹲深、上升拉長、頂點放大、落地重壓扁＋小搖，力道全在 rigid）。H1–H4、S、W 改用它，跳高 24/24/22/22/16/26 → 30/30/28/28/22/32；H1/H2/H4 的空中轉動改成 `+=`，落地小搖才保得住。低獎字母與玉杯不變。
- `SymbolMeshWin.svelte` 加法邊光：同一份網格幾何再畫一次（add、暖金 0xffe2a8），亮度 = 0.22 × pose.air（跳到頂最亮、第二下小跳較弱、落地為 0；待機/落地幾乎不離卡所以只微亮）。slot-motion-recipes §1.2 第 5 層。
- 玉杯倍率分色（`SackBadge.svelte`，照 Saucer/Swing 的區間）：1–3 玉綠、5–10 青藍、15–30 紫、40–50 朱紅、100+ 金字褐邊。

**人物**
- `cheer` 重做（`design/cheer_motion_v2.mjs`，`design/add_cheer_clip.mjs` 直接寫進兩個 monkey.json）：舊版整隻左右滑步＋雙手連揮兩下、從頭動到尾；新版＝預備（下蹲後仰、壺收胸前）→ 遞出（手臂展開、前臂晚 0.06s）→ **停 0.66s** 瞇眼笑、頭點兩下 → 收回小壓扁。長度不變（1.7/1.6s），手臂在 MAX_SHOULDER 26°/MAX_ELBOW 22° 內。`theme_cast_motions.mjs` 也改用 cheerBones，重建時身體一致。**注意**：產生器重建師傅 json 會把出貨的 `pour` 改回舊版（產生器的 pourClip 跟出貨檔不同，原本就有），所以只用 add_*_clip 寫 json、產生器只拿來重建貼圖集。
- 閉眼臉重繪（`design/redraw_blink_faces.py`，系統 Python，需 opencv）：blink／laugh_3_blink／laugh_4_blink 原本是眼睛上蓋平塗膚色圓片＋一條線，學徒睫毛瞳孔還露在外面；改從睜眼臉出發，從眼白長出整個眼睛遮罩（限凸包＋5px）、只用周圍膚色補、重畫眼皮（笑臉 ^ 弧、眨眼下垂眼皮＋睫毛）。原圖 `design/source/_pre_blink_20261031/`。
- ~~笑臉露齒~~：試過在口腔上緣加牙帶，使用者看了說「笑的時候嘴巴線條很奇怪」（逐欄取上緣出鋸齒、吃掉墨線），已移除並還原原圖，`add_laugh_teeth.py` 刪除。照美式餐館的畫法：乾淨深色橢圓＋粗墨框＋舌頭、不畫牙。閉眼腳本只在上 62% 找眼睛（原本會把嘴的差異當成眼睛、把學徒嘴角補成膚色）。重建貼圖集：`CAST=mg|fg node design/generate_monkey_spine.mjs E:/stake/tools/gen` 後把 json 換回（或重跑 add_cheer_clip／add_pour_clip），貼圖集排版不變。
- 張嘴臉重畫（`design/redraw_laugh_mouths.py`，系統 Python）：使用者「開口跟閉合的線根本沒對齊」——laugh_1..4／talk_open 的嘴是另外貼上的深色橢圓，閉嘴的笑線從橢圓中間穿過、兩端留在臉頰，切換時嘴會跳（美式餐館也是同樣貼法，不能直接套）。改成：先用 rest 臉蓋掉舊橢圓，從 rest 臉追出閉嘴線（四周都是膚色的細長墨線，可分段），**整條線沿自己的形狀上下分開**（使用者指定：兩端＝嘴角、上唇＝線往上推 32%、下唇＝線往下拉 68%，深度沿用舊開口，laugh_1→4 逐級張大；中間試過「笑線當上唇、下面垂 D 形」被否決），填口腔色、原本有舌頭的才畫舌頭、墨線粗細照笑線。原圖 `design/source/_pre_mouth_20261031/`。**順序**：redraw_laugh_mouths → redraw_blink_faces → 產生器重建貼圖集 → 換回 json。
- HA 字幕照 Putt/Strike/Swing：只在 chestbeat 畫、play() 切走就停、已在笑不重啟、換角色重置、壽命 min(360, 1.5 拍)。
- 離線檢查：check_cast_flow 全過、check_cast_motion 無 jerk（裂縫數與其他動作同級）；姿勢圖用 render_pour.mjs 改 ANIM/CASTDIR 出過。

**其他款修過的**
- 讀取頁標題去底板（`design/build_logo_wordmark.py`）：同 FG/大獎的玉雕金邊字標，JADE／TEAHOUSE 兩行，1600×600 不變；舊匾在 `design/source/_pre_wordmark/`，`build_jade_art.py` 不再寫 logo_board。FeatureIntro 改畫 Sprite（燈籠網格 `logoBoard.ts` 已刪、不再正弦搖），logo 寬上限 680→760。
- bar 底板拿掉金線、金鉚釘、虛線點（`build_jade_art.py` 的 `bar_strip()`＝`panel(..., gold=False, dots=False)`），舊圖 `design/source/_pre_bar_20261031/`。
- 兩段 Turbo（turboTiers 2、keyline 0xd6ac52、`SPIN_OPTIONS_*_T2`、BanditCollect 虛擬時鐘：Turbo 2 收分 1.5×）、規則頁 Turbo 三段說明、`readoutOffsetY -8`、`labelChevronHoverColor 0x67645c`。
- `check_social_words.mjs` 補 pixi `text="…"` 掃描（探針 `text="Buy now"` 確認會擋）。
- 光暈：`fx_glow` 是硬邊圓 → FG 牌／大獎／計數牌／期待框改 `fxSoftGlow`（從 Swing 複製），光暈 ×0.75→×0.4、LightRays 每道 0.16→0.08。
- 獎圖待機（`idleDirector.ts`）從每 1.9–4.2s＋35% 鄰格接著動，改成 6.5–11s、不帶鄰格、靜止 2.5s 後才開始（同霓虹）。
- `design/GAME_DESCRIPTION.md` 原本整份還是 Sushi Monkey 文案，已重寫成茶樓（含 98 字英文機制說明）。
- 數學觸頂已是 10 萬本、各 20 本（之前就修好），本次沒動。

`pnpm build` 通過（`design/build_20261031_optimize.log`，型別 15 項低於基準、check_mesh_wins 全過）。**未上機**。

## 2026-10-31 第二輪：轉場、開場牌、升級動畫、轉輪、Buy Bonus 卷軸（Claude）

用本機試玩殼實測（`jadeplay`，build/＋design/playtest_stub.js＋build_playtest_stub_data.py 產的 stub-data.js；`window.__stub.force(177)` 4 Scatter、`force(2)` 3 Scatter 且 FG 內有升級）。**注意**：每次 navigate 後要重設模擬視窗（resize desktop → 1280×720），否則畫布不跟著 DPR 更新、畫面被放大；面板隱藏時 rAF 停、讀取會卡住。

- **FG 觸發轉場**（`TransitionAnimation.svelte`）：不再丟玉杯（原本轉 2.2 圈、放大 1.4 倍、看起來像大蓋碗飛過盤面）。人物在場時改送 `mascotOffer`（Mascot 播 cheer＝遞茶），門在遞出時開始關；門關上期間紙窗從背後透暖光（fxSoftGlow add），花燈（gbS）沿吊繩落到接縫前、擺一下、閃一下，開門時拉起。關門停留 380→1000ms。進場（說明頁→遊戲）也走同一支，所以也有花燈。實測過；曾因吊繩 `Array(負數)` 卡死（已夾 0）。
- **FG 開場牌**（`FreeSpinIntro.svelte`、`FreeSpinAnimation.svelte`）：紙面座標 `PAPER` 原本是舊看板量的、偏低 140px，第三行說明跑到框上 → 重量為 175,165,1425,795。場數改蓋朱紅印章（`design/build_fg_seal.py` → `sushiV8/fg_seal.png`，`v8FgSeal`），米白粗 Cinzel 數字反白在章裡、**擺正**（使用者要求）；說明縮成兩行、依寬度自動縮放。兩側吊燈籠拿掉（和師傅擠）。實測過。
- **升級動畫**（`BanditMeter.svelte`）：程式畫的斜劈三色線、多邊形碎片、平面金圈全拿掉；低獎卡用 Strike 的 `CardShatter`（真實美術切片碎裂，附 `game/letterCentre.ts`）、扇子打中處加法閃光、玉杯從空中落進空位壓扁回彈＋柔光＋LightRays＋茶葉 FxBurst；「+N」改用同一顆朱紅印章（擺正）；黑幕 .65→.45。時間軸與音效點不變。**未實測**（面板被隱藏）。
- **轉輪**：照霓虹——`ReelMotion.svelte`＋`game/reelMotion.ts`（整條輪帶依實際速度的方向模糊，`design/check_reel_motion.mjs` 通過）；SymbolSprite 拿掉殘影兩張與 30% 拉長；`SPIN_OPTIONS_DEFAULT` 改霓虹的 2.8/4.2/回彈 0.12/間隔 100ms。實測過（3 秒內五輪停好）。
- **獎圖再加大**：strongLeap 蹲/壓 ×1.2、頂點放大 .12、落地搖 3.6°、二跳 .4；跳高 H1/H2 38、H3/H4 35、S 28、W 40、低獎字母 28。check_mesh_wins 全過。
- **Buy Bonus 卷軸**（`design/build_buy_scroll.py` → `sushiUi/buy_scroll_0..5.png`）：平常半捲（open .56），中間一段紙上就是共用按鈕排的 BUY / BONUS 兩行字，所以捲著也看得出是入口；滑鼠指到時共用的 `buyBonusHoverFrames` 播 1..5 張展開（55ms/張）、停最後一張，四角金雲紋完全展開才露出。只動 print 皮膚設定；竹牌擺動的 `BuyPlateMesh.svelte`／`meshWin/buyPlate.ts` 已刪。滑鼠移開會直接回半捲（共用按鈕沒有收起動畫）。**未實測**。

`pnpm build` 通過（型別 15 項低於基準、check_mesh_wins 全過）。
- **選單字幕看不清**（使用者 2026-10-31）：共用 bar 的選單字幕寫死成 labelFill＋valueStroke 3px、0.5 字級，在茶樓是深玉字被米白描邊吃掉、看起來像淡白字。共用 `theme.svelte.ts` 新增四個預設不生效的鍵 `menuCaptionFill／Stroke／StrokeWidth／Scale`（LayoutBottomBar captionStyle 讀它們，未設定＝原樣），茶樓 print 皮膚設深墨綠 0x1c3830、米白光暈 4、字級 0.62。build 過，未實測。

## 2026-11-01 背景改壽司猴風格＋獎圖/背景/人物動態（Claude）

- **背景**（使用者：背景跟盤面太像，要像壽司猴）：`design/build_ink_backgrounds.py` 把兩張原畫轉成壽司猴的墨線＋網點＋米紙：DoG 墨線、45° 網點（7px）、中央盤面處淡成紙白（橢圓、柔邊）、四盞吊燈籠以實測位置（bgProps LANTERN 座標）乘上朱紅、紅流蘇與暖燈保留原色。不重生圖、構圖不變，所以背景網格骨架（bgProps.ts）照舊對得上。原圖在 `design/source/_pre_ink_bg/`（腳本永遠讀這裡）。模糊 0.6 同壽司猴。**試玩殼實測過**。
- **背景動態**：新 `BgAmbience.svelte`（兩張背景都掛）：每 28 秒一片雲影掃過地板（只變暗）、左右山景窗各有墨線小鳥飛過（23s／31s，拍翅＋滑翔）、地板一道紙色薄霧緩慢漂移。都以背景像素座標畫、跟背景一起漂移/淡出。
- **獎圖**（照 Purrfia/鸚鵡，使用者規則：不要星星、硬邊光環、方框）：拿掉每格中獎的硬邊雙線方框；改成中獎期間的暖色柔邊背光（跳越高越亮）＋跳到最高時一道光澤從左掃到右（同網格加亮複本＋移動的斜帶 Graphics 遮罩，300–720ms）。落地煙塵的地面閃光/煙團從硬邊 fxGlow 換 fxSoftGlow。實測：中獎格無方框、背光有出來；光澤掃過時間太短截圖沒抓到。
- **人物**：`nod`（一般中獎最常播）照 cheer 的做法重做（`cheer_motion_v2.mjs` 的 `nodBones/nodFace`，add_cheer_clip 一併寫入）：壺先往下收→舉起敬茶（前臂晚 0.05s）→停住點一下頭＋閉嘴笑轉小開口笑→收回，1.2s。check_cast_flow 0 翻面，離線姿勢圖看過。
- **Buy Bonus 卷軸**：實測發現半捲時 BONUS 頂到竹軸 → 平常展開 0.56→0.66、字 0.5→0.44、hitArea 跟著改；實測平常/滑過都正常。
- `pnpm build` 通過（型別 15 項低於基準）。
- **11-01 同日修正**（使用者：背景不要奇怪的燈籠跟絲帶，風格不一致）：build_ink_backgrounds.py 拿掉所有上色（朱紅燈籠、保留原色的金絲帶/紅流蘇/暖燈），純墨線＋網點；`bg_feature` 改由 **base 原畫**轉換（FG 原畫的飄浮金絲帶與空中花瓣在墨線畫裡很突兀），所以兩張背景目前相同，FG 背景也改用 base 的網格骨架；`FallingPetals.svelte`（彩色花瓣）一併移除。build 過。
- **FG 背景＝同一間茶樓的夜晚**（使用者要兩張有區別）：`build_ink_backgrounds.py` 的 `night` 參數——在原本墨線網點上再疊一層較細的第二道網點（四周與屋簷最暗、中央盤面處仍淡），光用「留白」表現：四盞燈籠與兩盞壁燈周圍網點變稀、露出紙白；墨線保留在最上層。`BgAmbience` 加 `night`：夜晚不飛鳥、無雲影，地板薄霧略濃。仍無任何顏色。build 過，未上機。

## 2026-11-01 獎圖墨線動態記號（Claude，照 Putt inkFx）

- 新 `src/game/meshWin/inkFx.ts`，`SymbolMeshWin` 只在真正中獎（沒傳 `spec` 的那條路，含 Scatter）畫：起跳時腳下兩側速度筆劃、落地時卡面上方一排衝擊短線；每張高獎在動作最高點加一個墨線記號——H1 壺嘴冒出一縷蒸氣、蓋子落回時頂端抖動線；H2 蓋碗兩次落蓋的碰撞短線；H3 蒸籠蓋左側兩縷熱氣（不壓到畫面）；H4 三杯依序跳起的叮噹短線；W 拋硬幣的旋轉弧；S 燈籠兩側擺動線。低獎字母只有地面記號（用較快的 LEAP 時間）。只用墨線筆劃，**沒有星星、光環、方框、色點**；筆劃從尾端長出、停一拍、從尾端擦掉。
- 同時：中獎背光＋光澤（11-01 稍早）原本只看 `showWinFrame`，Scatter 拿不到 → 改成 `winning = !props.spec`。
- 離線檢查：node 假 Graphics 把筆劃座標倒出來疊到獎圖上逐格看過（script 在 session scratchpad）。build 過，未上機。

## 2026-11-01 匯集兄弟款優點：聽得見的音效、玉杯冒熱氣（Claude）

- **音效（照忍者 11-01）**：量頻譜發現 btn 只有 6% 能量在 400 Hz 以上、spin 21%、門撞 33%、FG 觸發音 21%、Scatter 得分 17%——手機/筆電喇叭放不出來；而且五軸停輪共用一個低沉 reel_stop、靠 playbackRate 變調，又是同一個快取元素，下一軸會把上一軸切掉。新 `design/build_audible_cues.py`（系統 Python）用忍者那批 CC0 實錄（木頭敲擊、Kenney 點擊、VCSL 馬林巴/大鼓；複製到 `design/source/audible_v1/raw`＋SOURCES.json/授權）重做：`reel_stop_1..5`（每軸一檔、逐軸亮一點）、btn、spin、door_clack、sack_throw（檔名不變，改成師傅遞茶時三聲上行馬林巴）、alarm_trip（檔名不變，Scatter 得分的馬林巴五度兩擊）；每檔 ≥60% 能量在 400 Hz 以上（腳本 assert）。Sound.svelte：停輪改各自檔案、音量 0.66→0.86 逐輪（同霓虹/忍者）、`layered` 疊播不互切；落地音改用新停輪；音效網址加 `?v=audible-20261101` 防快取。舊檔在 `design/source/_pre_audible_20261101/`。未上機聽。
- **玉杯冒熱氣（照 Swing 收分時唱片旋轉）**：BanditCollect 收分期間，每個玉杯跳完後冒兩縷墨線熱氣（畫出→停→擦掉，約 1.1 秒一輪、杯與杯錯開），收分結束就停；走虛擬時鐘，Turbo 2 一起變快。只用墨線，無光無粒子。未上機。
- `pnpm build` 通過。

## 2026-11-01 玉杯收分改「倒茶」演出（Claude，使用者：要更有趣，音效動畫都是）

- **動畫**（`BanditCollect.svelte`）：玉杯不再只是飛進茶師：每杯飛到茶師的計數牌旁上方（從哪邊來就停哪邊）→ 傾斜 → 倒出墨線框的琥珀色茶柱落在牌子上 → 金額隨茶落下增加、牌子擠壓、濺起四顆茶滴 → 空杯回正往上飄走。杯與杯錯開（`staggerFor`：90–190ms，杯越多越快），一位茶師倒完才換下一位。拿掉舊的紅色錯位印牌、紅色硬邊捕捉圈；牌子改紙條＋墨框＋內側玉色細線，大獎金額朱紅；FG 倍數章改用與 FG 開場同一顆朱紅印章、擺正。
- **音效**（`build_audible_cues.py`，CC0 實錄）：每杯一個音、沿五聲音階往上爬（撥弦 psaltery＝最接近古箏的實錄＋瓷杯碰撞聲），多杯就是一段上行小旋律、跨茶師也接著往上；一位茶師收完播一個撥弦琶音和弦（`soundCollectDone`）；起杯音改兩音上滑撥弦；FG 倍數蓋章改木頭＋紙聲的「蓋印」。順便發現原本 `coin_in` 用 playbackRate 想逐杯升調其實沒效（瀏覽器預設保持音高），所以改成每音一檔。試聽檔：`design/source/audible_v1/preview_cup_collect.wav`。
- 試玩殼看過：杯子飛到牌旁、傾斜、牌子計數、印章都正常；茶柱太快沒截到，另用同樣數學離線疊圖確認落點（已修正茶柱落在牌子上緣）。build 過。

## 2026-11-01 倒茶自然化＋背景風場（Claude）

- **倒茶更自然**（`BanditCollect.svelte`）：杯子飛到位時帶一點過衝再停；倒之前先往後仰一下（預備）；**以杯口為支點**傾斜（杯口固定、杯身繞過去，不再繞杯心轉）；倒到底時微微晃；回正後飄走。茶柱改成真的落體：每一滴從杯口帶一點橫向速度出發、受重力加速落下，所以茶柱是弧線、前端越落越快、越往下越細；杯子回正時茶柱在杯口斷開、尾巴掉下去。金額在第一滴茶落到牌子時才增加（落下時間用重力公式算）。曾有正負號錯誤讓茶柱停在半空，已修；離線疊圖確認落點在牌子上緣。
- **背景風場**（照 Putt／Saucer 的 windAt）：`bgProps.ts` 新增 `draught()`——每 6.4 秒一陣風從左吹過茶樓（1.1 秒橫越），左邊的燈籠、竹子先倒、右邊最後，快速傾入、慢慢放開；燈籠流蘇、卷軸流蘇晚一拍甩起，竹葉尖在風中顫動。基礎擺幅也加大一點。所有角度用 `soft()`（tanh）軟夾在各部件實測上限內，check_mesh_wins 全過。
- **新增動態**（`BgAmbience.svelte`）：白天每陣風吹到竹叢時，兩叢輪流掉一片墨線竹葉，順風翻轉飄落；夜晚（FG）燈籠與壁燈的留白光暈像燭火一樣閃爍、偶爾暗一下。
- 試玩殼看到燈籠隨風擺動；竹葉/夜燈未特別截到。build 過。

## 2026-11-01 整體流程（Claude）

- **FG 觸發等太久**：原本 Scatter 落定後先停 3 秒鐘聲，再把燈籠的得分動作連播三次（約 4.5 秒），轉場門前約 7.5 秒畫面不動；改成鐘聲 1.8 秒＋播一次（師傅的笑照常在下面跑），約省 4 秒。
- **自動轉卡在 FG 開場/結算**：兩塊牌原本只能點擊才繼續，自動轉時會停住。現在 `isContinuousBet()`（自動轉或按住空白鍵）時，開場在蓋章後約 2.6 秒、結算在數完後 2.2 秒自己往下走；手動玩仍要點（同大獎牌原本就會自動結束）。
- 新 `?flowlog` 網址參數（`src/game/eventEmitter.ts`）：把每個 broadcast／broadcastAsync（開始 `>`、結束 `<`）時間記到 `window.__flow`，用試玩殼量各段時長。預設不啟用。注意：瀏覽器面板隱藏時 rAF 只有 1 fps，量出來的時間會被拉長 10 倍以上（這次就是），要面板開著量。
- build 過，未上機。

## 2026-11-06 高獎演繹重做（Claude）

使用者：「優化茶樓，重點在獎圖動態、動畫、演繹」。離線逐格圖（`check_mesh_wins --dump`＋`render_mesh_wins.py`）看出的問題：H1–H4、W、S **六張做的是同一件事**——壓成扁片、整張跳 35–40px、在空中停約半秒幾乎不變、再壓扁（sx 1.25／sy 0.69）、小跳；各自的部件動作（蓋子、壺嘴、茶杯）只有 4–9°，所以看起來是貼紙在跳（slot-motion-recipes 說的廉價感）。燈籠還被當成球在彈。

- 新 `meshWin/act.ts`＋`meshWin/ppVocabulary.ts`（從 slot-motion-recipes 複製）：跳只當**節拍**，照 PP 三拍（133 預備、433 出框、667 回卡面、1167 第二小拍、1500 收），高度約 20px，壓扁保面積（sx·sy≈1）；邊光改在拍點上脈衝（`pose.flash`，SymbolMeshWin 的 rim 改讀它）。各圖在節拍上**演自己的戲**，而且停住的時間比動的時間長：
  - H1 茶壺：預備後仰＋龍頭後仰 → 跳起時轉向觀眾（假 3D lookPart，壺身花紋比外形移得多）→ 落回卡面後以壺嘴那側的壺腳為支點**前傾 20° 倒茶**並停住（壺嘴晚一格下壓、蓋子抬起輕顫、龍頭晚兩格跟著前傾）→ 扶正接第二小拍 → 蓋子最後落定。
  - H2 蓋碗：上升時蓋子晚一格浮起 → 落回碟上後**掀蓋左右刮茶兩次**（刮沫）、碗身反向轉 → 蓋回叮一聲。
  - H3 蒸籠：蓋子被頂開並撐住 → 兩個包子晚一格拋起、落下後**依序膨起**（發麵）→ 第二拍落地時蓋子蓋回。
  - H4 茶盤：三杯由左到右波浪跳（每杯晚兩格）→ 落回後茶盤**向玩家傾斜奉茶**一左一右、杯子晚一格跟著傾 → 第二拍波浪由右到左。
  - W：上升翻一整圈、頂點正面 → 落下在邊緣上嗡嗡晃 → 圖上的猴子回頭看、尾巴晚一格甩 → 第二拍小跳不翻。
  - S 燈籠：**不再跳**，從掛鉤當鐘擺盪（拉回 → 放出去 → 回 → 小一點），流蘇晚兩格且幅度更大，光在每次盪到頂時亮一下；只剩 6px 的呼吸起伏、不畫起跳/落地墨線。
- `inkFx.ts` 改到新拍點：茶壺倒茶時壺嘴流下兩道茶線（照重力在傾斜的壺身座標裡斜畫）再冒一縷熱氣、蓋碗刮茶時杯緣刮擦短線、蒸籠熱氣改在蓋子撐開時、茶盤叮聲在落回時逐杯、燈籠擺動線跟著兩次大擺。仍然只有墨線，沒有星星/光環/方框。
- 低獎字母、落地、待機、玉杯收集都沒動。所有高獎長度統一 1500ms（WinWays 的保留時間本來就取最長）。
- 網格檢查全過（H2 刮茶的位移、H3 包子膨脹、H4 杯高都是量著上限調下來的）；`pnpm build` 通過（`design/build_20261106_acts.log`，型別 15 項同基準）。**未上機**，只看過離線逐格圖。

## 2026-11-06 開場只有背景（Claude）

- 使用者回報進遊戲只剩背景。試玩殼重現：`ReferenceError: Cannot access … before initialization`。原因是 11-01「倒茶」收分：`BanditCollect.svelte` 的 `POUR_ON`/`POUR_OFF` 在元件初始化時呼叫 `tiltAt`，而它用的 `easeInOutSine` 宣告在檔案後面（TDZ），整個 Svelte 樹中斷。修法：緩動函式移到 `tiltAt` 前面。build 通過；**守門腳本抓不到這類錯誤**，改元件時初始化期間呼叫的函式都要寫在前面。修正後未在試玩殼確認（窗格隱藏），使用者自行上傳測。

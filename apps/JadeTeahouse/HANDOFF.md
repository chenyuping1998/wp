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

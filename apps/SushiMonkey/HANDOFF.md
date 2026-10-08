# Sushi Monkey — 交接文件

2026-10-05。本機可玩換皮版本，以使用者指定 GoBanandit 為模板。

## 使用者確認

- 名稱 Sushi Monkey／gameId SushiMonkey，5×4／1,024 Ways。
- 第七版日式漫畫墨線風格已核准；米灰主調、中低飽和暖磚橘、稀疏網點。
- 追加指示：盤面外框、Buy Bonus 框不做電腦視窗，改為壽司吧台木框與繩掛點單牌。其他獎勵面板仍採復古視窗。
- 兩隻不同的猴子師傅：MG 老練男師傅、FG 年輕女師傅；使用自有 #7 管線。
- 每隻 W 收集所有 P，固定 ×1。FG 師傅計數 4／8／12 各加 10 轉，之後依序移除整種 10／J／Q，替換成 P。
- Superbonus 起始計數 4、10 已換 P，沒有開場再加 10 轉。買入 100×／150×，Max 10,000×。

## 位置

- 前端：/Users/stone/stake-engine/wp-banandit/apps/SushiMonkey
- 數學：/Users/stone/stake-engine/math-sdk/games/SushiMonkey
- 暫存包：/Users/stone/stake-engine/upload/SushiMonkey/
- 離線預覽：http://localhost:4193/?rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en
- 預覽 fake RGS 只在 dist/sushimonkey-playtest；未送入上傳 frontend。
- node_modules 暫時連到同 workspace 的模板套件；未修改 shared packages。

## 實作

- 原創 H1–H4／W／P／S，兩套背景、兩位猴子師傅、木框與點單牌均用內建 imagegen 個別生成。沒有配送 Hacksaw 素材。
- 原稿：design/source、design/cast_delivery；核准概念：design/style_test_v7.png。
- 木框依實測透明開口九宮切片適配，底板與邊框分離，底排不被木樑蓋住。
- 角色依新圖重新切層／量關節與出手點；396 個加權頂點各角色檢查皆有效，九段動作保留。模式切換在丟盤完成及訊號遮罩時完成。
- 全畫面四通道 pixel／low-res／VHS／色差；CRT 開關存 localStorage。
- 原創合成音樂與瓷器／復古電子音效：36 cues、兩首 BGM。舊 heist audio 已移到 design/_template_reference。
- 生成時先將已刪除種類映射 P，再設 prize／reveal／Ways／collect，包含 padding；不改共享 reel strips。
- banditMeter 等 book 事件名稱保留相容，removedSymbols 可重建續玩 UI。en／zh／ja 新文案；其餘語系採 English fallback。

## 數學結果

- 正式生成及最佳化：base 100,000、bonus 50,000、superbonus 50,000。
- 實測三模式 RTP 均為 94.50%，每模式皆有 10,000× 封頂本。LUT 指標在 design/math_metrics.json。
- check_books.py 對全部 200,000 本通過，489,020 收集事件；三階替換的後續盤面都有樣本。check_plate_replacements.py 通過。
- 5,000×／10,000× 尾端機率已記錄；官方星級門檻未提供，沒有宣稱星級審核通過。

## 視覺與本機檢查

- Build 通過；59 個 asset paths、36 cues、undefined refs、social words、symbol/banner/sign mesh guard 通過。
- 型別檢查仍有模板／shared 已知 17 個 baseline issues，無新 issues；不宣稱全專案型別零錯誤。
- 瀏覽器離線檢查：主遊戲收集；4 scatter→12 spins；MG→FG 換人；第一／第二階加轉→22／32 spins；10／J→P 提示；大獎、32轉結算及換回 MG。檢查期間沒有 console errors。
- 桌面 1366×768 與手機 390×844 的木框確認不擋底排。截圖：design/sushi_counter_desktop.jpg、sushi_counter_mobile.jpg、sushi_freegame_desktop.jpg。
- 70px 符號表：design/style_delivery_sheet.png；個別資產 style gates 全通過，完整數值 design/style_metrics.txt。
- 縮圖 200px 目視完成：BG mean223.8／p10 190.6／dark0.5%；FG 真 RGBA、透明73.9%。

## 包裝與限制

- 暫存包包含 frontend／math／1024 BG+FG+provider logo／1920 cover BG+FG／README。
- 未產出 ZIP；未更新平台，未驗證正式平台 session。仍需平台端 integration／官方審核。
- 平台提交前依其要求跑完整認證檢查；本文件只列實際完成的本機與 book 檢查。

## 圖騰外框追加調整

2026-10-05：依使用者指示，A／K／Q／J／10 的外框改為手繪米色菜單紙籤。去除電腦標題列與控制按鈕；不規則墨邊、少量乾筆及折角，文字仍由程式置中。正式資產 low_label.png 已同步本機預覽與 upload/SushiMonkey；平台未更新。

## 全圖騰框與 FG 斬擊演出

2026-10-05：全部盤面圖騰加入共同紙籤底框，在 spin／land／win／static 都保留。FG 升級改為持刀師傅特寫、粉色斜斬、實際分割文字與紙籤的兩半遮罩、26片碎紙、盤子彈出及加轉重擊字樣。單階約3.57秒；一次跨多階依序表演每個新刪除種類，總加轉使用 book 原值。顯示「從下一轉開始生效」，不修改當前盤面或數學賠付。

新增師傅持刀原稿 design/source/ui/chef_cut_in.png，內建 imagegen；提詞同目錄 chef_cut_in_prompt.txt。音效使用本款原創 whoosh／瓷器重擊疊層。

本次 build 完成：61 asset paths、36 audio cues 與既有 guards 通過，type baseline 仍17。新持刀特寫 style gates 通過（colors95 65／soft47.2%／非強調色chroma9.6／fit65.5%）。本機在第一階10斬擊停格確認真實切半與碎片，恢復後觀察18/20轉繼續運作，無 console error。截圖：design/sushi_all_symbol_frames.jpg、sushi_chef_slice.jpg。已同步upload，預覽暫停功能僅在離線stub。


2026-10-06：開場已有替換的 Superbonus，在 FG 介紹關閉後、第一轉前播放 10 → 壽司盤斬擊。開場僅展示既有替換，不加轉；字幕改為「從第一轉開始生效」，結尾顯示更多壽司盤。一般 FG 起始計數仍0，後續收集升級照原規則。

開場改版 build 與 upload staging gate 通過；本機 Superbonus 介紹後停格確認切半 10、第一轉生效字幕、總轉數10。截圖 design/sushi_opening_slice.jpg。

2026-10-06：FG斬擊結果的大盤縮至86%並上移，與替換文字留白。箭頭和小盤以 CanvasTextMetrics 實際字寬共同置中，固定2.5%面板寬間距，支援10／10 J／10 J Q不同長度。前端build完成，已同步本機與upload，平台未更新。

2026-10-06：兩隻猴子的頭／軀幹接縫改為共同頸部權重場（頸點上65至下40px的smoothstep），頭24×28、軀幹24×72網格；袖口上緣沿用同一衣領變形。獨立頭轉限制idle3.2°／反應9°，頭位移55%，保留身體與手勢演出。generator備份為generate_monkey_spine.mjs.neck-backup，兩份runtime JSON和atlas已同步build／預覽／upload。

2026-10-06（風格對照）：依 Hacksaw 整套轉錄開第八版美術需求 design/ART_REQUEST_2026-10-06.md（A–H，採壽司店實物版）。程式端：body 底色由模板叢林綠改 #E4E0D4；載入頁改為單一 400×25 黑底橘條（無百分比／提示）；畫面字型統一 Bungee，數字暫留 Anton；開場說明格改米紙卡過渡版；大獎時長改 BIG 1.8／SUPER 3.6／MEGA 3.6／EPIC 7／MAX 9s，5×以下 0、5–15× 1.5s。轉輪錯開與音效擴充未動（理由見需求單）。Build 與內建 guards 通過；本機確認開場、底色、轉場與 FG 進場，大獎完整時長未在本機跑完。已同步 upload，平台未更新。

2026-10-07（轉場）：使用者要求改成像 Go Banandit 那樣「壽司店開門關門」。TransitionAnimation.svelte 改為木格拉門：等師傅丟盤 → 兩扇門從畫面兩側滑入（560ms，加速＋碰撞回彈）→ 暖簾從門楣落下並晃動 → 關住時換場（oncover）→ 拉開（620ms）。節奏與 Go Banandit 鐵捲門相同；舊的訂單終端 glitch 轉場已停用（原檔備份在 session scratchpad）。門與暖簾由 design/build_sushi_door.py 程式繪製（§0 墨線、木色取自盤框、米紙格、暖簾中央剖半海苔捲印記）。音效暫用既有 shutter_down／shutter_slam。本機確認 FG 進場時門關上、換成 FG 師傅後打開。未同步 upload。
2026-10-07（轉場音效＋美術需求）：新增原創合成木門音效 door_slide／door_clack／door_open（design/generate_door_audio.py，固定種子、32kHz），轉場改播這三個（關門、碰合、開門），不再借用 shutter_down／shutter_slam。音效 cue 36→39，check_audio 通過。手繪門與暖簾正式版的需求開在 ART_REQUEST_2026-10-06.md J 項。未同步 upload。

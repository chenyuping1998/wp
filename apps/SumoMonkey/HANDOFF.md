2026-10-26 發布已驗證：frontend v5 / math v1；平台縮圖／封面未更新。

# Sumo Monkey — 手臂修正，2026-10-26

使用者指出 FG 前臂像腫一塊。原圖上下臂連續圓鼓塊造成輪廓不自然；MG 也有同類問題。本版重畫兩位角色前後側上下臂，共 8 層，改成連續、自然收窄的形狀，補齊肩、肘、袖口內的遮擋重疊。保留漫畫墨線、紙色、毛髮筆觸與 MG/FG 角色差異。

使用內建 ImageGen 產生來源，拒收仍分節腫大的 front 版本，採用每位角色連續的 back 版本再配準上下臂。generation/generation.json、registration.json 保留來源與變換；原圖、被拒候選是研究紀錄，不能當成現行成品。隱藏的上臂肩部重疊為 100px，未改動關節位置、動作幅度或人物尺寸。

以新的 spine-motion CLI 重建兩套 Spine 4.3，六個動作均 score100；idle 首格偏移仍有工具提示（MG18°/FG15°），遊戲維持 180ms 姿勢銜接。工具分數以外，已檢查 28 層亮暗底、兩套六動作五相位與臂部近照、401 格/角色轉場預覽，未見碎片、殘影、白邊、分離或關節露底。預覽使用真實裁圖及烘焙矩陣。unchanged-motion.json 證明骨架 bones 與 animations 完全未改。

實際本機遊戲測試：MG 桌機、FG 桌機、直式手機 cut-in 與結算；使用真實 bonus book28（本機 RGS stub），跑完25手、升至7排，總獎915.50，wallet/end-round 成功，console error 為0。手機平常隱藏側邊角色，角色在 cut-in 出現。runtime-qa/ 有實拍與console紀錄。這些截圖來自本機打包測試，並非平台上線畫面的聲稱。

完整建置通過，既有13項型別問題仍低於原baseline；資源、未定義參照與社交文案守衛通過。frontend419檔與正式 build 逐檔雜湊相同，未含stub或測試工具列。revision-consistency.json 核對來源層、全身合成、Spine images、runtime裁圖、build、staged包與bakes一致。數學7檔雜湊完全未改，FG每門檻+5手、4→5→6→7排維持現有真實數學。

當前正式來源：art-source/cast/、art-source/motion/、SumoMonkey-Spine43.zip；當前動作預覽：sumo-current-motion.gif。sumo-forearm-before-after.gif 與 preview-forearm-before-after.png 的左側明確為舊版、右側為新版。legacy/ 與較早 boxing/redissect-v2/polish/manga 內容為歷史紀錄。

本機 thumbnail/cover 已以當前角色重合成，亮度守衛通過且檢視200h構圖。依使用者要求，不上傳平台縮圖及封面；只更新遊戲frontend。發布結果見 platform-*.json。

---

以下為歷史交接記錄。

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

2026-10-20: Platform UPDATED — frontend v9 successfully published; get_game confirms v9 and approval conversation references frontend v9 / math v2. Post-upload plan: 0 actions. Approved math v2 retained (96.55%, 10,000× in all three modes). No reviewer reply was sent; issue closure remains with platform review.


2026-10-20 RTP retarget: base 96.02%, Dinner Service 96.05%, Omakase Course 96.08%. Only LUT weights changed; books/payouts/costs/10,000× cap preserved. Source mode targets and optimizer slices now agree, rules/menu/confirmation use correct per-mode figures. Backup: /Users/stone/stake-engine/_upload_backups/SushiMonkey-rtp9655-20261020-092440 (266 verified files, restore.py). Platform UPDATED: frontend v10 / math v3 published and verified; approval references v10 / v3. Both post-upload plans show zero actions. Prior frontend v9 / math v2 at 96.55% retained in the verified backup.

2026-10-20 (review: "Sushi Plate mechanic is unclear"): root cause — SackBadge drew the copper `plate` digit PNGs on a copper disc (same colour), so no value was visible and the disc, sat over the two maki, read as a coin. SackBadge is now a paper chit on the plate's lower rim (maki stay visible): copper digits on paper below 10×, charcoal `count` digits on a copper chit from 10×, thicker rim from 100×; same offset in BanditCollect hop/flight. Paytable P row: chit on the icon + every value listed (1,2,3,4,5,10,15,20,25,50×; FS also 100×, 250×, from game_config base_prizes/fg_prizes); rules paragraph lists them too and names the plate "with two tuna maki". Verified in playtest (book 18886: 2× and 25× plates). Frontend staged (backup _upload_backups/SushiMonkey-frontend-1020-1319.tgz) and uploaded to scratch (re-plan 0 actions); Platform UPDATED: frontend v11 published; approval references front v11 / math v3. Math unchanged.

## 2026-10-23 final character motion integration

User confirmed actual board expansion, 4→5→6→7 rows, +5 spins per meter rung.
MG and FG are different sumo monkeys. ImageGen created isolated-part atlases;
`design/sumo_build_layers.py` extracts padded connected shapes and aligns joints,
`spine-motion character` generates the delivered Spine 4.3 JSON and six clips.
Both final reports: PASS, scores95–100, no joint/seam warnings. The idle score95
includes a minor IK acceleration observation; it remains above the tool's80 gate.

Shared pixi-svelte Spine runtime is4.2.74. Rather than changing shared packages,
`sumo_export_motion.ts` evaluates the4.3 output including IK/physics at30fps;
SumoFigure draws those regional affine transforms and interpolates samples.
Runtime uses cropped textures (original full-canvas layer coordinates preserved).
New motion responds to transitions, meter rises, wins, and the animated FG cut-in.
Source rig, reports, both GIFs and reproducible scripts are in upload art-source.
`sumo_preview_motion.py` renders six-clip proof GIFs from the same game transforms.

## Final math and live-round proof

Final math contains100,000 base /50,000 bonus /50,000 superbonus outcomes.
Full200,000-book walk passed with73,425 expansion events, actual4/5/6/7-row
reveals and correct+5 spin accounting. Measured RTP96.02/96.05/96.08%.
Headful Chrome local stub replay using final real books completed base and full
bonus through /wallet/end-round with zero page errors; all four heights seen.
Growth is deduplicated when both meter and boardExpand report the same rung.
Old symbols stay on their floor as the frame opens upward; offsets clear on the
next actual reveal. FG cut-in punch is sampled on the tier's impact clock.

Standalone showcase snapshots are display evidence only; live-round proof above
is from actual complete event playback. Debug/stub/hook files remain outside
production frontend. Platform unchanged.

## 2026-10-24 03:00 scheduled manga revision

User explicitly requested the actual Sushi Monkey Japanese manga treatment.
Compared actual Sushi backgrounds, H1 and character cut-in before generating.
Built-in ImageGen restyled both articulated atlases, arena and all8symbols.
Dark ink/ivory/sparsehatching/low-saturation salmon replaces the colorfulposter.
Preserved source poses; grid extraction now uses .25cell padding and the central
substantial connected component to avoid both clipping and adjacent-part leaks.
New MG/FG full assemblies visually inspected; final new spine-motion runs PASS
all6motions (95–100 smoothness, no seam or joint warnings). Baked4.3 motion data
and game textures regenerated; GIFs use the same game transforms.
MG full style: colors95=42,soft40.7,chroma6.6,palettefit78.0%; FG45/45.1/8.9/74.2%.
Reference palette and gates from actual Sushi ART_BRIEF, not an invented gold theme.
Math source/books/LUTs are unchanged; hash record at
_upload_backups/SumoMonkey-before-manga-20261024/math.sha256.

Final illustration style gates: all8symbols+arena PASS with the unchanged
Sushi-reference limits (colors95<=100,soft<=50%,non-accentchroma<=20,
palettefit>=55%,salmonshare<=20%). W-only final ivory nameplate brings its
salmonshare to6.3%; fit89.3% andchroma5.0. H1fit85.6% (sourceSushiH1fit88.4%).
All seven staged math hashes match pre-restyle originals. Full real BASE+BONUS
playback finished /wallet/end-round with no browser orHTTP errors; all four board
heights observed. Final W change is texture-only; release build/guards rerun.
Local tests use final realbooks; no production platform changes performed.


## 2026-10-24 — boxing redraw final integration

MG/FG were redrawn as unified full-body manga illustrations before14-layer
extraction. Registered visible pixels, complete concealed head/chest anatomy,
wide textured knee/elbow/hip overlaps replaced the independent-part version.
Static exactness initially hid missing underpainting: real punch/celebrate
frames exposed head/chest holes and striped caps; these were explicitly repaired.
The final motion pipeline uses spine-motion character followed by the official
kit buildCharacter API for idle intensity0.80 MG/0.65 FG and swing30 celebration.
All12 animation checks score100, seams pass, no joint warnings; actual evaluated
Spine4.3 transforms baked at30fps. Six-motion contact sheets and comparison GIFs
were inspected. Root math's seven hashes remain unchanged.

Real-book BASE and BONUS playback both completed wallet/end-round with errors[]
and HTTPfailures[]. Rows4/5/6/7 and +5 EXTRA SPINS observed; clean5/6/7desktop and
portrait7 captured. All14parts in each cast change LOCAL and world transforms.
Responsive alpha-silhouette fit prevents the new wide stance clipping at the
right edge. FG cut-in punches left toward the card; final cut-in size/foot anchor
was reduced to keep feet clear of its explanatory text. Full round proof is
boxing-full-qa.json; focused final cut-in proof is boxing-cutin-release-qa.json.
Frontend build/types passed with13 inherited diagnostics and no new regressions.
Clean root upload frontend updated (no stub/observer hooks); new thumbnail and
cover staged, BG brightness PASS(mean212.6/190). Spine43 ZIP and motion GIF are
in upload/SumoMonkey. Platform was NOT uploaded/published/updated.

## 2026-10-24 23:45 new cast patch (sumo_patch_2026-10-24)

Applied 角色生圖_相撲猴/sumo_patch_2026-10-24.tgz (MG/FG 14 layers each, design rig,
sumoMotion_{mg,fg}.json); removed layers/celebrate.params.json. Pre-patch backup:
_upload_backups/SumoMonkey-cast-before-20261024.tgz. Re-ran
design/measure_cast_placement.py (celebrate now jumps; horizontal bounds ~same).
Build + all guards OK (196 assets, 39 cues, 13 type errors ≤ baseline). Local
playtest: MG idle/punch, FG idle/punch/celebrate, no console errors —
design/sumo_new_cast_check.jpg. upload/SumoMonkey/frontend restaged (backup
_upload_backups/SumoMonkey-frontend-1024-2342.tgz). Platform: game sumo-monkey
exists but has 0 versions and empty scratch (plan: front 419 files 49.6 MB,
math 7 files 214 MB). NOT uploaded/published — first publish needs math+front.

2026-10-25 00:00 seam/edge pass (user: 注意接縫處、邊邊不要有毛邊). Patch neck.png was
three small round caps; with the glove off the chin (FG idle, both celebrates)
the background showed between jaw, chest notch and nape. design/sumo_fix_neck.py
paints a tapered fur column (torso fur texture, 4px ink rim where it can show)
from inside the jaw to the chest notch and out to the nape, re-crops the runtime
neck texture and shifts the baked neck matrices by the crop change. Enclosed-hole
scan of every baked frame: neck holes gone (remaining marks are the natural
arm/body gaps); outer edges are clean ink, no light halo. Old neck files:
_upload_backups/SumoMonkey-neck-before-20261024/. Proof:
design/sumo_neck_seam_check.jpg, design/sumo_new_cast_check.jpg. Build + guards OK,
in-game FG idle/celebrate checked, no console errors. upload/SumoMonkey/frontend
restaged (prev backup _upload_backups/SumoMonkey-frontend-1025-0000.tgz).
Spine source in design/sumo_cast/*/*_spine and upload art-source still carry the
patch's original neck. Platform not uploaded.

2026-10-25 00:15 Platform UPDATED (user typed 發布): first publish of sumo-monkey (team silver-stars). Compliance PASS 2★/3★ (0 failures). Uploaded front 419 files 49.8 MB + math 7 files 214 MB, re-plan 0 actions both; published math v1 (check_compliance) and front v1; get_game shows both versions, approval none, image none (store thumbnail/cover not set via stakecli).

## 2026-10-25 02:00 UI aligned to approved Sushi Monkey (local only, not uploaded)

Stone: 按鈕裡面東西太小、換皮 UI 要跟過審的一樣；FG 開場盤面太小人物太大.
- Bar/Buy Bonus plates: Sumo's own plates drew a small salmon disc + diamond in
  the 256 canvas (buttons ~25% small, diamond hid -,+,menu,auto,turbo icons) and
  a square Buy Bonus slab. design/sumo_port_ui_plates.py copies Sushi's
  bar_strip/button_*/spin_plate/buybonus_plate(+lit), salmon b87b60→c47d60.
- Board (stateGame boardLayout): MG = Sushi (BOARD_SHRINK, centred). FG starts
  identical to MG; extra rows grow upward from a fixed floor and cells shrink
  only past the screen top (portrait keeps room for the counter). Previously FG
  pre-shrank to 7 rows (4-row board at 4/7 size).
- Mascot sizes/feet off the 4-row frame (boardLayout.baseScale) so the cast no
  longer grows as rows shrink the cells.
Proof: design/ui_vs_approved_{mg,fg_start}_{desktop,portrait}.jpg, _bar.jpg,
_fg_rows_desktop.jpg, _aspects.jpg (16:10, 4:3). Build+guards OK, no console
errors. Backup: _upload_backups/SumoMonkey-ui-before-1025-0143.tgz.
upload/SumoMonkey/frontend NOT restaged; platform unchanged (live front v1).

2026-10-25 11:40 UI package refreshed: approved Sushi-size button plates and FG
4-row opening board/cast scale now included in root upload/SumoMonkey/frontend.
Fresh build + guards PASS (13 inherited type diagnostics, no regression).
All419 build files match staged hashes. Fresh real BASE collection round reached
wallet/end-round; browser/network errors [], all14 local cast transforms move.
Desktop/portrait evidence refreshed; prior FG4-7/aspect comparison evidence copied
to art-source/ui-20261025. Thumbnail/cover retained. Math unchanged.
Platform NOT updated this pass; published front/math remain v1 per prior record.

## 2026-10-25 re-split v2 completed (local package; no platform update)

Implemented the 11:50 requirements and 重拆_v2/重拆單.md. Both casts now
have complete upper arms, clean torso/chest/armpits, smooth black-fur thighs,
painted overlapping round knees and clean wrist/cuff edges. Removed glove
cheek/chest fragments and pelvis leg fragments. All28 source PNGs are single
visible components; each full.png exactly matches its actual layer assembly.
The edited master is retained separately with honest target-difference proof;
registered generated parts are not mislabeled as pixel-identical to the master.
Source/provenance: 角色生圖_相撲猴/重拆_v2/交件/{MG,FG}. Original 交件
top-level files refreshed after backup; stale celebrate.params override removed.

Official spine-motion CLI regenerated both Spine4.3 rigs: all12 clips score100,
seams/flips/joints PASS. Original joints and recipe animations/bones unchanged;
idle first-frame rear-shoulder18°MG/15°FG reminders remain. Trim -> actual
Spine4.3 bake -> alpha placement -> game-transform previews. Generator now reads
the installed recipes instead of obsolete October24 staging/hard-coded params.
Historical neck painting and atlas extraction must not regenerate this cast.

Style PASS at unchanged Sushi thresholds: MG colors50/soft39.9/chroma7.6/fit75.5%;
FG67/48.6/8.7/65.6%. Final FG front-thigh ink revision preserves alpha byte-for-
byte, all other13 layers and all baked matrix bytes unchanged. Final real-book
BASE+BONUS reached two wallet/end-rounds, errors[]/HTTPfailures[], rows4/5/6/7,
+5 EXTRA SPINS,14LOCAL+WORLD parts moving per cast; desktop and portrait7 checked.
Build/guards pass with13 inherited type diagnostics (no regression).

Root upload/SumoMonkey refreshed: all419 build files match stage,28 cropped
textures/source match,7 math hashes unchanged, new thumbnail/cover exposure PASS.
Current active artifacts: SumoMonkey-Spine43.zip, sumo-redissect-motion.gif,
art-source/redissect-v2 (including runtime QA, v2/Bandit comparison GIFs, prompts,
raw sources and release-manifest.json). Earlier cast/motion/ZIP retained under
art-source/legacy/before-redissect-v2. No debug/stub observer in production.
Platform was NOT uploaded/published/updated in this pass. The revised user brief
records previously published front v2; platform version was not queried here.


## 2026-10-25 presentation polish (local package; no platform update)

Portrait now uses a wide compact progress ticket, with a clear next reward and
space above the frame. The seven-row board has larger cells and prize labels;
labels use ink on paper/copper for contrast. A completed tier prominently shows
the actual row transition and +5 spins. Removed the stamp's distracting diamond
and prevented a translucent duplicate character beneath the result stamp.
Background plates are printed at84% opacity over ivory for clearer foregrounds.

Kept both official spine-motion 4.3 rigs, six recipes, source layers, runtime
crops and baked transforms byte-identical. Reactions now keep the same character
instance and blend evaluated poses over180ms instead of destroying/recreating
sprites. No art crossfade, reduced action amplitude, smaller actor or seam cover.
Six motions plus transition/intermediate frames inspected for both casts;
401 frames/cast rendered into art-source/polish/motion. Original art acceptance
proof remains in redissect-v2. Runtime transition previews are separate from
raw Spine previews because the latter do not implement game clip switching.

Final production build/guards passed (13 inherited type diagnostics, no regression).
Final real-book BASE+BONUS completed2 wallet/end-rounds: no browser/HTTP errors,
4/5/6/7rows and all three +5/row-transition results observed. Actual desktop and
portrait390x844 checked, plus seven-row320x568 and430x932. Fourteen cast parts
move in LOCAL and WORLD matrices per cast; payouts unchanged from prior run.
Additional result-only presentation test is explicitly separate from real books.

All staged frontend files match the production build. All7 math hashes and28
character crop hashes unchanged. Existing current thumbnail/cover retained;
this pass changes presentation, not store art. Fresh screenshots, runtime
transition GIFs, QA results and final manifest under art-source/polish.
No local stub/debug observer in frontend. No platform upload/publication/update.
Previous local frontend and sources backed up under
_upload_backups/SumoMonkey-before-polish-20261025/.


## 2026-10-25 platform publication — frontend v3 / math v1

User explicitly authorized upload and publication. stakecli validated the staged
frontend, uploaded31 changed files (7,782,711 bytes), removed1 obsolete bundle,
and retained388 files. Exact post-upload re-plan:0 actions. Frontend publish
returned published=true, changed=true, version3; fresh get_game confirms front3
and math1. All7 local math files match platform scratch; no math upload or new
math version was necessary. Math compliance PASS:96.02/96.05/96.08%,0 failures,
0 warnings.419 staged frontend hashes match the final tested polish release.

User will upload store art personally. Thumbnail/cover were NOT modified on
platform. No approval-version change, new review submission or reviewer message.
Approval currently null. Publication does not claim Stake approval or live listing.
No live RGS session was exercised in this pass. Direct public CDN probe returned
403; platform publication is verified through publish result + get_game, not a
claimed byte comparison against public CDN. Local full real-book mock evidence
and honest certification gaps are in publish-20261025/self-check.md.

Publication receipts, exact upload plan and compliance retained in
art-source/publish-20261025/.


## 2026-10-25 Auto Spins visibility fix — published front v4 / math v1

Reproduced the user's v3 screenshot on the exact staged build: unselected round
labels were ink on ink. Final manga selectors lacked html[data-ui-skin] and lost
to the older platform selectors. Selected10 remained salmon and visible, while
25/50/75/100/250/500/1000/infinity and the close glyph disappeared visually.

Only authored change: src/components/ui/Modals.svelte. Final styles now override
at the correct platform scope: ivory panels, ink text, salmon selected chips and
a legible close glyph. Modal titles use the game's face; control labels use its
local body face. Portrait advanced-limit options use3 columns instead of6 tiny
chips. No shared package files edited by this fix. Existing duplicate out-of-flow
shared Popup render is inherited; probes explicitly inspect .pop-up-wrap, not
hidden duplicate content. It is not the cause of this contrast defect.

Final build/guards pass with13 inherited type diagnostics, no regression.
CUA tested production-build local real-book mock shell: USD desktop1280x720,
XSC/social390x844 and320x568, small400x225 including scrolling. Round25 and
infinity selection, advanced loss10x selection and close button work. Chips have
12.2669:1 unselected and4.5279:1 selected contrast. No browser errors or play
requests occurred while opening/selecting/closing confirmation. Desktop amount
menu also inspected. Six visual snapshots retained; two detailed DOM records
retained. No complete gameplay/replay/currency certification rerun claimed.

419 staged files match build. All existing art/audio assets and7 math hashes
unchanged; no character/artwork/math changes. Root upload package refreshed.
User authorized continuing game updates/publication; store art remains untouched.
Uploaded5 files, removed3 obsolete bundles, retained414; re-plan0 actions.
Publish returned front4 and get_game confirms front4/math1. No approval-version
change, reviewer message or approval submission. Platform publication confirmed;
not a claim of game approval. Receipts and screenshots: art-source/auto-modal-fix/.


## 2026-10-27 — v5 detail brief implemented; local package only

Implemented the five items in 角色生圖_相撲猴/補畫_v5/補畫單.md from installed v5 sources: smooth knee silhouettes, consistent FG thigh hatching, concealed seam repair, disconnected speck removal, and MG elbow taper. Exactly11 listed layers per cast changed; head/neck/fist_front unchanged. Original joints/order/params are byte-identical. Official4.3 CLI reports100/seams/flips pass for all6 clips/cast; actual bakes and180ms transitions rendered and inspected. All28 layers connected; source/full/Spine/crop/build revision checks pass. Rebuilt419-file staged frontend;7 math files unchanged. New thumbnail/cover reflect this exact revision.

Final production real-book local mock completed BASE+BONUS2 end-rounds, all4/5/6/7rows and three+5 awards;0 browser/HTTP errors. Desktop and portrait checked, with a separate labelled presentation-only mobile cut-in probe. Full replay/social/currency certification and live RGS were not exercised. Build retains13 inherited type diagnostics; no increase. No platform upload, publication, approval change or store-art platform update.

Evidence and Chinese acceptance report: upload/SumoMonkey/art-source/v5-detail-20261027/. Current GIF/Spine archive in root upload/SumoMonkey. Requested patches delivered to 補畫_v5/交件/{MG,FG}. Backup: _upload_backups/SumoMonkey-before-v5-detail-20261027.

## 2026-10-28 — latest-requirement check and current preview refresh

Latest local brief remains 補畫_v5/補畫單.md; its five items and the later MG
front-knee crack are already implemented. Fresh platform get_game reports
front v6 / math v1, approval null; get_conversation returns 404. Frontend
plan_upload reports zero actions. Earlier local-only notes describe their
historical pass, not the current platform version. No further requirement found
in the inspected local briefs, handoffs or platform snapshot.

Fixed an actual delivery mismatch: the active GIF still predated the knee repair.
Rendered all six current baked motions (131 frames/cast) and the existing 180ms
transitions (401 frames/cast), inspected all motion contacts and 28 individual
layers on light/dark backings, and refreshed the active combined GIF, individual
Spine previews and ZIP. Source art, joints, recipes, bakes, frontend and math
unchanged. Refreshed local thumbnail/cover from current full assemblies; visual
inspection and brightness guard pass. Current source/Spine/crop/build/stage/ZIP
identity checks pass; all419 frontend and7 math files match the pre-pass hashes.

Evidence and reproducible preview staging script: art-source/current-20261028/.
Source helper: design/refresh_current_previews.py. Previous deliverables backed
up in _upload_backups/SumoMonkey-preview-refresh-20261028/.

No fresh gameplay or live RGS test performed in this preview-only pass. Existing
after_knee_fix desktop/portrait gameplay proof remains in design/v6_check;
its local font404 remains recorded. No platform upload/publication, store-art
platform update, approval change or messages in this pass.

## 2026-10-29 — FG calf restoration (local package only)

Stone spotted "something cut off" on the FG legs. Cause: 補畫_v5 knee fix trimmed both FG
lower-leg layers down to a narrow tube (calf muscle gone, angular notches ~100 px below the knee).
design/sumo_restore_calf.py restores each row's silhouette from 重拆_v2 below the knee (smoothstep
from the thigh bottom), keeping v5's knee tuck and v5 fur where solid; 1 px hair at the top removed,
transparent RGB zeroed. Only fg leg_back_lower / leg_front_lower changed (copies in
角色生圖_相撲猴/小腿修正_20261029/FG). Spine CLI 6×100 both casts; MG bake byte-identical, FG bake
changes only by crop origin. All six FG clips checked every 0.12 s on paper/dark + max-bend zooms;
in-game desktop 1440×900 FG bonus and portrait 390×844 DOSUKOI cut-in checked; fresh load 0 console errors.
Staged by design/stage_calf_fix.py: frontend 423 files (2 pngs + bundle), cover FG refreshed (thumbnail
unchanged, brightness PASS), Spine zip/GIF/art-source updated, math unchanged. Evidence:
upload/SumoMonkey/art-source/calf-fix-20261029/. Backup: _upload_backups/SumoMonkey-before-calf-20261029.
Platform NOT uploaded/published.
Same day, buy screens: ModalBuyBonus cards still used sushiBackground scenes + sushiSymbols/p.png (sushi
plate) → sumoBackground bg_base/bg_feature + sumoSymbols/p.png (Prize Medallion), heroes now sized by
scene height (h%) so the medallion never clips at 1440×900 / 1280×600 / 390×844 / 320×568. Dohyo Clash
buy button and its CONFIRM button were ink text on the ink accent (blank black bar) → paper text.
ModalGameRules controls guide pointed at sushiIcons / sushiUi plate → sumoIcons / sumoUi (what the bar
draws). No sushi* sprite path left in src. Restaged (frontend 423, cover/thumbnail as above). Not uploaded.
Known, pre-existing (also in v7): a second .wp-rules copy renders off-screen below the viewport while the
rules popup is open; invisible unless the page is scrolled programmatically. Not fixed.
Platform: 2026-10-29 15:2x UTC uploaded (7 files + 3 deletes, replan 0) and PUBLISHED front v8 (math stays v1, no approval open). Receipts: _upload_backups/SumoMonkey-publish-v8-20261029.
2026-10-29 (later 2): intro MAX WIN card — 10,000× moved off the trophy onto clear paper below it (all layouts). Restaged; platform still front v8 until uploaded.
Platform: 2026-10-29 15:50 UTC uploaded (3 files + 1 delete, replan 0) and PUBLISHED front v9 (intro MAX WIN off the trophy; math v1, no approval). Receipts: _upload_backups/SumoMonkey-publish-v9-20261029.
2026-10-30: MG+FG all four leg layers — 補畫_v5 straight chord cuts undone (outline blended back to 重拆_v2 away from the knee; v5 knee tuck kept). Copies 角色生圖_相撲猴/腿部重修_20261030/. Staged 423 files; cover/thumbnail refreshed. Platform still front v9 until uploaded. Backup _upload_backups/SumoMonkey-before-legfix2-20261030.
Platform: 2026-10-30 03:00 UTC uploaded (11 files + 1 delete, replan 0) and PUBLISHED front v10 (MG+FG leg fix; math v1, no approval). FG checked in-game desktop + portrait 390×844 cut-in before upload. Receipts: _upload_backups/SumoMonkey-publish-v10-20261030.

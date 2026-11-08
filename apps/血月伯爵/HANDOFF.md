# 血月伯爵開發版

目前底座為 `GoBoomana`。前端複製其 SvelteKit、Pixi、共用 UI、設定、下注狀態機與回放入口；保留新版 UI bar 的操作流程，`src/game/uiTheme.ts` 已依後續需求改成吸血鬼主題。GoBoomana 原專案未修改。

## 本機啟動

```powershell
& E:/stake/tools/node-v22.23.1-win-x64/corepack.cmd pnpm --dir E:/stake/wp/apps/血月伯爵 dev
```

網址為 `http://127.0.0.1:3050/`。沒有 Stake session 時使用明確分開的本機虛擬餘額與數學事件書；有 session 時沿用原生 Authenticate 與 RGS 流程，不會回落到本機開獎。

`?preview=base`、`?preview=free` 是本機場景預覽。`?preview=base&scenario=wild` 或 `scenario=merge` 在按 SPIN 時播放固定參考案例。這些模式只在沒有 session 的開發路徑生效。

## 已套用

- 6×6、50 條來源固定線、原賠表與 0.05× 精度。
- bar 的尺寸、頂端 head 偏移與盤外裁切；大圖示以單張完整圖片繪製。
- 人物整塊成功／失敗、4 種 WILD、轉換前後盤面。
- FG 6 局、每 12 點升階並加 3 局、倍率 1／2／3／5／8／12；本局先累積點數再套倍率，封頂仍加局。
- 原背景、盤框、圖示、特效序列與音效；伯爵上下 RGB/alpha 影片以 WebGL shader 合成透明角色。
- 單一旋轉時鐘控制停輪、角色、合併、紅霧與揭曉；原生 UI bar、買功能確認、虛擬餘額、auto、Turbo、Stop 接線。

## 數學與素材重建

```powershell
& E:/stake/math-sdk/env/Scripts/python.exe -B E:/stake/math-sdk/games/血月伯爵/run.py --count 100
& E:/stake/math-sdk/env/Scripts/python.exe -B E:/stake/math-sdk/games/血月伯爵/verify.py
& E:/stake/math-sdk/env/Scripts/python.exe -B E:/stake/wp/apps/血月伯爵/scripts/prepare_assets.py
```

數學目錄保留 `source_go_boomana` 的來源快照及 SHA256。新遊戲沿用 SDK GameConfig、GeneralGameState、Book；生成輸出在 `library/reference_files`，前端資料在 `static/data/demo-books.json`。`verify.py` 獨立核對每條線、轉換、幾何、FG 與 book／CSV 派彩。已核對 403 本。

## 開發範圍

目前是可播放的美術與規則預覽。機率為明列的開發假設，觀測 RTP 不是目標或原版 RTP；未進行最佳化。保留原派彩精度，因此部分結果無法通過 Stake SDK 的 0.1× 預檢，不能將 `reference_files` 視為正式發行包。原翻牌 BONUS 未實作，WildTrans 分支選擇、大格路徑及部分時序仍屬開發方案，尚未逐幀對齊原錄影。RGS 真實環境及真實回放需在部署測試環境再驗證。

素材對應集中在 `static/bloodmoon/manifest.json`，編譯用副本為 `src/game/bloodmoonAssets.json`。換圖時保留邏輯 ID、錨點、尺寸、clip 狀態與演出標記；目前角色播放器使用 WebGL。

## 角色比例調整

2026-11-05：主遊戲與 FG 的角色共用尺寸從 345×545 放大為 445×703（約 29%），調整位置以維持原腳底高度，並讓倍數階梯留在角色左邊。WILD Out 播完後維持離場狀態，Back 從重新出現的 cue 才開始播放，修正原先提前半秒在隱藏期間播放回場片段的問題。

放大後的透明頭頂留白會伸出畫面；角色濾鏡設定 `clipToViewport: false`，保留完整 packed RGB/alpha 區域，避免先裁切導致頭部與 alpha 對錯位置。已檢查主遊戲與 FG 的 1600×900 實際渲染，並播放一次本機 WILD 參考牌局至完成（虛擬餘額 10,000 → 9,999 → 10,012，派彩 13.00，控制列恢復可操作，瀏覽器無 error）。此輪只放大角色，UI 主題於下一輪另行更新。

新版預覽：`E:/stake/deliverables/血月伯爵預覽/主遊戲角色放大版.jpg`、`免費遊戲角色放大版.jpg`；前一版圖片保留供比較。

## 吸血鬼 UI、音效與連續動畫

2026-11-06：控制列改用黑曜石、酒紅、古金與棺形 Buy Bonus，沿用 GoBoomana 原生下注、自動、Turbo、Stop 與彈窗操作。Cinzel 字型與授權放在本專案；`scripts/build_vampire_ui.mjs` 可重建 SVG／PNG 控制列素材。已完成的一次性原始碼遷移腳本已從專案移除，封存在下方清理備份中。

`src/game/presentation.ts` 共用一份時序計畫，讓轉輪、影片、紅霧、逐格 WILD 結果與音效同步。轉輪使用有上下緩衝格的連續 strip、加速／減速曲線與短回彈；大格擴張時後方的小轉輪繼續轉。FG 集能、升倍與加局依序呈現。

WILD 角色預載 NG／FG 各片段，使用原片的 500 ms In、1,000 ms Loop、1,000 ms Out、約 1,533 ms Back；出擊對齊完整 Loop 邊界。播放器只在切段時對時，移除每 200 ms 的漂移 seek，加入 110 ms 混合，並修正混合時 packed alpha 的預乘處理。下一段未就緒時保留上一段畫面；原始影片未改寫。變牌特效依來源約 30 fps 播放前段，保留 Success 最後一格至淡出（原曲線在 0.5–1.0 秒保持該格），成功與失敗都按來源 1 秒透明度曲線淡出。

音效最多 12 聲部，人物語音互斥、背景音交叉淡入並在演出時壓低；按鍵解鎖音訊。CueCursor 以 presentationId 分局，避免連續兩本 reveal index 同為 0 時漏音效；Stop 不補播跳過的音效。

驗證：`pnpm check:presentation` 的 5 項測試通過，涵蓋全部參考事件書的 NG／FG、Normal／Turbo、轉輪連續性、連局音效與兩款 WILD 片段邊界；production build 通過。數學規則未更改。原始 30 fps 影片保留原幀率，整體 rAF 視覺動畫隨瀏覽器更新。

本機瀏覽器驗收：新版播放器連續兩局 WILD（每局 13.00，虛擬餘額 10,000 → 10,012 → 10,024）均完成並恢復控制列；FG 參考案例跑完 9 局，經過 ×2 升倍與加局後返回主遊戲，總派彩 184.70，虛擬餘額 10,183.70，與事件書一致。兩種流程均無瀏覽器 error。

5×5 大格擴張案例亦完成停輪與 0.80 派彩，虛擬餘額 9,999.80，控制列恢復；瀏覽器無 error。預覽圖片取自 production build 實際渲染。

預覽包裝頁的 iframe 從 base 導航至 free 時另記錄過一次未附來源 URL 的 `MutationObserver.observe` 非 Node 錯誤，畫面仍正常完成。原生牌局頁的上述三種流程沒有此錯誤；目前尚未確認是瀏覽器注入工具或 Pixi accessibility 在導航期間的生命週期問題，後續若重現需保留 stack 追查。

新版預覽在 `E:/stake/deliverables/血月伯爵預覽/吸血鬼UI主遊戲.jpg`、`吸血鬼UI免費遊戲.jpg`；`WILD音效節奏示範.mp3` 是以同一 cue 計畫離線混音的節奏示範，並非瀏覽器實錄。逐幀原版對照與正式 RGS 驗證仍待後續完成。

`WILD角色銜接預覽.mp4` 是同一角色片段計畫的離線合成示範，方便檢視起手、循環、出擊、回場、得分與 Idle 的銜接，不代表完整遊戲實錄。先執行 `pnpm preview:plans`，再以工作區 Python 執行 `scripts/render_character_preview.py`、`scripts/render_audio_preview.py` 即可重建兩份媒體。

## 整體動態與方框主視覺

2026-11-06：主盤面改用正方形構圖。`src/game/geometry.ts` 統一 108×108 格、648×648 盤面與 704×704 外框；bar/head 仍使用原協定的格數。`scripts/build_square_frame.mjs` 產生黑曜石、古金、血紅寶石的 SVG／PNG 方框，包含 NG、FG、WILD 三種外觀與金／紅光層，保留換皮入口。執行 `pnpm art:frame` 可重建。原城堡盤框的來源參考位於 `E:/stake/星城抄錄/血月伯爵/extracted/game145`，不再隨前端攜帶未使用副本；背景和角色仍使用原素材。

角色目前為 475×750，位置 (960,-65)，在新的 780 高演出區維持大角色比例；窄版使用較寬的舞台邊界，完整保留角色與倍數階梯。大格、盤外 head 裁切、紅霧、變牌、中獎線與集能路徑全部跟隨正方形格距。

- 背景：NG／FG 漸變、月光呼吸、原素材薄霧、飄塵、原蝙蝠圖集、樹影；WILD 期間依來源 Red In／Out 的方向漸變血紅色。牌局演出共用時序計畫，背景使用輕量 rAF 時鐘。
- 轉輪與中獎：連續 strip、大格擴張、停輪回彈、逐線亮獎、沿線光點、得分跳動與倍率合併。
- 大獎：Big／Super／Mega／Epic 逐層標題、原始標題美術、計分、粒子、全畫面暗幕與進退場。門檻 20／50／100／200× 是美術演出選擇，不是原版機率或數學規則。
- FG：進出場月亮／煙霧／徽章、背景交叉淡入、點數集能、升倍彈跳、加局飛字與總得分結算。保留原 6 局、每 12 點 +3 局及本局使用新倍率的規則。
- 音訊：原始人物、轉輪、WILD、FG、加局、升倍、計分、大獎開場與循環；背景音樂交叉淡入及壓低，人物與 fanfare 分組互斥，最多 12 個單次聲部。靜音套用到全部通道，跳過會收掉音效，頁面隱藏暫停音訊，返回時不補播過期 cue。
- 動態偏好：背景位移、飄塵、蝙蝠、非必要震動與彈跳尊重 `prefers-reduced-motion`；必要的牌局結果仍完整呈現。

`pnpm check:presentation` 目前有 11 項測試，包含所有參考書的方格覆蓋／無重疊、Normal／Turbo 時序、精確計分、FG 背景銜接、音效資源、連局、隱藏頁面、靜音與播放器清理。production build 通過。數學輸出未改動。

本機額外預覽：`?preview=base&scenario=bigwin` 使用 base 參考書中最高派彩的一本（198.80×）；`?preview=win&rank=big|super|mega|epic` 直接播放相應的真實參考 winInfo，供美術檢查，不進行下注或結算。全部限於沒有 RGS/session 的本機路徑。

`preview.html?scene=base&scenario=wild&record=1&seconds=14` 與 `scenario=bigwin&seconds=14` 會出現明確的錄製按鈕，擷取實際遊戲 canvas 為 WebM。影片為無聲實錄；`完整演出音效串接示範.mp3` 是同一計畫的 23 秒音效串接示範，含 WILD、FG 進場、集能、Epic 與 FG 結算，並非現場錄音。執行 `pnpm preview:plans` 後以工作區 Python 執行 `scripts/render_showcase_audio.py` 可重建音效示範。

最終方框版瀏覽器驗收：完整 FG 9 局回到 NG，總派彩 184.70、虛擬餘額 10,183.70；Turbo + Stop 在約 1 秒內進入得分演出，仍以 13.00 派彩、10,012.00 餘額完成並恢復按鈕；另錄製正常 WILD 與 198.80 大格大獎流程。這些原生牌局與最後錄製頁均無瀏覽器 error。先前 iframe 導航的孤立 MutationObserver 記錄仍保留供追查。

本輪長期預覽與原始 WebM 封存在 `E:/stake/archive/deliverables/血月伯爵/2026-11-06-方框動態版`，包含方框主遊戲／FG 截圖、WILD／大格大獎無聲實錄、音效串接示範與驗收截圖。MP4 為原始 WebM 轉碼，未使用影格插補；角色原影片仍為 30 fps。

上述完成的是目前已定義的主遊戲、WILD 與 FG 演出。原翻牌 BONUS、原版機率／RTP、逐幀原錄影對齊、真實 RGS／回放與 SDK 派彩精度問題，仍沿用前述限制，不可宣稱 100% 原版或正式發行包。

## 四階大獎精修續作

四階大獎已接入原版 Spine 4.1 骨架、網格變形與場景特效，搭配逐階標題衝擊、餘震、牌匾、數字、粒子及音效。初版以 app 專用 WebGL 4.1 畫布橋接；2026-11-07 已改為 `@esotericsoftware/spine-core@4.1.56` 加原生 Pixi 8 網格，避免改動共用 4.2 runtime。原始骨架 JSON、圖集文字與 PNG 均保持 SHA256 不變。初版對圖集尺寸的判斷錯誤，改寫 UV 造成破圖，已由下方「破圖與繪製效能修復」取代。`pnpm art:win` 可重建牌匾與光芒。

`preview.html` 的錄製模式已接入遊戲混音輸出，不使用麥克風。初步 IAB 錄影曾只有每秒約一格，後續改成明確的錄影更新時鐘、等待 Svelte 更新與 Pixi 繪製完成後才 `requestFrame()`，並為預覽頁及 helper 加上版本參數，已取得 682 個實際畫格／15.82 秒的 Epic 實錄（平均 43.06 fps、95% 畫格間距 39 ms）。這是該次桌面錄影的數值，不代表全裝置 60 fps。原始角色影片仍為 30 fps，不使用光流補幀。

## 未使用套版檔案清理

2026-11-06 依使用者要求，只清理本款前端。核對路由、元件、動態與 type import、素材登錄表、Spine 圖集依賴、音效 cue 及共用 UI theme 後，移除 321 個檔案（60.27 MiB）：舊猴子／礦坑美術、音效、骨架、未引用的 90 個元件與遊戲模組、GoBoomana 專用設計腳本、完成的一次性遷移腳本，以及已被方框構圖取代的舊匯出素材。`static/assets` 只保留 UI 仍使用的 9 個單色按鈕圖示。原 GoBoomana 專案與星城來源均未改動。

`bloodmoonConfig.json` 雖非目前前端的執行時依賴，仍作為數學輸出的規格契約保留。角色影片、WILD 特效序列、FG 倍數、方框、吸血鬼 UI、四階大獎骨架及授權檔保留。`prepare_assets.py` 與兩份素材 manifest 已同步刪除未使用項目，避免重新準備時復生。

參考牌局 JSON 以相同值與事件重新序列化，18,475,246 → 4,229,547 bytes；`pnpm build` 會先執行 `compact_demo.mjs`，所以數學端重新產生有縮排的資料後，下次前端建置仍會自動縮小。新增 `pnpm check:assets`，核對 298 個素材檔、manifest 一致性、匯出檔案大小與 SHA256、Spine 圖集頁面及 UI 圖示。

清理前後（MiB，檔案內容總長，非壓縮包）：static 139.59 → 66.82、build 142.31 → 69.53、.svelte-kit 145.77 → 72.97。含程式及重建副本共減少約 219.45 MiB；外部原始碼備份約 0.47 MiB。額外清除 `.svelte-kit/output` 的動作被自動政策審核拒絕，未另行刪除；目前保留正常建置快取。

清單與恢復資訊：`E:/stake/archive/research/血月伯爵/2026-11-06-前端清理/cleanup-manifest.json`。小型程式／設定原檔封存於同目錄 `source-backup.zip`；大型套版素材逐檔確認與原 GoBoomana 的 SHA256 相同，清單記載原始位置，避免為備份再複製一份大檔。

清理後驗證：production build 完成；298 檔素材校驗、16 項演出／音訊／Spine／時鐘測試及 403 本獨立規則核對通過。實際主遊戲 WILD 完成，派彩 13.00、虛擬餘額 10,012.00；FG 場景與倍數顯示完整，兩種場景無瀏覽器 error。截圖在 `E:/stake/tmp/bloodmoon-cleanup-main.png`、`bloodmoon-cleanup-free.png`。本輪沒有改動數學規則。

## 動畫連續性與自然化（2026-11-07 續作）

- 伯爵切段改為單次濾鏡混合兩份解包後的預乘透明像素，避免兩層 Sprite 各自淡入淡出造成交疊時不透明度下降；切段混合為 140 ms。保留原片幀率與一次入段對時，不反覆 seek。
- 大獎標題的縮放原先在撞擊瞬間跳變 4–5%，改成撞擊前壓縮、連續的接觸曲線與有起步緩衝的阻尼回彈；降低高頻震動，牌匾保留稍後跟隨的動作。升階場景混合改為 320 ms 平滑曲線，粒子發射先漸亮。
- 大獎碎光與拖尾使用固定的 Sprite 池及三張程式產生的共用小貼圖，替代每幀重畫大量 Graphics 路徑；結束時釋放 Sprite 與貼圖，未新增外部美術檔。
- 轉輪落定回彈在起點與終點均為零速度；背景飄塵在畫面邊緣漸淡，集能光點也有進出場亮度包絡。
- `MotionClock` 排除隱藏分頁經過的時間，角色影片同步暫停／恢復，回到遊戲時不跳過整段演出。Stop 仍直接完成當前事件時鐘，規則與派彩未更動。
- 預覽錄影只在場景、音訊及操作 helper 就緒後啟用按鈕；明確取幀完成後下載，結束時恢復原畫質與更新方式。此功能限本機 iframe，不影響正式 RGS 路徑。

目前 18 項測試涵蓋接觸前後的位置／速度連續性、停輪、隱藏分頁時間、原骨架變形、音效及原有參考事件書。最近一次在主機資源壓力下並行啟動測試遇到 Windows WSAStartup 初始化失敗，改以 `--test-concurrency=1` 重跑，18 項全部通過，未調高任何型別檢查基準。

本輪瀏覽器驗收：正常 WILD 完成 13.00 派彩、餘額 10,012.00；完整 FG 九局經升倍與加局後返回 NG，總派彩 184.70、餘額 10,183.70。兩條流程無瀏覽器 error。QA 截圖為 `E:/stake/tmp/bloodmoon-smooth-wild-final.png`、`bloodmoon-smooth-fg-final.png`。

曾試作轉輪期間分批預熱特效貼圖，錄影實測未改善，已移除；不以該嘗試宣稱效能提升。IAB 錄製速度仍受主機及頁面載入影響，應區分遊戲更新幀數、實際影片畫格與原影片幀率。

本輪可觀看的有聲預覽位於 `E:/stake/archive/deliverables/血月伯爵/2026-11-06-大獎精修版`：`四階大獎精修實錄.mp4`（682 個實際畫格，原始實錄平均 43.06 fps）與 `WILD順暢音效實錄.mp4`（337 個實際畫格，原始實錄平均 24.74 fps）。兩份 MP4 與原始 WebM 保持相同畫格數，未使用光流補間；同名 `-驗收.json` 記錄時間、間距與音訊峰值。大獎檔已取代原本的每秒一格初稿。

以上預覽採用前次較穩定、已包含本輪核心動作改版的實錄。2026-11-07 的後續 IAB 重錄仍有明顯波動：WILD 209 格／13.18 秒、Epic 207 格／15.36 秒；兩者無瀏覽器 error，但不可作為全程 60 fps 的效能證明。需在穩定的部署預覽或目標裝置進行獨立幀時間量測，才能下整體效能結論。

最終來源已移除預熱實驗，production build 與 18 項測試通過，298 檔素材校驗通過；預覽伺服器已停止。原數學、RGS 與逐幀原版對齊的限制仍適用。

## 破圖與繪製效能修復（2026-11-07）

使用者回報大獎破圖後，核對原始 atlas 與 PNG：Big 的邏輯頁面為 2044²、Super 為 1928²、Mega 為 2048²、Epic 為 1944²；解碼圖片都是 2048²。這些圖片是整體縮放，而非補邊。初版將 UV 乘上「邏輯尺寸／解碼尺寸」，又讓 MeshAttachment 用解碼尺寸處理 trim／rotation，因而讀到相鄰圖塊。`bindResizedWinPage` 現在讓 Spine 所有座標計算都使用原 atlas 邏輯尺寸；Pixi 另用實際圖片尺寸上傳。`validateWinAtlas` 只檢查，不再改 UV。

`NativeWinRig` 由原版 4.1 core 計算 bones、path constraints、deform、sequence 與 drawOrder，直接更新主 Pixi renderer 的 MeshGeometry。包含蝙蝠序列換格時同步更新 UV，以及 normal／additive 混合。來源有 99／26／49／51 張網格，沒有 clipping 或 two-colour tint；遇到新增的 two-colour tint 會明確拒絕，不默默顯示錯誤。來源 PNG 的 `pma:true` 在載入 ImageBitmap 前即傳入 Pixi，避免二次預乘造成暗邊。

已移除第二個 WebGL context、1024×640 中介畫布、每幀 `gl.flush`／Canvas 上傳及固定矩形裁切。四張共享圖集只在載入時上傳；原本每幀至少搬運的 RGBA 表面為 2,621,440 bytes。計分改為兩組預先產生的 BitmapFont 字形與 BitmapText，避免每次跳數重畫兩份有陰影的文字 Canvas。原 WebGL runtime 依賴已移除，只保留 app 專用 core 4.1.56。

背景：保留原始 1280×720 PNG，取消額外 3.5% 放大和整張背景的次像素漂移；遮罩 alpha 由 .16 降至 .055，霧由三層改為兩層並降低濃度、FG glow 降低。沒有新增全畫面的銳化濾鏡；原始素材本身的柔焦畫風未改寫。

20 項測試核對四階完整動畫的世界頂點、UV、序列、圖層順序、原始檔 hash 與舊有演出／音效／停輪；另有 Super 背景區域的明確 UV 邊界回歸測試。修正 app tsconfig 的 JSON 型別解析及 SvelteKit ambient 引用後，新繪製模組無型別錯誤；全專案型別 gate 仍有既有 RGS fetcher、公用環境變數及 actor／模式整合錯誤，未提高 baseline。

瀏覽器 QA 限制：工具回報「Local browser use is disabled in Work settings」，未改設定，也未使用其他瀏覽器控制路徑替代。因此本輪未量到實機 FPS，亦沒有新的瀏覽器實錄。`scripts/export_win_reference.ts` 直接匯出原生網格，`render_win_reference.py` 以 CPU 參考光柵化逐圖對照，明確標示為離線渲染。四階 360 次 pose／mesh 更新的 CPU 中位數約 .016–.123 ms、P95 約 .032–.507 ms；不含 GPU、文字、角色、背景、主畫布與錄影，不能換算成整體遊戲 FPS。

離線破圖／背景對照與 profile 封存在 `E:/stake/archive/deliverables/血月伯爵/2026-11-07-破圖與效能修復`。先前 `2026-11-06-大獎精修版` 的影片仍含舊 UV 問題，不可當作此版成果；等本機瀏覽器操作可用後，必須再驗收四階大獎、完整 WILD／FG、字形顯示、透明混合與實際幀時間。

## 轉輪與粒子配置優化（2026-11-07 續作）

`ReelView` 以 108 個預先配置的原生 Sprite 保留六組窄軸與六組可能的大格軸；跨格時只換貼圖和位置，不再依每個邏輯 index 建立／移除 Svelte 符號元件。合併步驟、停輪時間、WILD 目標與換牌時點在新 reveal 時準備，逐幀繪製不再產生整份 tile 描述陣列。保留全部 14 個符號（包含 12／13 的 WILD）、原加減速、回彈、合併遮罩、head 裁切與逐線亮獎。

背景 28 顆浮塵與轉場 18 顆浮塵共用各自的不可變圓形幾何；FG 集能預先配置 36 個光點、每個三層光暈，共享一份足夠細緻的圓形幾何，只更新位置與透明度。中獎線框用物件 alpha 呼吸、沿線亮點移動既有圓形，標題掃光移動固定多邊形遮罩，暗幕與人物腳下陰影也不再因 alpha 改變而重建路徑。

大獎的 194 個粒子／拖尾／環物件及三張小貼圖改在閒置時準備並上傳，演出結束後隱藏、重複使用，卸載遊戲才釋放。粒子方向預先計算，逐幀樣本寫回同一份資料。FG 結算總獎金也改用既有 BitmapFont 字形；大獎與 FG 共用各自預建的 Intl 格式器。角色影片的原 30 fps、切段混合與背景清晰度保持前輪設定。

驗證：25 項演出／音訊／網格／時鐘／物件池測試通過。以舊版獨立參考計算比對所有 1,945 次 reveal、Normal／Turbo 共 137,014 個時點，包含合併起終點、停輪邊界、每個 WILD 結果前後、大格亮獎與 Stop 終點，符號／位置／尺寸／透明度一致；108 個符號物件從建立到測試結束均為同一批，沒有逐幀配置或替換。production build 與 298 個素材校驗通過。全專案仍為原有 12 個型別錯誤，本輪新增模組沒有型別錯誤，未提高 baseline。

`scripts/profile_render_pools.ts` 記錄離線 CPU 與場景圖操作；六格大軸參考演出原鍵值軌跡產生 916 次建立、914 次移除，原生池在轉動期間均為零。這是依舊版 keyed 元件的鍵值追蹤得出的配置次數，不是瀏覽器實測。CPU profile 不包含 Svelte flush、GPU、貼圖上傳或影片解碼，不能換算成遊戲 FPS。本機瀏覽器操作先前被 Work 設定停用，本輪沒有啟動預覽伺服器或繞過限制，實機幀時間、透明混合和完整 WILD／FG／四階大獎仍待瀏覽器驗收。

離線 profile、測試／建置記錄與來源雜湊封存：`E:/stake/archive/deliverables/血月伯爵/2026-11-07-轉輪與粒子優化`。這輪沒有新增美術大檔、外部依賴或改動數學規則。

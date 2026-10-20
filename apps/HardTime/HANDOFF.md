# Hard Time — 交接文件

## 2026-10-20 — Spine v2 重切、補畫及動作接入

依 `design/cast_brief/spine_v2/README.md`：內建 imagegen 產出 P1–P4、W1–W4 及獨立的 P2_under，
保存在 `design/_incoming/spine_v2/`。囚犯 15 層、典獄長 20 層，來源切件與 atlas 均可重建。
兩節腿以四個 IK 約束固定腳踝；雙臂、手掌、毛巾及配件獨立；3–6 秒隨機眨眼。
保留先前兩人在盤面兩側與共用待機時鐘的工作，典獄長修正為朝盤面；警棍前臂在軀幹前，
反應時只將該前臂、棍與手指疊到盤框前，與本體共用已解算矩陣，不會整個人蓋住盤面。

修掉把全身圖裁成褲子時、誤把垂下手掌留在大腿切片的殘影；guard 會檢查這個區域。
`pnpm build` 與 `pnpm check:cast-spine` 通過；實際 runtime 每人 363 格、零翻面、腳踝誤差 < 1e-6 art px。
4:3／16:10／16:9 都已看反應峰值，眨眼已看；本機 stub 轉一局完成且 console 零 error。
完整型別檢查仍有既有 design／共享套件診斷，新 CastSpine 元件沒有型別錯誤。

殘影複查（同日晚）：囚犯軀幹接縫、左上臂裡的右手手指、毛巾殘條三處會在手臂收緊／毛巾晃動時露出，已修；
典獄長警棍改到軀幹後、前景副本只疊在轉輪層之上。`design/check_cast_spine_holes.py` 量靜止時與原圖一致（0 破洞）。
詳細重建步驟、提示詞、標準 underlay audit 對交叉手臂的誤報說明、六組 GIF 及盤面截圖：
`design/source/spine_v2/README.md`。本機 playtest 已更新；**未重新打包、未上傳或發布平台版本**。

## 2026-09-25 角色分層完成

囚犯改用 `CastFigureMesh.svelte` → `LayeredFigure` 四層網格、共用骨架；圖層與 PSD 在 [design/cast_parts/base](design/cast_parts/base/README.md)，遊戲資產在 `static/assets/castLayers/prisoner/`。待機／win／winBig／trigger 已接線，外側手掌在最大動作仍保留螢幕留白。原有 `castMotion.ts` 的並行修改未回退，新手臂幅度及解剖左右適配在 `layeredCastMotion.ts`。

新增 `check_layered_cast.mjs` 已加入 build：3,232 姿勢、1×/2×/4×、翻面 0、面積比 0.862–1.147；PNG／PSD／空隙驗證在 `check_layered_art.py`。正式建置與新角色 TS 模組通過，整個專案的 `check:types` 仍有其他診斷，詳見交付 README。瀏覽器已看過三種反應與完整盤面事件。尚未上傳 Stake。

最後更新：2026-09-15（第一次打包；pre-submission QA 全數完成）

Capo Nostra 的換皮，但**數學核心重寫**：Vault Frame 整個拿掉，改由探照燈（Searchlight）
承載倍率。完整規格見 [SPEC.md](SPEC.md)，美術與音效規則見
[ART_AUDIO_BRIEF.md](ART_AUDIO_BRIEF.md)。

> 這份檔案在 2026-09-15 以前是 **Capo Nostra 的 HANDOFF.md 原封不動的副本**（與
> `wp/apps/CapoNostra/HANDOFF.md` 逐位元組相同、零處提到 Hard Time），跟
> `ART_BRIEF.md`、`ART_STATUS.md` 一起被 scaffold 帶進來。原件仍在 CapoNostra，
> 本檔從此只記 Hard Time。

---

## 1. 與 Capo Nostra 的差異

| 項目 | Capo Nostra | Hard Time |
|---|---|---|
| 倍率來源 | Vault Frame 1×1/2×2/3×3 | **無框**；探照燈照到的每一格各帶倍率 |
| 擴展 Wild | Tommy Gun，填滿整列 | 探照燈，**只從落點往下** |
| FG Wild | 不黏 | **黏到 FG 結束** |
| 同輪再落燈 | — | 重疊格 ×2（「輪」＝輪軸，見記憶 `lun-means-reel`） |
| FG 手數 | 10 | **8** |
| 層級 | SOLDIER / CAPO / THE DON | **LOCKDOWN / RIOT / BREAKOUT** |
| 上限 | 20,000× | **12,000×** |
| 買入價 | 100 / 500 / 1000 | **100 / 300 / 600** |

## 2. 數學（最終）

| mode | cost | RTP | etl10k (≤0.8) | etl40b (≤0.9) | max win |
|---|---|---|---|---|---|
| base | 1 | 94.58% | 0.0021 | 0.7222 | 1 / 8,000,001 |
| bonus | 100 | 94.63% | 0.1648 | 0.4894 | 1 / 120,000 |
| bonus_hits | 300 | 94.67% | 0.5452 | 0.3000 | 1 / 40,000 |
| bonus_epic | 600 | 94.78% | 0.7540 | 0.0000 | 1 / 20,000 |

四模式差距 0.20%。`design/check_searchlight.py` 驗機制：10 萬本書、271,105 盞燈、
88,841 個翻倍格，零違規。

### 每次重跑都會再撞到的四件事

1. **賠付值必須是 0.1 的倍數**——`verify_lookup_format` 在書和 Rust optimizer 都跑完
   之後的最後一步才斷言 `payout % 10 == 0`。
2. **`etl10k` / `etl40b` 不是機率**，是「≥門檻的贏分帶走的回報」，不除以成本。
3. **三個 freegame criteria 都需要頂段抑制器**——母體只調過 strong。
4. **scale_factor 與指標不是 1:1**——砍 3 倍只換到 1.4 倍改善。

### 硬約束：頂層買入價 ≤ ~646×

```
etl10k 地板 = wincap 切片 rtp × 模式成本
```

四個模式實測成立。bonus_epic 在 600× 時地板 0.600（算術、不會漂移），只有 0.154
會變。**價格本身就是上限**：第一次跑失敗在 1.4639，是因為繼承的 1000× 讓地板單獨就
1.000——在產出第一本書之前就超標，任何 scale_factor 都救不回來。已寫進
`game_optimization.py` 檔頭。

### 已決定、不要翻案

- **BREAKOUT 的「每手保證一盞」關閉**——與黏性在數學上互斥（開著 100% 撞頂）。
- **0.754 / 0.800 不是 6% 餘裕**——不要再壓 `(10000, 11999)` 抑制器，那是在打可動的 20%。

## 3. 前端

- 書事件 `newFrames/updateFrames/frameDoubling/wildExpand` → `searchlight/updateLights`。
- `NeonFrames.svelte` → `Searchlights.svelte`（**逐格**，不是逐光束）。
- `WildColumns.svelte` 從落點往下掃，時長隨光束長度縮放。
- 取消母體「轉輪還在轉就先畫框」——光束是燈落下之後的因果結果。
- 音效：`sfx_light_land` → `sfx_light_sweep_{1..4}`（依光束長度）→ `sfx_light_double`，
  以 AudioBuffer 時長實測驗證。

### 3.1 角色網格（2026-09-17 移植 Capo 的修正）

原狀：`meshRigs/cast_guy/guy.rig.json` 跟 Hot Miami v0 的
`guy_full_standalone_sleeveless.rig.json` **逐位元組相同**——綁的是另一個人。
手臂骨頭落在囚服前襟和褲管上（arm_l+fore_l 擁有左上袖 0.13、左前臂+手 0.32；
右側 0.00 / 0.13），動作表是 Capo 09-10 的 raw-Spine 版，gate 沒有網格規則。
**線上版本 trigger 摺到 3.6%**。

現狀（`design/_legacy_assets/cast_guy_hotmiami_v0_rig/` 留舊版）：

- `design/build_cast_guy_rig.py`：Capo 的量測骨架線方法，**rig 空間維持 512x1024**
  （使用者決定；prisoner.png 是 441x1100，一直被拉寬 16% 顯示），`figure_box` 保留
  舊值 (134,86,403,887) 以免人物在畫面上縮小、位移。平滑 2 次——他的**手離褲管只有
  5–10px**，一格 32px，剪力只能選擇落在手指還是褲邊；2 次是兩者都 1.36 的點，
  依實際 trigger 姿勢渲染選定。手臂自有權重 0.58 / 0.69 / 0.56 / 0.72。
- `src/game/castMotion.ts` / `skinnedFigure.ts`：Capo 的移植版（程式碼與 Capo 相同，
  只有註解不同），**arm_l 主動**（使用者選 B；網格上 A/B 幾乎打平 72.2% vs 71.0%）。
- `design/check_cast_motion.mjs`：Capo 改寫過的規則 1/3/6/6b/8/10，加上**規則 11：
  手臂骨頭在手臂上**（`design/cast_guy_arm_regions.json`，建 rig 腳本讀同一份）。
  已注入驗證：舊 rig 會被規則 11 擋、舊表會被規則 1/6/6b 擋。規則 10 **擋不住**
  舊 rig（骨頭不在手臂上時什麼都不會摺，也什麼都不會動）。
- `JOINT_LIMIT_DEG` 在新 rig 上**幾何 + 目視**重量：arm 4.5/4.5、fore 7/6、
  chest 8、neck 9、head 20、hips 8、waist 12。幾何值（`design/measure_joint_limits.mjs`）
  arm_l 7.5 但 -5 度手指就變尖——面積沒變，所以只有目視抓得到。
- `design/measure_cast_travel.mjs`：呼叫共用數學、預算頭部**自身**擺動（扣掉根部抬升），
  上限 3.0 / 4.5 / 6.0%（實測 2.57 / 3.87 / 5.17 的 1.15 倍）。
- 規則 10：idle 84%、win 79%、winBig 75%、trigger 71% / 1.28x，0 翻轉。
- 瀏覽器（playtest 殼、兩次 win）：抬升 18.0px（= win 層 2.25%×801）、主動左臂肩到指尖
  1.022x、支撐右臂 0.980x、無 glow。trigger 層未在瀏覽器觸發，只有 gate 量測。

重畫囚犯時：重描 `cast_guy_arm_regions.json` 和 `ARMS` 關節線，重跑
`measure_joint_limits.mjs`，再**目視**一遍——rig、權重、極限都屬於那張圖。

## 4. 換皮繼承、而且沒有任何 guard 抓得到的缺陷

全部修正並對 build 驗證。字串都合法、資產都解析、build 全綠——所以 guard 看不見：

- 免責聲明用了**審查已退過的** `Silverstars Studio`（應為審查指定的 `TM and © 2026 Engine.`）
- `explainInsufficientBalance` 從未 opt-in——**CapoNostra 本身也還沒修**
- 賠付表整張是 Capo 的符號名（Signet Ring / Briefcase / Tommy Gun…）
- `FREE_SPINS = 10`、`baseFreeSpins = 10`、三處 `?? 20000` fallback
- 賠付表把 Tommy Gun 的「填滿整列」寫在 Searchlight 名下
- `wp/apps/HardTime/math/` 整包是 **Hot Miami 的數學**（`game_id = "hot_miami"`），已刪
- 出貨包帶著 `audio/capo/`（含 `sw_gunfire.wav`）、Hot Miami 女性角色的 spine + mesh rig
- 角色 mesh rig 是 Hot Miami 的、骨頭不在囚犯手臂上，動作表是 Capo 已退件的 09-10 版
  （2026-09-17 修，見 §3.1）

## 5. QA 結果

| 項目 | 結果 |
|---|---|
| review-findings 五項 | ①②原本壞、已修；③④⑤通過 |
| 三層 + retrigger | 書 11 / 195 / 50 / 5313 全對帳 |
| 大獎橫幅雙層變暗 | 430 幀最差世界 alpha 1.000、零缺符號 |
| 直式控制項 | 首轉後全部存活 |
| 限制詞 guard | 注入驗證兩條規則都會叫 |
| Replay | 六項全過（含重播 WIN 歸零） |
| 商店縮圖頭頂 | 40px → 104px（縮 93% 底部對齊，原圖在 `design/source/hardTime/tile/`） |

## 6. 打包

`design/ship.sh`（第一次打包就寫成腳本）。`./design/ship.sh --check` 只跑 gate。

### 2026-09-15 第一次打包

最終出貨（ship run #4，2026-09-15 20:50，從最終 src 建出）：

| zip | 大小 |
|---|---|
| `upload/HardTime-frontend.zip` | 45.7 MB |
| `upload/HardTime-math.zip` | 100.3 MB |
| `upload/HardTime-upload.zip`（frontend + math + thumbnail + README） | 148.3 MB |

gate `all clean`（腳本真正結束碼 0，讀自 log 而非背景通知）。出貨 bundle 與最終 src
快照做正規化比對內容相同。

出貨包清掉的東西（全部是換皮繼承、gate 原本看不到的）：

| 移除 | 大小 | 為什麼沒被抓到 |
|---|---|---|
| `assets/audio/capo/`（含 Tommy Gun 的 `sw_gunfire.wav`） | 11 MB | gate 只掃 `assets/sprites` |
| `assets/spines/cast_guy` + `cast_girl` | 5.4 MB | 帶 `preload: true`、每次開機都載入，但 `CastFigureSpine` 從未掛載 |
| `assets/meshRigs/cast_girl`（Hot Miami 的女性角色） | 7.5 MB | `new URL(..., import.meta.url)` 會被 Vite **無條件打包**，即使 `who` 寫死 `"guy"` 從不 fetch |
| `wp/apps/HardTime/math/`（Hot Miami 的數學原始碼） | — | 不在出貨包，但放在 app 目錄裡看起來像權威來源 |

出貨 frontend zip 68 MB → 46 MB。

### build 不是確定性的——不要直接比 hash

同一份 src 建兩次，`index.html` 的 sha 一定不同。三種雜訊：

- `__sveltekit_xxxxxx`——每次 build 隨機產生的全域名
- `cY="1789…"`——13 位數的 build 時間戳
- `bundle.XXXXXXXX`——chunk 內容雜湊（chunk 內嵌了上面兩個，所以跟著變）

要證明「兩次 build 內容相同」，先把這三種正規化掉再比，並**確認正規化器真的有命中**
（否則空集合比對會假通過）。2026-09-15 用這個方法證明：只改註解後重建，內容與已上傳的包
完全一致（正規化後 sha `c1a476b74529d0f9`；三種雜訊各命中 7／1／63 處）。直接比 hash
那一次回報的 `DIFFERENT` 從一開始就證明不了任何事。

### 刻意保留

`assets/sprites/uiSlotsAssetsBespoke/`（152 KB，autospin/turbo 啟用狀態圖）沒有任何引用，
但它是**樣板層級**、主題中立（灰底紫光圈），8 個兄弟 app 都有，包括通過審查的 Hot Miami。
不是換皮殘留，所以不刪。

### gate 自己出過的錯（修 gate 時請先注入污染證明它會叫）

- 第一版 grep `"12000"`，但 minifier 寫成 `12e3` → 把正確的包報成壞的。
- 第一版只掃 `assets/sprites` → 對一個正在出貨 `audio/capo/` 的包報「all clean」。
  是**列 zip 內容**抓到的，不是 gate。

## 7. 測試環境的坑

- `preview_start` 開的是**不帶查詢字串的裸網址**，會留下一條
  `ERR_NAME_NOT_RESOLVED / Failed to fetch` 緩衝訊息——不是遊戲缺陷。
  一律用 `?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en`。
- 改完 `dist/hardtime-playtest/stub.js` 要加 `?v=` 版本號，否則瀏覽器跑快取的舊版。
- 抓場景樹的探針要**每次取樣重新解析**；存下的節點參照在盤面重建後就脫離了。

## 8. 2026-09-20 重新打包（09-17 的角色 rig 修正終於進包）

Capo Nostra 清掉兩項換皮殘留之後，順手檢查 Hard Time —— **這兩項在 09-15 的 ship run
就已經從原始碼清掉了**，這次沒有東西可刪：

- `static/assets/spines/`：不存在（`CastFigureSpine.svelte` 也不在）。
- `sprites/hotMiamiParts/`：不存在，`assets.ts` 只剩一行孤兒註解。
- `assets/audio/capo/`：不存在。

所以這次打包的實質內容是**把 2026-09-17 的角色 rig 修正送進出貨包** —— 那一輪（§3.1，
rig 重綁、手臂骨真的落在手臂上、規則 11）做完之後沒有重打，線上包一直是 09-16 的版本。

`./design/ship.sh` 一次跑完，`checks` 回報 `all clean`：

| zip | 09-16 | 09-20 |
|---|---|---|
| `HardTime-frontend.zip` | 45.7 MB | **44 MB** |
| `HardTime-math.zip` | 100.3 MB | 100 MB（math 未動） |
| `HardTime-upload.zip` | 148.3 MB | **147 MB** |

實機驗證（playtest shell）：開場頁與盤面都正常，轉三手（餘額 1000→997），探照燈照亮
一整輪、格子帶 1x、兩條線各中 $0.20，**console 零錯誤**；
`performance.getEntriesByType('resource')` 實測 spines 0 筆、hotMiamiParts 0 筆、
`capo/` 音效 0 筆，`guy.rig.json` 有載入。

**未上傳到平台。**

⚠ **未決**：Hard Time 的 `castMotion.ts` 仍是抄錄版（`fromReference` + 擠壓拉伸），
也就是 Capo Nostra 在 2026-09-20 被使用者要求換掉的那一套。這次沒有動它 —— 使用者只
交代清資產與打包。要不要跟著改成 Hot Miami 的寫法，等使用者決定。


## 2026-09-23 — 手臂改剛性＋FG 結算置中（跟 Turf War 同一批問題）

使用者在 Turf War 回報「手很怪，很像沒骨頭一樣，參考 miami 或 deadwood」與「FG 結束後贏分沒置中」，要求檢查 Hard Time。兩項都有。

**手臂。** 量描好的手臂區域（`design/cast_guy_arm_regions.json`）內的頂點，偏離「最佳剛體擬合」的最大距離，以身高的千分比表示：
反應時左上袖 10.7‰→4.5‰、右前臂＋手 7.6‰→3.1‰；待機時左前臂＋手 4.9‰→2.8‰。
原因跟 Turf 一樣：抄錄版讓主動臂沿著自己拉長 1.23x（16x40 的格子上整條手臂沒辦法一起縮放，所以會彎）；
待機手臂 1.6／1.2／1.5／1.1°，大約是 Hot Miami 的兩倍。
改法：`castMotion.ts` 的 `ARM_BONES` 不吃擠壓伸展（`BODY_SCALE_SHAPE`），待機四根手臂骨改用 Hot Miami 的值（0.88／0.66／0.825／0.605）。
脊椎、頭、抬升、側移、胸頸擠壓和反應角度仍是抄錄版。
gate rule 6 原本「要求一定有一隻手臂拉長」，現在**反過來**改成「手臂不得有擠壓伸展」；
新增 `--motion=` 參數，已驗證舊的動作表會被擋下。修改前的 castMotion 備份在 `design/_legacy_assets/cast_motion_transcription_20260923.ts`。

**FG 結算。** `fs_sign.png` 是空白牌子，TOTAL WIN／金額從 0.02／0.28 改成 −0.18／0.08（跟 Turf 用同一組數值；兩邊的 FreeSpinAnimation 除了一行註解外完全相同）。
在 playtest 用 `__HM_EMIT__` 叫出結算畫面，確認已置中。

`./design/ship.sh`（無 zip）全綠、playtest 已部署。未上傳。

## 2026-09-24 — 手臂擠壓改成參考的真實軸向＋分層重繪需求單

使用者給了新版研究包（`hacksaw-motion-kit.zip`，內含 Miami 六隻角色的動作包）。用動作包量出：
skill `rig/motion.py` 的 REACTION_SCALE **把 Spine 的 scaleX／scaleY 讀反了**（scaleX＝沿骨頭、scaleY＝垂直骨頭）。
Miami 扛球棒男在反應最高點：上臂 `arm_r` 長度不變（肩→肘 231.09 → 231.09）、**變粗 1.229**；
支撐側前臂 `arm_l_2` 沿骨頭 1.063、**變細 0.799**。舊表卻是「沿骨頭拉長 1.23」——這正是「手像沒骨頭」的源頭。
四隻有反應動作的 Miami 角色，沒有一隻的手臂沿骨頭拉長超過 6%。

本款改成：主動臂上臂**垂直骨頭鼓起**（1.00, 1.23）、支撐側前臂（1.06, 0.80），k 與 flutter 沿用。
量測（仿射殘差，只算真正的彎）：鼓起 ≈ 不擠壓，約是舊拉長版的一半以下。gate 與 `pnpm run build` 全綠。
在目前的圖上，鼓起幾乎看不出來（手臂貼身）→ 真正的解法是重畫：
**需求單在 `/Users/stone/stake-engine/docs/cast-layers-brief/README.md`**（三款共用，附標註圖）。
收到分層圖之後，程式要改成「每個圖層一張網格、共用一副骨架」。

未重新打包：upload/ 仍是上一版，要出貨時跑 `./design/ship.sh`。
gate rule 6 再改：從「手臂不得擠壓」改成「手臂沿骨頭不得超過 ±6.5%，且主動臂要垂直骨頭鼓起 ≥2%」。
已驗證：舊的抄錄版與 09-23 的不擠壓版都會被擋下。

# Go Banandit — 交接文件

> 最後更新：2026-10-01。由協作者的 Go Boomana 換皮（`chenyuping1998/wp` `origin/main`）。
> 規格：`SPEC.md`；美術需求與畫風鎖定：`ART_BRIEF.md`。

## 位置

| 項目 | 路徑 |
|---|---|
| 前端 | `wp-banandit/apps/GoBanandit`（git worktree，分支 `go-banandit`，從 `origin/main` 分出） |
| 數學 | `math-sdk/games/GoBanandit` |
| 開發伺服器 | port 3020，`/Users/stone/stake-engine/.claude/launch.json` 的 `gobanandit-dev` |
| 試玩殼 | `dist/gobanandit-playtest`（`?rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en`） |
| 上傳暫存 | `upload/GoBanandit/`（`design/ship.sh`；`--zip` 才壓縮） |

## 機制

- 5×4、1,024 ways。香蕉袋 P 帶 `prize`（押注倍數）；大盜 W 是百搭，只在第 2–5 輪。
- 盤面同時有 W 與 P：每隻 W 收走全部 P 的總和（2 隻＝收兩次）。主遊戲也會收。
- FG：3/4/5 S → 10/12/15 轉；每落一隻 W 計數 +1，到 4/8/12 → +10 轉、收集倍率 ×2/×3/×10。無 retrigger。
- 模式：base、bonus 100×、superbonus 150×（計數器開在 4、×2）。

## 數學

```bash
cd math-sdk
python games/GoBanandit/make_reels.py              # 轉輪帶（固定種子）
SIMS=100000 PYTHONPATH=. python games/GoBanandit/run.py   # 模擬＋最佳化＋驗證（約 20 分）
SIMS=4000 PROBE=1 PYTHONPATH=. python games/GoBanandit/run.py  # 只模擬，看自然分佈
PYTHONPATH=. python games/GoBanandit/probe_stats.py  # 自然分佈統計
PYTHONPATH=. python games/GoBanandit/check_books.py  # 逐本驗證機制（每次重跑都要跑）
```

Python：`/Applications/anaconda3/envs/math-sdk/bin/python`。

### 發布數值（2026-10-01 第三輪）

見 `SPEC.md` §9 的表。第二輪起的調整：
- 主遊戲 basegame 1×–5× 權重 ×1.6、0.1×–0.9× ×0.8 → 「贏分 ≥ 押注」3.8% → 7.5%
- 兩檔 buy 的封頂切片 0.01 → 0.005 → Max Win 約 1/20,000（bonus），本地波動警告消失
- 已知：5,000×–10,000× 沒有自然結果（最高約 4,100×，其上只有封頂本）。試過 FG 1% 熱轉輪，
  bonus 平均暴漲 33% 仍無 5k+，已撤回。要補這段需要新機制（例如更高的袋值或 ×10 之後的額外倍率）。

## 前端：這次改了什麼

- 事件：`reveal → winInfo/setWin → collect → setWin`，FG 另有 `banditMeter`。
  `bookEventHandlerMap.ts` 的 `collect` / `banditMeter` handler；續玩快照讀最後一個 `banditMeter`。
- 新元件：`BanditCollect.svelte`（袋子跳→逐隻大盜飛入→倍率章）、`BanditMeter.svelte`（升級海報）、
  `FreeSpinCounter.svelte` 改成絲印票卡（轉數＋計數格＋收集倍率）。
- 轉場：`TransitionAnimation.svelte` 改成鐵捲門（`gbShutter`），`oncover` 在門全關時觸發。
- 移除：ReelBlast、FullBoard、BlastSwell、CaveRockfall、MineAir、StickyPrizes、BgProps、caveQuake、
  rockPaint、hold and spin 全部分支；符號專屬的 mesh 中獎 rig（照舊圖座標切的）清空，中獎走通用 SymbolWinAnim。
- 規則頁、付費表、買入選單、載入提示、功能介紹全部改寫，數字從 `config.ts` 讀。
- `design/check_types.mjs`：基準路徑是 Windows 反斜線，已改成在 macOS 也能比對。
- `design/check_mesh_wins.mjs`：工具路徑改讀 `GEN_TOOLS`，找不到 pngjs 就明確 SKIP。

## 美術與分工

美術由 Codex（ChatGPT 桌面版）生成並接入：符號（`bananditSymbols/`）、背景、框、UI 底板、圖示、字型、
`uiTheme.ts` 配色、`Symbol.svelte`/`SymbolSprite`/`SymbolWinAnim`。

## 角色（2026-10-01）

兩隻都是 Codex 交的單張全身圖（`design/cast_delivery/{mg,fg}_full_source.png`），不是分層 PSD：

```bash
python3 design/cut_cast_layers.py mg|fg          # 切圖 → design/source/<cast>/（含 rig.json、_compare.png）
CAST=mg|fg node design/generate_monkey_spine.mjs <pngjs 工具目錄>   # → static/assets/spines/bananditBandit | bananditLookout
SPINE=bananditBandit node design/preview_monkey_spine.mjs <工具目錄> chestbeat   # 預覽（不畫網格；看關節用 RIGID_CLOTH=1 產生）
```

- 切線是多邊形（寫在 `cut_cast_layers.py` 的 `CUTS`，座標對應 `design/cast_cut/<cast>_grid.png`），
  各部位壓在別塊下面的地方延伸 26px 並補自己的邊色，關節轉動不露洞；零碎小島併給最近部位。
- **原圖鏡像**：兩張原稿都朝右，站在盤面右邊會背對盤面，所以切圖時鏡像（`MIRROR = True`），
  左右部位名稱與 `cast_cut/<cast>_rig.json` 的點一起對調；投擲仍由畫面左手往盤面丟。
- 骨架沿用 Boomana 的九個動作；`helmet/banana/pocket` 三根配件骨頭沒有對應圖層（產生器會警告，預期內）。
- 投擲道具換成香蕉袋（`bananditSymbols/p.png`）。
- `Mascot.svelte` 依 `gameType` 選 `gbBandit` / `gbLookout`；`gameType` 在鐵捲門全關時才切換，換人藏在轉場下。
  出手點與拳頭落點是產生器印出的實測值，重產骨架後要更新。

## 收尾（2026-10-01）

- 大獎牌 ×5、跑馬燈底板、大獎香蕉粒子：`design/build_screenprint_ui.py` 依 §0 色卡重畫／鎖色；等級名稱
  （BIG/SUPER/MEGA/EPIC/MAX WIN）改由 `Win.svelte` 執行期用 Bungee 寫，不再印在圖上。
- 縮圖：`design/thumbnail/`（BG 取自 bg_base 裁切、FG 大盜、供應商 Logo），`ship.sh` 6b 步放進 upload。
- 數學：FG 袋值加稀有 100×／250×，補上 5k–10k 自然結果（數字見 SPEC §9）。
- 下注列：共用套件新增兩個預設關閉的選項 `stepperLayout: 'flank'`、`buyBonusHideInFreeSpins`，
  本作開啟；`LabelWin` 跑分改以最終金額決定小數位（共用，對所有遊戲都只會更正確）。
- 動畫迴圈全改 `game/frameLoop.ts`（rAF）；刪除未引用的 Boomana 素材（約 32MB）與炸藥音效。
- 送審標籤檢查剩下：供應商載入畫面 Arial（刻意，供應商標誌）。

## 待辦

- 尚未 commit（分支 `go-banandit`）

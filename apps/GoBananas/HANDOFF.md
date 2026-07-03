# Go Bananas 金猴鬧春 — 專案交接文件

> 最後更新：2026-07-03（美術二次改版：美式漫畫貼紙風叢林突擊隊符號組，見 §2；superspin 前端見 §5.5）
> 涵蓋範圍：`apps/GoBananas` 前端 + `math-sdk/games/GoBananas` 數學後端

---

## 1. 遊戲規格

| 項目 | 值 |
|------|-----|
| Game ID | `GoBananas` |
| 版面 | 5 軸 × 5 列 |
| 賠付線 | 15 條固定線（由左至右） |
| RTP | 97% |
| Max Win | 5000×（superspin 2000×） |
| Bet Modes | `base`（1×）、`bonus`（Buy 200×）、`superspin`（50×） |
| Free Game 特色 | **黏性擴展倍率百搭**：W 落地後旋轉金箍棒擴展成整輪，黏住直到 freegame 結束，乘倍每次 spin 重擲（`updateExpandingWilds`） |

## 2. 美術（2026-07-03 二次改版：美式漫畫貼紙風・叢林突擊隊）

主題再轉向：使用者提供另一款遊戲的符號截圖（存於 `design/reference/`，**已 gitignore，版權物勿入 repo/build**），依其「叢林突擊隊猴子」概念由零重繪成**美式漫畫貼紙風**（粗墨線、平塗、網點陰影、白色貼紙描邊、有態度的表情），消除抄襲疑慮。

| 符號 | 圖案 |
|------|------|
| W 百搭 | 軍盔突擊隊猴＋步槍＋WILD 橫幅 |
| WX 擴展百搭 | 全身軍裝猴（軍盔/彈帶/軍靴，256×1280 整輪）；擴展動畫＝小猴掏出**大香蕉**轉三圈邊轉邊長大（cudgel.png 沿用金箍棒的轉軸接法） |
| H1–H4 | 軍盔+護目鏡、火焰果、鳳梨手榴彈、葡萄 TNT 炸彈 |
| L1–L5 | A/K/Q/J/10 寶石字（岩漿紅/冰晶綠/紫晶/翠玉/藍寶，白貼紙邊） |
| S | 金香蕉串 scatter |
| P | 金幣（superspin 獎金符號）、X = 木箱空格 |

> ⚠️ 背景×3、紅漆金邊轉輪框、`audio/cn/` 音效**仍是中國風**，尚未跟進換成叢林軍事主題；`Game.svelte` 標題「GO BANANAS 金猴鬧春」的中文副標也待定。
> 舊中國風符號版本可從 git 歷史（`7b5de6a`）找回。

### 生成器（全部可重跑，輸出即 repo 內素材）

```powershell
cd apps/GoBananas
node design/generate_symbols_comic.mjs <含 @resvg/resvg-js 的 node_modules 目錄>  # 漫畫貼紙風符號（現行）＋design/comic_contact_sheet.png 總覽
node design/generate_art.mjs <同上>   # 中國風背景/轉輪框（符號部分已被 comic 版取代，勿再跑符號）
node design/generate_spines.mjs   # Spine 4.1 JSON：各符號得分動畫 + wx 擴展動畫（h2 已改火焰閃爍）
node design/generate_audio.mjs    # 純 Node 合成中國風音效（無外部依賴）
```

## 3. 擴展百搭前端接線

事件流（每個 free spin）：`reveal` → `updateExpandingWilds`（舊輪乘倍重擲）→ `newExpandingWilds`（新百搭擴展）→ `winInfo`。

- `src/components/ExpandingWilds.svelte`：黏性覆蓋層元件。新百搭從落地格起跳 → 轉金箍棒 3 圈放大滑至輪中心 → 金光換全身 wx → 不透明紅漆底板鎖輪 + 乘倍徽章。中獎線穿過時徽章脈衝。
- `bookEventHandlerMap.ts`：兩個事件 handler；`freeSpinTrigger`/`freeSpinEnd` 清空；`createBonusSnapshot` 斷線續玩還原（累積 newExpandingWilds + 最後一次 update 的乘倍）。
- `stateGame.stickyWildReels`：黏住的輪不再重播 W 落地音效。
- 已修 bug：`animateSymbols` 列過濾原為 1..3（3 列時代殘留），改 1..numRows。

## 4. 音效（design/generate_audio.mjs 合成）

古箏（Karplus-Strong）、鑼、木魚、大鼓、鈸、破風聲全程式合成，輸出 `static/assets/audio/cn/*.wav`：

- BGM：`bgm_main.wav`（96BPM 山水）、`bgm_freespin.wav`（126BPM 慶典），HTML5 Audio 循環
- 關鍵 SFX：轉輪停=木魚、scatter=五聲遞升撥弦、免費遊戲觸發=大鑼、`wild_expand.wav`=三段加速破風+鑼（與 wx 擴展動畫 0.35–1.45s 旋轉時間軸同步）
- `Sound.svelte` 內 `SPRITE_TO_CN` 表攔截 sprite 音效名 → 中國風音檔；未攔截的仍走原 sprite（sounds.json）

## 5. 數學建置（math-sdk）

```powershell
cd E:\stake\math_sdk
py -m venv env                      # Python 3.14 可用（numpy/zstandard 會源碼編譯）
.\env\Scripts\python.exe -m pip install -r requirements.txt   # 跳過第一行 git+ 那行
.\env\Scripts\python.exe -m pip install -e .
cd games\GoBananas
..\..\env\Scripts\python.exe run.py   # sims 1e4×3 modes → configs → Rust 最佳化 → 分析 → 驗證
```

輸出位置：`math_sdk/games/GoBananas/library/`
- `books/` 牌局書（.jsonl.zst）
- `lookup_tables/` 查找表 csv
- `configs/` 前端/RGS 設定（含 fe config）
- `publish_files/` 上傳 Stake Engine 用
- `optimization_files/`、`forces/` 最佳化與 force 檔

## 5.5 Superspin 前端呈現（2026-07-03 完成）

事件流：`updateFreeSpin`（次數 1..3）→ `reveal`（gameType `superspin`，board 的 P 帶 `prize` 分值）→ `newStickySymbols`（新銅錢黏板、次數重置）→ …循環… → `prizeWinInfo`（總結算）→ `setWin`/`finalWin`。

- `src/components/StickyPrizes.svelte`：黏性銅錢覆蓋層（仿 ExpandingWilds 模式）。紅漆金邊格底板鎖格 + `gbP` 銅錢 backOut 彈入 + 金字金額（`bookEventAmountToCurrencyString`）；`prizeWinInfo` 時全部脈衝
- `bookEventHandlerMap.ts`：`newStickySymbols`（撥弦音 + 彈入 + 寫入 `stateGame.stickyPrizes`）、`prizeWinInfo`（升調滑音 + 脈衝 + 設定贏分 + 收 spin counter）
- `Symbol.svelte`：P 符號顯示自身 `prize` 金額（reveal board 直接帶）
- `actor.ts` `onNewGameStart` 清空黏幣（一顆 superspin 一局）；`createBonusSnapshot` 累積 `newStickySymbols` 斷線還原（`utils.ts` snapshot 保留清單已加入）
- `betModeMeta.ts` 改為 `GO_BANANAS_BET_MODE_META`：BASE / BONUS 200× / SUPERSPIN 50×（hold'em 說明文案）
- spin 次數顯示沿用 `FreeSpinCounter`（`updateFreeSpin` 驅動，X/3，銅錢落地即重置）
- 手寫示範事件：`src/stories/data/superspin_events.ts` + `ModeSuperspinBookEvent.stories.svelte`（fullRound 一鍵播整局）
- 背景/BGM 原本就有 superspin 分支（月夜背景 + 慶典 BGM），無需改動

## 6. 待辦

- [ ] math 正式跑完後，把新 books 換進 `src/stories/data/`（現有 base/bonus books 是舊數學產的，沒有 `newExpandingWilds` 事件；已在 `bonus_events.ts` 加手寫示範事件 + Storybook stories 可單獨驗證動畫；superspin 同樣是手寫示範，待真 books 驗證）
- [x] superspin 模式前端呈現（2026-07-03，見 §5.5）
- [ ] Stake 上架素材（Thumbnail/Foreground）尚未做中國風版

# Go Bananas 金猴鬧春 — 專案交接文件

> 最後更新：2026-07-02（中國風全面改版 + 黏性擴展倍率百搭前端接線 + 程式合成中國風音效）
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

## 2. 中國風美術（2026-07-02 改版）

主題：西遊記 Q 版，參照 `apps/GoBananas/static/香蕉.png` 的賠率表風格。

| 符號 | 圖案 |
|------|------|
| W 百搭 | 悟空持金箍棒 + 紅底金字「百搭」 |
| WX 擴展百搭 | 全身悟空踩筋斗雲、直立金箍棒（256×1280 整輪） |
| H1–H4 | 金元寶、紅燈籠、蟠桃、鞭炮 |
| L1–L5 | A/K/Q/J/10 漆牌金字 |
| S | 金蟠桃 scatter（只出現在第 2/3/4 輪） |
| P | 銅錢（superspin 獎金符號）、X = 木牌空格 |

背景×3（山水/紅金慶典/月夜）、紅漆金邊轉輪框（回紋+雲紋+福字）。

### 生成器（全部可重跑，輸出即 repo 內素材）

```powershell
cd apps/GoBananas
node design/generate_art.mjs <含 @resvg/resvg-js 的 node_modules 目錄>  # SVG→PNG 符號/背景/框
node design/generate_spines.mjs   # Spine 4.1 JSON：各符號主題得分動畫 + wx 擴展動畫
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

## 6. 待辦

- [ ] math 正式跑完後，把新 books 換進 `src/stories/data/`（現有 base/bonus books 是舊數學產的，沒有 `newExpandingWilds` 事件；已在 `bonus_events.ts` 加手寫示範事件 + Storybook stories 可單獨驗證動畫）
- [ ] superspin 模式前端呈現（`newStickySymbols`/`prizeWinInfo` 事件尚無 handler，型別已定義）
- [ ] Stake 上架素材（Thumbnail/Foreground）尚未做中國風版

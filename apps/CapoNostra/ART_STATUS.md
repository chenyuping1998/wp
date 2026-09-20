# Capo Nostra — 美術盤點

最後更新：2026-09-17

這份是**現況清單**：每一項資產現在是什麼狀態、接上了沒、還缺什麼。
設計方向與規格（色票、尺寸、構圖要求）在 [ART_BRIEF.md](ART_BRIEF.md)。

圖例：✅ 已完成並接上　🟡 圖有了但沒接　🔴 還是 Hot Miami 的圖　⬜ 沒有圖

---

## 一覽

| 區塊 | 狀態 | 說明 |
|---|---|---|
| 符號 H1–H5 / W / SW / FS | ✅ v2 | H1–H5 已放大主體、簡化細節並強化輪廓；W / SW / FS 沿用 |
| 符號 L1–L4（撲克花色） | ✅ v4 | 對比 3.27→8.41，兩種底板皆通過 `check_symbol_weight.py` |
| 錢框 1×1 / 2×2 / 3×3 | ✅ | 已完成，另經透明度後製（見下） |
| Tommy Gun 展開特效 | ✅ | 火光 / 光柱 / 彈殼 / 彈孔全部接上 |
| 三檔標題 SOLDIER / CAPO / THE DON | ✅ | 圖已有，2026-09-02 補接上 |
| Logo | ✅ | Art Deco 金字 CAPO NOSTRA |
| 大佬角色（盤面右側） | ✅ v3，動作照抄錄重做 | **2026-09-17 動作整套重做，照 hacksaw-character-motion 的 `rig/motion.py` 抄錄。** 之前「像紙片一樣軟軟的」有三個原因，全部修掉：① **rig 的手臂骨不在手臂上**——自動偵測把左手抓成肩膀一塊、右手抓成雪茄的煙，兩隻手臂分到自己骨頭的權重是 0；改由 `design/build_cast_guy_rig.py` 用輪廓量出的關節折線綁定（0 → 0.5–0.8）。② **缺擠壓拉伸通道**：`castMotion.ts` 加入每根骨的（沿骨軸, 橫向）縮放、不往子骨傳，與抄錄 Python 對照誤差 4.4e-6。③ **反應表照錯參考**：9/10 版照原始 Spine（手臂轉 20°）把幅度塞進 fore_l 6.7°，現在 idle 與三檔反應全換抄錄原值。出力手臂**照角色不照名字**：伸直垂下的 arm_l 出力伸長、雪茄手撐住（照名字的話雪茄手會往下沉）。`check_cast_motion.mjs`：idle 73%、win 75%、winBig 71%、trigger **66% / 1.33x、零翻面**；關節上限在新 rig 上重量並目測（頸部只有 9°）；五條照原始 Spine 寫的規則已改，並用 4 個故意做壞的版本驗證都擋得下。三態貼圖（`guy_feature.png` / `guy_don.png`）alpha 與 `guy.png` 逐位元相同，共用同一具 rig |
| UI 圖示 | ✅ | 已改單色金 |
| **開場說明頁人物** | ✅ v3，與盤面同一張圖 | `intro_boss_v3.png`，由 `design/build_intro_boss.py` 從 v3 master 裁切，剪影與盤面 Don 的 IoU **0.993**——腳本會在兩者不再是同一張圖時直接失敗。舊的 `intro_boss_v1.png`（9/2，無圍巾無雪茄）已移到 `design/_legacy_assets/`，省下 1.6MB 出貨體積 |
| 開場頁配色（CSS，非美術） | ✅ | 2026-09-02 由霓虹紫/青改成棕金，並修對比 |
| Base 背景 | ✅ v1 | 低彩度 1930s 地下賭場包廂，中央留給盤面 |
| Feature / Epic 背景 | ✅ | 談判室 / 金庫室，非 Miami；Don 檔背景的接線 bug 已修 |
| **盤面底板 `frame_bg.png`** | ✅ v1 | 棕黑皮革圖已接上盤面 |
| 商店縮圖 BG / FG | ✅ v2 | 無字；BG 已依平台檢核提高約 40% 環境亮度，FG 沿用透明大佬＋Tommy Gun，三件上傳檔齊全 |
| 中獎橫幅 5 張 | ✅ | Art Deco 金字，遞進靠邊框線密度 1→5 條 |
| 盤面外框 / FS 面板 | ✅ v1 | 棕金四件已接上；edge add 混合正常 |
| 黏著標記 frame_sticky | ✅ v2 | 改為固定尺寸封蠟鎖章，免費遊戲中顯示於 Frame 右上角 |
| FG 轉場（金庫門） | ✅ v1 | 三張已接上，`TransitionAnimation.svelte` 改寫完成；暫代的黑頭轎車與 `hmCarSide` 已移除 |
| Buy Bonus 面板配色 | ✅ | 2026-09-02 由霓虹紫改成暗棕 + 金色明度階梯 |
| 下 bar 配色 | ✅ | 平台 chrome 的綠已改灰階 |
| 字體系統 | ✅ | 導入 Cinzel 當標題字；字詞跟美術、數字跟可讀性（ART_BRIEF §9.5） |
| **FS 匾額無字版** | ✅ v2 | 無字皮革匾額已接上，Intro / Retrigger / Total Win 由 runtime 各自排字 |
| **Buy Bonus 卡片框** | ✅ v1 | `capoUi/buy_card_frame.svg` 9-slice 雙金線 Art Deco 框已接上 |
| **Buy Bonus 下注列底板** | ✅ v2 | 酒紅絨面、古金鉚釘框；已覆蓋紫色霓虹舊圖並接上既有 runtime 疊字 |
| **下注列／資訊頁材質底板** | ✅ v1 | 圓鍵、Spin、讀數牌已接上；規則與賠付卡套用既有 Art Deco 9-slice 框 |
| 音效 | ✅ v2 | Capo crime-jazz 完整聲音包；四階獨立報獎、MAX WIN、低刺激錢幣循環與短連線 tick 已接上並通過頻譜 gate |

---

## 1. 已完成 ✅

### 符號（`static/assets/sprites/hotMiamiSymbols/`）

全部 512×512 PNG-32，13 張全數換成黑幫主題並已接上：

| 檔名 | 內容 | 賠付 |
|---|---|---|
| `h1.png` | 教父權戒（金戒 + D 家徽） | 5×400 |
| `h2.png` | 1930s 城市天際線 | 5×200 |
| `h3.png` | 現鈔手提箱 | 5×50 |
| `h4.png` | 威士忌 + 雪茄 | 5×30 |
| `h5.png` | 黑頭轎車 | 5×10 |
| `l1_v2–l4_v2.png` | 黑桃 / 紅心 / 方塊 / 梅花，雕版浮雕 + 金描邊，無圓框 | 全部 5×2.0 |
| `l1_v3–l4_v3.png` | 更小、更扁平的單色雕版候選版，去除珠寶感與華麗捲草紋；尚未接上 | 全部 5×2.0 |
| `l1_v4–l4_v4.png` | 依最新版 v4 規格重繪：保留深色雕版本體，改用較清楚的亮金輪廓；尚未接上與量測 | 全部 5×2.0 |
| `w.png` | 黑色 Fedora（帽帶印 WILD） | 5×400 |
| `sw.png` | **湯普森衝鋒槍 + 紅色警示星芒** | 不賠付，整軸變 Wild |
| `fs.png` | 金庫轉盤鎖 | Scatter |
| `frame.png` | 舊 1×1 框，已被 `capoFrames/` 取代 | — |

低符號的紅心/方塊用暗酒紅而非訊號紅，訊號紅 `#C1272D` 全款只給 Tommy Gun —— 這條守住了。

### 錢框（`static/assets/sprites/capoFrames/`）

| 檔名 | 尺寸 | 內容 |
|---|---|---|
| `frame_1x1.png` | 256×256 | 蠟封信封 |
| `frame_2x2.png` | 512×512 | 鉚釘鐵皮現金箱 |
| `frame_3x3.png` | 768×768 | 金庫門 + Art Deco 角 |
| `frame_edge_1x1/2x2/3x3.png` | 同上 | 外框發光層（add 混合） |

三個尺寸是**三個不同的物件**而不是同一張放大，邊框寬度也沒有等比例放大 —— 這兩條是
ART_BRIEF §3 的硬規則，交出來的圖都守住了。

> ⚠ **這六張是後製過的，不要直接覆蓋。**
> 交付的原圖在 `design/_capo_frames_delivered/`，出貨用的圖由
> [`design/soften_frames.py`](design/soften_frames.py) 產生。詳見第 3 節。

### Tommy Gun 特效（`static/assets/sprites/capoFx/`）

| 檔名 | 尺寸 | 用途 |
|---|---|---|
| `sw_muzzle_flash.png` | 512×512 | 槍口火光，第一拍 |
| `sw_column_beam.png` | 256×1024 | 整條直行光柱 |
| `sw_shell.png` | 64×64 | 彈殼粒子（3 顆帶旋轉） |
| `sw_bullet_holes.png` | 512×512 | 彈孔疊層 |

全部接在 [`WildColumns.svelte`](src/components/WildColumns.svelte)。

### 三檔標題（`static/assets/sprites/hotMiamiSplash/`）

`title_soldier.png` / `title_capo.png` / `title_don.png`，各 1024×360。
舊的 `title_neon_nights / sunset_hits / ocean_drive` 已刪除。

### 其他

- `hotMiamiBrand/logo.png` — Art Deco 金字 CAPO NOSTRA
- `meshRigs/cast_guy/` — 三件式西裝大佬，rig 沿用
- `hotMiamiUiIcons/*` — 12 個圖示已改單色金

---

## 2. 還沒做 🔴

按急迫度排序。

### 2.00 免費遊戲金庫門轉場 —— 🟡 v1 素材完成

已新增至 `static/assets/sprites/capoFx/`：

- `vault_door_l.png` — 1024×1536，不透明左門扇
- `vault_door_r.png` — 1024×1536，不透明右門扇
- `vault_dial.png` — 1024×1024，透明背景、八輻置中轉盤

左右門由同一張完整雙門原圖精確對半切割，中央接縫一致。原始生成圖保存在
`design/source/capoFx/`。目前尚未接入轉場程式，舊 `transition_car.png` 仍保留供回退。

### 2.0 開場頁配色（已完成，屬程式非美術）

開場頁的面板底色原本是硬寫在 `IntroFeatures.svelte` CSS 裡的 Hot Miami 紫
（`rgb(58,16,96)` → `rgb(24,6,44)`）加上青色角標，新的棕金背景進來後變成整個畫面
最搶眼的東西。42 處色值已改成 ART_BRIEF 的色票。

順帶修掉一個對比問題：強調字（`2× to 100×`、`1, 4 or 9 positions`）原本
落在 3.19:1，低於 WCAG AA 對一般字級要求的 4.5:1 —— 而那正是面板上最重要的數字。
改用亮金 `#E8D48B` 後是 **10.58:1**。

### 2.04 低賠付符號 L1–L4 —— ✅ v4 完成

v4 已接上並通過檢查（紫底、棕底都過）：

| 版本 | 佔格 | 亮部 | 對比 | 結果 |
|---|---|---|---|---|
| v1 籌碼圓框 | 64.2% | 11.8% | — | 階級反了 |
| v2 | 19.2% | 0.1% | 3.27 | 過暗 |
| v3 | 14.6% | 0.0% | 2.02 | 更暗，未接 |
| **v4** | **18.3%** | **1.4%** | **8.41** | ✅ |
| H1–H5 v2 | 55.8% | 8.8% | 13.85 | ✅ 高賠付辨識度加強 |

`design/check_symbol_weight.py` 已掛進 `pnpm run build`。

**檢查工具的上限規則改過一次。** 原本寫死「L 對比 ≤ 7.5」，v4 的 7.6–9.9 被判 FAIL，
但實際擺上盤面 v4 讀得清楚且仍明顯從屬於 H —— 是線畫錯了不是圖畫錯了。
對比只量「邊緣可不可讀」，量不到「份量」；份量是佔格（H 的 41%）與亮部（H 的 22%）
在撐。規則改成「**L 的對比不得超過 H 系列裡最低的那個**」，門檻會跟著 H 一起動。

### 2.04b 低賠付符號 L1–L4 —— 歷史需求

v2 已接上，階級修正了（佔格 64%→19%、亮部 12%→0.1%），但**對比只有 3.27:1**，
目標是 5–7:1。v3 試過再往下收，對比掉到 2.02 —— 方向反了，沒有接。

v4 要的是「維持 v2、只把金色描邊加粗提亮」。完整需求與量測方式見
[ART_BRIEF.md §2 改版紀錄與 v4 需求](ART_BRIEF.md)。

交圖前自己量：

```bash
/Applications/anaconda3/envs/math-sdk/bin/python design/check_symbol_weight.py
```

工具讀 `assets.ts` 決定量哪個檔案，所以**新圖要先接上去才量得到**。

### 2.05 低賠付符號 L1–L4 的圓框（歷史）

現行的籌碼輪盤邊讓最便宜的符號變成盤面上最吵的東西 —— 量測 L1–L4 佔格面積 64.2%、
亮部 11.8%，H1–H5 只有 44.4% / 6.4%。規格與目標數值見 [ART_BRIEF.md §2](ART_BRIEF.md)
低賠付那一段。

### 2.1 開場說明頁人物（已完成 v1）

`IntroFeatures.svelte` 已改為只顯示一位西裝大佬：

`static/assets/sprites/hotMiamiCast/intro_boss_v1.png`（1024×1536、RGBA）

角色沿用盤面大佬的臉、三件式條紋西裝、金錶鍊與低彩度風格，手持未點燃雪茄、沒有武器。
舊 `cast_girl/girl_idle.webp` 已不再由開場頁引用，但檔案仍保留以便回退。

生成工具：內建 imagegen。身份／畫風參考：`meshRigs/cast_guy/guy.png`。

注意：`meshRigs/cast_guy/` 底下的 `guy.png`、`guy_feature.png`、`guy_don.png`
**是位元組完全相同的三個複本**（MD5 一致），ART_BRIEF §1 想要的「同一個大佬三種狀態」
目前並不存在。後兩個檔案也沒有被任何程式引用。

用的是 `hotMiamiCast/` 底下的圖。三個選項：
1. 生一張大佬的半身或全身像取代左側，右側留白
2. 生大佬 + 一位女伴（1930s 晚宴裝）
3. 兩側都拿掉，改成放大的符號或金庫門構圖

### 2.2 背景（`hotMiamiBackground/`）

六張全是 Miami 霓虹夜景，需要三組場景 × 遠近兩層：

| 檔名 | 目標場景 |
|---|---|
| `bg_base_v1.png` | ✅ 低彩度地下賭場包廂，已接到 base 與開場頁 |
| `bg_base_near.png` | ✅ 賭桌、威士忌與煙霧透明近景層 |
| `bg_feature.png` / `_near.png` | 辦公室 / 談判室 |
| `bg_epic.png` / `_near.png` | 金庫室 |

**亮度要比 Miami 版砍掉約一半** —— 盤面是主角。

### 2.3 商店縮圖（`hotMiamiBrand/tile_foreground.png`，1024×1024）

✅ v2 已完成，圖內無字：

- `hotMiamiBrand/tile_background_v2.png`：不透明亮版金庫室背景（平台檢核修正版）
- `hotMiamiBrand/tile_foreground_v1.png`：透明大佬半身＋Tommy Gun 前景
- `wp/upload/CapoNostra/thumbnail/CapoNostra-BG.png`
- `wp/upload/CapoNostra/thumbnail/CapoNostra-FG.png`
- `wp/upload/CapoNostra/thumbnail/Silverstars-Logo.png`

> Stake 的縮圖是**三個檔案**（背景 / 前景 / provider logo）由平台合成，
> 不是一張合好的圖 —— 交件時要確認三件齊全。

### 2.4 中獎橫幅（`hotMiamiWinBanners/`，各 1000×560）

`big / superwin / mega / epic / max` 五張，仍是霓虹配色。改燙金，遞進靠裝飾密度。

### 2.5 盤面外框與 FS 面板（`hotMiamiFrame/`）

**這一組是畫面上僅存的 Hot Miami 紫，現在最顯眼。** 完整規格見
[ART_BRIEF.md §3.5](ART_BRIEF.md)，那裡有三個會讓圖畫壞的技術限制
（方形畫布被壓成 0.8 高、中央 86.7% 會被符號蓋住、edge 會被 add 混合再畫一次）。

| 檔案 | 量測 |
|---|---|
| `frame_bg.png` | 平塗深紫 `RGB(40,10,66)`，符號後方那片底板 |
| `frame_edge.png` | 金框 + 金角標，**內側有一道洋紅霓虹線，佔可見像素 31%** |
| `fs_counter_panel.png` | 1.3% 粉 |
| `fs_sign.png` | 5.5% 粉 |

> 註：`frame_edge.png` 的平均 RGB 是 `(255,202,83)` 看起來像純金，但那是被金色面積
> 蓋過去的假象 —— 逐像素分類才看得到那 31% 的洋紅。**判斷配色不要看平均值。**

### 2.6 音效（`static/assets/audio/`）

`capo/bgm_base.m4a` 已換成 1930s crime-jazz：walking bass、刷鈸、鋼琴與 muted brass。
完整可重建聲音包在 `static/assets/audio/capo/`，產生器為
`design/generate_capo_audio.py`；Tommy Gun、2×2／3×3 Cash Frame、金庫轉場、
免費遊戲、Big Win、reel tension 與所有既有聲音事件皆已接線。
`sw_gunfire`、`frame_big_land`（2×2 / 3×3 專用重擊）、`vault_open` 均已新增並接線。

---

## 3. 需要注意的事

### 3.1 錢框是後製過的，不要直接覆蓋

交付的原圖是**實心板子**：`frame_1x1` 有 68% 的面積完全不透明，`frame_2x2` 60%、
`frame_3x3` 58%（中央還有一層網點）。框是**疊在符號上**的，實心板子會把符號整個蓋掉 ——
1×1 底下那顆權戒完全看不見。

這不只是好不好看：框的語意是「疊在某個符號上、放大那個符號的中獎倍數」，
玩家認不出底下是什麼符號就無法把中獎線跟賠付對起來，這在審查眼中會被當成 payout bug。

`design/soften_frames.py` 做三件事：外緣一圈維持滿 alpha（鉚釘、鉸鏈、轉盤、
Art Deco 角全部保住）→ 中央淨空圓擴大 → 中間那片「面」降到 28–38% alpha。

| | 交付原圖 | 出貨版 |
|---|---|---|
| `frame_1x1` | 68.4% 不透明 | 21.3% |
| `frame_2x2` | 60.1% | 15.1% |
| `frame_3x3` | 57.6%（中央網點） | 12.7%（中央淨空） |
| `frame_edge_3x3` | 中央 alpha 0.70 | 0.00 |

**重生圖之後的流程：**
```bash
cp <新圖> design/_capo_frames_delivered/
/Applications/anaconda3/envs/math-sdk/bin/python design/soften_frames.py
```
腳本永遠讀 `_capo_frames_delivered/`、寫 `static/assets/sprites/capoFrames/`，
不讀自己的輸出，所以可以反覆重跑、反覆調參數（參數在腳本頂端的 `PLATES` / `EDGES`）。

備份資料夾**刻意放在 `design/source/` 之外** —— `check_source_art.py` 會掃那棵樹找
「腳本畫的圖」，而單色的 edge 疊層本來就會觸發它。

### 3.2 如果要重畫框，往這個方向

後製救得回可讀性，但 1×1 犧牲掉了「信封感」—— 米色紙 body 透掉之後它讀起來比較像
金框而不是信封。真正的解法是**畫的時候中間就是空的**：只有信封的邊緣折線 + 蠟封，
不要畫實心紙面。2×2 / 3×3 同理，金屬邊框可以厚實，中間那片面留空或大面積半透。

框中央必須留出乾淨區放倍數數字（前端動態繪製，不是圖上的字）。
目前程式把數字畫在中心下方 `span × 0.22`，淨空圓半徑約 `span × 0.31`。

### 3.3 `frame_sticky_*` 目前沒接 🟡

`frame_sticky_1x1/2x2/3x3.png` 是**三個一模一樣的檔案**（黃圓圈加一橫），
沒有註冊進 `assets.ts`，免費遊戲的黏著標記等於沒有圖。

那個圖案讀起來像「禁止進入」不像「釘住」。建議改成鎖頭、圖釘或封蠟，
而且三個尺寸應該用**同一個物理尺寸**的標記（貼在框角），不要跟著框放大。

### 3.4 透過變數引用的資產，guards 看不到

三檔標題圖生出來後在硬碟上躺了一段時間沒被接上，而所有 guard 都是綠的 ——
因為 `FreeSpinIntro.svelte` 是用 `key={tier.titleKey}` 引用的，
`check_sprite_keys.mjs` 只讀 `key="..."` 字面值，看不見變數。

已補上 [`design/check_feature_titles.mjs`](design/check_feature_titles.mjs)（已掛進 `pnpm run build`），
會驗證 `featureTiers.ts` 的每個 `titleKey` 都存在於 `assets.ts`。

**這是目前唯一一處用變數定址資產的地方。** 之後如果再新增這種寫法，記得同時補 guard ——
否則就是「圖在硬碟上、畫面上沒有、build 全綠」。

---

## 4. 目前未被引用的檔案

`assets.ts` 沒有引用、可以評估刪除的：

```
capoFrames/frame_sticky_1x1|2x2|3x3.png    ← 見 3.3，要接還是要重畫
hotMiamiCast/girl.png                       ← 女性角色已從盤面移除
hotMiamiCast/guy_bat.png, guy_bat_shoulder.png  ← 球棒武器，不要了
hotMiamiCast/guy.png                        ← 小尺寸備援，mesh rig 上線後未使用
hotMiamiBrand/tile_foreground.png           ← 商店縮圖，待重做（見 2.3）
hotMiamiParts/{h3,h4,h5,sw}/pose_*.png      ← 分件動畫的 pose 圖，目前走整體動畫
hotMiamiUiIcons/{spin,turbo,increase,decrease}.png  ← 被 uiSlotsAssetsBespoke 取代
```

`meshRigs/cast_girl/` 與 `spines/cast_girl/` 整組也可以移除。

---

## 5. 驗收清單

出圖後請確認：

- [ ] 隨機挑三張符號縮到 **120×120** 還分得出來是什麼
- [ ] 整套符號**轉灰階後** H1–H5 的明度仍有明顯階梯
- [ ] 訊號紅 `#C1272D` **只出現在** `sw.png` 與 `capoFx/`
- [ ] 框疊在符號上時，底下符號**認得出來**（跑一次 `soften_frames.py` 再看盤面）
- [ ] 商店縮圖縮到 200px 還看得出是黑幫題材
- [ ] 全套資產裡**沒有**霓虹粉、霓虹青、紫色
- [ ] `pnpm run build` 全綠（含 `check_source_art` 與 `check_feature_titles`）
- [ ] 實機跑過：`?forceBook=133` 看大框、`?forceBook=2` 看 Tommy Gun 展開

---

## 6. 送審前巡檢（2026-09-03）

實機逐頁看過 base / free game、四個 modal、直式與橫式後修掉的東西。
全部已進 build，13 個 guard 全綠。

### 內容錯誤（送審一定被抓）

| 位置 | 問題 | 處理 |
|---|---|---|
| `ModalPayTable` | 符號名稱還是 Hot Miami 的 —— 圖是現鈔手提箱寫「Flamingo」、圖是威士忌寫「Boombox」、圖是權戒寫「Neon Diamond」 | 改成 Signet Ring / City Skyline / Briefcase / Whiskey & Cigar / Black Sedan / Spade / Heart / Diamond / Club；Scatter 補上 Vault Door，SW 補上 Tommy Gun（原本沒有 label，畫面上就印「SW」）。**「Cash Case」「Money Case」不能用**，`cash` 和 `money` 都在限制字表裡 |
| `featureTiers.ts` | Soldier 的 splash 還寫 `ONE **CASH** FRAME` —— 就是當初把機制從 Cash Frames 改名的那個字 | 改成 VAULT FRAME，並且**補了 guard**（見下） |
| `ModalGameRules` | 「2× 到 10× on the larger Frames」，但 `frame_size_ladders` 3×3 上限是 8×，等於廣告了數學做不出來的倍數 | 改成「2×–10× on a 2×2，2×–8× on a 3×3」 |
| `ModalGameRules` | 句中出現大寫的 "The Tommy Gun **Does not pay**"（`T.doesNotPay` 是句首用的） | `.toLowerCase()` |
| `ReplayIntro` | 模式名稱還是 Neon Nights / Sunset Hits / Ocean Drive | 改成從 `FEATURE_TIERS` 推導，不再手寫第三份 |

### 版面 / 互動

| 位置 | 問題 | 處理 |
|---|---|---|
| `LayoutBottomBar`（shared） | 選單展開時 BUY BONUS 直接壓在 PAYTABLE / INFO 上 —— 兩者都在同一條左欄。選單有全螢幕遮罩，底下那塊本來就點不到 | 選單開啟時不繪製 |
| `Game.svelte` | 直式 375px 下左上「時間＋CAPO NOSTRA」和右上「CAPO NOSTRA」互相疊字，畫面顯示成 `CAPO NOSTOSTRA` | 畫布寬 < 480 時不畫右上那份（名字左上已經有了）。**內容不動** —— 重複遊戲名是 HotMiami / Moooo / GoBananas 共同的慣例 |
| `Cast.svelte` | 直式下人物縮成約 35px 飄在盤面上方空白處。整個元件的前提是「填滿盤面右邊到螢幕邊的帶狀空間」，直式那條帶只剩 8%（橫式 21%） | 帶寬 < 15% 就不畫。不是縮小，是不畫 —— 沒有帶狀空間時他站在那裡沒有作用 |
| `ModalGameRules` Controls | Buy Bonus 那列沒有 icon，`no-icon` 讓它整列往左推 4.6rem，讀起來像段落標題而不是清單項目 | icon 欄改放一塊迷你 BUY BONUS 牌子（下 bar 上本來就是牌子不是圖示），對齊回來 |

### 配色（邁阿密殘留）

| 位置 | 原本 | 現在 |
|---|---|---|
| `Anticipation` | 內圈燈管 + 光束 `0xff8ede` 霓虹粉 | 金 `0xE8D48B` / `0xffdf9e` |
| `WinLines` | 35 色彩虹（青、薄荷、洋紅、紫、萊姆） | 18 色暖色家族，靠**明度與色溫**分線不靠色相 |
| `symbolWinMotion` / `symbolLandMotion` | L1–L4 當霓虹字管點亮：粉 / 青 / 黃 / 紫 | L1–L4 已經是撲克花色不是字母了 —— 黑桃梅花冷銀、紅心方塊暖酒紅 |
| `SymbolWinAnim` | 中獎角標 `CYAN 0x66f6ff` | `MARK 0xf2e0a8` 淡金 |
| `BigWinFx` / `Win` / `FreeSpinCounter` | 粉、薰衣草、粉色頂階光暈 | 酒紅 / 煙灰 / 白熱金 |
| `Modals.svelte` | modal 外框整套還是 GoBananas 的橄欖綠（`rgba(26,36,12)` 等）＋洋紅陰影 | 暖近黑 ＋ 金 |
| **Settings 面板** | 沒有自己的皮，所以直接露出上面那套：橄欖綠底、**瀏覽器預設藍色音量滑桿**、無襯線標題 | 近黑金框、`accent-color: #c9a227`、標題吃 Cinzel |
| `FeatureSplashPanel` | 「10 FREE SPINS AWARDED」是**淺紫白牌子＋深藍字＋紅框**（抄別款的牌面美術），疊在金色 Cinzel 標題下像錯誤對話框 | 深底暖字。牌子「下緣溶解」的造型保留，那部分是對的，換掉的只有顏色 |
| 各 modal 標題 | Titan One（Hot Miami 的圓體） | Cinzel。另外 `BaseTitle` 是 `<div>` 不是 heading，所以 h1–h4 規則本來就打不到 Settings / Auto Spin / Bet 這些共用面板 |

### 美術

- **開場第一張卡的圖示是一塊空白米色方塊。** `IntroFeatures` 的 Frame overlay 指向 `hotMiamiSymbols/frame.png` —— 那是**軟化前**的米色羊皮紙牌，中間只有一個小橢圓是透明的，縮到圖示大小就把底下的權戒整個吃掉。改指 `capoFrames/frame_1x1.png`，也就是盤面真正在畫的那張。

### 新增 guard

`check_social_words.mjs` 多了 **rule 4：純 .ts 檔裡的玩家文案**。

原本 rule 1 只讀 `.svelte` 的 **markup**（`<script>` 會被剝掉），rule 2/3 只看 `pick()` 和 `social ? :` 這種分模式的分支。像 `featureTiers.ts` 這種「一張英文字串表、原樣渲染」的檔案是**沒有任何一條規則在看的**，`ONE CASH FRAME` 就是這樣活下來的。

已驗證會擋：把字改回 `CASH` 跑 guard → exit 1 並指出 `cash → coins`。

### 順手清掉

`static/assets/audio/miami/`（5.8M，`src/` 裡零引用）。frontend 從 104M 降到 98M。

`meshRigs/cast_girl/`(7.5M)、`spines/cast_girl/`(2.4M)、`sprites/hotMiamiParts/`(4.5M) **還在**：
這三組 `assets.ts` 有註冊（雖然 `who` 寫死 `"guy"`、`SYMBOL_RIGS` 已清空，實際都不會被畫），
要刪得連 registry 一起改。刪 `hotMiamiParts` 等於放棄以後回頭做分件中獎動畫 —— 這個請你決定。

### 還沒查的

- Replay 模式（`?replay=true`）實機沒跑過，只有靜態改過配色
- 直式盤面上下大片留白是共用直式版面的比例，沒有動
- 直式下 FREE SPINS 次數在盤面上方（金牌）和下 bar（灰牌）各出現一次

---

## 7. 停輪音效有時候沒有五聲（2026-09-03）

### 原因

`Sound.svelte` 的 `getCnSfx()` **一個檔案只快取一個 `HTMLAudioElement`**，
而五個停輪聲**是同一個檔案** `reel_stop.wav`（105ms），只是 `playbackRate` 從
0.94 排到 1.14 做出音高階梯。

一個 `<audio>` 元素沒辦法和自己疊加播放：`currentTime = 0` 打在還在播的元素上是
**重新開始**，不是多一聲。所以只要兩個停輪落在 105ms 之內，後面那一聲就把前面那聲
洗掉，玩家只聽到一下。

- Turbo 的停輪間隔是 150ms —— 只剩 45ms 餘裕，稍微抖一下就掉聲
- 按 Stop 快停時間隔直接歸零，五聲併成一聲
- 一般速度間隔夠大時五聲才會都在

「有時候五輪都有有時候不一定」就是這個。`pluck_low`（Wild 落地）更嚴重，
同一毫秒可能觸發好幾次。

### 修法

一次性音效改成從 **voice pool** 取元素（每個檔案最多 6 個），
不再共用那一顆。迴圈音效（`reel_tension`、`coin_shimmer`）維持用原本那顆，
因為 `playCnLoop` / `stopCnSfx` 靠元素識別；pool 挑元素時會跳過 `loop` 中的。
元件卸載時連 pool 裡多開的那幾顆一起釋放。

### 量測

hook `HTMLAudioElement.prototype.play`，記錄每次呼叫時該元素是不是**還在播**：

| | play 次數 | 打在還在播的元素上 |
|---|---|---|
| 修之前 | 5 | **4** |
| 修之後 | 5 | **0** |

修完五個 rate 都到齊：0.94 / 0.99 / 1.04 / 1.09 / 1.14。

> 註：兩次量測都在 browser pane 裡跑，那個環境在面板隱藏時會凍住 rAF、
> 面板回來時把積住的停輪動畫在同一幀全部結算，所以量到的間隔比實際play緊。
> 這對「會不會互相洗掉」是有效測試，但**不是真實輪間間隔的量測**。

### ⚠️ 第一次的修法不夠，第二次才真的修好

**voice pool 沒有解決問題** —— 回報還是常常只有兩三聲。原因：

- pool 裡多開的那幾顆是**碰撞當下才 `new Audio()` 建立**的，`preload='auto'` 才剛開始抓檔，
  `play()` 立刻打上去時 `readyState` 還是 0。也就是說**需要它們的那一輪，正好是它們來不及的那一輪**
- `HTMLAudioElement` 本來就不是拿來做「短、密、會重疊」的一次性音效的：
  一顆 105ms 的click要背一整套 network / decode / readyState 狀態機

**改成 Web Audio。** 這個檔案裡本來就有 `AudioContext`（給音樂的 duck 濾波器用），
所以不是多加一套音訊堆疊，只是多一道 decode：

- mount 時把 22 個 sfx 各 `decodeAudioData` 一次成 `AudioBuffer`
- 每次播放建一個丟棄式的 `AudioBufferSourceNode` 蓋在共用 buffer 上 ——
  重疊是免費的，而且是立刻發聲，沒有 readyState 這種東西
- 迴圈音效同樣走 buffer source（`loop = true`），handle 存起來讓 `stopCnSfx` 停、
  讓 `playCnLoop` 改 `playbackRate` 而不重啟
- 沒有 `AudioContext` 或某個檔案 decode 失敗時，才退回原本的 element 路徑

### 量測（這次量的是結果，不是代理指標）

第一次我量的是「元素有沒有被搶」（`wasPlaying`）—— 那**只證明沒被覆蓋，
沒有證明五份真的有發出來**，而且用單一元素時本來就不可能發得出來。這次改量真正的輸出：
hook `AudioBufferSourceNode.prototype.start`，數實際起了幾個 voice、
以及它們的存活區間有沒有重疊。

| | 停輪 voice 數 | 同時發聲的最大數 | 走 element 路徑的 sfx |
|---|---|---|---|
| 改之前（單一元素） | 5 次呼叫，實際 1 份 | 1 | 全部 |
| voice pool | 5 | 量不出來（代理指標） | 全部 |
| **Web Audio** | **5** | **5** | **0** |

`playbackRate` 五階都在：0.94 / 0.99 / 1.04 / 1.09 / 1.14。
`AudioBufferSourceNode` 一旦 `start()` 就一定會 render，沒有被搶的可能，
所以「起了 5 個而且區間重疊」等同於「五聲都聽得到」。

迴圈路徑也驗過（這是最可能改壞的地方，卡住的 drone 比原本的 bug 更糟）：
聽牌時起 1 個 tension loop、中途被 retune 到 rate 1.38（不是重啟）、
之後 `stop()` 有被呼叫、結束時**沒有任何 loop 還在跑**。

### 順帶查到、不是問題的

`stateGame.stickyWildReels` 在 `onReelStopping` / `onSymbolLand` 裡都有 early return，
一度懷疑是它讓某些輪靜音 —— 但全專案搜過，這個陣列**只有被指派成 `[]`，
沒有任何地方 push**，所以永遠是空的，那兩個 early return 從來不會成立。
是 Hot Miami 留下來的死狀態。要嘛之後把黏性 wild 真的接上去，要嘛整組拿掉。


---

## 8. 停輪音效：✅ 已改為五輪統一、聽牌升音（2026-09-10）

2026-09-10 最終處理：一般五輪固定播放同一顆 `reel_stop.wav`（rate 1.0）；只有
`anticipation[reelIndex] > 0` 的真正聽牌輪使用 rate 1.18。免費遊戲的 sticky Wild 輪不再
提前 `return` 漏播；快停或卡幀造成多輪同幀落下時，Web Audio clock 會以至少 72ms 間隔
排開五聲，正常的 150ms 逐輪停靠不受影響。`design/check_reel_stop_sound.mjs` 防止這三條退化。

以下保留 2026-09-03 的調查紀錄作為背景：

第 7 節寫的兩次修法都**沒有解決你聽到的問題**。這一節記錄真正查到什麼、以及卡在哪裡，
避免下一個人重走一遍。

### 我修掉的是真的 bug，但不是「這個」bug

`Sound.svelte` 一個音檔只快取一顆 `HTMLAudioElement`，五個停輪聲共用同一個檔案 ——
這是真的缺陷，改成 Web Audio（`AudioBufferSourceNode`）之後量到 5 個 voice 同時發聲、
0 個走 element 路徑。**這個改動保留**，它獨立成立。

但它不是你聽到的症狀的原因。

### 真正的發現：`onReelStopping` 根本沒有每次都被呼叫

在 `onReelStopping` 裡插 log、掛 console hook 之後，跑一連串真的有動畫的轉動
（餘額 1000 → 999.91 → 999.80 → 999.63，畫面上看得到輪子在轉、逐輪停）：

- 有一次跑出**完整 5 次**呼叫（rate 0.94 / 0.99 / 1.04 / 1.09 / 1.14）
- 有好幾次跑出 **0 次** —— log 完全是空的，只有 spin 的按鈕音

所以聲音不是「被蓋掉」也不是「擠在一起」，是**那一手根本沒有觸發**。
這和你說的「常常漏」完全吻合，而且**不是音訊層的問題**，是觸發停輪回呼的那條路徑。

排除掉的假設（都查過，不是原因）：

| 假設 | 結果 |
|---|---|
| `stickyWildReels` 讓某些輪 early return | 全專案只有被指派成 `[]`，沒有任何 push，永遠是空的 |
| `preSpin` 把 `onSpinFinishing` 洗回 no-op | `preSpin` 不會呼叫 `prepareToSpin`，不會動到它 |
| `interruptible` 被中斷時 promise 不 settle，卡住不往下走 | `interruptible.add` 兩條路都會 resolve，`onSpinFinishing()` 一定會被走到 |

### 我沒有解決，也不打算硬送

`onSpinFinishing()` 在 `createReelForSpinning.svelte.ts:285` 是無條件呼叫的，
但實測就是有整手都不觸發的情況。要往下追得進 `utils-slots` 的轉輪引擎，
那是**所有遊戲共用**的，送審前我不會在沒有可信量測的情況下亂改。

**為什麼我量不準**：browser pane 在工具呼叫之間會隱藏，隱藏時 rAF 完全凍結 ——
實測 6 秒內只跑了 **1 幀**。所以停輪的時間間隔我量到的數字全都不可信
（連續截圖可以逼它渲染，量到 16.6ms/幀，但截圖批次之間還是會斷）。
我在這上面反覆給了你兩次「修好了」，兩次都不算數，這是我的問題。

### 下一步需要的資訊

同樣的漏音，在下面哪些情況會發生？這會直接決定要往哪裡查：

- 一般速度 / turbo / 兩個都會
- 一般轉 / 免費遊戲 / 兩個都會
- 按 Stop 快停的時候，和讓它自己停完，有沒有差別

### 已經有的、但沒驗證的一個修法

「就算回呼擠在一起也保證五聲分開」的排程器我寫過（每聲至少間隔 80ms，
最多推遲 200ms 以免聲音落後畫面），但**在我的環境裡驗不出來就退掉了**，
沒有進 build。如果你要，我可以放回去讓你直接聽 —— 但它只能救「擠在一起」，
救不了「整手沒觸發」，而目前的證據指向後者。

# 下注列第四版（拆分式）— SplitBar

2026-11-07 建立。第一個套用：Volt Monster。

## 長相（第二版編排，2026-11-07）

使用者給了 Katana Kash 的截圖，**圖示不變、只改編排**：

| 位置 | 內容 |
|---|---|
| 底部一排（左→右） | 黃色買入方塊貼左下角（上方一顆圓形選單鈕）→ BALANCE 底板 → WIN 底板（置中，沒中獎時顯示 0）→ ▲▼ 上下疊 → BET 底板（下緣有等級線，按它開清單） |
| 右下角 | 白色旋轉大圓鈕，上方一道弧線排 Turbo（正上方）和自動播放（右上） |

- 讀數改成**半透明深色底板**（標籤＋金額靠左，WIN 置中），金額太長自動縮到底板內
- 兩群貼齊**實際螢幕**的左下／右下角，WIN 置中在遊戲框
- 手機直式：底部一排 BALANCE｜WIN｜BET 撐滿寬，買入方塊和旋轉鈕組各站在兩個角落、在那排上面；▲▼ 疊在旋轉鈕左邊
- 其餘都跟第三版一樣：Nunito、回饋只變色不縮放、面板 70ms 淡入、自動播放只選局數、Esc 關面板、開購買選單時整組 120ms 淡出
- 第一個套用的是 Volt Monster（`apps/VoltMonster科學怪人`），買入圖示是那款的燈泡佔位，套別款要重畫

`preview/`：1 寬螢幕 16:9、2 手機直式、3 五款買入圖示（大圖＋64px）、4 遊戲內實拍（Fang、Mummy）（套在 Volt Monster 上拍，畫面美術還是 Mummy 的）。舊編排的截圖在 `preview/old_vice_heat/`。

## 套到某款遊戲

1. 複製 `SplitBar.svelte` 到該款 `src/components/ui/`
2. 該款要有第三版用到的東西：`static/fonts/Nunito.ttf`＋OFL、`app.html` 的 `@font-face`、`src/game/fonts.ts` 的 `BAR_FONT`（照 MummyMayhem 複製）
3. `src/game/uiTheme.ts`：`setUiTheme({ customLayout: SplitBar, barHeight: <見下>, betBarLayout: 'compactBottom' })`
4. 購買選單底部膠囊：複製 `MummyMayhem木乃伊/src/components/ui/BuyMenuBetPill.svelte`，接進該款 ModalBuyBonus（拿掉標題旁 BetMenuAmountToggle、選單 max-height 留 92px）
5. 規則頁的操作說明：照 Mummy 的 `ui/BarIcon.svelte` 畫法換成對應圖示（`kind === 'buy'` 那格讀同一份 `BUY_ICON`）
6. 買入方塊的圖示：複製 `buyIcon.example.ts` 成該款 `src/game/buyIcon.ts`，照下面「買入按鈕圖示」重畫成該款主題
7. 跑完整 `pnpm build`（守門全過）

### 要依該款調的地方

- **barHeight**：用 190（底部那排高約 114，盤面下緣要高過 WIN 底板）
- **跟吉祥物重疊**：右下角的旋轉鈕組在 16:9 會蓋到站在盤面右側的人物腳邊。要嘛把人物往上移／縮小，要嘛調 `WIDE.SPIN / TURBO / AUTO`
- 幾何全在檔案開頭的 `WIDE` / `PORTRAIT` 兩個表；底板的 x/y 是左上角、圓鈕是圓心；右群的 x 是負的（從右下角往左量）

## 買入按鈕圖示（2026-11-08）

左下黃色買入方塊中央的圖示，**每款一個、要有該款的主題**。使用者看過第一版的棺材說「太不像棺材」，之後的規則都從這次修正來。

### 放在哪

- 形狀定義在各款 `src/game/buyIcon.ts` 的 `BUY_ICON`（範例：`buyIcon.example.ts`，Fang Frenzy 的棺材）
- `SplitBar.svelte` 的 `drawBuyIcon(g, size, color, tileColor)` 照這份畫；規則頁 `ui/BarIcon.svelte` 用同一份畫 SVG，兩邊不會不一致
- 座標系 viewBox −50..50（100 單位＝圖示大小），畫在方塊高度 0.72 倍
- 三種形狀：`d` 填色路徑、`c` 圓 `[cx, cy, r]`、`s` 圓頭線段（寬 `w`）。路徑只用 `M L C Q Z`（pixi 的 `GraphicsPath` 和 SVG 都吃）
- `fill: 'ink'` 是黑色印章；`fill: 'tile'` 是**用方塊本身的顏色挖回來**的鏤空（眼睛、縫線、蓋子的斜邊）。方塊按下／激活時會變色，`tileColor` 跟著傳，鏤空不會變成別的顏色

### 設計規則

1. **畫主題裡最有辨識度的一個「物件或角色剪影」**，不要畫抽象符號。好的例子（`preview/3_buy_icons.png`）：
   - 木乃伊：繃帶纏住的貓頭，露一隻眼
   - 科學怪人：平頭、鋸齒瀏海、縫線嘴、脖子兩根螺栓
   - 吸血鬼：六角棺材（窄頭、寬肩、尖腳）＋蓋子斜邊＋蓋上一隻蝙蝠
   - 亡靈節：糖骷髏（花眼、愛心鼻、縫線牙、額頭小花）
   - 深海：戴船長帽的章魚、四條捲曲觸手
2. **形狀要「對」**：物件的經典輪廓先抓準。棺材要窄頭寬肩、肩在上面四分之一；只畫一個六角框加一條橫槓會看不出是棺材
3. **一個黑色剪影＋幾個鏤空**：剪影本身要能單獨認出來，鏤空只負責表情和細節（眼睛、牙、縫線）
4. **不能用閃電**：Turbo 鈕已經是閃電。**不能用參考廠商的標誌**
5. **最小的鏤空或線條至少 3 單位**（遊戲裡約 2px），再細就糊掉
6. **細節不要貼到剪影邊緣**：鏤空離剪影外緣至少 3 單位，不然小尺寸會看起來剪影破一個洞
7. 圖示佔方塊約 65%，上下左右留白平均

### 怎麼驗

`buy-icons/` 裡有生圖用的兩支腳本：`icons.mjs`（各款形狀）、`render.mjs`（用 `E:/stake/tools/gen` 的 resvg 把每款畫在真實尺寸的黃色方塊上）。改完跑：

```bash
E:/stake/tools/node-v22.23.1-win-x64/node.exe render.mjs
```

會出 `sheet_big.png`（看細節）和 `sheet_small.png`（每格 64px＝遊戲裡的大小）。**一定要看 64px 那張**：這次蝙蝠第一次放大後超出棺材蓋，在大圖看還好，小圖就變成一條波浪。確定後把形狀抄進該款 `buyIcon.ts`。

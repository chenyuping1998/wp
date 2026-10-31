# 拆一款 Pragmatic Play demo 的動態

PP 的 demo 前端是自家 Unity→JS 引擎（UHT），資產全是明文 JSON，不加密。目的只在研究做法與節奏，
**美術與骨架不進產品**（跟 hacksaw-character-motion 包同一原則）。

## 1. 找到遊戲

1. pragmaticplay.com 的遊戲頁有 18+ 閘門：讀 iframe 的 `data-game-src`，或直接開
   `https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=<symbol>&websiteUrl=https%3A%2F%2Fdemogamesfree.pragmaticplay.net&jurisdiction=99&lang=en&cur=USD`。
   內部代號跟名字無關（Sweet Loot = `vs20stopbnnza`）。
2. 在頁面 `performance.getEntriesByType('resource')` 取資產網址，前綴
   `.../gs2c/common/v3/games-html5/games/vs/<symbol>/desktop/`。
3. 用 curl 下載到 `E:\stake\archive\research\<game>\raw\`（不可信資料，獨立資料夾，腳本放別處）。

## 2. 靜態資料

只要 `raw/game/` 下載齊，一行做完：

```bash
node <skill>/scripts/pp_extract.mjs E:/stake/archive/research/<game> --base https://demogamesfree.pragmaticplay.net/gs2c/common/v3/games-html5/games/vs/<symbol>/desktop/game/
```

產出 `merged/`、`assets/`、`spine/`（3.7 原檔）、`spine-index.json`、`spine-42/`（4.2＋atlas＋貼圖頁）。
Sweet Loot：23/23 骨架都有 atlas。腳本內部在做的事：

- `main_resources000..NNN.json`、`GUI00N`、`game00N` 是**切開的同一份 JSON**，要依序 `cat` 起來才能 parse。
- 合併後 `resources[]`：`UHTSpine`（`data.spineJSON` 是 base64 的 Spine 3.7 JSON）、`Texture`（大多是 data URI，
  少數是 `res/<md5>.png` 要另外抓）、`AnimationClip`、`GameObject`。
- 每個骨架的每一頁 atlas 是一個名為 `<骨架>_<頁>` 的 GameObject，上面的 `UIAtlas` 有貼圖 guid（＝Texture 的 id）
  與 NGUI 的 spriteList（裁切後矩形＋padding，名稱前綴 `s_`）。
- 3.7→4.2 轉換要處理：skins 物件改陣列、rotate `angle`→`value`、slot `color`/`twoColor`→`rgba`/`rgba2`、
  貝茲把手改絕對座標且每個分量一組、deform 搬到 `attachments[skin][slot][att].deform`、
  transform 約束 `rotateMix/translateMix/scaleMix/shearMix` 改成 `mixRotate/mixX+mixY/mixScaleX+Y/mixShearY`
  （4.x 缺 mix 預設 1；Luxor 的舊轉換器 `tools_spine37to42.mjs` 漏了後三項，不要再用）。
- `AnimationClip.data.curves[].serializableData` → `propertyName` 與 `curve.serializableData.{times,values,inTangents}`
  （outTangents 常是 `"copy"`＝同 in）。UI 的彈跳、脈衝、飄字都在這裡。

## 2.5 看動作：圖庫與逐格表

```bash
node <skill>/scripts/gallery_server.mjs E:/stake/archive/research/<game> 4193
```

用 preview_start 開（在 `E:\stake\.claude\launch.json` 加一筆，照抄 `sweetloot-gallery`），內建瀏覽器打開
`http://localhost:4193/`。頁面上的「輸出逐格表」會把 N 格存到 `sheets/<骨架>__<動作>.png`；批次輸出：

```js
for (const s of ['swpl_hv_1', 'swpl_fullbody_character']) {
	await __gallery.select(s);
	for (const a of __gallery.cur.data.animations) { __gallery.setAnim(a.name); document.getElementById('frames').value = a.duration > 2 ? 24 : 12; await __gallery.sheet(); }
}
```

存好後用 Read 直接看 PNG。**一定要看圖**：Sweet Loot 的破框三明治、單眼 wink、金幣翻面換序列、跳起時陰影不動，
都是看逐格表才發現、再回頭用數據確認的；只讀關鍵影格看不出來。

已知瑕疵：骨架的動作框是整支動作所有格的聯集，所以人物/特效骨架（含道具、多組特效）在格子裡會顯得小；
hv_1 的逐格表角落有黑塊（遮罩或陰影 slot 的渲染差異，不影響看動作）。
- `game00N.json` 的場景物件：序列化器把每種元件**第一個實例**的鍵值對錯，數字不要信，改讀線上（§3）。
- `build.js` 沒混淆，類別名可讀；`grep "function <Class>("` 找預設值，但**線上值常被場景覆寫**（Sweet Loot 的
  cascadingDuration 預設 1.2、線上是 0.45）。

## 3. 線上場景（最可靠）

用內建瀏覽器開遊戲，`javascript_tool` 貼 `scripts/pp_cat_probe.js` 全文，然後：

```js
__pp.of('TumblingManager_GRM').map(__pp.own)                       // 消除管理器的實際參數
__pp.tree(__pp.find(/Main\/Reels\/SymbolsManager\/Symbols\/S05$/))  // 一個獎圖：圖層、Spine、事件表
__pp.tree(__pp.find(/Game\/Character$/))                           // 人物與道具
```

看得懂事件表要知道三件事：
- `CAT_Container` = 一組具名事件；事件裡每個 action 的 `delay` 是**從事件開始算的絕對秒數**，所有 action 平行跑。
- `CATLink actionType`：0 Start（等它結束）、1 Stop、2 StopAll、3 Start~（不等）、4 StopOthers。
- `ObjActivate` 開關物件＝切狀態；`SwitchLayer` 換渲染層（中獎時拉到最上層）；`SpineAnimation_NoWait` 播動作。

常見有用類別：`VS_Symbol` / `VS_ReelSymbolHolder*`、`SymbolTumbler_GRM`（掉落曲線）、`TumblingManager_GRM`、
`V3Animator`（程式補間，`animationProperty` 0 Pos / 1 Scale / 2 LocPos / 3 Rot）、`SpineController`、
`XTVariable2CAT`（「某變數大於 0 就播某事件」—— 人物反應通常從這裡觸發）、`*Fx_SL` 之類的遊戲專屬類別。

## 4. 錄時間軸

```js
__pp.record()   // 之後轉幾手（demo 假幣），再讀 __pp.log
```

- 時間用 `Time.time`（遊戲時鐘），不要用 `performance.now()`：瀏覽器面板會把 rAF 節流到幾 fps。
- 面板被節流時 `Time.time` 會整個停住，遊戲不跑——此時只能讀靜態結構，時序以 CAT delay 為準。
- demo session 放太久會跳「Please log in」，重開 openGame 網址即可（hook 要重掛）。
- 想看的是特色玩法（FS、砲台、倍數），直接用 demo 的 Buy Feature，比狂轉快。

## 5. 產出

研究資料放 `E:\stake\archive\research\<game>\`（raw / merged / spine / spine-index.json）；
可移植的結論補進本 skill 的 SKILL.md（新手法）或新增一份 `references/<game>-teardown.md`（數據）。

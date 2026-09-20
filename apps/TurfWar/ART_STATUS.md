# Turf War 美術實作狀態

更新：2026-09-09。此檔取代繼承的 Capo Nostra 狀態；原始記錄保留於 ART_STATUS_capo_nostra_reference.md。

2026-09-06 thumbnail 修正：`turfBrand/tile_background.png` 已重新調光。200px 縮圖平均亮度由 29.2 提升至 73.8，亮度低於 40 的暗部像素由 82.2% 降至 12.8%；鐵網、建築、鐵捲門與濕地反光在 FG 合成後仍可辨識。舊暗版保留為 `design/source/turf/tile_background-v1-dark.png`。

## 已落地

- 使用內建 imagegen 產出 63 張採用的原始美術，保存於 `design/source/turf/`；完整提示詞、原圖來源與輸出尺寸記在 `design/turf-art-manifest.json`。
- 12 個符號：金鍊、鐵網街區、鈔票捲、酒瓶與香菸、低底盤車、四種塗鴉 tag、指虎 Wild、Bruiser、Boombox。所有盤面與賠付表引用已更新。
- 三組遠景與透明近景、Turf War Logo、三檔標題、五檔中獎橫幅、無字 FS 招牌、盤面外殼、Buy 卡片框、12 個骨白 UI 圖示。
- 1×1／2×2／3×3 Loot Bag、透明邊光、sticky 圈叉；Big Score 全盤框與邊光已製作並註冊。
- 球棒弧光、整行光柱、碎屑、裂痕；Kingpin 鎖定直行疊層已製作並註冊。
- 鐵捲門左右半片與獨立掛鎖，沿用既有對開轉場。
- 人物 base／feature／Kingpin 三張；透明輸出 512×1024、figure box 134,86→403,839，沿用網格與動作。免費遊戲依 tier 換貼圖；直式窄側帶仍隱藏角色。
- 商店 FG／BG，以及沿用工作室既有產生器輸出的 Provider Logo，位於 `static/assets/sprites/turfBrand/`。
- 銅質王冠代幣與 12 幀旋轉 atlas。
- 標題改用自架 Oswald OFL；數字保留 Orbitron，內文保留 Saira。
- §8.7 UI 材質已完成：正方形 Buy Bonus、Spin、9-slice bar、一般／啟用圓鍵、直式抽屜鍵、info 卡邊與 modal 外框均已出圖並接線。
- 修正 runtime 殘留：紫色落敗符號濾鏡、撲克花色紅色閃光、金棕色 modal／intro、舊人物 H1/H2 pose swap。舊 pose swap 已停用，保留物件變形動畫。
- 程式合成的原創 78／88 BPM 鼓點底樂、球棒撞擊、鐵捲門、重袋落地、Big Score buildup 音檔。當前 Wild／轉場／背景音樂路由已更新。其他通用提示音沿用原版。
- 未被 `src` 引用的 10 組 Capo 美術資料夾已移至 `design/_legacy_assets/`，不再出現在新的 static 出貨內容。少數未啟用的舊分件／Spine 相容資產仍在，未宣稱完成送審用 dead-asset audit。

## 驗證

- `pnpm build` 通過：包含既有素材、key、動作、符號階級、音效等 guards 與新增 Turf 美術 guard。
- `pnpm check:turf-art`：63 張尺寸／透明度、三張人物對位、門片遮蔽與框中央 alpha 0 全數通過。
- `check_symbol_weight.py --ground 17191C` 通過；低符號佔格約 29–35.5%、亮部 0%、對比約 5.9–6.3。
- 本機 stub 試玩已確認開場、一般遊戲、轉動／中獎與 Buy 面板能顯示新圖。此 stub 使用來源 Capo 的 books，只供美術驗證。
- `pnpm check:types` 尚不通過：704 errors / 30 warnings / 56 files。來源 CapoNostra 同一指令也是 704 / 30 / 56，包含 design JS 的 TS 設定、舊 Storybook 型別與缺少 utils-pixi 等既有問題；不能視為完整型別檢查已通過。

## 尚未完成的整款驗收

- 本次沒有變更數學、RTP、reel strips 或 book protocol。現有 `bonus_epic` 仍是每手保證 Bruiser 的舊行為，文案維持描述實際行為。
- Big Score 的全盤框與 buildup 音檔／Kingpin 黏 Wild 鎖定圖已備妥，但相應新數學事件與持續狀態尚未接線；不能宣稱這兩個新機制已可玩。
- 新 math 上線後需更新三檔文案，再跑三檔完整 feature、retrigger、黏 Wild、Big Score 分段動畫與送審巡檢。
- 高符號灰階次序仍須人工微調：H2 與 H3 的最高亮部對比接近，並非嚴格單調階梯。當前可讀性與高／低階級 guard 已通過。
- 未完成逐圖螢光色面積／紅色像素自動分類，未勾選整份 ART_BRIEF 的最終送審驗收。

## 重建

```sh
/Applications/anaconda3/envs/math-sdk/bin/python design/install_turf_art.py
/Applications/anaconda3/envs/math-sdk/bin/python design/generate_turf_audio.py
pnpm build
```

`install_turf_art.py` 只做保存原圖、輸出尺寸／透明畫布對位、atlas packing 和極低 alpha 捨入清理；不以程式繪製代替主要美術。原圖仍保留不變。提示詞的來源路徑在本機 Codex generated_images；重建時也應保留 `design/source/turf/`。

美術試玩輸出：`/Users/stone/stake-engine/dist/turfwar-art-playtest/`，本機 port 4197。`stub.js`／`stub-data.js` 只在這個本機資料夾，沒有放入 app 的正式 build。

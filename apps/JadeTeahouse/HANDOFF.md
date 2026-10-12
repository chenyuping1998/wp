# Jade Teahouse 交接

## 2026-10-10 RTP 更新

- base、bonus、superbonus 的現行目標及已發布 LUT 均為 **96.00%**；三模式各 10,000 本 books 的 SDK 驗證通過。以下舊機率與舊目標數字是歷史紀錄，以本段及 `game_config.py` 為準。正式外部認證仍待完成。

## 路徑

- 前端：`E:\stake\wp\apps\JadeTeahouse`
- 數學：`E:\stake\math-sdk\games\JadeTeahouse`

## 已完成

- 複製 Sushi Monkey 前端至獨立專案，保留原專案。
- 重畫背景、獎圖、青瓷框、角色服裝、轉場、購買卡、免費轉盤／大獎面板與 UI bar；新角色重新切圖並生成 Spine atlas。
- 更新名稱、規則、Pay Table、購買卡及主要多語文字；接入 JadeTeahouse 數學的 FE config。
- 數學模型實作 Ways、W 收集 P、Scatter 免費轉盤、免費轉盤階梯、兩種購買模式與 10,000× cap。

## 指令

```powershell
# from E:\stake\math-sdk
.\env\Scripts\python.exe games/JadeTeahouse/smoke.py
.\env\Scripts\python.exe games/JadeTeahouse/run.py --books 100

# from E:\stake\wp\apps\JadeTeahouse
E:\stake\tools\node-v22.23.1-win-x64\node.exe design/sync_math_config.mjs
E:\stake\tools\node-v22.23.1-win-x64\corepack.cmd pnpm preview:build
```

## 發行前

此為可運作的換皮與數學模型草案，還需完成大樣本 RTP 調參、正式權重、RGS 驗證、茶樓專屬音樂／音效與角色表情圖。音效檔名、若干程式內部 asset key 仍保留 `sushi` 以維持原互動載入路徑，玩家畫面以新主題為準。

依使用者核准的規則調整，玉杯已加入 15／20／30／40／50×，免費轉盤另有 100／150／200／250×；上限仍分別是 50×、250×。使用正常 FR0 輪帶與計數達 12 的替換規則，可以組成觸及 10,000× 上限的盤面，沒有指定或強制封頂書本。玉杯權重是新遊戲待調整數學草案，正式 RTP 與觸頂頻率尚待大量抽樣與優化。

目前抽樣：三模式各 10,000 本。`run.py` 會把 LUT 權重校到目標 RTP：base 94.5%（解出 feature 觸發機率 0.406%，約 1/246；純基礎遊戲 70.72%、feature 平均 59.26×）；bonus／superbonus 95%（原始 92.1%／96.4%，以 (1+賠付)^λ 平滑傾斜權重，λ = +0.018／−0.013，最大權重比 1.23／1.16）。三模式書本、LUT hash 和金額格式均通過 SDK 驗證。1 萬本仍不足以認證 RTP，正式版本需要大量抽樣。

## 送審前修正（2026-10-09，Claude，與 Pocha／MonkeyKingRush／SwingMonkey 同一組）

- **FG 結算金額含觸發轉**：`src/game/featureTotal.ts`（從 Boat 移植）。books 實測：主遊戲觸發的 FG 有 245／1,000 本結算面板少了觸發轉的獎金（付款本身一直是對的）。
- **Spin 鈕呼吸光暈關閉**（`uiTheme.ts` `spinButtonGlow: false`）。
- **限制字詞形變化**：`design/check_social_words.mjs` 加上 buys／paying／wagered 等。
- **重播面板金額全精度**：`ReplayIntro.svelte` 用 6 位小數。
- **說明對照 books**：`design/check_copy_claims.py`（`pnpm check:claims`）驗 9 條規則說法，全部成立。
  - 買入模式的進場盤只放 Scatter、不結算（22.9% 看得到連線、4.8% Wild 旁有玉杯卻沒收），規則頁「模式」下已補一句說明，沒動數學。
  - 樣本最高一局 1,138.8×，**沒有觸頂 10,000× 的 book**，正式重跑數學時要處理。

## 2026-10-10 收集音效只留在該手（Claude）

- 使用者回報：Wild 收分後，收集的音效拖到下一手還在響。原因是一次性音效（收集叮噹、大聖/主角笑聲、算盤跑分 2.2s、大獎號角 2–6s）都會播到結束，沒人停。
- 修法：每手 reveal 送 `soundSpinCut`，`Sound.svelte` 的 `cutSpinSounds()` 把 `SPIN_SCOPED` 清單裡的音效（含 `coin_in` 的疊播複本）在 160ms 內淡出停止。轉輪、停輪、Scatter、FG 觸發鈴、過場門不在清單內。
- 茶樓底七款（Jade／Diner／Pocha／MK／Swing／Mardi／Strike）同步修；未上機。

## 人物網格重切（2026-10-10，Claude）

- 使用者回報擺動時衣服重疊、身體跑掉。原因：多數角色沿用別款的方框切線與關節點（壽司猴的 neck 207、hand 118,558），手臂層帶走了身體、尾巴、鞋尖，關節不在畫上的位置。
- 修法：在 `design/cut_cast_layers.py` 依本款原圖逐列掃描墨線重切（袖子沿腋下縫線、前臂沿身體間隙、大腿從衣襬／肚子下緣、鞋子完整）；rig.json 加 `joints`（實測肩肘髖膝踝）、`sleeveHem:false`、`gusset`、`legBlend`／`kneeBlend`（無衣襬的連身褲）、`underlay`（被手臂遮住的身體改填乾淨衣色並描邊；`hidden` 補畫被手遮住的尾巴段）。
- 流程：`python design/cut_cast_layers.py <mg|fg>` → `python design/fill_cast_underlay.py <mg|fg>` →（Diner mg 另跑 `clean_cast_trunk.py` + `fix_apron_hem.py`）→ `CAST=<mg|fg> node design/generate_monkey_spine.mjs E:/stake/tools/gen`。頭部切線保留（笑臉表情對齊頭框）。
- 驗證：`check_cast_flow` 全過；離線逐格渲染量「脫離身體的碎片」，各角色最大值降到 ≤300px（原本茶樓 ~470、Diner 31,000、Pocha 11,000、Swing 30,000）。未上機。
- 原版備份在 session scratchpad（cast_backup/），未進 git。

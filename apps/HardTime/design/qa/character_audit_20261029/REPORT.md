# HardTime 角色驗收 — 2026-10-29

**結論：未符合最新交付標準。角色能運作，但來源美術、極限姿勢裁切與功能進場的一致性仍未完成，不可標為角色驗收通過或據此打包交付。**

依據：`/Users/stone/.codex/skills/spine-character/SKILL.md`、`hacksaw-character-motion/SKILL.md` 及本 workspace `AGENTS.md`。最新要求為「殘影、毛邊／白邊、碎片、肢體分離、接縫露底、破口或錯誤輪廓任一仍可見，即為未完成」；10/28 另要求手部道具在頭前。

## 本次實際檢查

- 囚犯 15 層、典獄長 20 層，逐層以亮／暗背景檢視。`*_layers_*.jpg` 為來源層檢視，不是假裝已修復的圖。
- 現有交付動作為兩人各自的 idle、react、reactBig、blink；不把新角色拳擊模板的六動作強加給既有姿勢。
- 用遊戲使用的 Spine 4.2 runtime 新擷取每人 484 格，合計 968 格，涵蓋 2 秒 idle、0.4 秒時觸發 reaction／blink、過渡、峰值與回待機。`runtime/motion-check-wide.json` 是本次新結果，非沿用 10/20 報告。GIF 保存每一擷取格；native PNG 保留起終、極值與中間關鍵格。
- 重新檢查來源 fingerprint、靜止合成及 43 個角色素材檔案在 source／build／preview／upload 的 hash。
- 遊戲內用 local stub 檢視桌機 1280×720 與手機 390×844 的反應峰值、RIOT 轉場／進場／FG 與大獎遮擋關係。local QA 控制項只注入 `dist/hardtime-cast-audit/`，不修改產品程式、build 或 upload。

## 阻擋項

### 1. 囚犯前臂與毛巾以碎片互相填洞 — FAIL

`static/assets/castLayers/prisoner_spine_v2/forearm_over.png` 有 **493 個內部透明像素**（alpha≤128），在 setup pose 被 `towel.png` 的像素 **493/493 完全填住**。毛巾層有兩塊主要布片與多塊分離小碎片（201／82／72／41／35／34／28 px 等）。

結果：靜止合成零破洞，兩層分別變形後就錯位。`prisoner_wide_reactBig_046.png`（t=0.767 s，reaction 自 0.4 s 開始）可見手掌下方袖緣與毛巾交界的破碎／穿透；react 中段也有同類問題。上臂補畫區另有模糊塗抹與不乾淨邊緣。

證據：`forearm_holes.png`、`forearm-hole-proof.json`、`defects.png`、`prisoner_reactBig.gif`。

修正應補完整袖子及被遮住的毛巾，清理碎片歸屬與邊緣，再保持原幅度重驗；不能只縮小動作或遮住該處。

### 2. 典獄長來源上臂混入握棍手指 — FAIL

`static/assets/castLayers/warden_spine_v2/upper_arm_r.png` 上端含獨立握棍前臂／手掌的手指像素。此手也由 `forearm_r`／`fingers_r` 繪製，來源層不符合「肢體完整、不得混入其他部位殘影」的標準。`thigh_r.png` 上端亦保留鑰匙像素，需和獨立 `keys` 層一起檢討歸屬。

證據：`warden_layers_2.jpg`、`warden_layers_1.jpg`、`defects.png`。來源缺陷已確認；不把所有被其他圖層遮住的殘影都宣稱為遊戲畫面已露出。

### 3. 典獄長反應峰值外側手掌被裁切 — FAIL

1280×720 的遊戲實際 peak pose：角色 bounds 左端約 **x=-24 CSS px**，外側手掌穿出左螢幕。`CastSpine.svelte:193` 以 rest box 加 6% 估寬，沒有使用完整 reaction envelope。

證據：`desktop_peak.png` 是固定 1280×720 viewport 擷取；早期 `runtime/game_*.png` 是 stage 全 bounds 擷取，會包含畫面外物件，不能用它們證明沒有裁切。

修正需依實際掃過範圍重新安排位置與盤面關係，保留原動作幅度；不可用縮小角色／動作掩蓋。

### 4. 主盤與功能進場不是同一套最終角色資料 — INCOMPLETE

主盤 `Cast.svelte` → `CastSpine.svelte` 使用 Spine v2（15／20 層）。桌機 `FreeSpinIntro.svelte:217` 仍掛 `CastFigureMesh`，且在 `gameType='freegame'` 時讀舊 `castLayers/warden/layers.json`（8 層）；舊囚犯 fallback 為 head/body 2 層。實際 RIOT 進場顯示舊 mesh 典獄長。

因此 v2 分層修補與動作驗收不能代表 feature cut-in 已驗收。來源、裁圖與執行路徑須先統一或分別建立完整驗收證據。

### 5. 警棍層序尚未完整符合 10/28 新規 — FAIL

典獄長主骨架的 `baton`、`forearm_r`、`fingers_r` slot 都排在 `head` 之前；只有 reaction 會另畫前景副本。這不符合最新「手部道具一律在頭前」的規則。調整層序後仍要檢查手掌完整度及原畫的遮擋關係。

## 已通過的項目（不能抵銷上述缺陷）

- 新 runtime 量測：兩人各 484 格，翻面 0；腳踝最大誤差囚犯 2.14e-13、典獄長 2.57e-13 art px。
- 三角形面積比：囚犯 0.681–1.211；典獄長 0.726–1.365。此數字不檢查來源碎片或錯誤輪廓。
- 眨眼可閉合及正常釋放，無永久閉眼。見兩張 `*_blink_detail.jpg`。
- 靜止合成：兩人 0 個原圖不透明位置的破洞；改色 0.37%／0.21%。它會漏掉「由另一可動圖層填住破洞」的情況，已以本次 493 px 案例證明。
- 43 個角色 source runtime 檔在 build、preview、upload 都逐 byte 相同。這只證明三處攜帶相同角色素材，不代表不同呈現路徑或整個 frontend 版本已統一。
- 本機檢查期間 console error 0；不代表 Stake 真實 RGS 或所有功能模式的完整送審驗收。

## 工具相容性

現有骨架為 Spine **4.2.43**。已執行 `spine-motion check`；它明確拒絕舊 IK／physics 格式，故不引用任何 Spine 4.3 的流暢度分數，也沒有改版本字串冒充相容。此次用現有官方 4.2 runtime 做數值與實際渲染；維持既有 rig 是合法維護路徑，版本本身不列為視覺 FAIL。

## 上輪載入結論更正

`preload:false` 在目前 `pixi-svelte/dist/components/AssetsLoader.svelte` 只是從預載清單移到一般載入清單，兩批最終都會下載。先前的 1,862,988 bytes 是移出 preload 的檔案量，**總下載節省為 0**；warden 舊圖層還被桌機 feature cut-in 使用。HANDOFF 與 optimization results 已更正。

本次僅驗收、保存證據及更正紀錄；未改角色來源、骨架、動作或產品程式，未打包、未上傳平台。建議依「補完整來源 → 統一 cut-in 路徑與道具層序 → 重算完整 motion envelope → 桌機／手機逐動作重驗」順序修正。

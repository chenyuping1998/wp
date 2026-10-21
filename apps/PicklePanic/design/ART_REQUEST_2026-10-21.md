## 2026-10-21 Codex 交件

已更新 FG 九個軀幹／手臂／腿圖層、picklePepper atlas 與 mesh 尺寸、buy_chef、切入 body／arm／sparks／合成圖、MAX base 與三個動畫層、封面 FG。原圖保存在各圖層 *_pre1021.png 與 design/source/review_1021/before/；runtime 備份存於 review_1021/backup_named/，不出貨。

alpha>8 的水平外接盒：軀幹 258px（目標約260）；上臂左146／右155px；前臂手掌左122／右128px；大腿149／99px；小腿87／104px。軀幹逐列量測胸174px、腰最小174px，腰胸比1.00。尺寸是實際可見墨跡，非檔案畫布寬度；逐列寬度及原／新對照見 design/qa/review_1021/registration_audit.json。

骨架、關節座標、動畫、物理與 mesh 權重／拓樸全數保留；只重新對位圖層、更新 mesh 頂點與 atlas 區塊。頭、頭巾、鞋與封面店長保留原像素。手臂向外加粗，殘影閘門左右0.0% PASS。全部13項新圖／組裝檢查通過 colors95≤140、soft≤38%、brief六色 palette-fit≥60%。MAX 建層腳本改讀當前 production 圖，避免永遠重切舊備份；封面建圖腳本改用新組裝角色。

建置與所有既有 guards PASS（既有15項型別問題，無新增）。已更新本機 upload/PicklePanic/，新版封面與既有單店長縮圖都包含；平台尚未上傳或更新。瀏覽器驗收記錄見 docs/handoff/PicklePanic.md 最新段落。

---

# Pickle Panic — FG 女廚師身形重畫需求單（2026-10-21）

使用者 10-21 回報（截圖 `design/qa/review_1021_user_fg_thin.png`）：
> 女酸黃瓜整體太細，身體跟手都是，身體還凹一塊。

畫風、色卡、閘門同 `ART_BRIEF.md` §0 與 §1（粗墨線美式地下漫畫、外線約內線 2 倍、平塗兩色調＋墨黑）。10-17 加的**紅色背心**保留。原檔一律留 `*_pre1021.png`。

## 量到的問題（`design/source/fg/` 各層，560×912 畫布）

| 部位 | 女廚師現況 | 店長（MG）對照 | 目標 |
|---|---|---|---|
| 軀幹最寬 | 207 px | 289 px（她只有 72%） | **約 260 px**（+25%，店長的 90%） |
| 腰（軀幹第 120–160 列） | **99–111 px**，胸口 173、臀 190 → 腰縮四成多，就是截圖裡那個凹口 | 一路飽滿 | 腰寬 ≥ 胸寬 90%：從胸到臀是一條飽滿的酸黃瓜外形，**側邊不能內凹** |
| 上臂寬 | 107／114 px | 129／100 px | **+35%**（約 145–155 px） |
| 前臂＋手寬 | 89／94 px | 106／91 px | **+35%**（約 120–125 px），手掌跟著放大一點，不要細指 |
| 大腿／小腿寬 | 85–129／72–90 px | 107–135／101–121 px | **+20%** |
| 頭、紅頭巾、鞋 | — | — | **不變** |

她仍然要明顯是**另一個角色**（細長酸黃瓜 vs 店長的矮胖），只是不要瘦到像竹竿；兩人並排像同一家族，頭頂高度差 ≤ 5%、腳底同一條線。

## 要交的檔案（所有出現她的地方一起換，不然又變兩套）

1. **遊戲裡的角色**：`design/source/fg/` 下 `torso_0_trunk.png`、`left_/right_arm_0_upper_arm.png`、`left_/right_arm_2_hand.png`、`left_/right_leg_0_thigh.png`、`left_/right_leg_1_calf.png`。
   - 同 560×912 畫布、**關節位置不變**（`rig.json`、`layers.json` 的骨架不能動；加粗是往外長，關節中心不移）。
   - 軀幹層**不能在手臂後方留色塊**（10-16 殘影問題）：交件後跑 `python3 /Users/stone/stake-engine/wp/.claude/skills/game-reskin/scripts/check_cast_underlay.py design/source/fg`，要 PASS（≤1%）。
   - 重打 atlas：`static/assets/spines/picklePepper/cast.png`（沿用 10-17 `design/apply_review_1017_ae.mjs` 的打包方式，atlas 區塊座標一併更新）。
2. **買特色卡**：`static/assets/pickle/buy_chef.png`（198×420，同畫布、同站位）。
3. **砍圖騰卡**：`static/assets/pickle/upgrade_cutin_body.png`、`upgrade_cutin_arm.png`、合成圖 `upgrade_cutin.png`（同畫布；手臂層的肩膀軸心 (365,315) 不變，`design/build_cutin_layers.py` 的動作才對得上）。
4. **MAX 招牌**：`static/assets/pickle/win_max_base.png` 右側的她（1600×900，同位置、手仍搭在招牌右邊與右上角）。
5. **封面**：`design/cover/PicklePanic-Cover-FG.png`（同畫布，左側店長與左下／右上留白區不變）。

## 驗收

- 70px 與 200px 大廳尺寸：她跟店長並排、在 FG 背景上，輪廓清楚，腰側沒有凹口。
- `check_cast_underlay.py` PASS；新圖閘門 colors95 ≤ 140、soft ≤ 38%、palette-fit ≥ 60%。
- 交件寫在本檔最上面：改了哪些檔、量到的新寬度。

## 交件後由 Claude 做

重跑 `python3 design/build_max_layers.py`（MAX 招牌三層要從新圖重切，不然招牌上的她還是舊的）、建置、實機看 FG 遊戲中（idle／大獎慶祝／砍圖騰卡）、買特色、MAX 大獎與開場卡、封面亮度檢查，打包。平台上傳等使用者說「上傳」。

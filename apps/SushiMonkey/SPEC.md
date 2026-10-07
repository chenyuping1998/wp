# Sushi Monkey — 換皮規格（啟動版）

日期：2026-10-05。使用者指定 GoBanandit 模板、猴子壽司師傅主題、Toshi 式米灰網點與復古視窗風格。
工作名稱：Sushi Monkey；gameID：SushiMonkey。

## 1. 本次範圍

| 項目 | GoBanandit 模板 | Sushi Monkey |
|---|---|---|
| 盤面／Ways | 5×4／1,024 Ways | 沿用 |
| 數學／paytable／轉輪 | 模板目前版本 | Base／paytable 沿用；FG 低分種類替換，新書本與權重重算 |
| 收集 | 每隻 W 收集所有 P | 每隻師傅 W 收集所有壽司盤 P |
| FG 計數 | 每隻 W 計數 +1，升收集倍率 | 師傅計數 +1，加轉並依序替換 10／J／Q，收集全程 ×1 |
| 角色 | MG 大盜猴／FG 把風猴 | MG 老練壽司師傅／FG 年輕壽司師傅，两隻不同猴子 |
| 美術 | 紅綠剪紙絲印 | 米灰線稿、網點、餘燼橘、機制藍／粉 |
| UI／轉場 | 絲印票卡／鐵捲門 | 壽司店訂單視窗／VHS 訊號切換 |

使用者已確認上述新機制；兩個角色皆選 #7 香蕉猴。

## 2. 模板數值

- 5 輪 × 4 列，1,024 Ways，左到右、最左輪起算、3 連起賠。
- 設定 RTP：94.5%，base／bonus／superbonus 一致；Max Win：10,000×。
- W 在第 2–5 輪；替代 H/L，不能替代 P 或 S；W 沒有獨立 paytable。
- P 不參與 Ways，帶 prize；主遊戲 1×–50×，FG 有稀有 100×／250×。
- 收集獎金 = 全盤 P 總和 × W 數量（固定 ×1），另加 Ways 獎金並共用封頂。
- 主遊戲 3／4／5 S → 10／12／15 FG；FG 轉輪不放 S，無 Scatter retrigger。
- FG 每落一隻 W 計數 +1；到 4／8／12 時各 +10 轉，依序移除整種 L5（10）／L4（J）／L3（Q），全部變成 P。
- 替換從下一次 FG 盤面生成開始，涵蓋所有輪與 padding；之後持續累加，整段 FG 生效，新一局重設。
- 替換的 P 也會從 FG 盤子數值表抽值；Ways 與收集都按替換後的同一張盤面計算。
- 若同一轉跨多個門檻，逐個解鎖，各加 10 轉；最高階後不再無限加轉。
- bonus：100×，10 FG，計數 0；superbonus：150×，10 FG，計數 4／開場已將所有 10 替換成 P，收集仍 ×1，不額外贈送已跨過的 +10 轉。
- RTP 94.5% 是最佳化目標，需以新 LUT 量測結果確認；其他列值是新規則設定。

## 3. 新符號映射

| ID | 顯示名稱 | 美術主體 |
|---|---|---|
| H1 | Omakase Boat | 舟形盛合壽司，最寬最豐富的輪廓，橘色重點 |
| H2 | Salmon Nigiri | 兩貫鮭魚握壽司，橘色魚肉 |
| H3 | Tuna Maki | 三顆卷壽司，圓形切面與海苔輪廓 |
| H4 | Tamago Nigiri | 玉子握壽司，長方形蛋片與海苔腰帶，米灰 |
| L1–L5 | A／K／Q／J／10 | 米色訂單紙上的炭灰粗體字，由程式排字 |
| W | Chef — Wild | 原創猴子師傅章，深炭底、橘框；不沿用大盜面罩 |
| P | Sushi Plate | 帶數值的圓壽司盤，主價值物件；數值執行期排字 |
| S | Order Bell — Scatter | 出餐鈴與 FS 訂單紙，橘色重點 |

## 4. 機制包裝

- 收集演出名稱：Sushi Service；師傅計數器：Chef Meter。
- bonus 對外名稱：Dinner Rush；superbonus：Omakase Rush。
- 舊事件名稱 collect／banditMeter／sacks 保留作相容協定，文案改成師傅與壽司盤。
- 藍只用於收集路径／框，粉只用於 FG 升級訊號，橘用於值錢物件與獎勵。
- 名稱 Sushi Monkey／Sushi Service／Chef Meter／Dinner Rush／Omakase Rush 未包含本機限制詞表的詞。

## 5. 工作位置與階段

- 前端：wp-banandit/apps/SushiMonkey；數學：math-sdk/games/SushiMonkey。
- 啟動階段：獨立骨架、設定改名、文案映射、美術 brief 與 style test。
- 原模板圖像目前是工程佔位；正式壽司素材須由核准的風格樣張延伸。第三版是粗線報紙漫畫、減少紋理。
- MG／FG 均已選 #7；最終角色圖與 rig 待第三版風格樣張核准。
- 送審暫存目的地：upload/SushiMonkey；本階段尚未打包或更新平台。

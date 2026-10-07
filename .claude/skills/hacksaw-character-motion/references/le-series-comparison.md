# Le 系列三款角色動態對照

| | gameId / ver | 角色檔 | 骨 | slot | 大小 | Spine | 骨架框 | 動畫數 |
|---|---|---|--:|--:|--:|---|---|--:|
| **Le Bandit** | 1309 / 1.24.0 | `raccoon.json` | 36 | 36 | 183 KB | **3.8.99** | 998×1372 | **21** |
| **Le Bandit Hold & Win** | 2465 / 1.4.5 | `smokey.json` | 36 | 36 | 176 KB | 4.0.64 | **998×1372** | 18 |
| **Le Prechaun** | 2413 / 1.16.4 | `smokey.json` | **57** | 43 | 431 KB | 4.0.64 | **450×614** | **39** |

抄錄日期 2026-09-16。角色名字從 `raccoon` 改成 `smokey`，但——

---

## 0. 結論

**三款是同一隻角色、同一批動畫資料。** 不是「風格延續」，是**逐幀相同**。

新作的做法不是重做，是：

1. 把 Spine 3.8 的檔案重新匯出成 4.0
2. 改名（`loosing_1_stomp` → `loosing_1`、`small_win` → `win_1`…）
3. **加次級骨**（鬍鬚、外套），在原本的動畫上疊新通道
4. 只有真正要換的演出才重做

---

## 1. Hold & Win：同一批檔案，換個名字

逐幀比對（3.8 的 `angle` 與 4.0 的 `value` 正規化後）：

| Le Bandit | Hold & Win | 通道逐幀相同 |
|---|---|---|
| `bread_win` | `bread_win` | **19 / 19** |
| `idle` | `idle` | **15 / 15** |
| `welcome` | `welcome` | **21 / 21** |
| `sus_scratch` | `sus_scratch` | **15 / 15** |
| `leprechaun_hat_on` | `leprechaun_hat_on` | **23 / 23** |
| `leprechaun_scratch` | `leprechaun_scratch` | **17 / 17** |
| `leprechaun_loosing_1` | `leprechaun_loosing_1` | **23 / 23** |
| `small_win` | `win_1` | **18 / 18** |
| `lost_mustache` | `lost_mustache` | 26 / 27 |
| `loosing_3_stomp_on_hat` | `loosing_3_stomp_on_hat` | 28 / 30 |
| `loosing_1_stomp` | `loosing_1` | 18 / 20 |
| `loosing_2__hat_toss` | `loosing_2` | 24 / 26 |
| `big_win` | `win_2` | **17 / 33** ← 只有這段真的重做 |

**骨骼名稱 36 根完全一致**，slot 名稱集合相同但順序被重排過（繪製順序調整）。

### 改了什麼

| | Le Bandit | Hold & Win |
|---|---|---|
| 中獎階梯 | 三階：`big_win` / `_incroyable` / `_mondieu` | **兩階**：`win_1` / `win_2` |
| 妖精中獎 | 三段 | 兩段（`leprechaun_win_1` / `_2`）|
| 帽子 | 只能戴上（`leprechaun_hat_on`）| **多了脫下**（`leprechaun_hat_off` 1.67s）與 `leprechaun_hat_toss` |
| 測試殘留 | 有 `idle_path_test` | **清掉了** |

**三階變兩階**是這款最大的表演改動 —— 少一層情緒分級，節奏更快。

---

## 2. Le Prechaun：同一個核心，加了鬍鬚和外套

57 骨裡 **35 根跟 Le Bandit 同名**，只少了 `bubble_bone`（改叫 `word_bubble`）。

新增的 22 根：

```
beard_1 → beard_2 → beard_3 → beard_4       掛 head_bone —— 四節鬍鬚
jacket_L → jacket_L_1 → jacket_L_2          掛 chest_bone —— 左襟三節
jacket_R → jacket_R_1 → jacket_R_2          掛 chest_bone —— 右襟三節
clover, sparkle_1, sparkle_2, sparkles       掛 root2 —— 幸運草與亮點
moustache_fake, word_bubble
a_HEAD_ASSETS, b_BODY_ASSETS,
c_ARM_ASSETS_LEFT, c_ARM_ASSETS_RIGHT,
main_rig, root2                              分組用的空骨
```

### 核心動畫沒動，只是多了通道

| Le Bandit | Le Prechaun | 共用通道逐幀相同 | Prechaun 總通道 |
|---|---|---|--:|
| `loosing_3_stomp_on_hat` | `loosing_3_stomp_on_hat` | **28 / 28** | 44（＋16）|
| `sus_scratch` | `sus_scratch` | **15 / 15** | 21（＋6）|
| `idle` | `idle` | **15 / 15** | 23（＋8）|
| `bread_win` | `win_bread` | **17 / 17** | 27（＋10）|
| `small_win` | `win_1` | **16 / 16** | 24（＋8）|
| `lost_mustache` | `lost_mustache` | 26 / 27 | 34 |
| `loosing_1_stomp` | `loosing_1` | 16 / 18 | 26 |

`idle` 多出來的 8 個通道，全部是次級運動：

```
beard_2 / beard_3 / beard_4   rotate  [−7.06, +3.54]
jacket_L_1 / jacket_L_2       rotate  [−10.76, +5.33]
jacket_R_1 / jacket_R_2       rotate  [−10.76, +5.33]
hat_bone                      rotate  [−2.79, +4.18]
```

**鬍鬚 ±7°、外套 ±10.8°，而軀幹還是那個 ±1.5°。**
跟 Miami 的鬍子（beard 6.9° / beard_tip 13.9°）是同一個手法家族 ——
**在既有動畫上掛一條會跟隨的鏈，就得到一個「新」角色。**

> 注意 `beard_2/3/4` 三節用**完全相同的範圍**（−7.06, +3.54），
> `jacket_*_1/2` 四節也一樣（−10.76, +5.33）。
> 一條曲線複製給整條鏈，只靠父子累加做出遞增幅度 —— 最省的跟隨鏈做法。

### 真正新增的：一整套跳舞

| 動畫 | 長度 | 動的骨 |
|---|--:|--:|
| `dance_start_1` | 0.50s | 16 |
| `dance_idle_1` | 1.00s | 16 |
| `dance_idle_1_long` | 3.00s | 16 |
| `dance_end_1` | 0.53s | 16 |
| `dance_start_2` | 2.00s | 29 |
| `dance_idle_2` | 0.83s | 27 |
| `dance_end_2` | 1.87s | 29 |

**兩套舞，各自 start → idle（可長可短）→ end 的完整狀態機。**
第 1 套 16 骨是小幅度的點頭晃動，第 2 套 27–29 骨是全身。

`dance_idle_1` 的幅度跟 `idle` 完全不是一個量級：

```
R_knee_bone   63.3      head_bone  51.4      L_ear   43.5
hip_bone      33.1      chest_bone 32.7      R_sholder 26.5
```

**膝蓋 63 度、頭 51 度、軀幹 32.7 度** —— idle 的軀幹只有 1.5 度，**差 22 倍**。
這是「站著」跟「跳舞」的差別，不是同一套動作加大。

### `bonus/` 命名空間 ＝ 同一批動畫換裝

Le Prechaun 把每段動畫做了兩份：`win_1` 與 `bonus/win_1`。逐幀比對：

| | 共用通道相同 |
|---|---|
| `idle` vs `bonus/idle` | **22 / 22** |
| `win_1` vs `bonus/win_1` | **24 / 24** |
| `win_2` vs `bonus/win_2` | **42 / 42** |
| `win_3` vs `bonus/win_3` | **43 / 43** |
| `win_bread` vs `bonus/win_bread` | **27 / 27** |
| `sus_scratch` vs `bonus/scratch` | **21 / 21** |

**骨骼資料一模一樣，只差 slot 通道**（開不同的服裝圖層）。
跟 Le Bandit 用 `leprechaun_` 前綴做同一件事 ——
**兩款都選擇「複製一份動畫改 slot」而不是用 Spine 的 skin 系統。**

代價是動畫數量翻倍（Prechaun 39 段有 17 段是複本），
好處是動畫師可以針對換裝微調個別 slot，不必受 skin 的結構限制。

---

## 3. 一張表看完

| | Le Bandit | Hold & Win | Le Prechaun |
|---|---|---|---|
| 骨架 | 基準 | **同一具** | 基準 ＋22 次級骨 |
| 動畫資料 | 基準 | **逐幀相同**（13 段裡 11 段）| **逐幀相同**（共用通道）|
| 真正重做的 | — | `win_2` | 全套 dance |
| 換裝做法 | `leprechaun_` 前綴複製 | 同左 | `bonus/` 命名空間複製 |
| 中獎階梯 | **三階** | 兩階 | 三階（`win_1/2/3`）|
| 角色會生氣嗎 | **會**（贏 <10× 就跺腳）| 會 | 會 |
| 新增機制 | — | 帽子可脫 | **跳舞狀態機** ＋ `reel_highlight` |
| 畫布 | 998×1372 | 998×1372 | **450×614** |

**畫布從 998×1372 縮到 450×614** 是 Le Prechaun 唯一的硬破口 ——
那代表美術重畫過（或至少重新輸出過），不能直接沿用 Le Bandit 的圖。
但**骨架與動畫可以**，而且他們就是這樣做的。

---

## 4. 要抄的話，這條線最值錢

**一具角色骨架可以撐三款遊戲。** 條件是：

1. **骨架命名要穩。** 三款 35–36 根同名骨，換人做也接得上。
2. **次級運動用獨立的鏈**（鬍鬚、外套、尾巴），掛在 `head_bone` / `chest_bone` 底下。
   要做「新角色」時加一條鏈就好，核心動畫一個關鍵幀都不用動。
3. **換裝用複製動畫改 slot**，不要用 skin —— 他們兩款都這樣選。
4. **新機制才重做動畫**（dance、hat_off），情緒演出沿用。

---

## 5. 沒有驗證的部分

- **三款都沒有實跑過。** 全部出自骨架檔比對。
- **只抓了 spine 的 `.json` 與 `.atlas`，兩款姊妹作沒抓貼圖**，
  所以「美術有沒有重畫」我只能從畫布尺寸推斷（998×1372 → 450×614），
  沒有比對過像素。
- Hold & Win 與 Le Prechaun 的 **`main.js` 沒抓到**（403，需要補 Referer 重抓），
  所以**那兩款的「誰決定播哪一段」我沒有讀**。
  本文的程式端結論全部只適用於 Le Bandit。
- `dance_*` 的狀態機怎麼串（什麼時候從 start 進 idle、什麼時候 long）
  要讀那兩款的 bundle 才知道，目前只有動畫本身。

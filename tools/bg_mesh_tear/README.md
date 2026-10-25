# 背景網格破圖檢查（2026-10-24）

check_mesh_wins 只量三角形面積，看不出「網格把旁邊的石頭／桌腳一起拖彎」這種破圖。
這兩支把每個背景道具掃 0–12 秒（含中獎陣風、震動等最壞事件），挑出變形最大的一幀，
用真底圖渲染成「靜止｜最壞｜差異×3」三格對照。

```bash
node wp/tools/bg_mesh_tear/bg_dump.mjs <app>/src/game/meshWin/bgProps.ts putt|alc out.json
python wp/tools/bg_mesh_tear/bg_render.py out.json gbBgBase=<plate> gbBgFeature=<plate> ... outdir
```

- `putt` = BgEnv {t, gustT}（茶樓底系列）；`alc` = {t, level, quakeT, blastT, coinT}（Boomana 底系列）。
- 渲染用最近鄰取樣，邊緣鋸齒是工具本身造成，遊戲裡是雙線性。
- 看差異圖：有出現「不該動的硬物」（步道、桌腳、火山口）就是破圖；用 bgProps 的 `avoid` 或收窄 `soft`。
- 疊在網格上的「固定」發光層（BgLight / lava glow）要避開會動的區域，否則會重影。

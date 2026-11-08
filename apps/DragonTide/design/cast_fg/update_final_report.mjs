/** Keep the canonical authoring preview/report on the app's final recipe. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url));
const folder=path.join(root,'cast_fg_spine');
const report=path.join(folder,'報告.md');
if(fs.existsSync(report)){
 const old=fs.readFileSync(report,'utf8');
 if(!old.includes('正式助手配方'))fs.writeFileSync(path.join(folder,'template-report.md'),old);
}
execFileSync(process.execPath,['/Users/stone/tools/spine-generator/bin/spine-motion.js','preview',path.join(folder,'cast_fg.json'),'--loops','idle,win_big_loop','-o',path.join(folder,'預覽.html')],{stdio:'inherit'});
const rig=JSON.parse(fs.readFileSync(path.join(folder,'cast_fg.json'),'utf8'));
fs.writeFileSync(report,`# FG 女助手 · 正式助手配方

本報告與預覽使用最終 cast_fg.json，包含 ${Object.keys(rig.animations).length} 段正式動作：${Object.keys(rig.animations).join('、')}。
初始 stand34 八段模板報告保存在 template-report.md，並非正式助手的驗收結果。

throw 事件：${rig.animations.gaze.events.find(e=>e.name==='throw').time*1000}ms。來源修圖保留原 joints、IK、骨架、動作鍵與角色尺寸。

正式動作的流暢度檢查見 [cast_fg.check.md](cast_fg.check.md)；該結果不取代原生素材和實際遊戲的目視驗收。
來源形態檢查仍保留尾巴第三節靜態 S 形內側 368px² 提示，原始結果見 ../qa/final-character-check.json，未抹去歷史警告。

第二輪來源修正與同版素材證據見 [README.md](../qa/repairs-r2/README.md)。包含十動作、十一關節區域各四格的 440 格原生同格對照、三個指定時間，以及桌機和直式手機畫面。預覽採用與 Pixi 一致的線性取樣，避免雙三次取樣在半透明圓頭產生亮弧。
完整實際素材動畫見 [preview.gif](../preview.gif)，本頁旁的預覽.html 直接嵌入正式十段骨架資料。

尚未打包到 upload 或更新平台；正式角色人聲仍待交。
`);

import { Application, Assets, Container, Graphics, Mesh, MeshGeometry, Sprite } from 'pixi.js';
import { MESH_WINS } from '../src/game/meshWin';
import { buildRig, skin } from '../src/game/meshWin/meshRig';
import { drawInkFx } from '../src/game/meshWin/inkFx';
import { mount } from 'svelte';
import CourseGuide from '../src/components/ui/CourseGuide.svelte';

mount(CourseGuide, { target: document.querySelector('#guide')! });

const labels = [
  ['H1', '風車', '反向蓄勢 → 連轉兩圈 → 急煞回彈'],
  ['H2', '恐龍', '前衝大咬 → 再補一口 → 冒出小汗珠'],
  ['H3', '球袋', '兩拍甩動 → 球桿回彈 → 毛巾跟隨'],
  ['H4', '檸檬飲料', '碰杯搖晃 → 水滴飛濺 → 氣泡冒出'],
  ['W', '高爾夫球手', '扭身躍起 → 俏皮致意 → 星芒接力'],
  ['S', '金旗', '左右迎風 → 旗面波動 → 三拍小星芒'],
];
const seek = document.querySelector<HTMLInputElement>('#time')!;
const play = document.querySelector<HTMLButtonElement>('#play')!;
const speed = document.querySelector<HTMLSelectElement>('#speed')!;
const status = document.querySelector('#status')!;
let playing = true, time = 0, last = performance.now();
play.onclick = () => { playing = !playing; play.textContent = playing ? '暫停' : '播放'; };
seek.oninput = () => { time = Number(seek.value); playing = false; play.textContent = '播放'; };
const renderers: ((t: number) => void)[] = [];
for (const [name, label, description] of labels) {
  const article = document.createElement('article');
  const title = document.createElement('h2'); title.textContent = label;
  const text = document.createElement('p'); text.textContent = description;
  article.append(title, text); document.querySelector('#symbols')!.append(article);
  const app = new Application();
  await app.init({ width: 300, height: 280, backgroundAlpha: 0, antialias: true, resolution: devicePixelRatio, autoDensity: true });
  article.prepend(app.canvas);
  const spec = MESH_WINS[name], rig = buildRig(spec.rig);
  const positions = new Float32Array(rig.rest);
  const geometry = new MeshGeometry({ positions, uvs: rig.uvs, indices: rig.indices });
  const tex = await Assets.load(`/assets/sprites/${spec.art}`);
  const mesh = new Mesh({ geometry, texture: tex });
  const holder = new Container(); holder.position.set(22, 12); app.stage.addChild(holder);
  holder.addChild(mesh);
  let sails: Sprite | undefined;
  if (spec.spinner) {
    sails = new Sprite(await Assets.load('/assets/sprites/sushiSymbols/h1_sails.png'));
    sails.anchor.set(spec.spinner.hub[0] / 256, spec.spinner.hub[1] / 256);
    holder.addChild(sails);
  }
  const ink = new Graphics(); holder.addChild(ink);
  renderers.push(t => {
    const pose = spec.pose(rig, t);
    skin(rig, pose, spec.feetY, positions); geometry.getBuffer('aPosition').update();
    drawInkFx(ink, name, t, spec.feetY, pose.rigid);
    if (sails && spec.spinner) {
      const [hx, hy] = spec.spinner.hub;
      let v = 0, best = Infinity;
      for (let i = 0; i < rig.rest.length; i += 2) {
        const d = Math.hypot(rig.rest[i] - hx, rig.rest[i + 1] - hy);
        if (d < best) { best = d; v = i; }
      }
      sails.position.set(positions[v] + hx - rig.rest[v], positions[v + 1] + hy - rig.rest[v + 1]);
      sails.rotation = (spec.spinner.turn(t) + pose.rigid.rot) * Math.PI / 180;
      sails.width = sails.height = 256 * pose.rigid.pop * Math.sqrt(Math.abs(pose.rigid.sx * pose.rigid.sy));
    }
  });
}
function frame(now: number) {
  if (playing) time = (time + Math.min(now - last, 60) * Number(speed.value)) % 2000;
  last = now;
  const t = Math.min(time, 1440);
  seek.value = String(t); status.textContent = `${Math.round(t)} ms`;
  for (const render of renderers) render(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

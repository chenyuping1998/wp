// Technical export of imagegen artwork: alpha-preserving resize, registration,
// layer assembly and atlas patching. No procedurally painted replacement art.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp = require('sharp');
const app = path.resolve(import.meta.dirname, '..');
const dir = path.join(app, 'design/source/review_1017_ae');
const art = path.join(app, 'static/assets/pickle');
const generated = JSON.parse(fs.readFileSync(path.join(dir, 'generated.json')));
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const blank = (width, height) => sharp({ create: { width, height, channels: 4, background: transparent } });
const before = (rel) => path.join(dir, 'before', rel);
const image = (name) => path.join(dir, 'raw', name + '.png');
fs.mkdirSync(path.join(dir, 'raw'), { recursive: true });
for (const [name, source] of Object.entries(generated)) {
  if (fs.existsSync(source)) fs.copyFileSync(source, image(name));
  else if (!fs.existsSync(image(name))) throw new Error(`Missing source art: ${name}`);
}
const sized = async (name, width, height) => sharp(image(name)).resize(width, height, { fit: 'fill' }).ensureAlpha().png().toBuffer();
const exportImage = async (name, file, width, height) => {
  const data = await sized(name, width, height);
  await sharp(data).toFile(path.join(art, file));
};
const report = {};
// Bound individual connected sheet objects, so a sprite crossing a nominal
// cell boundary cannot leave an unrelated fragment in an exported part.
async function objects(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const seen = new Uint8Array(info.width * info.height), found = [];
  const stack = new Int32Array(seen.length);
  for (let k = 0; k < seen.length; k++) {
    if (seen[k] || data[k * 4 + 3] <= 8) continue;
    let head = 0, tail = 1, minX = info.width, minY = info.height, maxX = 0, maxY = 0;
    stack[0] = k; seen[k] = 1;
    while (head < tail) {
      const q = stack[head++], x = q % info.width, y = Math.floor(q / info.width);
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      for (const n of [x > 0 ? q - 1 : -1, x + 1 < info.width ? q + 1 : -1, y > 0 ? q - info.width : -1, y + 1 < info.height ? q + info.width : -1]) {
        if (n >= 0 && !seen[n] && data[n * 4 + 3] > 8) { seen[n] = 1; stack[tail++] = n; }
      }
    }
    if (tail > 2000) found.push({ left: Math.max(0, minX - 1), top: Math.max(0, minY - 1), width: Math.min(info.width - Math.max(0, minX - 1), maxX - minX + 3), height: Math.min(info.height - Math.max(0, minY - 1), maxY - minY + 3), count: tail });
  }
  return found.sort((a, b) => b.count - a.count).slice(0, 4).sort((a, b) => Math.floor((a.top + a.height / 2) / (info.height / 2)) - Math.floor((b.top + b.height / 2) / (info.height / 2)) || a.left - b.left);
}

// A: independent, complete layers; the boat is painted beneath every spear.
if (generated.h4gen) {
  const sheet = await sharp(image('h4gen')).resize(1024, 1024, { fit: 'fill' }).png().toBuffer();
  const definitions = [
    ['body', 0, 0, [49, 185, 463, 430], [256, 330]],
    ['spear_middle', 512, 0, [95, 120, 320, 306], [210, 230]],
    ['spear_left', 0, 512, [140, 155, 365, 341], [255, 265]],
    ['spear_right', 512, 512, [185, 190, 410, 376], [300, 300]],
  ];
  const layers = [], composites = [];
  const parts = await objects(sheet);
  if (parts.length !== 4) throw new Error('H4 requires four disconnected sprite parts');
  for (const [index, [name, left, top, box, pivot]] of definitions.entries()) {
    const { count, ...bounds } = parts[index];
    const tile = await sharp(sheet).extract(bounds).png().toBuffer();
    const data = await sharp(tile).resize(box[2] - box[0], box[3] - box[1], { fit: 'fill' }).png().toBuffer();
    await sharp(data).toFile(path.join(art, `h4_${name}_v2.png`));
    composites.push({ input: data, left: box[0], top: box[1] });
    layers.push({ name, key: `layer_h4_${name}`, pivot, box });
    await blank(512, 512).composite([composites.at(-1)]).png().toFile(path.join(dir, `h4_${name}_registered.png`));
  }
  await blank(512, 512).composite(composites).png().toFile(path.join(art, 'h4.png'));
  // No separate underpaint is necessary: body is an unoccluded complete boat.
  const specFile = path.join(app, 'src/game/symbolLayers.ts');
  const old = fs.readFileSync(specFile, 'utf8');
  const spec = { canvas: [512, 512], rest_max_rgba_error: 1, layers, underpaint: null };
  fs.writeFileSync(specFile, old.replace(/  "h4": \{[\s\S]*?(?=  "w": \{)/, `  "h4": ${JSON.stringify(spec, null, 2)},\n`));
  report.h4 = spec;
}

// B: preserve the torso's measured original alpha; only change its printed art.
// Restore the original apron pixels, which were never part of the clothing edit.
if (generated.fg_torso) {
  const rel = 'design/source/fg/torso_0_trunk.png';
  const old = before(rel);
  const raw = await sharp(await sized('fg_torso', 271, 361)).raw().toBuffer();
  const orig = await sharp(old).ensureAlpha().raw().toBuffer();
  // Registration to the original crop, not a repack of the skeleton.
  for (let y = 0; y < 361; y++) for (let x = 0; x < 271; x++) {
    const k = (y * 271 + x) * 4;
    raw[k + 3] = orig[k + 3];
    if (y >= 210) for (let c = 0; c < 4; c++) raw[k + c] = orig[k + c];
  }
  const torso = await sharp(raw, { raw: { width: 271, height: 361, channels: 4 } }).png().toBuffer();
  fs.writeFileSync(path.join(app, rel), torso);
  const atlasRel = 'static/assets/spines/picklePepper/cast.png';
  const atlas = await sharp(before(atlasRel)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = await sharp(torso).raw().toBuffer();
  for (let y = 0; y < 361; y++) pixels.copy(atlas.data, ((y + 2) * atlas.info.width + 516) * 4, y * 271 * 4, (y + 1) * 271 * 4);
  await sharp(atlas.data, { raw: { width: atlas.info.width, height: atlas.info.height, channels: 4 } }).png().toFile(path.join(app, atlasRel));
}
if (generated.fg_buy) await exportImage('fg_buy', 'buy_chef.png', 198, 420);
if (generated.fg_cutin) {
  await exportImage('fg_cutin', 'upgrade_cutin_body.png', 768, 768);
  const combined = await blank(768, 768).composite([
    { input: path.join(art, 'upgrade_cutin_body.png') },
    { input: path.join(art, 'upgrade_cutin_arm.png') },
    { input: path.join(art, 'upgrade_cutin_sparks.png') },
  ]).png().toBuffer();
  fs.writeFileSync(path.join(art, 'upgrade_cutin.png'), combined);
}
if (generated.fg_max) {
  const edit = await sized('fg_max', 1600, 900);
  const right = await sharp(edit).extract({ left: 1315, top: 0, width: 285, height: 900 }).png().toBuffer();
  const original = await sharp(before('static/assets/pickle/win_max_base.png')).raw().toBuffer();
  const piece = await sharp(right).raw().toBuffer();
  for (let y = 0; y < 900; y++) piece.copy(original, (y * 1600 + 1315) * 4, y * 285 * 4, (y + 1) * 285 * 4);
  await sharp(original, { raw: { width: 1600, height: 900, channels: 4 } }).png().toFile(path.join(art, 'win_max_base.png'));
}
if (generated.fg_cover) {
  const rel = 'design/cover/PicklePanic-Cover-FG.png';
  const edit = await sized('fg_cover', 1920, 1080);
  const original = await sharp(before(rel)).ensureAlpha().raw().toBuffer();
  const piece = await sharp(edit).extract({ left: 1378, top: 0, width: 542, height: 1080 }).raw().toBuffer();
  for (let y = 0; y < 1080; y++) piece.copy(original, (y * 1920 + 1378) * 4, y * 542 * 4, (y + 1) * 542 * 4);
  const foreground = await sharp(original, { raw: { width: 1920, height: 1080, channels: 4 } }).png().toBuffer();
  fs.writeFileSync(path.join(app, rel), foreground);
  await sharp(path.join(app, 'design/cover/PicklePanic-Cover-BG.png')).composite([{ input: foreground }]).png().toFile(path.join(app, 'design/cover/PicklePanic-preview.png'));
}

// C: keep all registered sizes and attachment pivots. All new parts are raster art.
for (const [name, file] of [['door_l', 'door_l_base_v2.png'], ['door_r', 'door_r_base_v2.png']])
  if (generated[name]) await exportImage(name, file, 1100, 1080);
if (generated.door_hazard) {
  const trim = await sharp(image('door_hazard')).trim({ threshold: 8 }).png().toBuffer();
  await sharp(trim).resize(1920, 180, { fit: 'fill' }).png().toFile(path.join(art, 'door_hazard_v2.png'));
}
if (generated.door_hardware) {
  const sheet = await sized('door_hardware', 1024, 1024);
  const parts = await objects(sheet);
  if (parts.length !== 4) throw new Error('Door hardware requires four disconnected sprite parts');
  for (const [index, [file, left, top, width, height]] of [
    ['door_wheel_v2.png', 0, 0, 256, 256], ['door_latch_v2.png', 512, 0, 512, 256],
    ['door_liquid_v2.png', 0, 512, 256, 256], ['door_badge_v2.png', 512, 512, 256, 256],
  ].entries()) {
    const { count, ...bounds } = parts[index];
    const part = await sharp(sheet).extract(bounds).png().toBuffer();
    await sharp(part).resize(width - 8, height - 8, { fit: 'contain', background: transparent }).extend({ top: 4, bottom: 4, left: 4, right: 4, background: transparent }).png().toFile(path.join(art, file));
  }
}
if (generated.door_steam) {
  const sheet = await sized('door_steam', 1536, 1024);
  for (let n = 0; n < 6; n++) await sharp(sheet).extract({ left: (n % 3) * 512, top: Math.floor(n / 3) * 512, width: 512, height: 512 }).resize(256, 256).png().toFile(path.join(art, `door_steam_${n + 1}_v2.png`));
}

// D: generated artwork, original alpha retained exactly, including the opening.
if (generated.frame) {
  const original = await sharp(before('static/assets/pickle/frame.png')).extractChannel('alpha').raw().toBuffer();
  const frame = await sharp(await sized('frame', 1280, 1280)).ensureAlpha().raw().toBuffer();
  for (let k = 0; k < original.length; k++) frame[k * 4 + 3] = original[k];
  await sharp(frame, { raw: { width: 1280, height: 1280, channels: 4 } }).png().toFile(path.join(art, 'frame.png'));
}
// E: no mask changes; rebuild background FX against these same new plates.
if (generated.bg_base) await exportImage('bg_base', 'bg_base.webp', 1920, 1080);
if (generated.bg_feature) await exportImage('bg_feature', 'bg_feature_v2.webp', 1920, 1080);
// Keep the assembled clothing source available to future store-art rebuilds.
const layerDir = path.join(app, 'design/source/fg');
const cast = JSON.parse(fs.readFileSync(path.join(layerDir, 'layers.json')));
await blank(...cast.canvas).composite(cast.layers.sort((a, b) => a.z - b.z).map(l => ({ input: path.join(layerDir, l.file), left: l.x, top: l.y }))).png().toFile(path.join(dir, 'fg_registered.png'));
fs.writeFileSync(path.join(dir, 'registration.json'), JSON.stringify(report, null, 2) + '\n');
console.log('Exported review A–E artwork, original canvas sizes, registered symbol layers and torso atlas.');

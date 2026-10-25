// Register native imagegen expression frames into the original sprite canvas.
// Keep the original alpha, hair, bandana, ears and neck pixels untouched.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp = require('sharp');
const rawDir = 'design/source/v8/laugh';
const zones = {
  mg: '26,81 44,73 62,99 76,74 108,80 123,108 112,129 113,146 100,166 64,173 26,158 21,130 34,112',
  fg: '36,83 63,74 72,105 86,78 128,82 140,118 130,139 126,163 105,181 55,184 28,164 24,139 35,122',
};
const panels = [];
const inks = [[40,40,40],[239,234,220],[232,181,125],[211,157,105],[184,123,96],[74,72,70],[160,110,70]];
for (const cast of ['mg', 'fg']) {
  const original = `design/source/${cast}/head_2_face.png`;
  const { data: base, info } = await sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const maskSvg = `<svg width="${w}" height="${h}"><polygon points="${zones[cast]}" fill="white"/></svg>`;
  const mask = await sharp(Buffer.from(maskSvg)).blur(1.1).ensureAlpha().raw().toBuffer();
  const row = [original];
  for (const state of ['half', 'open']) {
    const source = `${rawDir}/${cast}_${state}_raw.png`;
    const edited = await sharp(source).resize(w, h, { fit: 'fill' }).ensureAlpha().raw().toBuffer();
    const output = Buffer.from(base);
    for (let p = 0; p < w * h; p++) {
      const i = p * 4;
      const a = mask[i + 3] / 255;
      // Common print-tone quantization only inside the generated expression.
      const rgb = [edited[i],edited[i+1],edited[i+2]];
      const nearest = inks.reduce((best,color) => {
        const distance = color.reduce((sum,v,c)=>sum+(v-rgb[c])**2,0);
        return distance<best.distance?{color,distance}:best;
      }, {color:inks[0],distance:Infinity}).color;
      for (let c = 0; c < 3; c++) {
        const ink = nearest[c];
        output[i+c] = Math.round(base[i+c]*(1-a)+ink*a);
      }
    }
    const dest = `design/source/${cast}/head_2_face_${state}.png`;
    await sharp(output, { raw: { width: w, height: h, channels: 4 } }).png().toFile(dest);
    fs.writeFileSync(`${rawDir}/${cast}_${state}_prompt.txt`, JSON.parse(fs.readFileSync(`${rawDir}/prompts.json`))[`${cast}_${state}`]+'\n');
    row.push(dest);
    console.log(`${cast} ${state}: ${w}x${h}; original alpha and outer pixels retained`);
  }
  for (let col = 0; col < row.length; col++) panels.push({ input: await sharp(row[col]).resize(300, 260, { fit: 'contain', background: '#e4e0d4' }).png().toBuffer(), left: col*320+10, top: cast==='mg'?30:320 });
}
fs.mkdirSync('design/qa/v8', { recursive: true });
await sharp({create:{width:960,height:610,channels:4,background:'#e4e0d4'}}).composite(panels).png().toFile('design/qa/v8/laugh-faces.png');

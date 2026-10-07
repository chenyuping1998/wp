/**
 * ktx2png.mjs — 把 .ktx2 轉成 .png。
 *
 *   node scripts/ktx2png.mjs <檔或資料夾> [...]        原地產生同名 .png
 *   node scripts/ktx2png.mjs <資料夾> --force          蓋掉已存在的
 *
 * Hacksaw 的貼圖全是 KTX2 + vkFormat=0 + supercompression=Zstd,也就是
 * 【UASTC + Zstd】。瀏覽器沒有原生解碼器,所以離線轉成 PNG 一次搞定,
 * player 就只吃普通 PNG,不需要 WebGL 也不需要 Spine runtime。
 *
 * 用 three 附的 basis_transcoder.wasm（官方 basis_universal 建置,含 zstd 支援）
 * 轉到 cTFRGBA32,再用 pngjs 寫檔。
 *
 * 注意 premultiplied alpha：basis 轉出來的 RGBA 是【已預乘】的,
 * 直接當普通 PNG 畫會在半透明邊緣發黑。這裡做 un-premultiply 還原,
 * player 才能用一般的 source-over 合成。
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { PNG } from 'pngjs';

const require = createRequire(import.meta.url);

// basis_transcoder.js 是 UMD（結尾 module.exports = BASIS）,但它住在 three 的
// package 裡而 three 宣告 "type":"module",所以 Node 會把它當 ESM 載 ——
// 檔案裡沒有 export,拿到的 namespace 是空的。手動用 CJS 殼跑一次才拿得到。
function loadCJS(id) {
  const p = require.resolve(id);
  const m = { exports: {} };
  new Function('module', 'exports', 'require', '__filename', '__dirname',
               readFileSync(p, 'utf8'))(m, m.exports, require, p, dirname(p));
  return m.exports;
}

const BASIS = loadCJS('three/examples/jsm/libs/basis/basis_transcoder.js');
const wasmBinary = readFileSync(require.resolve('three/examples/jsm/libs/basis/basis_transcoder.wasm'));

const cTFRGBA32 = 13;

const args = process.argv.slice(2);
const force = args.includes('--force');
const targets = args.filter((a) => !a.startsWith('--'));
if (!targets.length) {
  console.error('用法: node scripts/ktx2png.mjs <檔或資料夾> [...] [--force]');
  process.exit(2);
}

/** 展開資料夾成 .ktx2 檔清單（遞迴）。 */
function collect(p, out = []) {
  const st = statSync(p);
  if (st.isDirectory()) {
    for (const n of readdirSync(p)) collect(join(p, n), out);
  } else if (extname(p).toLowerCase() === '.ktx2') {
    out.push(p);
  }
  return out;
}

const files = targets.flatMap((t) => collect(t));
console.log(`找到 ${files.length} 個 .ktx2`);

const mod = await BASIS({ wasmBinary });
mod.initializeBasis();

let done = 0, skipped = 0, failed = 0;
const modes = { premultiplied: 0, straight: 0 };

for (const src of files) {
  const dst = src.replace(/\.ktx2$/i, '.png');
  if (existsSync(dst) && !force) { skipped++; continue; }

  let file;
  try {
    file = new mod.KTX2File(new Uint8Array(readFileSync(src)));
    if (!file.isValid()) throw new Error('KTX2File.isValid() = false');

    const w = file.getWidth(), h = file.getHeight();
    if (!file.startTranscoding()) throw new Error('startTranscoding 失敗');

    // level 0 = 最大 mip。layer/face 都是 0（這批貼圖沒有 array/cubemap）
    const size = file.getImageTranscodedSizeInBytes(0, 0, 0, cTFRGBA32);
    const dstBuf = new Uint8Array(size);
    if (!file.transcodeImage(dstBuf, 0, 0, 0, cTFRGBA32, 0, -1, -1)) {
      throw new Error('transcodeImage 失敗');
    }

    // 是不是預乘 alpha 要【驗】不要猜：預乘的資料任一色通道都不可能大於 alpha。
    // 找到一個超過的就代表沒預乘,那就不能還原,否則整張會被打亮。
    // （容忍 2 的量化誤差 —— UASTC 是有損的,邊緣會差一兩階）
    let premul = true;
    for (let i = 0; i < dstBuf.length; i += 4) {
      const a = dstBuf[i + 3];
      if (a === 255) continue;
      if (dstBuf[i] > a + 2 || dstBuf[i + 1] > a + 2 || dstBuf[i + 2] > a + 2) {
        premul = false;
        break;
      }
    }
    if (premul) {
      for (let i = 0; i < dstBuf.length; i += 4) {
        const a = dstBuf[i + 3];
        if (a === 0) { dstBuf[i] = dstBuf[i + 1] = dstBuf[i + 2] = 0; continue; }
        if (a === 255) continue;
        const s = 255 / a;
        dstBuf[i]     = Math.min(255, Math.round(dstBuf[i]     * s));
        dstBuf[i + 1] = Math.min(255, Math.round(dstBuf[i + 1] * s));
        dstBuf[i + 2] = Math.min(255, Math.round(dstBuf[i + 2] * s));
      }
    }
    modes[premul ? 'premultiplied' : 'straight']++;

    const png = new PNG({ width: w, height: h });
    png.data = Buffer.from(dstBuf.buffer, dstBuf.byteOffset, dstBuf.length);
    writeFileSync(dst, PNG.sync.write(png));
    done++;
    if (done % 10 === 0) console.log(`   … ${done}/${files.length}`);
  } catch (e) {
    failed++;
    console.error(`   ✗ ${src}  ${e.message}`);
  } finally {
    file?.close?.();
    file?.delete?.();
  }
}

console.log(`\n✅ 轉了 ${done} 個　已存在跳過 ${skipped}　失敗 ${failed}`);
console.log(`   alpha: 預乘還原 ${modes.premultiplied} / 原本就是 straight ${modes.straight}`);

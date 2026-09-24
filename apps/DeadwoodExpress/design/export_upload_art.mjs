import { createRequire } from 'node:module';
import { cpSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require('/Users/stone/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const app = path.resolve(import.meta.dirname, '..');
const source = path.join(app, 'static/assets/deadwood');
const frontend = process.argv[2];
const thumbnail = process.argv[3];
if (!frontend || !thumbnail) throw new Error('usage: node export_upload_art.mjs FRONTEND_DEADWOOD THUMBNAIL_DIR');
mkdirSync(frontend, { recursive: true });
mkdirSync(thumbnail, { recursive: true });

const png = async (name, width) => {
 const image = sharp(path.join(source, name));
 if (width) image.resize({ width, withoutEnlargement: true });
 await image.png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 94, effort: 10 }).toFile(path.join(frontend, name));
};

await Promise.all([
 png('background.png', 1536), png('background_feature.png', 1536),
 png('conductor.png'), png('logo.png', 1024), png('bonus_button.png', 512),
 png('card_standard.png', 768), png('card_premium.png', 768),
 ...['H1','H2','H3','H4','H5','L1','L2','L3','L4','W','S'].map((symbol) => png(`symbol_${symbol}.png`, 512)),
 ...['glow','star','streak','leaf','vignette'].map((fx) => png(`fx_${fx}.png`)),
 sharp(path.join(source, 'thumbnail_bg.png')).resize(1024,1024).png({compressionLevel:9,adaptiveFiltering:true,palette:true,quality:95,effort:10}).toFile(path.join(thumbnail,'DeadwoodExpress-BG.png')),
 sharp(path.join(source, 'thumbnail_fg.png')).resize(1024,1024).ensureAlpha().png({compressionLevel:9,adaptiveFiltering:true,palette:false,effort:10}).toFile(path.join(thumbnail,'DeadwoodExpress-FG.png')),
]);
for (const name of ['conductor.rig.json','fs_panel.svg','fs_sign.svg','win_big.svg','win_superwin.svg','win_mega.svg','win_epic.svg','win_max.svg','icon_menu.svg','icon_menuExit.svg','icon_settings.svg','icon_info.svg','icon_payTable.svg','icon_soundOn.svg','icon_soundOff.svg','icon_autoSpin.svg']) cpSync(path.join(source,name),path.join(frontend,name));
console.log('Exported optimized Deadwood runtime and store art.');

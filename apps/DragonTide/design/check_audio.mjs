/**
 * Dragon Tide audio gate (new-games/sea-dragon/音效需求單.md §3-§4, delivery-v1): every file the
 * manifest lists is in static/assets/audio/dragon/ and nothing else ships; formats, lengths,
 * onsets and the size budget follow the request; every cue Sound.svelte and the game request
 * exists. Loop seams and loudness are checked on the delivery side (audio/validation.json).
 */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtime = path.join(app, "static/assets/audio/dragon");
const manifestSource = fs.readFileSync(path.join(app, "src/game/audioManifest.ts"), "utf8");
const manifest = Object.fromEntries(
  [...manifestSource.matchAll(/"([a-z0-9_]+)"\s*:\s*"([^"]+\.(?:wav|ogg))"/g)].map((m) => [m[1], m[2]]),
);
const files = fs.readdirSync(runtime).filter((file) => /\.(?:wav|ogg|mp3|m4a)$/i.test(file)).sort();
assert.deepEqual(files, Object.values(manifest).sort(), "Manifest must list every runtime file exactly once");
assert.deepEqual(fs.readdirSync(path.join(app, "static/assets/audio")), ["dragon"], "Only the Dragon Tide set ships");

function wav(buffer) {
  assert.equal(buffer.toString("ascii", 0, 4), "RIFF");
  assert.equal(buffer.toString("ascii", 8, 12), "WAVE");
  let format;
  let audio;
  for (let offset = 12; offset + 8 <= buffer.length; ) {
    const tag = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (tag === "fmt ") {
      format = {
        encoding: buffer.readUInt16LE(offset + 8),
        channels: buffer.readUInt16LE(offset + 10),
        rate: buffer.readUInt32LE(offset + 12),
        align: buffer.readUInt16LE(offset + 20),
        bits: buffer.readUInt16LE(offset + 22),
      };
    }
    if (tag === "data") audio = buffer.subarray(offset + 8, offset + 8 + size);
    offset += 8 + size + (size % 2);
  }
  assert.ok(format && audio);
  return {
    ...format,
    audio,
    duration: audio.length / format.align / format.rate,
  };
}

function ogg(buffer) {
  const ident = buffer.indexOf(Buffer.from("\x01vorbis", "binary"));
  assert.ok(ident >= 0, "Expected Ogg Vorbis identification packet");
  const channels = buffer[ident + 11];
  const rate = buffer.readUInt32LE(ident + 12);
  let samples = 0n;
  for (let offset = 0; offset < buffer.length; ) {
    assert.equal(buffer.toString("ascii", offset, offset + 4), "OggS");
    const granule = buffer.readBigInt64LE(offset + 6);
    if (granule >= 0n) samples = granule;
    const count = buffer[offset + 26];
    let payload = 0;
    for (let i = 0; i < count; i += 1) payload += buffer[offset + 27 + i];
    offset += 27 + count + payload;
  }
  return { channels, rate, duration: Number(samples) / rate };
}

// request §3: [target or cap seconds, cap?]. Targets allow ±10 %; caps are upper bounds.
const T = (s) => ({ min: s * 0.9, max: s * 1.1 });
const CAP = (s) => ({ min: 0.01, max: s });
const spec = {
  bgm_main: T(90), bgm_free: T(60), bgm_fg_wait: T(12), amb_sea: T(60), amb_hall: T(60),
  sfx_spin_press: CAP(0.6), sfx_board_out: T(0.7), sfx_reel_stop: CAP(0.15), sfx_refill: T(0.8),
  sfx_score_1: T(1.55), sfx_score_2: T(1.55), sfx_score_3: T(1.74), sfx_score_4: T(1.88), sfx_score_5: T(2.02),
  sfx_cast_king: T(2.18), sfx_cast_princess: T(2.18), sfx_pearl_show: T(0.85), sfx_pearl_show_top: T(1.85),
  sfx_strike: CAP(0.4), sfx_pearl_lit_s: CAP(0.6), sfx_pearl_lit_m: CAP(0.6), sfx_pearl_lit_l: CAP(0.6),
  sfx_pearl_fly: T(0.6), sfx_pearl_add: T(1.55), sfx_pearl_add_top: T(1.96), sfx_total_fly: T(1.0),
  sfx_win_multiply: T(0.89), sfx_win_multiply_fg: T(2.06), sfx_total_up: CAP(0.5),
  sfx_gate_land: { min: 0.9, max: 1.54 }, sfx_gate_tease: { min: 0.9, max: 2.2 }, sfx_gate_win: T(2.44),
  jng_fg_intro: T(4.22), sfx_ready: T(3.88), sfx_transform: T(4.66), sfx_portal: T(2.33), jng_fg_outro: T(4.22),
  sfx_fg_retrigger: T(2.93),
  sfx_bigwin_start_1: T(2.0), sfx_bigwin_start_2: T(2.3), sfx_bigwin_start_3: T(2.5), sfx_bigwin_start_4: T(2.7), sfx_bigwin_start_5: T(3.0),
  sfx_bigwin_count: CAP(12), sfx_bigwin_end: T(2.25),
  sfx_button: CAP(0.2), sfx_buy_hover: CAP(0.3), sfx_buy_confirm: CAP(1.0), sfx_entry_reveal: CAP(1.0),
  sfx_menu_open: T(0.3), sfx_menu_close: T(0.4),
};
// request §3.8 voices (P2, wordless): 1.5-2.9 s; the top-pearl lines ~2.6
const VOICE = { min: 1.5, max: 2.9 };
for (const who of ["king", "princess"]) {
  for (let n = 1; n <= 5; n += 1) spec[`vo_${who}_cast_${n}`] = VOICE;
  spec[`vo_${who}_cast_top`] = T(2.6);
}
for (let n = 1; n <= 3; n += 1) spec[`vo_fg_in_${n}`] = VOICE;
for (const line of ["vo_fg_end_1", "vo_fg_end_2", "vo_fg_end_big_1", "vo_fg_end_big_2"]) spec[line] = VOICE;
for (let n = 1; n <= 5; n += 1) spec[`vo_bigwin_${n}`] = VOICE;
for (let n = 1; n <= 5; n += 1) {
  spec[`sfx_fgscore_${n}`] = T(1.69);
  spec[`sfx_blast_${n}`] = T(1.53);
  spec[`sfx_bigwin_loop_${n}`] = CAP(12);
}
// request §3: P1 must all be here
const P1 = Object.keys(spec).filter((cue) => !/^amb_|^sfx_menu_|^vo_/.test(cue));
for (const cue of P1) assert.ok(manifest[cue], `P1 cue missing from the delivery: ${cue}`);

let bytes = 0;
let onsetChecks = 0;
for (const file of files) {
  const buffer = fs.readFileSync(path.join(runtime, file));
  bytes += buffer.length;
  const cue = file.replace(/\.(?:wav|ogg)$/, "");
  const info = file.endsWith(".wav") ? wav(buffer) : ogg(buffer);
  assert.ok([22050, 44100].includes(info.rate), `${file}: ${info.rate} Hz`);
  const range = spec[cue];
  assert.ok(range, `${file}: not in the request`);
  assert.ok(info.duration >= range.min - 1e-3 && info.duration <= range.max + 1e-3, `${file}: ${info.duration.toFixed(3)} s outside ${range.min.toFixed(2)}-${range.max.toFixed(2)}`);
  if (file.endsWith(".wav")) {
    // request §4: short one-shots are 16-bit WAV, mono (the portal may be stereo), no silent head
    assert.equal(info.bits, 16, `${file}: 16-bit`);
    assert.ok(info.channels === 1 || cue === "sfx_portal", `${file}: mono`);
    assert.ok(info.duration <= 2.6, `${file}: one-shots over 2.5 s ship as OGG`);
    let first = -1;
    for (let i = 0; i < info.audio.length; i += info.align) {
      if (Math.abs(info.audio.readInt16LE(i)) > 16) { first = i / info.align; break; }
    }
    assert.ok(first >= 0 && first / info.rate <= 0.005, `Onset >5 ms: ${file}`);
    onsetChecks += 1;
  }
}
assert.ok(bytes <= 12_000_000, `Runtime audio must fit the 12 MB budget (${bytes})`);

// every cue the code asks for exists: literal cues, and the 1-5 ladders built at run time
const sources = [];
const walk = (dir) => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) walk(full); else if (/\.(?:svelte|ts)$/.test(entry.name) && !full.endsWith("audioManifest.ts")) sources.push(fs.readFileSync(full, "utf8")); } };
walk(path.join(app, "src"));
const soundSource = fs.readFileSync(path.join(app, "src/components/Sound.svelte"), "utf8");
let cueRefs = 0;
for (const source of sources) {
  for (const match of source.matchAll(/(?:sfx\(|playCue\(|cue:\s*|music:\s*|ambience:\s*)["'`]((?:sfx|bgm|amb|jng|vo)_[a-z0-9_]+)["'`]/g)) {
    assert.ok(manifest[match[1]], `Missing cue: ${match[1]}`);
    cueRefs += 1;
  }
}
// the voice pools Sound.svelte builds at run time
if (/vo_king_cast_|POOLS/.test(soundSource)) for (const cue of Object.keys(spec).filter((name) => name.startsWith("vo_"))) assert.ok(manifest[cue], `Missing voice: ${cue}`);
for (const ladder of ["sfx_blast_", "sfx_score_", "sfx_fgscore_", "sfx_bigwin_loop_", "sfx_bigwin_start_", "vo_bigwin_"]) {
  assert.ok(soundSource.includes("`" + ladder + "${"), `Ladder ${ladder} not used`);
  for (let n = 1; n <= 5; n += 1) assert.ok(manifest[`${ladder}${n}`], `Missing ladder cue ${ladder}${n}`);
}
// The compiler is the same installed Svelte 5 compiler used by the app build.
const { compile } = await import("svelte/compiler");
compile(soundSource, { filename: "Sound.svelte", generate: "client" });
console.log(
  `OK: ${files.length} Dragon Tide audio files / ${bytes.toLocaleString("en-US")} bytes; ${onsetChecks} WAV onsets <=5 ms; lengths per the request; ${cueRefs} cue references + 5 ladders resolve; Svelte compilation`,
);

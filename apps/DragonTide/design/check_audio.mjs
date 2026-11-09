/** Verify delivered audio without requiring a DAW or network access. */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtime = path.join(app, "static/assets/audio/medusa");
const hypnoDir = path.join(app, "static/assets/audio/hypno");
const manifestSource = fs.readFileSync(
  path.join(app, "src/game/audioManifest.ts"),
  "utf8",
);
const manifest = Object.fromEntries(
  [
    ...manifestSource.matchAll(
      /["']?([a-z0-9_]+)["']?\s*:\s*["']([^"']+\.(?:wav|ogg|mp3|m4a))["']/g,
    ),
  ].map((m) => [m[1], m[2]]),
);
const files = fs
  .readdirSync(runtime)
  .filter((file) => /\.(?:wav|ogg|mp3|m4a)$/i.test(file))
  .sort();
assert.deepEqual(
  files,
  Object.values(manifest).sort(),
  "Manifest must list every runtime file exactly once",
);

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

const limits = {
  vo_medusa_hmm: 0.6,
  vo_medusa_peek: 0.4,
  vo_medusa_annoyed: 0.6,
  vo_medusa_gasp: 0.8,
  vo_medusa_laugh: 2,
  vo_medusa_laugh_2: 2,
  vo_medusa_cry_happy: 2,
  sfx_glasses_slide: 0.25,
  sfx_glasses_on: 0.25,
  sfx_snakes_hiss: 0.6,
  sfx_snake_yawn: 0.8,
  sfx_snakes_laugh: 1,
  sfx_gaze_charge: 0.3,
  sfx_gaze_beam: 0.4,
  sfx_orb_fly: 0.45,
  sfx_orb_hit_s: 0.6,
  sfx_orb_hit_m: 0.6,
  sfx_orb_hit_l: 0.6,
  sfx_orb_crack: 0.6,
  sfx_orb_crack_2: 0.6,
  sfx_total_mult_up: 0.5,
  sfx_total_to_win: 0.4,
  sfx_win_mark: 0.3,
  sfx_crumble: 0.4,
  sfx_drop: 0.2,
  sfx_reel_stop: 0.15,
  sfx_scatter_land: 0.5,
  sfx_scatter_tease: 0.8,
  sfx_scatter_trigger: 1,
};
let bytes = 0;
let onsetChecks = 0;
const hypnoFiles = fs.readdirSync(hypnoDir).filter((f) => /\.(?:wav|ogg)$/i.test(f));
// Placeholder sets (Medusa + circus) until the Dragon Tide audio lands: every runtime file
// must parse, run at 44.1 kHz, start promptly (SFX) and stay inside the cue length limits.
for (const [dir, file] of [...files.map((f) => [runtime, f]), ...hypnoFiles.map((f) => [hypnoDir, f])]) {
  const buffer = fs.readFileSync(path.join(dir, file));
  bytes += buffer.length;
  const info = file.endsWith(".wav") ? wav(buffer) : ogg(buffer);
  const cue = file.replace(/\.(?:wav|ogg)$/, "");
  assert.ok([22050, 44100].includes(info.rate), `${file}: ${info.rate} Hz`);
  assert.ok(info.duration > 0, file);
  if (dir === runtime && file.endsWith(".wav") && cue.startsWith("sfx_")) {
    let first = -1;
    for (let i = 0; i < info.audio.length; i += info.align) {
      if (Math.abs(info.audio.readInt16LE(i)) > 16) { first = i / info.align; break; }
    }
    assert.ok(first >= 0 && first / info.rate <= 0.005, `Onset >5 ms: ${file}`);
    onsetChecks += 1;
  }
  if (cue in limits) assert.ok(info.duration <= limits[cue] + 1 / 44100, `Spec length ${file}`);
  if (/^sfx_bigwin_\d$/.test(cue)) assert.ok(info.duration >= 2 && info.duration <= 4, file);
}
assert.ok(bytes <= 12_000_000, "Runtime audio must fit the 12 MB budget");
assert.deepEqual(
  fs.readdirSync(path.join(app, "static/assets/audio")),
  ["hypno", "medusa"],
  "Old template audio must remain outside static",
);

const soundSource = fs.readFileSync(
  path.join(app, "src/components/Sound.svelte"),
  "utf8",
);
for (const match of soundSource.matchAll(
  /['"]((?:sfx|vo|stinger|bgm|amb)_[a-z0-9_]+)['"]/g,
)) {
  const cue = match[1];
  // Old event names are aliases; actual file requests are playCue or cue-map
  // entries. Those static targets must be in the manifest.
  if (
    match.index > 0 &&
    /(?:cue:\s*|playCue\(|:\s*)$/.test(
      soundSource.slice(Math.max(0, match.index - 20), match.index),
    )
  ) {
    if (!cue.startsWith("bgm_winlevel_"))
      assert.ok(manifest[cue] || fs.existsSync(path.join(app, 'static/assets/audio/hypno', cue + '.wav')), `Missing static cue: ${cue}`);
  }
}
// The compiler is the same installed Svelte 5 compiler used by the app build.
const { compile } = await import("svelte/compiler");
compile(soundSource, { filename: "Sound.svelte", generate: "client" });
console.log(
  `OK: ${files.length + hypnoFiles.length} audio files / ${bytes.toLocaleString("en-US")} bytes; ${onsetChecks} SFX onsets <=5 ms; 22.05/44.1 kHz, cue limits, cue targets, Svelte compilation (placeholder sets)`,
);

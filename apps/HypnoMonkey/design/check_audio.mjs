/** Verify delivered audio without requiring a DAW or network access. */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(app, "design/source/medusagaze/audio");
const runtime = path.join(app, "static/assets/audio/medusa");
const metadata = JSON.parse(
  fs.readFileSync(path.join(sourceDir, "audio_metadata.json"), "utf8"),
);
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
assert.equal(files.length, metadata.files.length);

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
for (const item of metadata.files) {
  const buffer = fs.readFileSync(path.join(runtime, item.file));
  bytes += buffer.length;
  assert.equal(buffer.length, item.bytes, item.file);
  assert.ok(Number.isFinite(item.lufs), `LUFS ${item.file}`);
  assert.ok(
    Number.isFinite(item.true_peak_db) && item.true_peak_db <= -1,
    `True peak ${item.file}`,
  );
  assert.ok(
    item.duration >= 3 || item.lufs_method === "complete cue repeated to >=3 s",
    `Short-cue LUFS method ${item.file}`,
  );
  const info = item.file.endsWith(".wav") ? wav(buffer) : ogg(buffer);
  assert.equal(info.rate, 44100, item.file);
  assert.equal(info.channels, item.channels, item.file);
  assert.ok(
    Math.abs(info.duration - item.duration) < 1 / 44100,
    `Duration ${item.file}`,
  );
  if (item.file.endsWith(".wav")) {
    assert.equal(info.bits, 16, item.file);
    assert.equal(info.channels, 1, item.file);
    assert.equal(info.encoding, 1, item.file);
    let first = -1;
    for (let i = 0; i < info.audio.length; i += 2) {
      if (Math.abs(info.audio.readInt16LE(i)) > 16) {
        first = i / 2;
        break;
      }
    }
    assert.ok(
      first >= 0 && first / info.rate <= 0.005,
      `Onset >5 ms: ${item.file}`,
    );
    onsetChecks += 1;
  }
  const master = wav(
    fs.readFileSync(path.join(sourceDir, "masters", item.cue + ".wav")),
  );
  assert.equal(master.rate, 48000, item.file);
  assert.equal(master.bits, 24, item.file);
  assert.equal(master.channels, item.channels, item.file);
  assert.ok(Math.abs(master.duration - item.duration) < 1 / 48000, item.file);
  if (item.cue in limits)
    assert.ok(
      item.duration <= limits[item.cue] + 1 / 44100,
      `Spec length ${item.file}`,
    );
  if (/^sfx_petrify_\d$/.test(item.cue)) assert.ok(item.duration <= 0.25);
  if (/^sfx_bigwin_\d$/.test(item.cue))
    assert.ok(item.duration >= 2 && item.duration <= 4);
  if (item.cue.startsWith("stinger_"))
    assert.ok(item.duration >= 3 && item.duration <= 4);
  if (item.cue.startsWith("bgm_")) {
    assert.equal(info.channels, 2);
    assert.equal(
      info.duration,
      64,
      "Ogg final granule must preserve the exact 64 s musical loop",
    );
    assert.ok(Math.abs(item.lufs + 18) < 0.2);
    const reference = wav(
      fs.readFileSync(path.join(sourceDir, "wav-reference", item.cue + ".wav")),
    );
    assert.equal(reference.rate, 44100);
    assert.equal(reference.channels, 2);
    assert.equal(reference.bits, 16);
    assert.equal(reference.duration, 64);
  }
}
assert.equal(bytes, metadata.runtime_bytes);
assert.ok(bytes <= 12_000_000, "Runtime audio must fit the 12 MB budget");
assert.deepEqual(
  fs.readdirSync(path.join(app, "static/assets/audio")),
  ["medusa"],
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
      assert.ok(manifest[cue], `Missing static cue: ${cue}`);
  }
}
// The compiler is the same installed Svelte 5 compiler used by the app build.
const { compile } = await import("svelte/compiler");
compile(soundSource, { filename: "Sound.svelte", generate: "client" });
console.log(
  `OK: ${files.length} audio files / ${bytes.toLocaleString("en-US")} bytes; ${onsetChecks} SFX onsets <=5 ms; 57 PCM24 masters, finite levels, exact Ogg loops, cue targets, Svelte compilation`,
);

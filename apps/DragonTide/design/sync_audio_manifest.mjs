/**
 * List the delivered original Medusa Gaze audio for Sound.svelte.
 *
 *   node design/sync_audio_manifest.mjs
 *
 * Runtime files live in static/assets/audio/medusa/. Sound.svelte decodes them
 * into Web Audio buffers for overlapping effects and sample-accurate loops.
 * The old template sprite is archived under design/source/audio/legacy-template
 * and is no longer shipped or loaded. Missing cues are not requested.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const DIR = path.join(appRoot, "static/assets/audio/medusa");
const OUT = path.join(appRoot, "src/game/audioManifest.ts");

const files = fs.existsSync(DIR)
  ? fs
      .readdirSync(DIR)
      .filter((name) => /\.(wav|mp3|ogg|m4a)$/i.test(name))
      .sort()
  : [];

// cue name = file name without extension; if both .wav and .mp3 exist, the
// first in sort order wins and the duplicate is reported
const byCue = {};
for (const file of files) {
  const cue = file.replace(/\.[^.]+$/, "");
  if (byCue[cue])
    console.warn(
      `  !! ${cue}: both ${byCue[cue]} and ${file} — using ${byCue[cue]}`,
    );
  else byCue[cue] = file;
}

const body = `// GENERATED FILE - do not edit by hand.
// Delivered audio in static/assets/audio/medusa/, as cue -> file.
// Regenerate with: node design/sync_audio_manifest.mjs (pnpm build runs it).
export const MEDUSA_AUDIO: Record<string, string> = ${JSON.stringify(byCue, null, "\t")};
`;
fs.writeFileSync(OUT, body, "utf8");
console.log(
  `Wrote ${path.relative(appRoot, OUT)} (${Object.keys(byCue).length} delivered cue(s))`,
);

// General integrity gates remain. Theme-specific Capo motion, palette and audio
// gates are replaced by checks against the actual Treasure renderer/assets.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const python = path.resolve(root, '../../../math-sdk/env/Scripts/python.exe');
const gates = [
 'check_connected_presentation.mjs',
 'check_bootstrap.mjs', 'check_reel_sand.mjs', 'check_beach_motion.mjs', 'check_symbol_rig.mjs', 'check_object_attachments.mjs', 'check_chest_motion.mjs', 'check_undefined_refs.mjs', 'check_assets_exist.mjs',
 'check_sprite_keys.mjs', 'check_feature_titles.mjs', 'check_treasure_art.py',
 'check_social_words.mjs', 'check_treasure_presentation.mjs', 'check_motion_flow.mjs', 'check_cast_refinement.mjs', 'check_feature_opening.mjs', 'check_mechanic_motion.mjs', 'check_attention.mjs', 'check_audio_direction.mjs', 'check_treasure_motion_art.py', 'check_anticipation.mjs',
 'check_treasure_audio.py', 'check_source_art.py', 'check_sounds.mjs',
 'check_reel_stop_sound.mjs', 'check_ui_palette.mjs',
];
for (const gate of gates) {
 const result = spawnSync(gate.endsWith('.py') ? python : process.execPath,
  [path.join(root, 'design', gate)], { cwd: root, stdio: 'inherit' });
 if (result.error) throw result.error;
 if (result.status !== 0) process.exit(result.status ?? 1);
}

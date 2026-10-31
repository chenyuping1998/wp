// Legacy entrypoint: rebuild the licensed sample-based delivery.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
execFileSync('python', [fileURLToPath(new URL('./build_sampled_audio.py', import.meta.url))], { stdio: 'inherit' });

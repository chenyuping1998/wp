// The kit's smoothness check over every ninja clip:
//   node design/spine43/check_kit.mjs [--md] [clip...]
import fs from 'node:fs';
import path from 'node:path';
import { kit, readRig, to43, LOOPS, HERE } from './kit.mjs';

const { checkSkeleton, reportMarkdown } = await kit('check.ts');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const reports = checkSkeleton(to43(readRig()), { loops: LOOPS, ...(only.length ? { only } : {}) });
for (const r of reports) {
  const bad = r.issues.filter((i) => i.severity !== 'info');
  const tally = {};
  for (const i of r.issues) tally[`${i.severity}:${i.code}`] = (tally[`${i.severity}:${i.code}`] ?? 0) + 1;
  console.log(`${r.name.padEnd(14)} ${r.duration.toFixed(2)}s score ${String(r.score).padStart(3)}  ${JSON.stringify(tally)}`);
  if (process.argv.includes('-v')) for (const i of bad) console.log(`   ${i.severity} ${i.code} ${i.bone ?? ''} ${i.timeline ?? ''} @${i.time?.toFixed(2) ?? '-'} ${i.message}`);
}
if (process.argv.includes('--md')) fs.writeFileSync(path.join(HERE, 'kit_check.md'), reportMarkdown('ninja.json', reports));

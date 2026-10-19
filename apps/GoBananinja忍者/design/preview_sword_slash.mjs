import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/game/swordSlash.ts', import.meta.url), 'utf8');
const { swordSlashFrame } = await import(`data:text/javascript;base64,${Buffer.from(ts.transpile(source, {
	target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022,
})).toString('base64')}`);
const frames = Array.from({ length: 47 }, (_, i) => ({ t: i * 20, ...swordSlashFrame(i * 20, 740, true) }));
fs.writeFileSync(new URL('source/ninja_reskin/sword_frames.json', import.meta.url), JSON.stringify(frames));
console.log('Exported actual sword geometry for preview');

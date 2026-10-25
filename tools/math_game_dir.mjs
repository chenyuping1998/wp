// The math SDK folder for a game id (2026-10-23), by the same rule as the
// SDK's src/config/paths.py game_dir: math-sdk/games/<id> if it exists,
// otherwise the one folder whose name starts with the id — so a folder can
// carry a readable suffix (games/PuttMonkey迷你高爾夫) without a junction named
// after the id beside it. More than one match throws rather than guessing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GAMES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../math-sdk/games');

export const mathGameDir = (id) => {
	const exact = path.join(GAMES, id);
	if (fs.existsSync(exact)) return exact;
	const matches = fs.existsSync(GAMES)
		? fs.readdirSync(GAMES, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name.startsWith(id)).map((d) => d.name).sort()
		: [];
	if (matches.length > 1) throw new Error(`game id ${id} matches several folders under math-sdk/games: ${matches.join(', ')}`);
	return matches.length ? path.join(GAMES, matches[0]) : exact;
};

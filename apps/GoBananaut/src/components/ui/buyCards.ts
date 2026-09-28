/**
 * The Buy Bonus cards' data, shared by this game's menu (ModalBuyBonus) and its
 * confirmation (ModalBuyBonusConfirm), so the step after choosing a card shows
 * the same card rather than a different game's text box.
 */
import { base } from '$app/paths';

import config from '../../game/config';

export const art = (file: string) => `${base}/assets/sprites/goBananasUi/${file}`;

export type Hero = { src: string; w: number; x: number; y: number; r?: number };
export type Card = {
	/** the meta's titles say BUY (FREE SPINS...), which the button already
	 *  says; the card is named by what it is */
	title: string;
	accent: string;
	/** the nebula's second colour */
	nebula: string;
	tag: string;
	heroes: Hero[];
	/** coins: the respin pips; board: reel one's opening height */
	meter: { kind: 'coins'; of: number; label: string } | { kind: 'board'; rows: number; label: string };
	points: string[];
	hot?: boolean;
};

export const COIN = art('buy_coin.png');
const PLANET = art('buy_planet.png');
const COMET = art('buy_comet.png');
const WILD = art('buy_wild.png');
const MARKER = art('buy_marker.png');

export const { baseRows, maxRows, reelMultiplier } = config.growth;
export const REELS = config.numReels;
const modeCfg = config.betModes as Record<string, { spins?: number; start_steps?: number; max_win?: number }>;
// reel one's height when the round opens: every start step is one row on it
// (the ladder fills reel one to the top before it moves on — betModeMeta.ts)
const openRows = (mode: string) => Math.min(maxRows, baseRows + (modeCfg[mode]?.start_steps ?? 0));
const spins = (mode: string) => modeCfg[mode]?.spins ?? 8;
const rowsLabel = (mode: string) => {
	const r = openRows(mode);
	return r > baseRows ? `REEL 1 OPENS ${r} ROWS · x${reelMultiplier}` : `OPENS ${baseRows} ROWS TALL`;
};
export const MAX_WIN = `${(modeCfg.bonus100?.max_win ?? 15000).toLocaleString('en-US')}×`;
const HS_MAX = `${(modeCfg.holdandspin?.max_win ?? 1000).toLocaleString('en-US')}×`;

// hero boxes as percentages of the scene, so the card scales whole
export const CARDS: Record<string, Card> = {
	HOLDANDSPIN: {
		title: 'HOLD AND SPIN',
		accent: '#e9c46a',
		nebula: '#3a6a8a',
		tag: 'COINS',
		heroes: [
			{ src: COIN, w: 30, x: -38, y: 34, r: -14 },
			{ src: COIN, w: 30, x: 8, y: 32, r: 12 },
			{ src: COIN, w: 38, x: -19, y: 16 },
		],
		meter: { kind: 'coins', of: 3, label: '3 RESPINS' },
		points: ['Coins stick and reset the respins', `Max win ${HS_MAX}`],
	},
	BONUS100: {
		title: 'FREE SPINS',
		accent: '#5fd4ff',
		nebula: '#1f4f8f',
		tag: 'LIFT-OFF',
		heroes: [
			{ src: PLANET, w: 62, x: -36, y: 12 },
			{ src: MARKER, w: 26, x: 14, y: 34, r: 18 },
		],
		meter: { kind: 'board', rows: openRows('bonus100'), label: rowsLabel('bonus100') },
		points: [`${spins('bonus100')} free spins`, 'Stretched reels stay tall and double'],
	},
	BONUS200: {
		title: 'SUPER FREE SPINS',
		accent: '#8fa8ff',
		nebula: '#3b2f8f',
		tag: 'SUPER',
		heroes: [
			{ src: PLANET, w: 50, x: -50, y: 22 },
			{ src: COMET, w: 44, x: 4, y: 2, r: 6 },
			{ src: MARKER, w: 17, x: 20, y: 52, r: 24 },
		],
		meter: { kind: 'board', rows: openRows('bonus200'), label: rowsLabel('bonus200') },
		points: [`${spins('bonus200')} free spins`, 'Reel one opens a row taller'],
	},
	BONUS300: {
		title: 'MAX FREE SPINS',
		accent: '#c58cff',
		nebula: '#5a1f8a',
		tag: 'MAX',
		heroes: [
			{ src: PLANET, w: 42, x: -56, y: 32 },
			{ src: COMET, w: 38, x: 16, y: 0, r: 8 },
			{ src: WILD, w: 46, x: -23, y: 12 },
		],
		meter: { kind: 'board', rows: openRows('bonus300'), label: rowsLabel('bonus300') },
		points: [`${spins('bonus300')} free spins`, 'Reel one opens at full height'],
		hot: true,
	},
};

// Two layers of stars, seeded so every card and every open draws the same sky.
// Written as an SVG background: hundreds of dots for the price of one string.
const starfield = (seed: number, count: number, big: number) => {
	let s = seed;
	const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
	let dots = '';
	for (let i = 0; i < count; i++) {
		const r = i < big ? 1 + rnd() * 0.9 : 0.35 + rnd() * 0.45;
		const o = (0.45 + rnd() * 0.55).toFixed(2);
		dots += `<circle cx='${(rnd() * 320).toFixed(1)}' cy='${(rnd() * 240).toFixed(1)}' r='${r.toFixed(2)}' fill='%23eaf6ff' fill-opacity='${o}'/>`;
	}
	return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 240'>${dots}</svg>")`;
};
export const STARS_FAR = starfield(7, 90, 0);
export const STARS_NEAR = starfield(31, 26, 10);

/**
 * Local round source for the independent animation comparison build.
 * The Alchemy reel engine needs a reveal book from RGS before it can stop.
 * This adapter supplies one when the skin is viewed without a game server.
 * It is deliberately synthetic and has no claim to Fangtastic math/RTP.
 */
import { rgsFetcher } from '../../node_modules/rgs-requests/node_modules/rgs-fetcher';
import config from './config';
import type { BookEvent } from './typesBookEvent';
import type { RawSymbol } from './types';

const UNIT = 1_000_000;
const SYMBOLS = ['L1', 'L2', 'L3', 'L4', 'L5', 'H1', 'H2', 'H3', 'H4'] as const;
let balance = 1_000 * UNIT;
let roundID = 0;
let pendingPayout = 0;
let installed = false;

const makeRound = (amount: number, mode: string) => {
	const won = roundID % 3 === 0;
	const board: RawSymbol[][] = Array.from({ length: 5 }, (_, reel) =>
		Array.from({ length: 6 }, (_, row) => ({
			name: SYMBOLS[(roundID * 7 + reel * 3 + row * 5 + Math.floor(Math.random() * 4)) % SYMBOLS.length],
		})),
	);
	if (won) for (let reel = 0; reel < 3; reel++) board[reel][2] = { name: 'L1' };
	const winAmount = won ? 50 : 0; // book amounts use cents at a one-unit test stake
	const events: BookEvent[] = [
		{
			index: 0,
			type: 'reveal',
			board,
			paddingPositions: config.paddingReels.basegame.map((strip) => Math.floor(Math.random() * strip.length)),
			anticipation: [0, 0, 0, 0, 0],
			gameType: 'basegame',
		},
	];
	if (won) {
		events.push({
			index: events.length,
			type: 'winInfo',
			totalWin: winAmount,
			wins: [{
				symbol: 'L1',
				kind: 3,
				win: winAmount,
				positions: [0, 1, 2].map((reel) => ({ reel, row: 2 })),
				meta: { ways: 1, globalMult: 1, winWithoutMult: winAmount, symbolMult: 1 },
			}],
		});
	}
	events.push({ index: events.length, type: 'setTotalWin', amount: winAmount });
	events.push({ index: events.length, type: 'finalWin', amount: winAmount });
	const payout = won ? amount * 0.5 : 0;
	pendingPayout = payout;
	return {
		roundID,
		amount,
		payout,
		payoutMultiplier: won ? 0.5 : 0,
		active: false,
		mode,
		event: '0',
		state: events,
	};
};

export const installLocalSkinRgs = () => {
	if (installed || typeof window === 'undefined') return;
	// This folder is a self-contained comparison build. Real RGS is an explicit
	// opt-in for testing against a matching Alchemy math deployment.
	if (new URLSearchParams(window.location.search).get('skin_remote') === '1') return;
	installed = true;
	rgsFetcher.post = (async (options: { url: string; variables?: Record<string, unknown> }) => {
		switch (options.url) {
			case '/wallet/authenticate':
				return {
					balance: { amount: balance, currency: 'USD' },
					config: {
						minBet: 100_000,
						maxBet: 10_000_000,
						stepBet: 100_000,
						defaultBetLevel: UNIT,
						betLevels: [100_000, 200_000, 500_000, UNIT, 2 * UNIT, 5 * UNIT, 10 * UNIT],
						jurisdiction: {
							socialCasino: false, disabledFullscreen: false, disabledTurbo: false,
							disabledSuperTurbo: false, disabledAutoplay: false, disabledSlamstop: false,
							disabledSpacebar: false, disabledBuyFeature: true, displayNetPosition: false,
							displayRTP: false, displaySessionTimer: false, minimumRoundDuration: 0,
						},
					},
				};
			case '/wallet/play': {
				const amount = Number(options.variables?.amount) || UNIT;
				balance -= amount;
				roundID += 1;
				return { balance: { amount: balance, currency: 'USD' }, round: makeRound(amount, String(options.variables?.mode || 'BASE')) };
			}
			case '/wallet/end-round':
				balance += pendingPayout;
				pendingPayout = 0;
				return { balance: { amount: balance, currency: 'USD' } };
			case '/bet/event':
				return { event: options.variables?.event ?? '0' };
			default:
				throw new Error(`Unsupported local test request: ${options.url}`);
		}
	}) as typeof rgsFetcher.post;
};

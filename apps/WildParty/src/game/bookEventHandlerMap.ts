import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent, getSymbolX } from './utils';
import { BOARD_SIZES } from './constants';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position, RawSymbol } from './types';
import config from './config';

// the last base-game reveal (i.e. the board that triggered free spins) —
// restored when the feature ends so the player returns to the trigger board
let lastBaseGameBoard: RawSymbol[][] | null = null;

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	if (winLevelData?.sound?.bgm) {
		eventEmitter.broadcast({ type: 'soundMusic', name: winLevelData.sound.bgm });
	}
	if (winLevelData?.type === 'big') {
		// Blast accent as the big/super/mega/epic win presentation slams in
		eventEmitter.broadcast({ type: 'soundBigWinBlast' });
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bigwin_coinloop' });
	}
};

const winLevelSoundsStop = () => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	if (stateBet.activeBetModeKey === 'SUPERSPIN' || stateGame.gameType === 'freegame') {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

// which wild fires the next multiplier comet. The math emits ONE
// updateGlobalMult book event PER WILD (+1 each), so this counter must
// survive across events within a spin — it resets on every reveal
let spinCometIndex = 0;

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	// Only animate symbols in visible rows (1, 2, 3) — padding rows (0, 4) have no
	// oncomplete callback and would cause the game to freeze waiting forever.
	const visiblePositions = positions.filter((p) => p.row >= 1 && p.row <= 3);
	if (visiblePositions.length === 0) return;
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: visiblePositions,
	});
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		// remember the triggering base board so it can be restored after free spins
		if (bookEvent.gameType === 'basegame') lastBaseGameBoard = bookEvent.board;
		spinCometIndex = 0;

		stateGame.gameType = bookEvent.gameType;
		await stateGameDerived.enhancedBoard.spin({
			revealEvent: bookEvent,
			paddingBoard: config.paddingReels[bookEvent.gameType],
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });

		// Build win line data — each win has a lineIndex from meta
		// symbol/kind/win ride along so the readout can name what paid — see
		// WinLines.svelte for why the lines are grouped rather than cycled.
		const winLineData = bookEvent.wins.map((win) => ({
			lineIndex: win.meta.lineIndex,
			positions: win.positions,
			symbolCount: win.positions.length,
			symbol: win.symbol,
			kind: win.kind,
			win: win.win,
		}));

		// In free game: show all lines instantly; in base: stagger
		const isFreeGame = stateGame.gameType === 'freegame';
		await eventEmitter.broadcastAsync({ type: 'winLinesShow', wins: winLineData, fast: isFreeGame });

		// Collect ALL unique winning positions (deduplicate — same symbol can appear in
		// multiple wins due to Wilds). Animating the same position twice would freeze
		// because the second symbolState='win' assignment doesn't trigger $effect again.
		const seenKey = new Set<string>();
		const uniquePositions: Position[] = [];
		for (const win of bookEvent.wins) {
			for (const pos of win.positions) {
				const key = `${pos.reel},${pos.row}`;
				if (!seenKey.has(key)) {
					seenKey.add(key);
					uniquePositions.push(pos);
				}
			}
		}

		// Animate all unique winning symbols in one batch
		await animateSymbols({ positions: uniquePositions });

		// Clear lines
		eventEmitter.broadcast({ type: 'winLinesHide' });
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		// Starting multiplier = how many paylines the three triggering Scatters
		// complete (1-3). The math never sends this as its own event: the first
		// updateGlobalMult is already start+1, i.e. the first Wild's increment.
		// (Verified across every bonus book — firstUpdateGlobalMult minus this
		// payline count is always exactly 1.) So derive it here, otherwise the
		// plaque both opens on the wrong number and swallows that first Wild.
		// positions carry board-array rows; row 0 is the top padding row.
		const scatterRows = new Map<number, number>();
		bookEvent.positions.forEach((position) => scatterRows.set(position.reel, position.row - 1));
		const startingMult = Math.max(
			1,
			Object.values(config.paylines).filter((line) =>
				[...scatterRows].every(([reel, row]) => (line as number[])[reel] === row),
			).length,
		);

		// Scatters landed on reels 3/4/5 — silence everything and ring the classic
		// free-game trigger bell, holding the moment for ~2s before the payoff.
		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_main' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
		await waitForTimeout(3000);
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		// Three passes of the scatter shake — extended trigger celebration
		await animateSymbols({ positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		// stepping into the Free Spins room — the grand ornate-door transition
		await eventEmitter.broadcastAsync({ type: 'transition', variant: 'enter' });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		stateGame.gameType = 'freegame';
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		// seed the plaque with the trigger's starting multiplier before play begins,
		// so every later updateGlobalMult still lands as a real +1 per Wild
		stateGame.globalMultiplier = startingMult;
		eventEmitter.broadcast({ type: 'globalMultiplierShow' });
		await eventEmitter.broadcastAsync({
			type: 'globalMultiplierUpdate',
			multiplier: startingMult,
		});
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
		eventEmitter.broadcast({ type: 'drawerFold' });
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount + 1,
			total: bookEvent.total,
		});
		stateUi.freeSpinCounterCurrent = bookEvent.amount + 1;
		stateUi.freeSpinCounterTotal = bookEvent.total;
	},
	updateGlobalMult: async (bookEvent: BookEventOfType<'updateGlobalMult'>) => {
		const targetMult = bookEvent.globalMult;
		const currentMult = stateGame.globalMultiplier;

		eventEmitter.broadcast({ type: 'globalMultiplierShow' });

		if (targetMult > currentMult) {
			// one comet per +1, launched from this spin's Wilds. Positions come
			// from each symbol's LIVE render coordinates (getSymbolX/symbolY —
			// the exact values the board draws with), not from index math, so
			// stacked same-reel wilds each fire from their own cell. Only
			// symbols whose center currently sits inside the mask window count.
			const wilds: { x: number; y: number }[] = [];
			stateGame.board.forEach((reel, reelIndex) => {
				reel.reelState.symbols.forEach((reelSymbol) => {
					const y = reelSymbol.symbolY();
					if (reelSymbol.rawSymbol.name === 'W' && y > 0 && y < BOARD_SIZES.height) {
						wilds.push({ x: getSymbolX(reelIndex), y });
					}
				});
			});
			wilds.sort((a, b) => a.x - b.x || a.y - b.y);

			// Animate one-by-one: each Wild adds +1, show each increment clearly
			// but quickly. spinCometIndex persists across the per-wild events of
			// the same spin so stacked wilds each launch from their own cell
			for (let mult = currentMult + 1; mult <= targetMult; mult++) {
				const from = wilds[spinCometIndex++];
				if (from) {
					await eventEmitter.broadcastAsync({
						type: 'multiplierComet',
						x: from.x,
						y: from.y,
					});
				}
				stateGame.globalMultiplier = mult;
				await eventEmitter.broadcastAsync({
					type: 'globalMultiplierUpdate',
					multiplier: mult,
				});
				if (mult < targetMult) {
					await waitForTimeout(150);
				}
			}
		} else {
			// Reset or same — just update directly
			stateGame.globalMultiplier = targetMult;
			await eventEmitter.broadcastAsync({
				type: 'globalMultiplierUpdate',
				multiplier: targetMult,
			});
		}
	},
	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		// Same bell moment as the initial trigger: silence the free-game bgm,
		// ring the bell and hold ~2s, then bring the music back.
		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_freespin' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
		await waitForTimeout(3000);
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		// Three passes of the scatter shake — extended trigger celebration
		await animateSymbols({ positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
		const extraSpins = Math.max(0, bookEvent.totalFs - stateUi.freeSpinCounterTotal);
		if (extraSpins > 0) {
			eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
			await eventEmitter.broadcastAsync({
				type: 'freeSpinIntroUpdate',
				totalFreeSpins: bookEvent.totalFs,
				extraSpins,
			});
			eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		}
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: stateUi.freeSpinCounterCurrent,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
	},
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		stateGame.gameType = 'basegame';
		stateGame.globalMultiplier = 1;
		await eventEmitter.broadcastAsync({ type: 'globalMultiplierUpdate', multiplier: 1 });
		eventEmitter.broadcast({ type: 'globalMultiplierHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateUi.freeSpinCounterShow = false;
		// transition resolves once the curtain fully covers the screen — swap the
		// board back to the base spin that triggered the feature behind it.
		// Returning to base play gets the quick neon wipe, not the grand doors.
		await eventEmitter.broadcastAsync({ type: 'transition', variant: 'exit' });
		if (lastBaseGameBoard) {
			eventEmitter.broadcast({ type: 'boardSettle', board: lastBaseGameBoard });
		}
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		// Regular wins just tick up in the bottom win label — only big-tier
		// wins (big/super/mega/epic/max) get the full pop-up presentation.
		if (winLevelData?.type !== 'big') return;

		eventEmitter.broadcast({ type: 'winShow' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'winHide' });
	},
	finalWin: async () => {
		// Do nothing
	},
	wincap: async (bookEvent: BookEventOfType<'wincap'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_end' });
	},
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (bookEvent) => bookEvent.type === type) as
				| BookEventOfType<T>
				| undefined;
		}

		const lastFreeSpinTriggerEvent = findLastBookEvent('freeSpinTrigger' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);
		const lastUpdateGlobalMultEvent = findLastBookEvent('updateGlobalMult' as const);

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });
		if (lastUpdateGlobalMultEvent) playBookEvent(lastUpdateGlobalMultEvent, { bookEvents });
	},
};

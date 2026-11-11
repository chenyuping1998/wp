import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position, RawSymbol, SymbolName } from './types';
import { BOARD_DIMENSIONS } from './constants';
import config from './config';
import { featureTotal } from './featureTotal';
import { plaqueLevelForAmount } from './winTiers';
import {medusaAnimations} from './animationTimeline';

// The math numbers the reels after the one where the third Aegis landed 1, 2,
// 3… (anticipation_triggers = 3, one short of the four that open free spins).
// Only value 1 is worth teasing: the very next reel, the single point in the
// round where one more Aegis decides the outcome.
//
// EXACTLY that value, not >=. A higher value means the feature is already won,
// nothing is left in suspense, and an anticipated reel costs real time — its
// padding is reelPaddingMultiplierAnticipated (8) against 1.2 for a normal reel,
// so it waits several times longer before it even starts falling. With >=, every
// bought round would open on a run of teased reels after the outcome was paid for.
const gateAnticipation = (anticipation: number[]) =>
	anticipation.map((value) => (value === 1 ? value : 0));

// Only these levels get the full plaque. setWin fires once per SPIN, not once per
// round, so celebrating every one would put a banner over most free spins. Small
// wins just move the ticker, which setTotalWin is already doing.
const isCelebratedWinLevel = (winLevelData: WinLevelData | undefined) =>
	winLevelData?.type === 'big';

/** One symbol reaching a paying count. */
export type ScatterWinDatum = {
	symbol: SymbolName;
	positions: Position[];
	win: number;
	overlay: Position;
};

const winLevelSoundsPlay = ({ winLevelData, blastTier, celebrate = true }: { winLevelData: WinLevelData; blastTier?: 1 | 2 | 3 | 4 | 5; celebrate?: boolean }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	// Deliberately NOT switching to winLevelData.sound.bgm: switching pauses the
	// running bed and restarts it from the top afterwards. Keep it playing.
	if (winLevelData?.type === 'big' && celebrate) {
		eventEmitter.broadcast({
			type: 'soundBigWinBlast',
			tier: blastTier ?? (Math.min(5, Math.max(1, winLevelData.level - 5)) as 1 | 2 | 3 | 4 | 5),
		});
		eventEmitter.broadcast({ type: 'soundMedusa', cue: 'laugh' });
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bigwin_coinloop' });
	}
	if (winLevelData?.type === 'big') {
		eventEmitter.broadcast({
			type: 'medusaAction',
			animation: winLevelData.alias === 'max' ? 'win_max' : 'win_big',
		});
	}
};

const winLevelSoundsStop = ({ restoreMusic = true }: { restoreMusic?: boolean } = {}) => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	eventEmitter.broadcast({ type: 'medusaPose', pose: 'idle' });
	if (!restoreMusic) {
		// the end plaque waits over its own bed; the base-game music comes in with the way back
	} else if (stateGame.gameType === 'freegame') {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

/**
 * A pearl (M) on a visible row is drawn as a cell owner carrying its value. Pearls in the
 * hidden rows stay plain: the one below the board never enters it, and the one above it
 * only becomes a pearl cell when a tumble drops it in (TumbleLayer picks it up then).
 */
const withPearls = (column: RawSymbol[]) =>
	column.map((raw, row) =>
		raw.name === ('M' as SymbolName) && row >= 1 && row <= BOARD_DIMENSIONS.y ? { ...raw, watchValue: raw.multiplier } : { ...raw },
	);
/** The largest pearl on the visible rows (0 when there is none). */
const topPearl = (board: RawSymbol[][]) =>
	Math.max(0, ...board.flatMap((column) => column.filter((raw, row) => raw.name === ('M' as SymbolName) && row >= 1 && row <= BOARD_DIMENSIONS.y).map((raw) => Number(raw.multiplier) || 0)));
const visiblePearls = (board: RawSymbol[][]) =>
	board.reduce((n, column) => n + column.filter((raw, row) => raw.name === ('M' as SymbolName) && row >= 1 && row <= BOARD_DIMENSIONS.y).length, 0);

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	// Only animate symbols in visible rows (1..numRows) — padding rows (0 and
	// numRows+1) have no oncomplete callback and would freeze the game forever.
	const visiblePositions = positions.filter((p) => p.row >= 1 && p.row <= BOARD_DIMENSIONS.y);
	if (visiblePositions.length === 0) return;
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: visiblePositions,
	});
};

/** Pace tier shared by the win marks and anything else that has four speeds. */
const currentPace = () =>
	stateGame.gameType === 'freegame'
		? stateBet.isTurbo
			? ('turboFreegame' as const)
			: ('freegame' as const)
		: stateBet.isTurbo
			? ('turbo' as const)
			: ('normal' as const);

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		// A reveal starts a fresh tumble sequence; the previous chain's readout must
		// not carry over. Medusa's running total is NOT touched — it survives every
		// reveal inside a feature.
		stateGame.tumbleWin = 0;
		stateGame.tumbleChain = 0;
		eventEmitter.broadcast({ type: 'medusaPose', pose: 'idle' });
		eventEmitter.broadcast({ type: 'hypnoWatchClear' });

		// reference game: the caster acts only when this board carries pearls; they land with it
		const revealBoard = bookEvent.board.map(withPearls);
		const pearls = visiblePearls(bookEvent.board);
		if (pearls > 0) eventEmitter.broadcast({ type: 'hypnoWatchReveal', pace: currentPace(), count: pearls, top: topPearl(bookEvent.board) });
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
		// reference: a free spin empties its board like a base spin, reel by reel left to right
		// (the shared spin would drop the whole board at once); a base spin already did this
		// before its book arrived
		if (bookEvent.gameType === 'freegame' && stateGame.board.some((reel) => reel.reelState.motion === 'stopped')) {
			eventEmitter.broadcast({ type: 'soundCue', cue: 'sfx_board_out' });
			await stateGameDerived.enhancedBoard.preSpin({ paddingBoard: config.paddingReels[bookEvent.gameType] as RawSymbol[][] });
		}
		await stateGameDerived.enhancedBoard.spin({
			revealEvent: {
				...bookEvent,
				board: revealBoard,
				anticipation: gateAnticipation(bookEvent.anticipation),
			},
			paddingBoard: config.paddingReels[bookEvent.gameType] as RawSymbol[][],
		});
		// Stone 11-11: an x100+ pearl shakes the board; the hand waits for the board to be still,
		// and when the pearls pay nothing (no win follows this board) it holds so the pearl can be
		// read before the next spin takes the board away.
		if (pearls > 0) {
			const next = bookEvents[bookEvents.indexOf(bookEvent) + 1];
			await eventEmitter.broadcastAsync({ type: 'hypnoWatchSettle', pace: currentPace(), wasted: next?.type !== 'winInfo' });
		}

	},

	/**
	 * One evaluation pass. Every symbol that reached a paying count is marked and
	 * its amount shown at the centre of the group. With no wild on the strips a
	 * cell belongs to exactly one symbol's group, so there is nothing to dedupe.
	 */
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		// 4+ dragon gates paying on their own when the chain ended (never multiplied)
		if (bookEvent.wins[0]?.symbol === ('S' as SymbolName)) {
			const positions = bookEvent.wins.flatMap((win) => win.positions);
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
			eventEmitter.broadcast({ type: 'scatterBurst', positions });
			await animateSymbols({ positions });
			return;
		}
		stateGame.tumbleChain += 1;

		const wins: ScatterWinDatum[] = bookEvent.wins.map((win) => ({
			symbol: win.symbol,
			positions: win.positions,
			win: win.win,
			overlay: win.meta.overlay,
		}));

		// The pluck marks the win. Stone cracks are scheduled by ScatterWins at
		// the actual petrification boundary, after the symbol's acting beat.
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_standard' });

		await eventEmitter.broadcastAsync({
			type: 'scatterWinsShow',
			wins,
			pace: currentPace(),
		});
	},

	updateTumbleWin: async (bookEvent: BookEventOfType<'updateTumbleWin'>) => {
		stateGame.tumbleWin = bookEvent.amount;
	},

	/**
	 * The winning cells turn to stone and crumble, and the board refills from
	 * above. The marks are dropped first: they belong to symbols that are about to
	 * stop existing.
	 */
	tumbleBoard: async (bookEvent: BookEventOfType<'tumbleBoard'>) => {
		// the frames stay up until the winners swell white (TumbleLayer hides them)
		// Pearls in the refill (and one falling in from the hidden top row) are placed by
		// TumbleLayer from the book: the caster acts at the burst and each rides its cell in.
		await eventEmitter.broadcastAsync({
			type: 'tumbleRun',
			explodingSymbols: bookEvent.explodingSymbols,
			newSymbols: bookEvent.newSymbols.map((column) => column.map((raw) => ({ ...raw }))),
			watches: [],
			pace: currentPace(),
		});
		// a pearl that fell in with the refill may be an x100+: let the board come to rest first
		await eventEmitter.broadcastAsync({ type: 'hypnoWatchSettle', pace: currentPace(), wasted: false });
	},

	/**
	 * Pearl settlement: the pearls already on the board are read out left to right and
	 * build "win x N". Base game N = their sum; free game N = TOTAL after they joined it.
	 * The updateTumbleWin that follows carries the multiplied amount.
	 */
	boardMultiplierInfo: async (bookEvent: BookEventOfType<'boardMultiplierInfo'>) => {
		const isFree = stateGame.gameType === 'freegame';
		await eventEmitter.broadcastAsync({
			type: 'hypnoThrow',
			multipliers: bookEvent.multInfo.positions.map((p) => p.multiplier),
			applied: true,
			mult: bookEvent.winInfo.boardMult,
			baseWin: bookEvent.winInfo.tumbleWin,
			totalWin: bookEvent.winInfo.totalWin,
			toTotal: isFree,
			// a big-win plaque follows (25x+, winTiers)
			bigWin: plaqueLevelForAmount(bookEvent.winInfo.totalWin) >= 6,
			pace: currentPace(),
		});
		if (isFree) stateGame.medusaTotal = bookEvent.winInfo.boardMult;
	},

	/** TOTAL MULTIPLIER: 0 when the free game opens, then the settled total. */
	updateGlobalMult: async (bookEvent: BookEventOfType<'updateGlobalMult'>) => {
		stateGame.medusaTotal = bookEvent.globalMult;
	},

	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},

	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_main' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
		eventEmitter.broadcast({ type: 'soundMedusa', cue: 'gasp' });
		// the hypnotist only tips his hat here; he winds up when the plaque comes in
		eventEmitter.broadcast({ type: 'medusaAction', animation: 'react_small' });
		eventEmitter.broadcast({
			type: 'scatterBurst',
			positions: bookEvent.positions,
		});
		const triggerStart = performance.now();
		await Promise.all(
			bookEvent.positions.map(async (position, index) => {
				await waitForTimeout(index * 120);
				await animateSymbols({ positions: [position] });
			}),
		);
		// reference §5.1: the gates' light 0.5-1.5 s, the plaque and the caster's wind-up at ~2.2 s
		// after the 4th gate lands (the bar takes ~0.4 s to clear first)
		await waitForTimeout(Math.max(0, 1100 - (performance.now() - triggerStart)));
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		// 天使奧丁 (research/xinstar-angelodin §5.1): the feature plaque comes in on
		// the BASE scene while the caster winds up and holds (Ready → ReadyLoop),
		// then he casts, a portal opens in the plaque and the free game appears
		// under a white flash.
		eventEmitter.broadcast({ type: 'medusaAction', animation: 'fg_ready' });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		eventEmitter.broadcast({ type: 'medusaAction', animation: 'fg_transform' });
		eventEmitter.broadcast({ type: 'soundCue', cue: 'sfx_transform' });
		eventEmitter.broadcast({ type: 'soundVoice', line: 'fgIn' });
		let swappedAt = performance.now();
		await eventEmitter.broadcastAsync({
			type: 'transition',
			kind: 'portal',
			tone: 'violet',
			oncover: () => {
				// the plaque stays up until the spiral has swallowed it
				swappedAt = performance.now();
				eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
				eventEmitter.broadcast({ type: 'medusaPose', pose: 'idle' });
				stateGame.gameType = 'freegame';
			},
			onreveal: () => {
				eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
				eventEmitter.broadcast({ type: 'medusaAction', animation: 'fg_trigger' });
			},
		});
		stateGame.gameType = 'freegame';
		// The running-total plate opens at 0 and has to be on screen before the
		// first free spin, or a second feature in one session would open showing
		// the previous feature's final total.
		stateGame.medusaTotal = 0;
		eventEmitter.broadcast({ type: 'medusaTotalShow' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		// `current: 1`, not undefined: the first updateFreeSpin is a moment away,
		// and undefined would leave the counter showing the last feature's value.
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: 1,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterCurrent = 1;
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
		eventEmitter.broadcast({ type: 'drawerFold' });
		// reference §5.1: the first free spin comes 1.5 s after the scene swapped under the flash
		await waitForTimeout(Math.max(0, 1500 - (performance.now() - swappedAt)));
	},

	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		// `amount` is already the 1-based index of the spin about to be played: the
		// math sends updateFreeSpin(amount=N) right before the Nth reveal.
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount,
			total: bookEvent.total,
		});
		stateUi.freeSpinCounterCurrent = bookEvent.amount;
		stateUi.freeSpinCounterTotal = bookEvent.total;
	},

	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		// Same bell moment as the initial trigger: three Aegis add five spins.
		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_freespin' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
		eventEmitter.broadcast({ type: 'medusaAction', animation: 'react_small' });
		await Promise.all(
			bookEvent.positions.map(async (position, index) => {
				await waitForTimeout(index * 120);
				await animateSymbols({ positions: [position] });
			}),
		);
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
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
		// the plaque shows the WHOLE round, trigger spin included (featureTotal)
		const total = featureTotal(bookEvent.amount);
		const winLevelData = winLevelMap[total.winLevel];

		// reference §5.3: the end plaque comes in ~0.5 s after the last spin stops (the bar takes
		// ~0.4 s to clear first)
		await waitForTimeout(100);
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		const fgEndStarted=performance.now();
		eventEmitter.broadcast({ type: 'medusaAction', animation: 'fg_end' });
		eventEmitter.broadcast({ type: 'soundMedusa', cue: 'glassesOn' });
		// The running-total plate stays up under the outro plaque — it is the
		// player's last look at what the feature built — and is hidden below.
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		eventEmitter.broadcast({ type: 'soundVoice', line: bookEvent.winLevel >= 2 ? 'fgEndBig' : 'fgEnd' });
		// the end plaque has its own sting and bed (reference FgPage_Out), not the big-win set
		winLevelSoundsPlay({ winLevelData, celebrate: false });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: total.amount,
			winLevelData,
		});
		winLevelSoundsStop({ restoreMusic: false });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		eventEmitter.broadcast({ type: 'medusaTotalHide' });
		stateGame.medusaTotal = 0;
		stateUi.freeSpinCounterShow = false;
		await waitForTimeout(Math.max(0,medusaAnimations.fg_end.durationMs-(performance.now()-fgEndStarted)));
		eventEmitter.broadcast({ type: 'medusaAction', animation: 'fg_transform' });
		eventEmitter.broadcast({ type: 'soundCue', cue: 'sfx_transform' });
		// back through a gold portal (天使奧丁 FG_Board_End Out: a golden gate)
		await eventEmitter.broadcastAsync({type:'transition',kind:'portal',tone:'gold',oncover:()=>{eventEmitter.broadcast({type:'soundMusic',name:'bgm_main'});eventEmitter.broadcast({type:'freeSpinOutroHide'});eventEmitter.broadcast({type:'medusaPose',pose:'idle'});stateGame.gameType='basegame';}});
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},

	/**
	 * Closes one spin's tumble sequence. Fires per spin, not per round, so only
	 * big-and-up gets the plaque; anything smaller has already been read out by the
	 * tumble counter and the win ticker.
	 */
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		// the maths sends the reference tiers 1-5 (2 BIG 25x+ ... 5 EPIC 200x+); the plaque table
		// numbers them 6-9, MAX 10 at the win cap (winTiers)
		const winLevelData = winLevelMap[plaqueLevelForAmount(bookEvent.amount)];
		if (!isCelebratedWinLevel(winLevelData)) return;

		eventEmitter.broadcast({ type: 'winShow' });
		// the plaque opens on BIG and climbs (Win.svelte sounds each tier it reaches)
		winLevelSoundsPlay({ winLevelData, blastTier: 1 });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		await eventEmitter.broadcastAsync({ type: 'winHide' });
	},

	finalWin: async () => {
		// Safety net: finalWin is the last event of every book, so it is the one
		// place that can guarantee no feature panel is left up.
		if (stateUi.freeSpinCounterShow) {
			eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
			stateUi.freeSpinCounterShow = false;
		}
		if (stateGame.gameType !== 'basegame') {
			stateGame.gameType = 'basegame';
		}
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
		const lastGlobalMultEvent = findLastBookEvent('updateGlobalMult' as const);

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });

		// Restore TOTAL from the last updateGlobalMult after the trigger.
		if (lastFreeSpinTriggerEvent) {
			stateGame.medusaTotal =
				lastGlobalMultEvent && lastGlobalMultEvent.index > lastFreeSpinTriggerEvent.index
					? lastGlobalMultEvent.globalMult
					: 0;
			eventEmitter.broadcast({ type: 'medusaTotalShow' });
		}
	},
};

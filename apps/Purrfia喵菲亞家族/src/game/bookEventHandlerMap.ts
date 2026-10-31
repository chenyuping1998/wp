import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position, RawSymbol, SymbolName } from './types';
import { BOARD_DIMENSIONS } from './constants';
import config from './config';
import { planCascadeColumn } from './symbolMotion';
import { featureTotal } from './featureTotal';
import { emptyTerritory, applyCellChanges, territoryBeforeReveal, replayTerritory } from './territory';

// 3… (anticipation_triggers = 3, one short of the four that open free spins).
// Only value 1 is worth teasing: the very next reel, the single point in the
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


export type ScatterWinDatum = {
	symbol: SymbolName;
	positions: Position[];
	win: number;
	overlay: Position;
};

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	// Deliberately NOT switching to winLevelData.sound.bgm: switching pauses the
	// running bed and restarts it from the top afterwards. Keep it playing.
	if (winLevelData?.type === 'big') {
        eventEmitter.broadcast({type:'castPlay',name:winLevelData.alias==='max'?'win_max':'win_big',hold:true});
		eventEmitter.broadcast({
			type: 'soundBigWinBlast',
			tier: Math.min(5, Math.max(1, winLevelData.level - 5)) as 1 | 2 | 3 | 4 | 5,
		});
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bigwin_coinloop' });
	}
};

const winLevelSoundsStop = () => {
    eventEmitter.broadcast({type:'castPlay',name:'idle'});
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	if (stateGame.gameType === 'freegame') {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

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
		stateGame.cellMults = territoryBeforeReveal(stateGame.cellMults, bookEvent.gameType);
		stateGame.bossPose = 'idle';
        stateGame.boxOpenCount=0;
		eventEmitter.broadcast({ type: 'soundReset' });
		// A reveal starts a fresh tumble sequence; the previous chain's readout must
		// reveal inside a feature.
		stateGame.tumbleWin = 0;
		stateGame.tumbleChain = 0;

		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
		await stateGameDerived.enhancedBoard.spin({
			revealEvent: {
				...bookEvent,
				anticipation: gateAnticipation(bookEvent.anticipation),
			},
			paddingBoard: config.paddingReels[bookEvent.gameType] as RawSymbol[][],
		});
	},

	
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		stateGame.tumbleChain += 1;
        if(stateGame.tumbleChain===4)eventEmitter.broadcast({type:'castPlay',name:'react_chain'});

		const wins: ScatterWinDatum[] = bookEvent.wins.map((win) => ({
			symbol: win.symbol,
			positions: win.positions,
			win: win.win,
			overlay: win.meta.overlay,
		}));

		// The pluck marks the win. Stone cracks are scheduled by ScatterWins at
		// the removal boundary, after the symbol's acting beat.
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

	
	tumbleBoard: async (bookEvent: BookEventOfType<'tumbleBoard'>) => {
		eventEmitter.broadcast({ type: 'scatterWinsHide' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
		await eventEmitter.broadcastAsync({
			type: 'tumbleRun',
			explodingSymbols: bookEvent.explodingSymbols,
			newSymbols: bookEvent.newSymbols,
		});
	},

	
	boxOpen: async (bookEvent: BookEventOfType<'boxOpen'>) => {
        const stamp=bookEvent.symbol==='W',short=stateBet.isTurbo||stateGame.boxOpenCount++>0;
        stateGame.boxReleaseMs=short?250:stamp?490:550;
        stateGame.boxDurationMs=short?500:stamp?900:1100;
        eventEmitter.broadcast({type:'castPlay',name:(stamp?'stamp':'push_monocle')+(short?'_short':'')});
        eventEmitter.broadcast({type:'soundCue',cue:bookEvent.symbol==='W'?'sfx_stamp_raise':'sfx_monocle_push',priority:2});
        stateGame.openingBoxes = bookEvent.boxes;
        await waitForTimeout(stateGame.boxReleaseMs);
        eventEmitter.broadcast({type:'soundCue',cue:bookEvent.symbol==='W'?'sfx_stamp_slam':'sfx_box_open',priority:2});
        for (const box of bookEvent.boxes) {
            const symbol = stateGame.board[box.reel]?.reelState.symbols[box.row];
            if (!symbol) throw Error('boxOpen position outside board');
            symbol.rawSymbol = { name: bookEvent.symbol, ...(bookEvent.symbol === 'W' ? {wild:true,multiplier:box.multiplier??1} : {}) };
            symbol.symbolState = 'static';
        }
        await waitForTimeout(stateGame.boxDurationMs-stateGame.boxReleaseMs);
        stateGame.openingBoxes = [];
        stateGame.bossPose = 'idle';
    },
    cellMults: async (bookEvent: BookEventOfType<'cellMults'>) => {
        const initial=bookEvent.cells.length===49&&stateGame.cellMults.every(col=>col.every(v=>v===0));
        stateGame.cellMults = applyCellChanges(stateGame.cellMults, bookEvent.cells);
        if(initial){eventEmitter.broadcast({type:'castPlay',name:'claim_turf',rate:stateBet.isTurbo?2:1});await waitForTimeout(stateBet.isTurbo?550:1100);}
        const highest=Math.max(...bookEvent.cells.map(cell=>cell.mult));
        eventEmitter.broadcast({type:'soundCue',cue:highest>=128?'sfx_cell_max':highest>=8?'sfx_cell_tier':highest>=2?'sfx_cell_up':'sfx_mark',priority:highest>=128?1:3});
    },

	
	scatterWin: async (bookEvent: BookEventOfType<'scatterWin'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		eventEmitter.broadcast({
			type: 'scatterBurst',
			positions: bookEvent.positions,
		});
		await animateSymbols({ positions: bookEvent.positions });
	},

	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},

	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
        eventEmitter.broadcast({type:'castPlay',name:'fg_trigger'});
		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_main' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
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
		await waitForTimeout(Math.max(0, 2000 - (performance.now() - triggerStart)));
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		stateGame.gameType = 'freegame';
		await eventEmitter.broadcastAsync({ type: 'transition' });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		stateGame.gameType = 'freegame';
		// The running-total plate opens at 0 and has to be on screen before the
		// first free spin, or a second feature in one session would open showing
		// the previous feature's final total.
		stateGame.cellMults = emptyTerritory();
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
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
		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_freespin' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
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
        eventEmitter.broadcast({type:'soundCue',cue:'stinger_fg_outro',priority:1});
		// the plaque shows the WHOLE round, trigger spin included (featureTotal)
		const total = featureTotal(bookEvent.amount, bookEvent.winLevel);
		const winLevelData = winLevelMap[total.winLevel as WinLevel];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		// The running-total plate stays up under the outro plaque — it is the
		// player's last look at what the feature built — and is hidden below.
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: total.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
        eventEmitter.broadcast({type:'castPlay',name:'fg_end',rate:stateBet.isTurbo?2.67:1});
        await waitForTimeout(stateBet.isTurbo?600:1600);
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateGame.cellMults = emptyTerritory();
		stateUi.freeSpinCounterShow = false;
		stateGame.gameType = 'basegame';
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},

	
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];
		if (!isCelebratedWinLevel(winLevelData)){if(bookEvent.amount>0)eventEmitter.broadcast({type:'castPlay',name:bookEvent.amount>=1000?'react_good':'react_small'});return;}

		eventEmitter.broadcast({ type: 'winShow' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		await eventEmitter.broadcastAsync({ type: 'winHide' });
	},

	finalWin: async () => {
        if(stateGame.boxOpenCount>0&&stateGame.tumbleChain===0)eventEmitter.broadcast({type:'castPlay',name:'react_none'});
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
        const events=bookEvent.bookEvents;
        const last = <T extends BookEvent['type']>(type:T) => [...events].reverse().find(e=>e.type===type) as BookEventOfType<T>|undefined;
        const trigger=last('freeSpinTrigger'), count=last('updateFreeSpin'), total=last('setTotalWin');
        const retrigger=last('freeSpinRetrigger'), tumble=last('updateTumbleWin');
        // Hydrate historical state without replaying the entry animation or awards.
        if(total) stateBet.winBookEventAmount=total.amount;
        if(trigger){
            stateUi.freeSpinCounterShow=true;
            stateUi.freeSpinCounterCurrent=count?.amount??1;
            stateUi.freeSpinCounterTotal=Math.max(trigger.totalFs,count?.total??0,retrigger?.totalFs??0);
            eventEmitter.broadcast({type:'freeSpinCounterShow'});
            eventEmitter.broadcast({type:'freeSpinCounterUpdate',current:stateUi.freeSpinCounterCurrent,total:stateUi.freeSpinCounterTotal});
        }
        stateGame.cellMults=replayTerritory(events);
        const reveal=last('reveal');
        if(reveal){
            let board=JSON.parse(JSON.stringify(reveal.board)) as RawSymbol[][];
            // Reconstruct all board changes before reconnect without replaying payouts.
            for(const event of events.filter(e=>e.index>reveal.index)){
                if(event.type==='boxOpen') for(const box of event.boxes) board[box.reel][box.row]={name:event.symbol,...(event.symbol==='W'?{wild:true,multiplier:box.multiplier??1}:{})};
                if(event.type==='tumbleBoard') board=board.map((column,reel)=>planCascadeColumn(column,event.explodingSymbols.filter(p=>p.reel===reel).map(p=>p.row),event.newSymbols[reel]??[],BOARD_DIMENSIONS.y).column);
            }
            stateGameDerived.enhancedBoard.settle(board);
            stateGame.gameType=reveal.gameType;
            stateGame.tumbleWin=tumble&&tumble.index>reveal.index?tumble.amount:0;
            stateGame.tumbleChain=events.filter(e=>e.type==='winInfo'&&e.index>reveal.index).length;
        }
    },
};

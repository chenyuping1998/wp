import type {BetType} from 'rgs-requests';
import type {RawSymbol,Position,SymbolName,GameType} from './types';
type E<T extends string,P={}>={index:number;type:T}&P;
export type WinDatum={symbol:SymbolName;win:number;positions:Position[];meta:{globalMult:number;clusterMult:number;winWithoutMult:number;overlay:Position}};
export type BookEvent=
 |E<'reveal',{board:RawSymbol[][];paddingPositions:number[];anticipation:number[];gameType:GameType}>
 |E<'winInfo',{totalWin:number;wins:WinDatum[]}>
 |E<'tumbleBoard',{explodingSymbols:Position[];newSymbols:RawSymbol[][]}>
 |E<'updateTumbleWin',{amount:number}>
 |E<'encore',{symbol:SymbolName;positions:Position[];volume:number|null;mult:number}>
 |E<'volumeStart',{volume:number}>
 |E<'platinumRecord',{mult:number;applied:boolean;baseWin:number;totalWin:number}>
 |E<'setTotalWin',{amount:number}>|E<'finalWin',{amount:number}>
 |E<'setWin',{amount:number;winLevel:number}>|E<'wincap',{amount:number}>
 |E<'freeSpinTrigger',{totalFs:number;positions:Position[]}>
 |E<'freeSpinRetrigger',{totalFs:number;positions:Position[]}>
 |E<'updateFreeSpin',{amount:number;total:number}>
 |E<'freeSpinEnd',{amount:number;winLevel:number}>
 |E<'createBonusSnapshot',{bookEvents:BookEvent[]}>;
export type Bet=BetType<BookEvent>;
export type BookEventOfType<T>=Extract<BookEvent,{type:T}>;
export type BookEventContext={bookEvents:BookEvent[]};

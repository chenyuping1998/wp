export type Bar = {col:number;size:number;head:number;icons:number[]};
export type Target = {tileId:string;col:number;top:number;size:number;before:number;after:number;success:boolean};
export type Reveal = {index:number;type:'reveal';spinIndex:number;gameType:'base'|'free';bars:Bar[];board:number[][];boardBeforeWild:number[][];mergePlan:{col:number;fromSize:number;toSize:number;delayMs:number;durationMs:number}[];wildPlan:{triggered:boolean;variant:number;targets:Target[]}};
export type FreeState = {points:number;stage:number;multiplier:number;spinsPlayed:number;spinsTotal:number};
export type LineWin = {line:number;positions:{col:number;row:number}[];symbol:number;count:number;payout:number};
export type Event = Reveal | {index:number;type:'freeStart';totalSpins:number} | {index:number;type:'freeProgress';before:FreeState;after:FreeState;addedSpins:number} | {index:number;type:'winInfo';wins:LineWin[];basePayout:number;payout:number;multiplier:number;totalWin:number} | {index:number;type:'freeEnd';totalWin:number;spinsPlayed:number} | {index:number;type:'finalWin';amount:number};
export type Book = {id:number;events:Event[];payoutMultiplier:number};
export type Bet = {state:Event[];active:boolean;amount:number;mode:string;payoutMultiplier:number;event?:string;betID?:number;payout?:number};

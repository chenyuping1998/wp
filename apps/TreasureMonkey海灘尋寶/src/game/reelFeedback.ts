// A rising five-note landing cadence, shared by the game and its art preview.
export const REEL_STOP_RATES = [.88, .98, 1.09, 1.21, 1.34] as const;
export function reelStopRate(reelIndex:number,teasing=false){
 return (REEL_STOP_RATES[reelIndex]??1)*(teasing?1.12:1);
}

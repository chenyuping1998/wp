
export type CellChange = {reel:number;row:number;mult:number};
export const emptyTerritory = () => Array.from({length:7},()=>Array<number>(9).fill(0));
export const applyCellChanges = (grid:number[][], changes:CellChange[]) => {
  const out=grid.map(column=>[...column]);
  for(const {reel,row,mult} of changes){
    if(reel<0||reel>=7||row<1||row>7||![1,2,4,8,16,32,64,128].includes(mult))throw Error('Invalid Purrfia territory event');
    out[reel][row]=mult;
  }
  return out;
};
export const territoryBeforeReveal=(grid:number[][],gameType:string)=>gameType==='basegame'?emptyTerritory():grid;
export const replayTerritory=(events:{type:string;gameType?:string;cells?:CellChange[]}[])=>{
  let grid=emptyTerritory();
  for(const e of events){
    if(e.type==='freeSpinTrigger'||e.type==='freeSpinEnd'||e.type==='finalWin')grid=emptyTerritory();
    if(e.type==='reveal')grid=territoryBeforeReveal(grid,e.gameType??'basegame');
    if(e.type==='cellMults')grid=applyCellChanges(grid,e.cells??[]);
  }
  return grid;
};

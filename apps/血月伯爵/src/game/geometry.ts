export const BOARD={cell:108,side:648,x:316,y:56,framePad:28,frameSide:704,stageHeight:780} as const;
export function tileRect(col:number,top:number,size:number){
 return {x:col*BOARD.cell,y:top*BOARD.cell,width:size*BOARD.cell,height:size*BOARD.cell};
}

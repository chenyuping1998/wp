/** Per-cell presentation opacity while copies perform the collect act. */
export const collectionVisual = $state({ cells:{} as Record<string,boolean>, alpha:1 });
export const collectedCellAlpha=(reel:number|undefined,row:number|undefined)=>
 reel!==undefined&&row!==undefined&&collectionVisual.cells[`${reel}:${row}`]?collectionVisual.alpha:1;

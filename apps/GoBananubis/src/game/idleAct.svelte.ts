/**
 * The one cell doing its idle act right now (components/BoardIdle.svelte picks
 * it, Symbol.svelte plays it — meshRig.idlePose). reel -1 = nobody. `id` moves
 * on with every new act, so a finished act only clears itself, never the next.
 */
export const idleAct = $state({ reel: -1, row: -1, id: 0 });

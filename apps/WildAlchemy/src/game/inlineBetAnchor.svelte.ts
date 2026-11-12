import type { BetAnchor } from './inlineBetLayout';

// The BET box's screen rect, measured on demand by ui/MummyBar.svelte when the
// player opens the stake list, so ui/InlineBetMenu.svelte can open beside it.
export const inlineBetAnchor = $state({ measure: null as null | (() => BetAnchor) });

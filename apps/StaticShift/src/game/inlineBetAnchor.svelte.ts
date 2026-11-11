import type { BetAnchor } from './inlineBetLayout';
// Set by the bar (components/ui/MummyBar.svelte) when its BET box is pressed:
// how to measure that box on screen, so the list opens beside it.
export const inlineBetAnchor = $state({ measure: null as null | (() => BetAnchor) });

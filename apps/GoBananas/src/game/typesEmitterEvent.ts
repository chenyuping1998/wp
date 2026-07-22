import type { EmitterEventBoard } from '../components/Board.svelte';
import type { EmitterEventBoardFrame } from '../components/BoardFrame.svelte';
import type { EmitterEventFreeSpinIntro } from '../components/FreeSpinIntro.svelte';
import type { EmitterEventFreeSpinCounter } from '../components/FreeSpinCounter.svelte';
import type { EmitterEventFreeSpinOutro } from '../components/FreeSpinOutro.svelte';
import type { EmitterEventWin } from '../components/Win.svelte';
import type { EmitterEventWinLines } from '../components/WinLines.svelte';
import type { EmitterEventSound } from '../components/Sound.svelte';
import type { EmitterEventTransition } from '../components/Transition.svelte';
import type { EmitterEventExpandingWilds } from '../components/ExpandingWilds.svelte';
import type { EmitterEventStickyPrizes } from '../components/StickyPrizes.svelte';
import type { EmitterEventSuperspinCells } from '../components/SuperspinCells.svelte';
import type { EmitterEventScatterBurst } from '../components/ScatterBurst.svelte';

export type EmitterEventGame =
	| EmitterEventBoard
	| EmitterEventBoardFrame
	| EmitterEventWin
	| EmitterEventWinLines
	| EmitterEventFreeSpinIntro
	| EmitterEventFreeSpinCounter
	| EmitterEventFreeSpinOutro
	| EmitterEventSound
	| EmitterEventTransition
	| EmitterEventExpandingWilds
	| EmitterEventStickyPrizes
	| EmitterEventSuperspinCells
	| EmitterEventScatterBurst;

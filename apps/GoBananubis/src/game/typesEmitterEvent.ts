import type { EmitterEventBoard } from '../components/Board.svelte';
import type { EmitterEventBoardFrame } from '../components/BoardFrame.svelte';
import type { EmitterEventFreeSpinIntro } from '../components/FreeSpinIntro.svelte';
import type { EmitterEventFreeSpinCounter } from '../components/FreeSpinCounter.svelte';
import type { EmitterEventFreeSpinOutro } from '../components/FreeSpinOutro.svelte';
import type { EmitterEventWin } from '../components/Win.svelte';
import type { EmitterEventWinLines } from '../components/WinLines.svelte';
import type { EmitterEventSound } from '../components/Sound.svelte';
import type { EmitterEventTransition } from '../components/Transition.svelte';
import type { EmitterEventMysteryReveal } from '../components/MysteryReveal.svelte';
import type { EmitterEventStickyPrizes } from '../components/StickyPrizes.svelte';
import type { EmitterEventScatterBurst } from '../components/ScatterBurst.svelte';
import type { EmitterEventMascot } from '../components/Mascot.svelte';
import type { EmitterEventScatterLand } from '../components/ScatterLand.svelte';
import type { EmitterEventMultiplierRoll } from '../components/MultiplierRoll.svelte';
import type {
	EmitterEventHeldTabletsPending,
	EmitterEventHeldTabletsOpened,
	EmitterEventHeldTabletsShow,
	EmitterEventHeldTabletKnock,
} from '../components/HeldTablets.svelte';
import type { EmitterEventMysteryOracle } from '../components/MysteryOracle.svelte';
import type { EmitterEventActing } from './actingEvents';

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
	| EmitterEventMysteryReveal
	| EmitterEventStickyPrizes
	| EmitterEventScatterBurst
	| EmitterEventMascot
	| EmitterEventScatterLand
	| EmitterEventMultiplierRoll
	| EmitterEventHeldTabletsPending
	| EmitterEventHeldTabletsOpened
	| EmitterEventHeldTabletsShow
	| EmitterEventHeldTabletKnock
	| EmitterEventMysteryOracle
	| EmitterEventActing;

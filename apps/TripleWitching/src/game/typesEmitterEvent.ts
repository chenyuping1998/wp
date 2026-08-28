import type { EmitterEventBoard } from '../components/Board.svelte';
import type { EmitterEventBoardFrame } from '../components/BoardFrame.svelte';
import type { EmitterEventFreeSpinIntro } from '../components/FreeSpinIntro.svelte';
import type { EmitterEventFreeSpinCounter } from '../components/FreeSpinCounter.svelte';
import type { EmitterEventFreeSpinOutro } from '../components/FreeSpinOutro.svelte';
import type { EmitterEventWin } from '../components/Win.svelte';
import type { EmitterEventSound } from '../components/Sound.svelte';
import type { EmitterEventTransition } from '../components/Transition.svelte';
import type { EmitterEventMultiplierMeter } from '../components/MultiplierMeter.svelte';
import type { EmitterEventBoardExpandFx } from '../components/BoardExpandFx.svelte';
import type { EmitterEventScatterTrigger } from '../components/ScatterTrigger.svelte';
import type { EmitterEventFeatureBags } from '../components/FeatureBags.svelte';

export type EmitterEventGame =
	| EmitterEventBoard
	| EmitterEventBoardFrame
	| EmitterEventWin
	| EmitterEventFreeSpinIntro
	| EmitterEventFreeSpinCounter
	| EmitterEventFreeSpinOutro
	| EmitterEventSound
	| EmitterEventTransition
	| EmitterEventMultiplierMeter
	| EmitterEventBoardExpandFx
	| EmitterEventScatterTrigger
	| EmitterEventFeatureBags;

import type { EmitterEventBoard } from '../components/Board.svelte';
import type { EmitterEventBoardFrame } from '../components/BoardFrame.svelte';
import type { EmitterEventFreeSpinIntro } from '../components/FreeSpinIntro.svelte';
import type { EmitterEventFreeSpinCounter } from '../components/FreeSpinCounter.svelte';
import type { EmitterEventFreeSpinOutro } from '../components/FreeSpinOutro.svelte';
import type { EmitterEventWin } from '../components/Win.svelte';
import type { EmitterEventSound } from '../components/Sound.svelte';
import type { EmitterEventTransition } from '../components/Transition.svelte';
import type { EmitterEventScatterBurst } from '../components/ScatterBurst.svelte';
import type { EmitterEventScatterWins } from '../components/ScatterWins.svelte';
import type { EmitterEventTumble } from '../components/TumbleLayer.svelte';
import type { EmitterEventCast } from '../components/Character.svelte';

export type EmitterEventGame =
	| EmitterEventCast
	| EmitterEventBoard
	| EmitterEventBoardFrame
	| EmitterEventWin
	| EmitterEventFreeSpinIntro
	| EmitterEventFreeSpinCounter
	| EmitterEventFreeSpinOutro
	| EmitterEventSound
	| EmitterEventTransition
	| EmitterEventScatterBurst
	| EmitterEventScatterWins
	| EmitterEventTumble;

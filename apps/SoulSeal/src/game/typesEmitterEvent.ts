import type { EmitterEventBoard } from '../components/Board.svelte';
import type { EmitterEventBoardFrame } from '../components/BoardFrame.svelte';
import type { EmitterEventFreeSpinIntro } from '../components/FreeSpinIntro.svelte';
import type { EmitterEventFreeSpinCounter } from '../components/FreeSpinCounter.svelte';
import type { EmitterEventFreeSpinOutro } from '../components/FreeSpinOutro.svelte';
import type { EmitterEventWin } from '../components/Win.svelte';
import type { EmitterEventSound } from '../components/Sound.svelte';
import type { EmitterEventTransition } from '../components/Transition.svelte';
import type { EmitterEventScatterTrigger } from '../components/ScatterTrigger.svelte';
import type { EmitterEventCollect } from '../components/Collect.svelte';
import type { EmitterEventTriggerTease } from '../components/TriggerTease.svelte';
import type { EmitterEventRailMilestone } from '../components/RailMilestone.svelte';
import type { EmitterEventWinLines } from '../components/WinLines.svelte';
import type { EmitterEventTalismanRail } from '../components/TalismanRail.svelte';

export type EmitterEventGame =
	| EmitterEventBoard
	| EmitterEventBoardFrame
	| EmitterEventWin
	| EmitterEventFreeSpinIntro
	| EmitterEventFreeSpinCounter
	| EmitterEventFreeSpinOutro
	| EmitterEventSound
	| EmitterEventTransition
	| EmitterEventScatterTrigger
	| EmitterEventCollect
	| EmitterEventTriggerTease
	| EmitterEventRailMilestone
	| EmitterEventWinLines
	| EmitterEventTalismanRail;

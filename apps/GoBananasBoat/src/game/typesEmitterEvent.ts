import type { EmitterEventBoard } from '../components/Board.svelte';
import type { EmitterEventBoardFrame } from '../components/BoardFrame.svelte';
import type { EmitterEventFreeSpinIntro } from '../components/FreeSpinIntro.svelte';
import type { EmitterEventFreeSpinCounter } from '../components/FreeSpinCounter.svelte';
import type { EmitterEventFreeSpinOutro } from '../components/FreeSpinOutro.svelte';
import type { EmitterEventWin } from '../components/Win.svelte';
import type { EmitterEventWinWays } from '../components/WinWays.svelte';
import type { EmitterEventSound } from '../components/Sound.svelte';
import type { EmitterEventTransition } from '../components/Transition.svelte';
import type { EmitterEventMysteryReveal } from '../components/MysteryReveal.svelte';
import type { EmitterEventFullShipment } from '../components/FullShipment.svelte';
import type { EmitterEventCargoPick } from '../components/CargoPick.svelte';
import type { EmitterEventMultiplierPick } from '../components/MultiplierPick.svelte';
import type { EmitterEventMultiplierStrike } from '../components/MultiplierStrike.svelte';
import type { EmitterEventStickyPrizes } from '../components/StickyPrizes.svelte';
import type { EmitterEventScatterBurst } from '../components/ScatterBurst.svelte';
import type { EmitterEventMascot } from '../components/Mascot.svelte';
import type { EmitterEventCameraShake } from '../components/CameraShake.svelte';

export type EmitterEventGame =
	| EmitterEventBoard
	| EmitterEventBoardFrame
	| EmitterEventWin
	| EmitterEventWinWays
	| EmitterEventFreeSpinIntro
	| EmitterEventFreeSpinCounter
	| EmitterEventFreeSpinOutro
	| EmitterEventSound
	| EmitterEventTransition
	| EmitterEventMysteryReveal
	| EmitterEventFullShipment
	| EmitterEventCargoPick
	| EmitterEventMultiplierPick
	| EmitterEventMultiplierStrike
	| EmitterEventStickyPrizes
	| EmitterEventScatterBurst
	| EmitterEventMascot
	| EmitterEventCameraShake;

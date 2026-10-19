import type { EmitterEventBoard } from '../components/Board.svelte';
import type { EmitterEventBoardFrame } from '../components/BoardFrame.svelte';
import type { EmitterEventFreeSpinIntro } from '../components/FreeSpinIntro.svelte';
import type { EmitterEventFreeSpinCounter } from '../components/FreeSpinCounter.svelte';
import type { EmitterEventFreeSpinOutro } from '../components/FreeSpinOutro.svelte';
import type { EmitterEventWin } from '../components/Win.svelte';
import type { EmitterEventWinWays } from '../components/WinWays.svelte';
import type { EmitterEventSound } from '../components/Sound.svelte';
import type { EmitterEventTransition } from '../components/Transition.svelte';
import type { EmitterEventBanditCollect } from '../components/BanditCollect.svelte';
import type { EmitterEventBanditMeter } from '../components/BanditMeter.svelte';
import type { EmitterEventScatterBurst } from '../components/ScatterBurst.svelte';
import type { EmitterEventMascot } from '../components/Mascot.svelte';
import type { EmitterEventBowlingBallRoll } from '../components/BowlingBallRoll.svelte';
import type { EmitterEventBowlingScoreboards } from '../components/BowlingScoreboards.svelte';

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
	| EmitterEventBanditCollect
	| EmitterEventBanditMeter
	| EmitterEventScatterBurst
	| EmitterEventMascot
	| EmitterEventBowlingBallRoll
	| EmitterEventBowlingScoreboards;

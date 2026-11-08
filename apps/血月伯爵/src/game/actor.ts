import {stateBet} from 'state-shared';
import {createIntermediateMachines,createGameActor} from 'utils-xstate';
import {createPrimaryMachines} from './primaryMachines';
import {playBet,resumable,settleBloodMoon,resetBloodMoon,stateBloodMoon} from './bloodmoon.svelte';
import type {Bet} from './bloodmoonTypes';
import {eventEmitter} from './eventEmitter';
const primary=createPrimaryMachines<Bet>({onResumeGameActive:resumable,onResumeGameInactive:bet=>settleBloodMoon(bet.state),onNewGameStart:async()=>{stateBet.winBookEventAmount=0;resetBloodMoon();eventEmitter.broadcast({type:'stopButtonEnable'});},onNewGameError:()=>{stateBloodMoon.phase='idle';},onPlayGame:async bet=>{await playBet(bet);eventEmitter.broadcast({type:'stopButtonEnable'});},checkIsBonusGame:bet=>bet.state.some(e=>e.type==='freeStart')});
export const gameActor=createGameActor(createIntermediateMachines(primary));

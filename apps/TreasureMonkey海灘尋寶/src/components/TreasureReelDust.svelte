<script lang="ts">
 import { stateBet } from 'state-shared';
 import { getContext } from '../game/context';
 import { BOARD_SIZES, BOARD_DIMENSIONS } from '../game/constants';
 import { getSymbolX } from '../game/utils';
 import BoardContainer from './BoardContainer.svelte';
 import ReelSand from './ReelSand.svelte';
 const context = getContext();
 const centers = Array.from({length: BOARD_DIMENSIONS.x}, (_, reel) => getSymbolX(reel));
 const spinning = $derived(context.stateGame.board.map(reel => reel.reelState.motion === 'spinning'));
</script>

<BoardContainer><ReelSand {spinning} {centers} floor={BOARD_SIZES.height - 3} turbo={stateBet.isTurbo} /></BoardContainer>

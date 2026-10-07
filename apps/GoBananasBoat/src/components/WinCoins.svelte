<script lang="ts">
	import { Container } from 'pixi-svelte';
	import BananaFountain from './BananaFountain.svelte';
	import { MainContainer } from 'components-layout';
	import { LEVEL_PARTICLE_BANANA_MAP } from '../game/particleBananaMap';

	import { getContext } from '../game/context';
	import type { WinLevelAlias } from '../game/winLevelMap';

	type Props = {
		emit?: boolean;
		levelAlias?: WinLevelAlias;
	};

	const props: Props = $props();
	const context = getContext();
	const extraConfig = $derived(
		props?.levelAlias ? LEVEL_PARTICLE_BANANA_MAP[props.levelAlias] : null,
	);
	// the tier's rate, speed and spread; the fountain itself (gravity, life,
	// cap, the tumble) is BananaFountain's — a mesh per banana, not the shared
	// particle emitter (2026-10-03)
</script>

{#if extraConfig}
	<MainContainer>
		<Container
			x={context.stateGameDerived.boardLayout().x}
			y={context.stateGameDerived.boardLayout().y}
		>
			<Container>
				<BananaFountain emit={!!props.emit} tier={extraConfig} />
			</Container>
		</Container>
	</MainContainer>
{/if}

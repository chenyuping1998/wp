<script lang="ts">
	import { Container, ParticleEmitter } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { fountain as baseConfig } from 'constants-shared/particleConfig';
	import { LEVEL_PARTICLE_COIN_MAP } from 'constants-shared/particleCoin';

	import { getContext } from '../game/context';
	import type { WinLevelAlias } from '../game/winLevelMap';

	type Props = {
		emit?: boolean;
		levelAlias?: WinLevelAlias;
	};

	const props: Props = $props();
	const context = getContext();
	const extraConfig = $derived(
		props?.levelAlias ? LEVEL_PARTICLE_COIN_MAP[props.levelAlias] : null,
	);
	const config = $derived({ ...baseConfig, ...extraConfig });
</script>

{#if config}
	<MainContainer>
		<!-- Two-depth coin rain. Scaling the container rather than the particle
		     config shrinks size AND screen velocity together, so the far layer
		     falls slower as well as smaller and reads as genuinely distant — a
		     single flat emitter reads as one sheet of coins at one distance. -->
		<Container
			x={context.stateGameDerived.boardLayout().x}
			y={context.stateGameDerived.boardLayout().y}
		>
			<Container scale={0.58} alpha={0.7}>
				<ParticleEmitter {config} key="coins" emit={props.emit} />
			</Container>
			<Container scale={1.3}>
				<ParticleEmitter {config} key="coins" emit={props.emit} />
			</Container>
		</Container>
	</MainContainer>
{/if}

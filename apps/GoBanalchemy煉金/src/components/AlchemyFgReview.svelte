<script lang="ts">
	import type { Application, Texture } from 'pixi.js';
	import { Container, Sprite, createApp, setContextApp, createContextParent } from 'pixi-svelte';
	import AlchemyFreeSpinPlaque from './AlchemyFreeSpinPlaque.svelte';
	import GoldText from './GoldText.svelte';
	const props: { app: Application; texture: Texture } = $props();
	const context = createApp({ assets: {} });
	context.stateApp.loadedAssets.gbFgPlaque = props.texture;
	context.stateApp.pixiApplication = props.app;
	setContextApp(context);
	createContextParent(props.app.stage);
</script>

<!-- Uses the actual shipped Sprite/GoldText/counter component, without a bet or RGS session. -->
<Container x={16} y={65}>
	<Sprite key="gbFgPlaque" width={680} height={513} />
	<GoldText
		x={340}
		y={256.5 - 0.26 * 385}
		text="FREE SPINS"
		fontSize={69}
		maxWidth={530}
		letterSpacing={6}
	/>
	<GoldText x={340} y={256.5 + 0.08 * 385} text="8" fontSize={128} />
	<GoldText
		x={340}
		y={256.5 + 0.32 * 385}
		text="SPINS AWARDED"
		fontSize={24}
		maxWidth={510}
		letterSpacing={4}
	/>
</Container>
<Container x={735} y={65}>
	<AlchemyFreeSpinPlaque
		width={300}
		height={226}
		title="FREE SPINS"
		count="7 / 8"
		progress={3}
		progressMax={5}
	/>
</Container>
<Container x={735} y={355}>
	<AlchemyFreeSpinPlaque
		width={300}
		height={226}
		title="RESPINS"
		count={3}
		progress={3}
		progressMax={3}
	/>
</Container>

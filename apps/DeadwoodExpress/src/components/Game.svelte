<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { onMount } from 'svelte';

	import { BlurFilter, Texture } from 'pixi.js';
	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, BaseSprite, Container, Graphics, Sprite, Text, REM } from 'pixi-svelte';
	import { stateModal, stateReplay } from 'state-shared';

	import { UI, UiGameName } from 'components-ui-pixi';
	import { GameVersion } from 'components-ui-html';
	import Modals from './ui/Modals.svelte';
	import ReplayIntro from './ui/ReplayIntro.svelte';

	import { getContext } from '../game/context';
	// side-effect import: paints the shared bet bar in the jungle palette
	import '../game/uiTheme';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import Cast from './Cast.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import Board from './Board.svelte';
	import ReelDust from './ReelDust.svelte';
	import EntryReveal from './EntryReveal.svelte';
	import ScatterBurst from './ScatterBurst.svelte';
	import MultiplierWheel from './MultiplierWheel.svelte';
	import Anticipations from './Anticipations.svelte';
	import WinLines from './WinLines.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';

	const context = getContext();

	// Radial mist: clear in the middle, the scene's fog colour toward the edges.
	// Drawn once into a canvas; stretched to the stage, so it is elliptical.
	const edgeMist = (() => {
		const size = 256;
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = size;
		const ctx = canvas.getContext('2d')!;
		const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.72);
		g.addColorStop(0, 'rgba(190,220,210,0)');
		g.addColorStop(0.55, 'rgba(190,220,210,0.35)');
		g.addColorStop(1, 'rgba(205,228,220,1)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, size, size);
		return Texture.from(canvas);
	})();

	// soft depth-of-field on the jungle scene so the reels read as the subject
	const backgroundBlur = [new BlurFilter({ strength: 0.6, quality: 3 })];

	onMount(() => (context.stateLayout.showLoadingScreen = true));

	// The corner logo must never sit on the reels. Stake review, 2026-10-04: "The
	// Title of the game is obscuring the symbols on the board in Popup S." The
	// logo is a fixed REM size while the board scales with the window, so in a
	// small popout it reached over the housing's top-right corner. It is now
	// sized to the room actually left beside or above the housing, and dropped
	// when that room is too small to read it.
	const LOGO_W = REM * 11;
	const LOGO_H = REM * 5.5;
	const LOGO_INSET = 20; // LayoutBottomBar places the logo 20 in from the right
	const HOUSING_PAD = 24.5; // BoardFrame: outer roundRect 22 + half its 5px stroke
	const logoScale = $derived.by(() => {
		const canvas = context.stateLayoutDerived.canvasSizes();
		const main = context.stateLayoutDerived.mainLayout();
		const board = context.stateGameDerived.boardLayout();
		const halfW = (board.width * board.scale) / 2 + HOUSING_PAD;
		const halfH = (board.height * board.scale) / 2 + HOUSING_PAD;
		const right = main.x + (board.x + halfW - main.width * main.anchor) * main.scale;
		const top = main.y + (board.y - halfH - main.height * main.anchor) * main.scale;
		const gap = 6;
		// Fits if it is entirely right of the housing, or entirely above it.
		const besideW = canvas.width - LOGO_INSET - right - gap;
		const above = top - gap;
		const s = Math.min(1, Math.max(besideW / LOGO_W, above / LOGO_H));
		return s < 0.4 ? 0 : s;
	});

	context.eventEmitter.subscribeOnMount({
		buyBonusConfirm: () => {
			stateModal.modal = { name: 'buyBonusConfirm' };
		},
	});
</script>

<App>
	<EnableSound />
	<EnableHotkey />
	<EnableGameActor />
	<EnablePixiExtension />

	<Container filters={backgroundBlur}>
		<Background />
	</Container>
	<!--
		Edge mist, not a dark vignette. Stake review, 2026-10-04: "the borders are
		currently too dark and may blend into the background of the Stake website.
		The game should remain clearly distinguishable from the surrounding site
		background." The corner vignette (α 0.9 near-black) did exactly that, so the
		edges are now lifted toward the scene's own fog instead, with a faint lit
		rim tracing the canvas edge.
	-->
	<BaseSprite
		texture={edgeMist}
		width={context.stateLayoutDerived.canvasSizes().width}
		height={context.stateLayoutDerived.canvasSizes().height}
		alpha={context.stateLayoutDerived.layoutType() === 'portrait' ? 0.28 : 0.42}
		blendMode="screen"
	/>
	<Graphics
		draw={(g) => {
			const { width, height } = context.stateLayoutDerived.canvasSizes();
			g.clear();
			g.rect(1.5, 1.5, width - 3, height - 3);
			g.stroke({ width: 3, color: 0x9fd3c2, alpha: 0.55 });
		}}
	/>

	{#if context.stateLayout.showLoadingScreen}
		<LoadingScreen onloaded={() => (context.stateLayout.showLoadingScreen = false)} />
	{:else}
		<ResumeBet />
		<!--
			The reason why <Sound /> is rendered after clicking the loading screen:
			"Autoplay with sound is allowed if: The user has interacted with the domain (click, tap, etc.)."
			Ref: https://developer.chrome.com/blog/autoplay
		-->
		<Sound />

		<!-- Someone standing at the right edge; behind the board's housing so the
		     reels always win any overlap. See Cast.svelte. -->
		<Cast />

		<MainContainer>
			<BoardFrame />
		</MainContainer>

		<MainContainer>
			<Board />
			<ReelDust />
			<Anticipations />
			<ScatterBurst />
			<WinLines />
		</MainContainer>

		<EntryReveal />

		<UI>
			{#snippet gameName()}
				<!-- The name text ends at x≈322 and the logo starts 196 in from the
				     right, so below ~560 wide they overlap (375 wide: 90–322 against
				     179–355). The logo already spells the name; drop the text there. -->
				<UiGameName
					name={context.stateLayoutDerived.canvasSizes().width < 560 ? '' : 'DEADWOOD EXPRESS'}
				/>
			{/snippet}
			{#snippet logo()}
				{#if logoScale > 0}
					<Sprite
						key="hmLogo"
						anchor={{ x: 1, y: 0 }}
						width={LOGO_W * logoScale}
						height={LOGO_H * logoScale}
					/>
				{/if}
				<!-- <Text
					anchor={{ x: 1, y: 0 }}
					text="DEADWOOD EXPRESS"
					style={{
						fontFamily: GAME_FONT,
						fontSize: REM * 1.5,
						fontWeight: GAME_FONT_WEIGHT,
						lineHeight: REM * 2,
						fill: 0xffffff,
					}}
				/> -->
			{/snippet}
		</UI>
		<Win />
		<FreeSpinIntro />
		<FreeSpinCounter />
		<FreeSpinOutro />
		<Transition />
	{/if}
</App>

<!-- DOM, so it lives outside <App> — the pixi tree cannot host HTML. -->
{#if stateReplay.waiting}
	<ReplayIntro
		onstart={() => {
			stateReplay.waiting = false;
			stateReplay.startRequested = true;
		}}
	/>
{/if}

<MultiplierWheel />

<Modals>
	{#snippet version()}
		<GameVersion version="0.0.0" />
	{/snippet}
</Modals>

<script lang="ts">
  import { getContext } from "../game/context";
  import { portraitBand, portraitCast } from "../game/cornerLogo";
  import { CAST_NATIVE } from "../game/castNative";
  import CastAlchemy from "./CastAlchemy.svelte";
  import { LADDER_GAP, LADDER_W } from "../game/hudLayout";
  import { stateGame } from "../game/stateGame.svelte";

  // Main game and feature entry share the same Spine art and motion.
  // Placement is measured in the bet strip's standard coordinate system.
  const context = getContext();

  const layout = $derived(context.stateGameDerived.boardLayout());
  const box = $derived(context.stateLayoutDerived.mainLayout());
  const std = $derived(context.stateLayoutDerived.mainLayoutStandard());
  const toStandard = (xInGameBox: number) =>
    std.width * 0.5 + ((xInGameBox - box.width * 0.5) * box.scale) / std.scale;

  const who = "guy" as const;
  const castWho = $derived(stateGame.gameType === "freegame" ? ("homunculus" as const) : ("alchemist" as const));

  // BoardFrame.svelte: the housing's ink edge is 1.12x the reels (nine-sliced
  // frames/board.png, 2026-11-10); FRAME_SCALE x FRAME_INK is that edge.
  const FRAME_SCALE = 1.12;
  const FRAME_INK = 1;
  const boardInkRight = $derived(
    toStandard(
      layout.x + layout.width * layout.scale * FRAME_SCALE * 0.5 * FRAME_INK,
    ),
  );
  const boardInkLeft = $derived(
    toStandard(
      layout.x - layout.width * layout.scale * FRAME_SCALE * 0.5 * FRAME_INK,
    ),
  );

  // In the free games the multiplier ladder stands between the housing and the
  // figure (LadderHud: 24 px off the reel area, rungs 106 wide, main-box units).
  const ladderRight = $derived(toStandard(layout.x + (layout.width * layout.scale) / 2 + LADDER_GAP + LADDER_W));
  const castEdge = $derived(stateGame.gameType === "freegame" ? Math.max(boardInkRight, ladderRight) : boardInkRight);
  const OVERLAP = 10;
  const BLEED = 1.12; // how far past the box edge the figure runs
  const width = $derived((std.width - (boardInkRight - OVERLAP)) * BLEED);
  const height = $derived((width * CAST_NATIVE[who].h) / CAST_NATIVE[who].w);
  const topY = $derived(std.height * 0.11);
  const x = $derived(boardInkRight - OVERLAP + width * 0.5);


  const bandFraction = $derived((std.width - boardInkRight) / std.width);
  const hasSideBand = $derived(bandFraction >= 0.15);

  const portrait = $derived(
    hasSideBand ? null : (() => {
      const band = portraitBand(context);
      return band ? portraitCast(context, band) : null;
    })(),
  );
</script>

<!-- One figure, on the board's right, facing it: the alchemist in the main
     game, the homunculus in the free games (house rule: two different cast). -->
{#key castWho}
  {#if !stateGame.featureSplashShow && hasSideBand}
    <CastAlchemy who={castWho} {topY} {height} innerEdge={castEdge} />
  {:else if !stateGame.featureSplashShow && portrait}
    <CastAlchemy who={castWho} topY={portrait.topY} height={portrait.height} innerEdge={portrait.innerEdge} />
  {/if}
{/key}

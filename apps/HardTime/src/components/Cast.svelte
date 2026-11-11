<script lang="ts">
  import { getContext } from "../game/context";
  import { portraitBand, portraitCast } from "../game/cornerLogo";
  import { CAST_NATIVE } from "./CastFigure.svelte";
  import CastSpine from "./CastSpine.svelte";
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

  const FRAME_SCALE = 1280 / 1110;
  const FRAME_INK = 0.938;
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

{#if !stateGame.featureSplashShow && hasSideBand}
  <CastSpine who="prisoner" side="right" {x} {topY} {height} innerEdge={boardInkRight} />
  <CastSpine who="warden" side="left" x={boardInkLeft + OVERLAP - width * 0.5} {topY} {height} innerEdge={boardInkLeft} />
{:else if !stateGame.featureSplashShow && portrait}
  <CastSpine who="prisoner" side="right" x={portrait.x} topY={portrait.topY} height={portrait.height} innerEdge={portrait.innerEdge} />
{/if}

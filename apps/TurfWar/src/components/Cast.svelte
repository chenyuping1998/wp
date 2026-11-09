<script lang="ts">
  import { MainContainer } from "components-layout";

  import { getContext } from "../game/context";
  import { portraitBand, portraitCast } from "../game/cornerLogo";
  import CastFigure, { CAST_NATIVE } from "./CastFigure.svelte";
  import CastFigureMesh from "./CastFigureMesh.svelte";

  // The live cast uses independent aligned layer meshes and one skeleton. The flat
  // CastFigure branch remains only as a fallback for the old art.
  const USE_MESH_CAST = true;
  import { stateGame } from "../game/stateGame.svelte";

  /** Main-game masked enforcer swaps to the distinct Kingpin in free games. */
  const context = getContext();

  // The SAME container the board's housing is drawn in (BoardFrame uses
  // `<MainContainer>` and `stateGameDerived.boardLayout()`), not the standard
  // box. That is the whole reason the first version sat too far out: it was
  // positioned as a fraction of a box the board is not measured in, so "near the
  // board" was a guess that happened to be 147px wrong. Here the figure's inner
  // edge is derived FROM the board's own edge, so it cannot drift.
  const layout = $derived(context.stateGameDerived.boardLayout());
  const box = $derived(context.stateLayoutDerived.mainLayout());
  // The bet strip is drawn in the STANDARD box, the board in the game box, and
  // on a wide canvas those two are not the same rectangle — the standard box is
  // letterboxed narrower. Put the figure in the strip's box so its feet align.
  //
  // The figure is placed in the STRIP'S box, and the board's edge is converted into
  // it. Both boxes are centred on the same canvas, so one offset from the centre
  // in canvas pixels converts by the ratio of their scales.
  const std = $derived(context.stateLayoutDerived.mainLayoutStandard());
  const toStandard = (xInGameBox: number) =>
    std.width * 0.5 + ((xInGameBox - box.width * 0.5) * box.scale) / std.scale;

  // The mesh component selects the appropriate MG/FG character rig.
  const who = $derived<"guy">("guy");

  // mirrors BoardFrame's own constant
  const FRAME_SCALE = 1280 / 1110;
  // frame_edge.png's alpha bbox fills 0.938 of its square, so the housing BOX is
  // wider than the housing INK. The figure is placed against what the player can
  // see, not against a transparent margin.
  const FRAME_INK = 0.938;
  const boardInkRight = $derived(
    toStandard(
      layout.x + layout.width * layout.scale * FRAME_SCALE * 0.5 * FRAME_INK,
    ),
  );

  // Fit the figure into the band between the board and the right screen edge.
  // CastFigureMesh clamps its swept ink to both edges across idle and reaction.
  const OVERLAP = 10;
  const BLEED = 1.12; // natural size before the layer envelope fit
  const width = $derived((std.width - (boardInkRight - OVERLAP)) * BLEED);
  const height = $derived((width * CAST_NATIVE[who].h) / CAST_NATIVE[who].w);
  // The layered figure is visible down to its shoes. Place those just behind
  // the bet strip so the character has a ground line rather than floating.
  const topY = $derived(std.height * 0.145);
  // Preserve the feature's preferred rightward position; the layer renderer
  // still clamps the entire motion envelope inside the visible side band.
  const FEATURE_GUTTER = 60;
  const x = $derived(
    boardInkRight - OVERLAP + width * 0.5 +
      (stateGame.gameType === "freegame" ? FEATURE_GUTTER : 0),
  );
  // Keep the complete new figure above the control strip, shoes included.
  const groundY = $derived(std.height * 0.84);

  // Grading them into the night street. See CastFigure's `grade` note for why
  // this is a value problem before it is a colour one. The tint is a violet-grey
  // multiply — the scene's own shadow colour, not neutral grey, which would just
  // make them dull; the pool is the magenta the background's neon actually is.
  const GRADE = { tint: 0xb9aa91, pool: 0xf5893d, poolAlpha: 0.08 };

  // ── when there is no band, there is no figure ─────────────────────────────
  //
  // Everything above sizes the figure to FILL the band between the board's ink
  // and the screen edge. That premise holds in landscape, where the band is
  // ~21% of the width (the reference's own is 23.5%). In portrait it does not:
  // the board takes almost the whole width, the band collapses to ~8%, and the
  // arithmetic still runs — so the Don was drawn at about 35 CSS px wide,
  // floating in the empty space above the board like a stray sprite.
  //
  // 0.15 sits between the two measured cases with room on both sides. Below it
  // the figure is not shrunk, it is not drawn: the reason for standing someone
  // there is to fill a side band, and when there is no side band there is
  // nothing for them to do.
  const bandFraction = $derived((std.width - boardInkRight) / std.width);
  const hasSideBand = $derived(bandFraction >= 0.15);

  // ── portrait: upper body above the board (2026-10-13, P1-F) ──────────────
  //
  // No side band does not mean no room: portrait has the strip above the
  // housing, and leaving it empty dropped the cast from every phone held
  // upright. The figure stands in the strip's right half with its body running
  // down BEHIND the housing (the mesh view sits at stage depth 2, under the
  // board), so only head and shoulders to the hips show and the reels win any
  // overlap. The logo takes the left half (Game.svelte). Same facing as beside
  // the board.
  const portrait = $derived(
    hasSideBand ? null : (() => {
      const band = portraitBand(context);
      return band ? portraitCast(context, band) : null;
    })(),
  );
</script>

{#if !stateGame.featureSplashShow && hasSideBand}
  <MainContainer standard>
    {#if USE_MESH_CAST}
      {#key who}
        <CastFigureMesh {who} {x} {topY} {height} {groundY} innerEdge={boardInkRight} fitToGround />
      {/key}
    {:else}
      <CastFigure
        {who}
        {x}
        {topY}
        {height}
        {groundY}
        flip={who === "guy"}
        grade={GRADE}
      />
    {/if}
  </MainContainer>
{:else if !stateGame.featureSplashShow && portrait && USE_MESH_CAST}
  <MainContainer standard>
    {#key who}
      <!-- 2026-11-05: the housing cuts him at the waist (MG jacket hem at 0.47
           of the ink, Kingpin's belt at 0.42), not across the trousers where
           the width-limited scale left it, which read as legs chopped off. -->
      <CastFigureMesh {who} x={portrait.x} topY={portrait.topY} height={portrait.height} groundY={portrait.groundY} innerEdge={portrait.innerEdge}
        cut={{ y: portrait.groundY, fraction: stateGame.gameType === 'freegame' ? 0.42 : 0.47, minTop: portrait.topY - 30 }} />
    {/key}
  </MainContainer>
{/if}

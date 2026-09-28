<script lang="ts">
  import { MainContainer } from "components-layout";

  import { getContext } from "../game/context";
  import { CAST_NATIVE } from "../game/castLayout";
  import CastFigureLayered from "./CastFigureLayered.svelte";

  import { stateGame } from "../game/stateGame.svelte";

  /**
   * Someone standing beside the board.
   *
   * The reference this game keeps being measured against (Hacksaw's Miami
   * Mayhem) puts a full-body character at the edge of the screen in the base
   * game and a different one in the feature, and it does two things at once:
   * it tells the player which mode they are in without a caption, and it FILLS
   * THE SIDE OF THE SCREEN. That second one is not decoration here — this board
   * is 5x4 inside a 1.78 box, so it is height-bound and can never fill the
   * width, and no amount of scaling the board changes that. Content beside the
   * reels is the only thing that ever could.
   *
   * ── Which side ───────────────────────────────────────────────────────────
   *
   * The right. The left already carries Buy Bonus, drawn at railWidth/2 and
   * about 200 units across, and a figure there would have the CTA sitting on
   * its chest. The right side has nothing on it at all — turbo and autospin
   * live in the strip — so that is where the empty space actually is.
   *
   * ── Which figure ─────────────────────────────────────────────────────────
   *
   * The guy in the base game, the woman in the feature. Same pair the intro card
   * introduces, so a player has already met whoever is standing there — and they
   * are NOT the two portrait symbols: the store tile's cast is a different guy
   * and a dark-haired woman, which is what makes swapping them worth doing.
   * Standing the H1 art beside a board with H1 on it would read as a bug.
   *
   * ── The motion ───────────────────────────────────────────────────────────
   *
   * game/idleSway.ts, CAST_SWAY. These are single flat cut-outs today, so they
   * sway as a body only and deliberately stay near a degree — see the note
   * there for why a flat figure has to move LESS than a rigged one, not more.
   */
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
  // letterboxed narrower. That is why a figure placed in the game box ran past
  // the end of the strip and stood in front of its controls
  // (「人物擋到下 bar 了」): the strip simply was not there to cover her.
  //
  // So she is placed in the STRIP'S box, and the board's edge is converted into
  // it. Both boxes are centred on the same canvas, so one offset from the centre
  // in canvas pixels converts by the ratio of their scales.
  const std = $derived(context.stateLayoutDerived.mainLayoutStandard());
  const toStandard = (xInGameBox: number) =>
    std.width * 0.5 + ((xInGameBox - box.width * 0.5) * box.scale) / std.scale;

  // Two figures, one per mode (the 2026-09-28 rule for every game): the Don in
  // the base game, the nightclub hostess in the feature. Two different people,
  // not the Don relit — his old guy_feature / guy_don grades are retired. The
  // swap happens while the feature splash is up (this whole component is
  // hidden then, see the {#if} below), so the player never sees one figure
  // turn into the other.
  const who = $derived<"don" | "hostess">(
    stateGame.gameType === "freegame" ? "hostess" : "don",
  );

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

  // ── size and place, from the reference's own proportions ───────────────────
  //
  // Measured off the two Miami Mayhem screenshots the user supplied:
  //
  //   the band between the board's edge and the screen edge is 23.5% of width
  //   the figure FILLS that band and is cropped by the screen edge
  //   the figure's inner edge TOUCHES the board — there is no gap at all
  //   its head starts about 13% down and its legs run off the bottom
  //
  // Filling the band means the figure has to be CROPPED, because our cut-outs
  // are 1:3.1 and the band is not that tall. That is not a compromise either:
  // the reference crops both of its characters at the thigh, and the bet strip
  // covers everything below its own top edge anyway, so the crop happens where
  // nothing is visible.
  const OVERLAP = 10;
  const BLEED = 1.12; // how far past the box edge the figure runs
  const width = $derived((std.width - (boardInkRight - OVERLAP)) * BLEED);
  // Both figures are DRAWN facing screen-right, and they stand right of the
  // board, so both are mirrored to face the reels (the user's standing rule:
  // a figure beside the board faces the board). Checked on screen, not from the
  // source art — reading the source crop is how this shipped facing away once.
  const MIRROR_TO_FACE_BOARD = true;

  // Both figures stand in the old Don's box; CastFigureLayered scales each one's
  // own ink height into it, so the pair shares a feet line and head height.
  const height = $derived((width * CAST_NATIVE.guy.h) / CAST_NATIVE.guy.w);
  // 0.11, not 0. In the reference the character's head sits BELOW the top of the
  // board, not level with it: the board stays the tallest thing on screen and
  // the figure reads as standing behind it rather than looming over it.
  const topY = $derived(std.height * 0.11);
  // Her raygun extends toward the board. Give the feature pose a small extra
  // gutter so the muzzle and spark stay readable instead of sitting under the
  // reel housing edge; the base-game man keeps the measured position.
  const x = $derived(boardInkRight - OVERLAP + width * 0.5);
  // A person sways about the ground under them. The feet are off-screen at this
  // size, so the pivot is the bottom of the box instead — the nearest thing to a
  // ground line that is actually on screen. Pivoting at the real feet, hundreds
  // of pixels below the canvas, would swing the head twice as far for the same
  // angle.
  const groundY = $derived(std.height);


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
</script>

{#if !stateGame.featureSplashShow && hasSideBand}
  <MainContainer standard>
    {#key who}
      <CastFigureLayered figure={who} {x} {topY} {height} {groundY} flip={MIRROR_TO_FACE_BOARD} innerEdge={boardInkRight} />
    {/key}
  </MainContainer>
{/if}

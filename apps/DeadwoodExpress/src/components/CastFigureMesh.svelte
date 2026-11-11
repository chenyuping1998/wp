<script lang="ts">
  import type { Texture } from "pixi.js";
  import { getContextApp, getContextParent } from "pixi-svelte";
  import { onMount } from "svelte";
  import { getContext } from "../game/context";
  import { SkinnedFigure, type MeshRig } from "../game/skinnedFigure";
  import { MOTION_SCALE } from "../game/castMotion";
  import { stateGame } from "../game/stateGame.svelte";

  type Props = {
    who: "guy" | "girl";
    x: number;
    topY: number;
    height: number;
    groundY: number;
    alpha?: number;
    flip?: boolean;
    /**
     * Draw inside the enclosing pixi container instead of near the bottom of the
     * stage. The board's own cast stands BEHIND the housing (stage index 2); the
     * free-game splash needs its figure IN FRONT of the splash's scrim, fading
     * with it. Placement is computed in canvas px either way, so the enclosing
     * container must not be transformed.
     */
    inline?: boolean;
  };

  const props: Props = $props();
  const app = getContextApp();
  const parentContext = props.inline ? getContextParent() : null;
  const context = getContext();
  const std = $derived(context.stateLayoutDerived.mainLayoutStandard());
  // guy = the conductor (base game), girl = the veiled passenger (free spins).
  const FIGURE = {
    guy: { key: "hmCastGuyMesh", rig: "./assets/deadwood/conductor.rig.json" },
    girl: { key: "hmCastGirlMesh", rig: "./assets/deadwood/passenger.rig.json" },
  } as const;
  const texture = $derived(
    app.stateApp.loadedAssets[FIGURE[props.who].key] as Texture,
  );
  const rigUrl = FIGURE[props.who].rig;
  let figure = $state<SkinnedFigure | null>(null);
  let seenReactionSeq = stateGame.castReaction.seq;

  onMount(() => {
    let disposed = false;
    let mountedFigure: SkinnedFigure | null = null;
    let update: (() => void) | null = null;

    void fetch(rigUrl)
      .then((response) => {
        if (!response.ok)
          throw new Error(`Unable to load mesh rig: ${response.status}`);
        return response.json() as Promise<MeshRig>;
      })
      .then((rig) => {
        if (disposed) return;
        const pixiApplication = app.stateApp.pixiApplication;
        if (!pixiApplication)
          throw new Error("Pixi application is unavailable for cast mesh");
        mountedFigure = new SkinnedFigure(rig, texture, MOTION_SCALE[props.who]);
        figure = mountedFigure;
        update = () => mountedFigure?.update(performance.now());
        if (parentContext) parentContext.parent.addChild(mountedFigure.view);
        else
          pixiApplication.stage.addChildAt(
            mountedFigure.view,
            Math.min(2, pixiApplication.stage.children.length),
          );
        pixiApplication.ticker.add(update);
        mountedFigure.update(performance.now());
      });

    return () => {
      disposed = true;
      const pixiApplication = app.stateApp.pixiApplication;
      if (update && pixiApplication) pixiApplication.ticker.remove(update);
      if (mountedFigure) {
        mountedFigure.view.removeFromParent();
        mountedFigure.view.destroy({ children: true });
      }
      figure = null;
    };
  });

  $effect(() => {
    if (!figure || stateGame.castReaction.seq === seenReactionSeq) return;
    seenReactionSeq = stateGame.castReaction.seq;
    if (stateGame.castReaction.kind !== "idle")
      figure.react(stateGame.castReaction.kind);
  });

  // Daylight between the figure and the reel housing / the screen edge, in
  // canvas px per standard-box unit (same values as Hard Time). MOTION_PAD
  // widens the figure box by the sway and reaction travel, as a share of its
  // width, so a reaction cannot carry a sleeve onto the frame either.
  const BOARD_GAP = 14;
  const SCREEN_GAP = 12;
  const MOTION_PAD = 0.06;
  const HOUSING_PAD = 24.5; // BoardFrame: outer roundRect 22 + half its 5px stroke

  $effect(() => {
    if (!figure) return;
    const [x0, y0, x1, y1] = figure.figureBox;
    const contentHeight = y1 - y0;
    const contentCenterX = (x0 + x1) * 0.5;
    const direction = props.flip ? -1 : 1;
    const anchorX = typeof std.anchor === "number" ? std.anchor : std.anchor.x;
    const anchorY = typeof std.anchor === "number" ? std.anchor : std.anchor.y;

    // The housing's right edge, in canvas px. The board lives in the game's
    // main layout box, not the standard one this figure is placed in.
    const main = context.stateLayoutDerived.mainLayout();
    const mainAnchor = typeof main.anchor === "number" ? main.anchor : main.anchor.x;
    const board = context.stateGameDerived.boardLayout();
    const housingRight =
      main.x + (board.x + (board.width * board.scale) / 2 + HOUSING_PAD - main.width * mainAnchor) * main.scale;

    // Fit the padded figure between the housing and the screen edge. When the
    // band is narrower than the figure at its natural size, it shrinks — it
    // never slides onto the board to make room.
    const pad = (x1 - x0) * MOTION_PAD;
    const leftLimit = housingRight + BOARD_GAP * std.scale;
    const rightLimit = context.stateLayoutDerived.canvasSizes().width - SCREEN_GAP * std.scale;
    const natural = (props.height / contentHeight) * std.scale * 0.82;
    // Up to OFFSCREEN of the padded figure may run past the right screen edge
    // (a coat tail cropped by the frame edge reads as staging) before the figure
    // is shrunk instead; shrinking alone took him to ~0.7 at 16:9.
    const OFFSCREEN = 0.2;
    const allowance = OFFSCREEN * (x1 - x0 + 2 * pad) * natural;
    const drawScale = Math.min(
      natural,
      (rightLimit + allowance - leftLimit) / (x1 - x0 + 2 * pad),
    );

    figure.view.scale.set(direction * drawScale, drawScale);
    const wanted =
      std.x +
      (props.x - 45 - std.width * anchorX) * std.scale +
      direction * -contentCenterX * drawScale;
    const inkLo = Math.min(direction * (x0 - pad), direction * (x1 + pad)) * drawScale;
    const inkHi = Math.max(direction * (x0 - pad), direction * (x1 + pad)) * drawScale;
    figure.view.x = Math.max(leftLimit - inkLo, Math.min(wanted, rightLimit + allowance - inkHi));
    // Feet stay where they stand at natural size: when the clamp shrinks the
    // figure it shrinks toward the ground, not toward the top of his cap.
    const groundCanvas =
      std.y + (props.topY - std.height * anchorY) * std.scale + contentHeight * natural;
    figure.view.y = groundCanvas - y1 * drawScale;
    figure.view.alpha = props.alpha ?? 1;
  });
</script>

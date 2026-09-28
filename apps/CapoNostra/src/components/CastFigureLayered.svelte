<script lang="ts" module>
  import type { LayeredRig } from "../game/layeredFigure";

  /** One fetch per rig file for the life of the page (see CastFigureMesh.svelte:
   *  this mounts beside the board, on the feature card, and remounts often). */
  const rigCache = new Map<string, Promise<LayeredRig>>();
  const loadRig = (url: string) => {
    const cached = rigCache.get(url);
    if (cached) return cached;
    const request = fetch(url)
      .then((response) => {
        if (!response.ok)
          throw new Error(`Unable to load cast rig: ${response.status}`);
        return response.json() as Promise<LayeredRig>;
      })
      .catch((error) => {
        rigCache.delete(url);
        throw error;
      });
    rigCache.set(url, request);
    return request;
  };
</script>

<script lang="ts">
  import type { Texture } from "pixi.js";
  import { getContextApp } from "pixi-svelte";
  import { onMount } from "svelte";
  import { stateBetDerived } from "state-shared";
  import { getContext } from "../game/context";
  import { LayeredFigure } from "../game/layeredFigure";
  import {
    LAYERED_TIERS,
    LAYERED_X_ENVELOPE,
    type CastFigureId,
  } from "../game/layeredCastMotion";
  import { stateGame } from "../game/stateGame.svelte";
  import { featureTimeScale } from "../game/timeScale";

  type Props = {
    /** don = MG, hostess = FG. Two different people, never one relit. */
    figure: CastFigureId;
    x: number;
    topY: number;
    height: number;
    groundY: number;
    alpha?: number;
    flip?: boolean;
    /** board ink's outer edge in the caller's container space; the figure's
     *  swept ink never crosses it */
    innerEdge?: number;
    /** Keep the swept ink inside the screen's right edge (beside the board).
     *  The feature card turns this off: it bleeds the figure off the edge on
     *  purpose, and clamping pulls her in behind the card. */
    clampScreen?: boolean;
    /** Draw above everything on the stage. The feature card needs it: the view
     *  is attached to the stage directly, and at the default depth (2) it sits
     *  under the card's scrim, whatever the markup order says. */
    onTop?: boolean;
    /** Which layout box x / topY / height are in: the STANDARD box (Cast.svelte,
     *  `<MainContainer standard>`) or the main game box (the feature card's
     *  plain `<MainContainer>`). The two differ on wide canvases. */
    box?: "standard" | "main";
  };

  const props: Props = $props();
  const app = getContextApp();
  const context = getContext();
  const std = $derived(
    props.box === "main"
      ? context.stateLayoutDerived.mainLayout()
      : context.stateLayoutDerived.mainLayoutStandard(),
  );

  const rigUrls: Record<CastFigureId, string> = {
    don: new URL("../../assets/castLayers/don/layers.json", import.meta.url).href,
    hostess: new URL("../../assets/castLayers/hostess/layers.json", import.meta.url).href,
  };

  /**
   * The hostess's grade follows the feature tier (game/featureTiers.ts):
   * soldier = her base drawing, capo = warmer light, don = gold rim light.
   * Same geometry and alpha, so it is a live texture swap, not a remount —
   * a remount would drop a running reaction. `bonusTier` outlives the feature,
   * but the hostess only stands during it, so no gameType check is needed.
   */
  const variant = $derived(
    props.figure === "hostess" && stateGame.bonusTier && stateGame.bonusTier !== "soldier"
      ? stateGame.bonusTier
      : "",
  );
  const texturesFor = (rig: LayeredRig, v: string) => {
    const prefix =
      "capoCast" +
      props.figure[0].toUpperCase() +
      props.figure.slice(1) +
      (v ? v[0].toUpperCase() + v.slice(1) : "");
    return Object.fromEntries(
      rig.layers.map((layer) => [
        layer.name,
        app.stateApp.loadedAssets[`${prefix}_${layer.name}`] as Texture,
      ]),
    );
  };

  let figure = $state<LayeredFigure | null>(null);
  let rigData: LayeredRig | null = null;
  let seenReactionSeq = stateGame.castReaction.seq;

  onMount(() => {
    let disposed = false;
    let mountedFigure: LayeredFigure | null = null;
    let update: (() => void) | null = null;

    void loadRig(rigUrls[props.figure])
      .then((rig) => {
        if (disposed) return;
        const pixiApplication = app.stateApp.pixiApplication;
        if (!pixiApplication)
          throw new Error("Pixi application is unavailable for cast mesh");
        rigData = rig;
        mountedFigure = new LayeredFigure(
          rig,
          texturesFor(rig, variant),
          LAYERED_TIERS[props.figure],
        );
        figure = mountedFigure;
        update = () => mountedFigure?.update(performance.now());
        if (props.onTop) pixiApplication.stage.addChild(mountedFigure.view);
        else
          pixiApplication.stage.addChildAt(
            mountedFigure.view,
            Math.min(2, pixiApplication.stage.children.length),
          );
        pixiApplication.ticker.add(update);
        mountedFigure.update(performance.now());
      })
      .catch((error) => {
        if (!disposed) console.error("Unable to mount layered cast", error);
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
    if (!figure || !rigData) return;
    figure.setTextures(texturesFor(rigData, variant));
  });

  $effect(() => {
    if (!figure || stateGame.castReaction.seq === seenReactionSeq) return;
    seenReactionSeq = stateGame.castReaction.seq;
    const kind = stateGame.castReaction.kind;
    if (kind === "idle") return;
    // `trigger` rides the FG-open sequence at the feature time scale; wins
    // follow the ordinary flat scale (same reasoning as CastFigureMesh).
    const speed =
      kind === "trigger" ? featureTimeScale() : stateBetDerived.timeScale();
    figure.react(kind, performance.now(), speed);
  });

  // Daylight between the swept ink and the reel housing / the screen edge, in
  // standard-box units (the 09-20 daylight request; Hard Time's 09-25 fix).
  const BOARD_GAP = 14;
  const SCREEN_GAP = 12;
  // CastFigureMesh's trim, same sign: negative moves the figure right.
  const MESH_TRIM_X = 10;

  $effect(() => {
    if (!figure) return;
    const [x0, y0, x1, y1] = figure.figureBox;
    const contentHeight = y1 - y0;
    const contentCenterX = (x0 + x1) * 0.5;
    const direction = props.flip ? -1 : 1;
    const anchorX = typeof std.anchor === "number" ? std.anchor : std.anchor.x;
    const anchorY = typeof std.anchor === "number" ? std.anchor : std.anchor.y;
    const toCanvasX = (x: number) => std.x + (x - std.width * anchorX) * std.scale;

    // The validated motion envelope (reaction peaks included) has to fit
    // between the board and the stage edge. When the band is too narrow the
    // figure shrinks; it never slides onto the board to make room.
    const [envLo, envHi] = LAYERED_X_ENVELOPE[props.figure];
    const rightLimit =
      props.clampScreen === false
        ? Infinity
        : context.stateLayoutDerived.canvasSizes().width - SCREEN_GAP * std.scale;
    const leftLimit =
      props.innerEdge === undefined
        ? -Infinity
        : toCanvasX(props.innerEdge + BOARD_GAP);
    const natural = (props.height / contentHeight) * std.scale * 0.82;
    const drawScale = Number.isFinite(rightLimit - leftLimit)
      ? Math.min(natural, (rightLimit - leftLimit) / (envHi - envLo))
      : natural;
    const inkLo = Math.min(direction * envLo, direction * envHi) * drawScale;
    const inkHi = Math.max(direction * envLo, direction * envHi) * drawScale;

    figure.view.scale.set(direction * drawScale, drawScale);
    const wanted =
      toCanvasX(props.x - MESH_TRIM_X) + direction * -contentCenterX * drawScale;
    figure.view.x = Math.max(
      leftLimit - inkLo,
      Math.min(wanted, rightLimit - inkHi),
    );
    figure.view.y =
      std.y + (props.topY - std.height * anchorY) * std.scale - y0 * drawScale;
    figure.view.alpha = props.alpha ?? 1;
  });
</script>

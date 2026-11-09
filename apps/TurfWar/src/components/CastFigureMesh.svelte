<script lang="ts">
  import type { Texture } from "pixi.js";
  import { getContextApp, getContextParent } from "pixi-svelte";
  import { stateBetDerived } from "state-shared";
  import { getContext } from "../game/context";
  import { SpineCastFigure } from "../game/spineCastFigure";
  import type { CastSpineJson } from "../game/spineCastData";
  import { stateGame } from "../game/stateGame.svelte";
  import { featureTimeScale } from "../game/timeScale";

  type Props = {
    who: "guy";
    x: number;
    topY: number;
    height: number;
    groundY: number;
    fitToGround?: boolean;
    alpha?: number;
    flip?: boolean;
    /** board ink's outer edge in the caller's container space; the figure's
     *  ink (plus its motion margin) never crosses it */
    innerEdge?: number;
    /**
     * Draw inside the enclosing pixi container instead of at stage index 2
     * (behind the housing). The free-game splash needs him IN FRONT of its
     * scrim and fading with it. Placement is in canvas px either way, so the
     * enclosing container must be untransformed.
     */
    inline?: boolean;
    /**
     * Portrait (2026-11-05): put this fraction of the ink height (from the top)
     * exactly on `y` (standard-box px) — the housing's top edge — so the reels
     * cut the figure at the waist rather than wherever the width-limited scale
     * happens to leave it. Ignored when the head would then rise above `minTop`.
     */
    cut?: { y: number; fraction: number; minTop: number };
  };

  const props: Props = $props();
  const app = getContextApp();
  const parentContext = props.inline ? getContextParent() : null;
  const context = getContext();
  const std = $derived(context.stateLayoutDerived.mainLayoutStandard());
  // v6 (2026-11-09): own skeleton + harmonic weights + physics accessories,
  // idle on one clock with reactions over it — design/cast_v6/ (build_v6.py,
  // motions.py, finalize.mjs). Same four drawings as v5.
  const variant = $derived(stateGame.gameType === "freegame" ? "fg" : "base");
  const LAYERS = ["arm_far", "body", "head", "arm_near"];
  const RIG_URL = {
    base: new URL("../../assets/castLayers/turf/v6/base/cast.spine.json", import.meta.url).href,
    fg: new URL("../../assets/castLayers/turf/v6/fg/cast.spine.json", import.meta.url).href,
  };
  const textures = $derived.by(() => {
    const selected: Record<string, Texture> = {};
    for (const layer of LAYERS) {
      const name = layer.split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join("");
      const label = variant[0].toUpperCase() + variant.slice(1);
      const key = `turfV6${label}${name}` as keyof typeof app.stateApp.loadedAssets;
      const texture = app.stateApp.loadedAssets[key] as Texture | undefined;
      if (!texture) return null;
      selected[layer] = texture;
    }
    return selected;
  });
  let figure = $state<SpineCastFigure | null>(null);

  // Daylight between the figure and the reel housing, in standard-box units,
  // plus room for the idle sway / reaction swing (fraction of figure height).
  // figure_box is the texture's alpha bbox (the mesh itself spans the whole
  // canvas, so its bounds are useless here). The fixed trim below placed the box
  // centre only, so on narrower screens the sleeve sat on the housing (「人物跟盤面重疊」, 2026-09-25).
  const BOARD_GAP = 14;
  // The posed ink stays inside these canvas-space coordinates in all 3 modes.
  // Leave a little extra for mesh-cell sampling and the additive glow.
  const SCREEN_GAP = 12;
  let seenReactionSeq = stateGame.castReaction.seq;

  // Every rig this figure can switch to is fetched up front, so the swap at
  // the start and end of the feature does not leave a gap while one loads.
  const rigs = new Map<string, Promise<CastSpineJson>>();
  const loadRig = (url: string) => {
    let pending = rigs.get(url);
    if (!pending) {
      pending = fetch(url).then((response) => {
        if (!response.ok)
          throw new Error(`Unable to load Spine cast: ${response.status}`);
        return response.json() as Promise<CastSpineJson>;
      });
      rigs.set(url, pending);
    }
    return pending;
  };
  for (const key of ["base", "fg"] as const) void loadRig(RIG_URL[key]);

  // Re-mounts whenever the drawing changes — rig, texture and pose together.
  $effect(() => {
    const url = RIG_URL[variant];
    const mountVariant = variant;
    const mountTextures = textures;
    if (!mountTextures) return;
    let disposed = false;
    let mountedFigure: SpineCastFigure | null = null;
    let update: (() => void) | null = null;

    void loadRig(url).then((rig) => {
      if (disposed) return;
      const pixiApplication = app.stateApp.pixiApplication;
      if (!pixiApplication)
        throw new Error("Pixi application is unavailable for cast mesh");
      mountedFigure = new SpineCastFigure(rig, mountTextures, `turf-cast-${mountVariant}`);
      figure = mountedFigure;
      update = () => mountedFigure?.update(performance.now());
      if (parentContext) parentContext.parent.addChild(mountedFigure.view);
      else {
        // Background has three persistent mode fades plus street-life layers.
        // A fixed child index could put ropes/lights IN FRONT of the actor.
        mountedFigure.view.zIndex = -0.5;
        pixiApplication.stage.addChild(mountedFigure.view);
        pixiApplication.stage.sortChildren();
      }
      pixiApplication.ticker.add(update);
      mountedFigure.update(performance.now());
    });

    return () => {
      disposed = true;
      const pixiApplication = app.stateApp.pixiApplication;
      if (update && pixiApplication) pixiApplication.ticker.remove(update);
      if (mountedFigure) {
        mountedFigure.destroy();
      }
      figure = null;
    };
  });

  $effect(() => {
    if (!figure || stateGame.castReaction.seq === seenReactionSeq) return;
    seenReactionSeq = stateGame.castReaction.seq;
    const kind = stateGame.castReaction.kind;
    if (kind === "idle") return;
    // `trigger` rides alongside the FG-open sequence, which already runs its
    // own beats at the gentler feature scale (game/timeScale.ts) rather than a
    // flat halving — the reaction should stay in step with that, not with the
    // ordinary spin grind. `win`/`winBig` accompany the everyday win volley,
    // which DOES use the flat scale, so they follow it too.
    const speed =
      kind === "trigger" ? featureTimeScale() : stateBetDerived.timeScale();
    figure.react(kind, performance.now(), speed);
  });

  $effect(() => {
    if (!figure) return;
    const [x0, y0, x1, y1] = figure.figureBox;
    const contentHeight = y1 - y0;
    const contentCenterX = (x0 + x1) * 0.5;
    const direction = (props.flip ?? true) ? -1 : 1;
    const anchorX = std.anchor;
    const anchorY = std.anchor;
    const toCanvasX = (x: number) => std.x + (x - std.width * anchorX) * std.scale;
    const [envLo, envHi] = figure.envelope;
    const rightLimit = context.stateLayoutDerived.canvasSizes().width - SCREEN_GAP * std.scale;
    const leftLimit = props.innerEdge === undefined
      ? -Infinity
      : toCanvasX(props.innerEdge + BOARD_GAP);
    const natural = (props.height / contentHeight) * std.scale * 0.82;
    const verticalLimit = props.fitToGround
      ? Math.max(0, props.groundY - props.topY) * std.scale / contentHeight
      : Infinity;
    const drawScale = Math.min(natural, verticalLimit, (rightLimit - leftLimit) / (envHi - envLo));
    const inkLo = Math.min(direction * envLo, direction * envHi) * drawScale;
    const inkHi = Math.max(direction * envLo, direction * envHi) * drawScale;

    figure.view.scale.set(direction * drawScale, drawScale);
    const wanted = toCanvasX(props.x - 45) - direction * contentCenterX * drawScale;
    figure.view.x = Math.max(leftLimit - inkLo, Math.min(wanted, rightLimit - inkHi));
    figure.view.y =
      std.y + ((props.fitToGround ? props.groundY : props.topY) - std.height * anchorY) * std.scale
      - (props.fitToGround ? y1 : y0) * drawScale;
    if (props.cut) {
      const toCanvasY = (y: number) => std.y + (y - std.height * anchorY) * std.scale;
      const cutY = toCanvasY(props.cut.y) - (y0 + props.cut.fraction * contentHeight) * drawScale;
      if (cutY + y0 * drawScale >= toCanvasY(props.cut.minTop)) figure.view.y = cutY;
    }
    figure.view.alpha = props.alpha ?? 1;
  });
</script>

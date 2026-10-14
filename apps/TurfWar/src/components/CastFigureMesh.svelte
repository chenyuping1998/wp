<script lang="ts">
  import type { Texture } from "pixi.js";
  import { getContextApp, getContextParent } from "pixi-svelte";
  import { stateBetDerived } from "state-shared";
  import { getContext } from "../game/context";
  import { LayeredFigure, type LayeredManifest } from "../game/layeredFigure";
  import { LAYERED_TIERS, KINGPIN_TIERS } from "../game/layeredCastMotion";
  import { stateGame } from "../game/stateGame.svelte";
  import { featureTimeScale } from "../game/timeScale";

  type Props = {
    who: "guy";
    x: number;
    topY: number;
    height: number;
    groundY: number;
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
  };

  const props: Props = $props();
  const app = getContextApp();
  const parentContext = props.inline ? getContextParent() : null;
  const context = getContext();
  const std = $derived(context.stateLayoutDerived.mainLayoutStandard());
  // Swap the complete rig and textures while the FG transition covers the board.
  // The FG Kingpin was drawn in a rigging A-pose: both arms hang well out
  // from the coat, which reads stiff and unnatural on screen (user, 2026-10-14:
  // 「這姿勢不行啊，超不自然」). Both arm layers are skinned 100% to their arm
  // bones and the body has no weight on them, so swinging the arms in at the
  // shoulder moves only the sleeves — no coat deformation. 12° was picked from
  // a 0/8/12/16 comparison: at 16 the far hand tucks behind the coat.
  const FG_REST = { arm_l: 12, arm_r: -12 };
  const variant = $derived(stateGame.gameType === "freegame" ? "fg" : "base");
  const LAYERS = $derived(variant === "fg"
    ? ["arm_l", "body", "head", "prop_cigar", "dangle_smoke", "arm_r"]
    : ["body", "arm_r", "prop_bat", "arm_l", "head", "dangle_chain", "dangle_mask", "fingers_r"]);
  const RIG_URL = {
    base: new URL("../../assets/castLayers/turf/base/layers.manifest.json", import.meta.url).href,
    fg: new URL("../../assets/castLayers/turf/fg/layers.manifest.json", import.meta.url).href,
  };
  const textures = $derived.by(() => {
    const selected: Record<string, Texture> = {};
    for (const layer of LAYERS) {
      const name = layer.split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join("");
      const label = variant[0].toUpperCase() + variant.slice(1);
      const key = `turfLayer${label}${name}` as keyof typeof app.stateApp.loadedAssets;
      const texture = app.stateApp.loadedAssets[key] as Texture | undefined;
      if (!texture) return null;
      selected[layer] = texture;
    }
    return selected;
  });
  let figure = $state<LayeredFigure | null>(null);

  // Daylight between the figure and the reel housing, in standard-box units,
  // plus room for the idle sway / reaction swing (fraction of figure height).
  // figure_box is the texture's alpha bbox (the mesh itself spans the whole
  // canvas, so its bounds are useless here). The fixed trim below placed the box
  // centre only, so on narrower screens the sleeve sat on the housing (「人物跟盤面重疊」, 2026-09-25).
  const BOARD_GAP = 14;
  // The posed ink stays inside these canvas-space coordinates in all 3 modes.
  // Leave a little extra for mesh-cell sampling and the additive glow.
  const LAYERED_X_ENVELOPE = [100, 990] as const;
  const SCREEN_GAP = 12;
  let seenReactionSeq = stateGame.castReaction.seq;

  // Every rig this figure can switch to is fetched up front, so the swap at
  // the start and end of the feature does not leave a gap while one loads.
  const rigs = new Map<string, Promise<LayeredManifest>>();
  const loadRig = (url: string) => {
    let pending = rigs.get(url);
    if (!pending) {
      pending = fetch(url).then((response) => {
        if (!response.ok)
          throw new Error(`Unable to load mesh rig: ${response.status}`);
        return response.json() as Promise<LayeredManifest>;
      });
      rigs.set(url, pending);
    }
    return pending;
  };
  for (const key of ["base", "fg"] as const) void loadRig(RIG_URL[key]);

  // Re-mounts whenever the drawing changes — rig, texture and pose together.
  $effect(() => {
    const url = RIG_URL[variant];
    const mountTextures = textures;
    if (!mountTextures) return;
    let disposed = false;
    let mountedFigure: LayeredFigure | null = null;
    let update: (() => void) | null = null;

    void loadRig(url).then((rig) => {
      if (disposed) return;
      const pixiApplication = app.stateApp.pixiApplication;
      if (!pixiApplication)
        throw new Error("Pixi application is unavailable for cast mesh");
      mountedFigure = new LayeredFigure(rig, mountTextures, variant === "fg" ? KINGPIN_TIERS : LAYERED_TIERS, {
        label: `turf-cast-${variant}`,
        poseState: variant === "fg" ? { pose: "layered", rest: FG_REST } : { pose: "layered" },
      });
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
    const direction = props.flip ? -1 : 1;
    const anchorX = std.anchor;
    const anchorY = std.anchor;
    const toCanvasX = (x: number) => std.x + (x - std.width * anchorX) * std.scale;
    const [envLo, envHi] = LAYERED_X_ENVELOPE;
    const rightLimit = context.stateLayoutDerived.canvasSizes().width - SCREEN_GAP * std.scale;
    const leftLimit = props.innerEdge === undefined
      ? -Infinity
      : toCanvasX(props.innerEdge + BOARD_GAP);
    const natural = (props.height / contentHeight) * std.scale * 0.82;
    const drawScale = Math.min(natural, (rightLimit - leftLimit) / (envHi - envLo));
    const inkLo = Math.min(direction * envLo, direction * envHi) * drawScale;
    const inkHi = Math.max(direction * envLo, direction * envHi) * drawScale;

    figure.view.scale.set(direction * drawScale, drawScale);
    const wanted = toCanvasX(props.x - 45) - direction * contentCenterX * drawScale;
    figure.view.x = Math.max(leftLimit - inkLo, Math.min(wanted, rightLimit - inkHi));
    figure.view.y =
      std.y + (props.topY - std.height * anchorY) * std.scale - y0 * drawScale;
    figure.view.alpha = props.alpha ?? 1;
  });
</script>

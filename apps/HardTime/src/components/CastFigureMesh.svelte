<script lang="ts">
  import type { Texture } from "pixi.js";
  import { getContextApp, getContextParent } from "pixi-svelte";
  import { stateBetDerived } from "state-shared";
  import { getContext } from "../game/context";
  import { LayeredFigure, type LayeredRig } from "../game/layeredFigure";
  import { LAYERED_X_ENVELOPE, WARDEN_TIERS } from "../game/layeredCastMotion";
  import { stateGame } from "../game/stateGame.svelte";
  import { featureTimeScale } from "../game/timeScale";

  type Props = {
    who: "guy" | "girl";
    x: number;
    topY: number;
    height: number;
    groundY: number;
    alpha?: number;
    flip?: boolean;
    /** board ink's outer edge in the caller's container space; the figure's
     *  swept ink never crosses it */
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
  const isWarden = $derived(stateGame.gameType === "freegame");
  const rigUrl = $derived(isWarden
    ? new URL("../../assets/castLayers/warden/layers.json", import.meta.url).href
    : new URL("../../assets/castLayers/prisoner_crossed/layers.json", import.meta.url).href);
  const textures = $derived.by(() => {
    if (!isWarden) return {
      head: app.stateApp.loadedAssets["htCastHead"] as Texture,
      body: app.stateApp.loadedAssets["htCastBody"] as Texture,
    };
    const selected: Record<string, Texture> = {};
    for (const name of ["arm_r", "prop_bat", "body", "arm_l", "dangle_chain", "head", "dangle_mask", "fingers_r"]) {
      const suffix = name.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join("");
      selected[name] = app.stateApp.loadedAssets[`htWarden${suffix}` as keyof typeof app.stateApp.loadedAssets] as Texture;
    }
    return selected;
  });
  // Both rigs are ready before the transition reaches its hidden swap beat.
  const rigCache = new Map<string, Promise<LayeredRig>>();
  const loadRig = (url: string) => {
    let pending = rigCache.get(url);
    if (!pending) {
      pending = fetch(url).then((response) => {
        if (!response.ok) throw new Error(`Unable to load cast rig: ${response.status}`);
        return response.json() as Promise<LayeredRig>;
      });
      rigCache.set(url, pending);
    }
    return pending;
  };
  for (const url of [
    new URL("../../assets/castLayers/prisoner_crossed/layers.json", import.meta.url).href,
    new URL("../../assets/castLayers/warden/layers.json", import.meta.url).href,
  ]) void loadRig(url);
  let figure = $state<LayeredFigure | null>(null);
  let seenReactionSeq = stateGame.castReaction.seq;

  $effect(() => {
    const url = rigUrl;
    const mountTextures = textures;
    const tiers = isWarden ? WARDEN_TIERS : undefined;
    let disposed = false;
    let mountedFigure: LayeredFigure | null = null;
    let update: (() => void) | null = null;

    void loadRig(url)
      .then((rig) => {
        if (disposed) return;
        const pixiApplication = app.stateApp.pixiApplication;
        if (!pixiApplication)
          throw new Error("Pixi application is unavailable for cast mesh");
        mountedFigure = new LayeredFigure(rig, mountTextures, tiers);
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
      })
      .catch((error) => {
        if (!disposed) console.error("Unable to mount layered prisoner", error);
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

  // Daylight between the swept ink and the reel housing / the screen edge, in
  // standard-box units. Capo's user asked for daylight on 09-20; HT lost it when
  // the right-edge clamp below pushed the figure left on narrower screens
  // (16:10: the left sleeve sat on the housing, 2026-09-25).
  const BOARD_GAP = 14;
  const SCREEN_GAP = 12;

  $effect(() => {
    if (!figure) return;
    const [x0, y0, x1, y1] = figure.figureBox;
    const contentHeight = y1 - y0;
    const contentCenterX = (x0 + x1) * 0.5;
    // `flip` is the prisoner's facing (his art is drawn turned toward the
    // board). The warden is drawn the other way — head turned to image right —
    // so the same `flip` would stand him beside the board looking away from it.
    // Invert it for him; the envelope and clamps below mirror with `direction`.
    const direction = (isWarden ? !props.flip : props.flip) ? -1 : 1;
    const anchorX = std.anchor;
    const anchorY = std.anchor;
    const toCanvasX = (x: number) => std.x + (x - std.width * anchorX) * std.scale;

    // The validated motion envelope (rig x, trigger peak included) has to fit
    // between the board and the stage edge. When the band is narrower than the
    // figure at its natural size, the figure shrinks — it never slides onto
    // the board to make room.
    const [envLo, envHi] = isWarden ? [130, 900] : LAYERED_X_ENVELOPE;
    const rightLimit =
      context.stateLayoutDerived.canvasSizes().width - SCREEN_GAP * std.scale;
    const leftLimit =
      props.innerEdge === undefined
        ? -Infinity
        : toCanvasX(props.innerEdge + BOARD_GAP);
    const natural = (props.height / contentHeight) * std.scale * 0.82;
    const drawScale = Math.min(natural, (rightLimit - leftLimit) / (envHi - envLo));
    // canvas x of the envelope's two ends, relative to view.x
    const inkLo = Math.min(direction * envLo, direction * envHi) * drawScale;
    const inkHi = Math.max(direction * envLo, direction * envHi) * drawScale;

    figure.view.scale.set(direction * drawScale, drawScale);
    const wanted =
      toCanvasX(props.x - 45) + direction * -contentCenterX * drawScale;
    figure.view.x = Math.max(
      leftLimit - inkLo,
      Math.min(wanted, rightLimit - inkHi),
    );
    figure.view.y =
      std.y + (props.topY - std.height * anchorY) * std.scale - y0 * drawScale;
    figure.view.alpha = props.alpha ?? 1;
  });
</script>

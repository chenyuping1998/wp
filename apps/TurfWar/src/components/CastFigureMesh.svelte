<script lang="ts">
  import type { Texture } from "pixi.js";
  import { getContextApp } from "pixi-svelte";
  import { stateBetDerived } from "state-shared";
  import { getContext } from "../game/context";
  import { MOTION_SCALE } from "../game/castMotion";
  import { SkinnedFigure, type MeshRig } from "../game/skinnedFigure";
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
  };

  const props: Props = $props();
  const app = getContextApp();
  const context = getContext();
  const std = $derived(context.stateLayoutDerived.mainLayoutStandard());
  // Turf War draws the man twice — bat planted (base game) and bat over the
  // shoulder (feature; kingpin shares that redraw's exact silhouette) — and a
  // rig fits exactly ONE drawing. Texture, rig and motion pose are all picked
  // from this one value so they cannot disagree: a shoulder texture on the
  // base rig tears the bat in half. See game/castMotion.ts.
  const variant = $derived(
    props.who !== "guy"
      ? "girl"
      : stateGame.gameType === "freegame"
        ? stateGame.bonusTier === "don" ? "kingpin" : "feature"
        : "base",
  );
  const TEXTURE_KEY = {
    base: "hmCastGuyMesh",
    feature: "hmCastGuyFeature",
    kingpin: "hmCastGuyKingpin",
    girl: "hmCastGirlMesh",
  } as const;
  // Literal URLs, one per file, so the bundler can see and copy each of them.
  const RIG_URL = {
    base: new URL("../../assets/meshRigs/cast_guy/guy.rig.json", import.meta.url).href,
    feature: new URL("../../assets/meshRigs/cast_guy/guy_feature.rig.json", import.meta.url).href,
    kingpin: new URL("../../assets/meshRigs/cast_guy/guy_kingpin.rig.json", import.meta.url).href,
    girl: new URL("../../assets/meshRigs/cast_girl/girl.rig.json", import.meta.url).href,
  };
  const texture = $derived(
    app.stateApp.loadedAssets[TEXTURE_KEY[variant]] as Texture | undefined,
  );
  let figure = $state<SkinnedFigure | null>(null);
  let seenReactionSeq = stateGame.castReaction.seq;

  // Every rig this figure can switch to is fetched up front, so the swap at
  // the start and end of the feature does not leave a gap while one loads.
  const rigs = new Map<string, Promise<MeshRig>>();
  const loadRig = (url: string) => {
    let pending = rigs.get(url);
    if (!pending) {
      pending = fetch(url).then((response) => {
        if (!response.ok)
          throw new Error(`Unable to load mesh rig: ${response.status}`);
        return response.json() as Promise<MeshRig>;
      });
      rigs.set(url, pending);
    }
    return pending;
  };
  if (props.who === "guy") {
    for (const key of ["base", "feature", "kingpin"] as const) void loadRig(RIG_URL[key]);
  }

  // Re-mounts whenever the drawing changes — rig, texture and pose together.
  $effect(() => {
    const url = RIG_URL[variant];
    const pose = variant === "base" || variant === "girl" ? "base" : "shoulder";
    const mountTexture = texture;
    if (!mountTexture) return;
    let disposed = false;
    let mountedFigure: SkinnedFigure | null = null;
    let update: (() => void) | null = null;

    void loadRig(url).then((rig) => {
      if (disposed) return;
      const pixiApplication = app.stateApp.pixiApplication;
      if (!pixiApplication)
        throw new Error("Pixi application is unavailable for cast mesh");
      mountedFigure = new SkinnedFigure(rig, mountTexture, MOTION_SCALE.guy, pose);
      figure = mountedFigure;
      update = () => mountedFigure?.update(performance.now());
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
    const drawScale = (props.height / contentHeight) * std.scale * 0.82;
    const direction = props.flip ? -1 : 1;
    const anchorX = typeof std.anchor === "number" ? std.anchor : std.anchor.x;
    const anchorY = typeof std.anchor === "number" ? std.anchor : std.anchor.y;

    figure.view.scale.set(direction * drawScale, drawScale);
    figure.view.x =
      std.x +
      (props.x - 45 - std.width * anchorX) * std.scale +
      direction * -contentCenterX * drawScale;
    figure.view.y =
      std.y + (props.topY - std.height * anchorY) * std.scale - y0 * drawScale;
    figure.view.alpha = props.alpha ?? 1;
  });
</script>

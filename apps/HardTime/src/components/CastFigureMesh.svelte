<script lang="ts">
  import type { Texture } from "pixi.js";
  import { getContextApp } from "pixi-svelte";
  import { onMount } from "svelte";
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
  // One cast member, always the rig built on the "guy" silhouette — the
  // prisoner's art is drawn to that body so the proven arm clearance carries
  // over (ART_AUDIO_BRIEF.md §1). `who` stays in Props only so callers need not
  // change.
  //
  // There used to be a girl branch here too: `new URL(".../cast_girl/girl.rig.json",
  // import.meta.url)`. Vite bundles every `new URL(..., import.meta.url)` it sees
  // UNCONDITIONALLY — the ternary never chose it at runtime, but 7.5MB of Hot
  // Miami's woman shipped in every upload anyway. Removed 2026-09-15.
  const texture = $derived(app.stateApp.loadedAssets["hmCastGuyMesh"] as Texture);
  const rigUrl = new URL(
    "../../assets/meshRigs/cast_guy/guy.rig.json",
    import.meta.url,
  ).href;
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
        // Hard Time has exactly ONE cast member — Cast.svelte pins `who` to
        // "guy" and FreeSpinIntro passes the same, so this is always the prisoner.
        // His tables in game/castMotion.ts are written against HIS OWN measured
        // joint limits, hence a scale of 1. A second figure would need its own
        // MOTION_SCALE entry and its own measured row in check_cast_motion.mjs.
        mountedFigure = new SkinnedFigure(rig, texture, MOTION_SCALE.guy);
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

<script lang="ts">
  import type { Texture } from "pixi.js";
  import { getContextApp } from "pixi-svelte";
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
  };

  const props: Props = $props();
  const app = getContextApp();
  const context = getContext();
  const std = $derived(context.stateLayoutDerived.mainLayoutStandard());
  const texture = $derived(
    app.stateApp.loadedAssets[
      props.who === "guy" ? "hmCastGuyMesh" : "hmCastGirlMesh"
    ] as Texture,
  );
  const rigUrl = '/assets/deadwood/conductor.rig.json';
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
    if (stateGame.castReaction.kind !== "idle")
      figure.react(stateGame.castReaction.kind);
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

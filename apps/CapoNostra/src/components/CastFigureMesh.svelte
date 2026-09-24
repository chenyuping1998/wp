<script lang="ts" module>
  import type { MeshRig } from "../game/skinnedFigure";

  /**
   * One fetch per rig file, for the life of the page.
   *
   * This component mounts more than once and remounts often: Cast.svelte draws
   * one beside the board behind a `{#key who}`, FreeSpinIntro draws another on
   * the feature card, and Cast's own `{#if}` tears its copy down and builds it
   * again whenever the splash shows or the side band disappears. Each of those
   * was re-fetching guy.rig.json — 100 KB of JSON, six times in a single feature
   * round. The browser's cache makes them cheap, not free, and they all land in
   * the same moments the feature is opening.
   *
   * The PROMISE is cached rather than the parsed rig, so two components mounting
   * in the same frame share one request instead of racing to start two. A failed
   * fetch is dropped from the map so a later mount can retry rather than
   * inheriting the rejection forever.
   */
  const rigCache = new Map<string, Promise<MeshRig>>();
  const loadRig = (url: string) => {
    const cached = rigCache.get(url);
    if (cached) return cached;
    const request = fetch(url)
      .then((response) => {
        if (!response.ok)
          throw new Error(`Unable to load mesh rig: ${response.status}`);
        return response.json() as Promise<MeshRig>;
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
  import { MOTION_SCALE } from "../game/castMotion";
  import { SkinnedFigure } from "../game/skinnedFigure";
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
  /**
   * Which of the Don's three states is showing.
   *
   * ART_BRIEF.md §1 replaced Hot Miami's two CHARACTERS with one man in three
   * states, because 「同一個大佬，隨著局勢越站越前面」 tells the player which mode
   * they are in without a caption and without a second figure to draw, rig and
   * gate. These are the three:
   *
   *   basegame              guy.png          the room as it normally is
   *   freegame              guy_feature.png  暖光打強
   *   freegame + don tier   guy_don.png      金色輪廓光
   *
   * The Don tier is the top of the three-rung feature ladder
   * (game/featureTiers.ts: soldier / capo / don), so it gets the loudest state;
   * soldier and capo share the ordinary feature grade. `bonusTier` survives past
   * the end of a feature, so the gameType check has to come first or the rim
   * light would follow the player back into the base game.
   */
  const assetKey = $derived(
    stateGame.gameType !== "freegame"
      ? "hmCastGuyMesh"
      : stateGame.bonusTier === "don"
        ? "hmCastGuyMeshDon"
        : "hmCastGuyMeshFeature",
  );
  const texture = $derived(app.stateApp.loadedAssets[assetKey] as Texture);
  const guyRigUrl = new URL(
    "../../assets/meshRigs/cast_guy/guy.rig.json",
    import.meta.url,
  ).href;
  const girlRigUrl = new URL(
    "../../assets/meshRigs/cast_girl/girl.rig.json",
    import.meta.url,
  ).href;
  const rigUrl = $derived(props.who === "guy" ? guyRigUrl : girlRigUrl);
  let figure = $state<SkinnedFigure | null>(null);
  let seenReactionSeq = stateGame.castReaction.seq;

  onMount(() => {
    let disposed = false;
    let mountedFigure: SkinnedFigure | null = null;
    let update: (() => void) | null = null;

    void loadRig(rigUrl)
      .then((rig) => {
        if (disposed) return;
        const pixiApplication = app.stateApp.pixiApplication;
        if (!pixiApplication)
          throw new Error("Pixi application is unavailable for cast mesh");
        // Capo Nostra has exactly ONE cast member — Cast.svelte pins `who` to
        // "guy" and FreeSpinIntro passes the same, so this is always the Don.
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

  // All three states are the same drawing graded differently, so this swaps the
  // texture on the live figure rather than remounting it — a remount would drop
  // a running reaction and restart the idle from zero, and the swap happens
  // exactly when a feature opens, which is when a reaction IS running.
  $effect(() => {
    if (!figure || !texture) return;
    figure.setTexture(texture);
  });

  /**
   * Horizontal trim, in standard units, applied on top of the `x` Cast.svelte
   * works out.
   *
   * Cast.svelte places the figure by its BOX: the band between the board's ink
   * and the screen edge. The mesh figure does not fill its box the way the flat
   * cut-out did — `figure_box` is the inked region of a 512x1024 sheet — so the
   * box-based x needs a trim to sit where the art actually is.
   *
   * NEGATIVE MOVES IT RIGHT, away from the board. It was -45 (leftward) until
   * 2026-09-20, which is what had the Don's cigar hand overlapping the reel
   * housing; the user asked for daylight between them. Cast.svelte's own
   * comment still describes the Miami reference as having the figure TOUCH the
   * board with no gap — that was the reference, and this is the call that
   * overrides it.
   */
  const MESH_TRIM_X = 10;

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
      (props.x - MESH_TRIM_X - std.width * anchorX) * std.scale +
      direction * -contentCenterX * drawScale;
    figure.view.y =
      std.y + (props.topY - std.height * anchorY) * std.scale - y0 * drawScale;
    figure.view.alpha = props.alpha ?? 1;
  });
</script>

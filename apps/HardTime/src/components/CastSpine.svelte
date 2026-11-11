<script lang="ts" module>
  /**
   * Shared idle clock for the Spine cast (2026-10-20).
   *
   * Iron Jaw's two boxers loop a 2.00 s idle on ONE clock that nothing ever
   * resets — not a spin, not a win, not a reaction — and the second figure runs
   * half a cycle behind the first, so one leans in while the other draws back.
   * Each instance reads this clock every frame instead of keeping its own, and
   * a reaction plays on a separate track over the top, so when it fades out
   * the figure is already at the right place in the loop.
   */
  export const CAST_IDLE_SECONDS = 2.0;
  export const CAST_PHASE = { prisoner: 0, warden: 1.0 } as const;
  export type CastWho = keyof typeof CAST_PHASE;
</script>

<script lang="ts">
  import { Physics, Spine, type SkeletonData } from "@esotericsoftware/spine-pixi-v8";
  import { getContextApp, getContextParent } from "pixi-svelte";
  import { untrack } from "svelte";
  import { stateBetDerived } from "state-shared";

  import { getContext } from "../game/context";
  import { stateGame } from "../game/stateGame.svelte";

  type Props = {
    who: CastWho;
    inline?: boolean;
    intro?: boolean;
    /** kept for callers; the figure is centred in its side band (see placement) */
    x: number;
    topY: number;
    /** standard-box height of the figure's art box */
    height: number;
    /** the board ink edge on this figure's side, standard-box x */
    innerEdge: number;
    side: "left" | "right";
  };

  const props: Props = $props();
  const app = getContextApp();
  const context = getContext();
  const inlineParent = props.inline ? getContextParent() : null;
  const std = $derived(context.stateLayoutDerived.mainLayoutStandard());

  // Art-space root and rest silhouette from the existing 4.2 rig.
  // The measured full-motion outward reach below keeps hands on screen.
  // Reactions may reach inward over the board through the forearm overlay.
  const RIG = {
    prisoner: { root: [541, 1773], box: [275, 172, 806, 1774], key: "htPrisonerSpine" },
    warden: { root: [495, 1875], box: [180, 71, 836, 1875], key: "htWardenSpine" },
  } as const;

  // 14 had both figures touching the housing (user, 2026-10-21: 離盤面太近).
  const BOARD_GAP = 64;
  const SCREEN_GAP = 12;
  const MIX = 0.2; // Iron Jaw's reaction fades back in ~0.17-0.2 s

  let spine = $state<Spine | null>(null);

  $effect(() => {
    const rig = RIG[props.who];
    const data = app.stateApp.loadedAssets[rig.key] as unknown as SkeletonData | undefined;
    const pixi = app.stateApp.pixiApplication;
    if (!data || !pixi) return;

    const figure = new Spine({ skeletonData: data, autoUpdate: false });
    figure.label = `ht-cast-${props.who}`;
    figure.state.setAnimation(0, "idle", true);
    if (inlineParent) inlineParent.parent.addChild(figure);
    else pixi.stage.addChildAt(figure, Math.min(2, pixi.stage.children.length));
    spine = figure;
    if (props.intro) untrack(() => play("reactBig"));

    // Only the striking forearm crosses in front of the reel housing. The
    // full figure stays behind it. Copy solved bone matrices so this overlay
    // cannot drift from the arm underneath or run a second physics clock.
    const armFront = props.who === "warden" && !props.inline
      ? new Spine({ skeletonData: data, autoUpdate: false }) : null;
    if (armFront) {
      armFront.label = "ht-baton-front";
      for (const slot of armFront.skeleton.slots) {
        if (!["forearm_r", "baton", "fingers_r"].includes(slot.data.name)) slot.setAttachment(null);
      }
      armFront.afterUpdateWorldTransforms = () => {
        for (let i = 0; i < figure.skeleton.bones.length; i++) {
          const from = figure.skeleton.bones[i], to = armFront.skeleton.bones[i];
          to.a = from.a; to.b = from.b; to.c = from.c; to.d = from.d;
          to.worldX = from.worldX; to.worldY = from.worldY;
        }
      };
      armFront.visible = false;
      pixi.stage.addChild(armFront);
    }

    let last = performance.now();
    let nextBlink = last + 3000 + Math.random() * 3000;
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (now >= nextBlink) {
        figure.state.setAnimation(2, "blink", false);
        figure.state.addEmptyAnimation(2, 0, 0);
        nextBlink = now + 3000 + Math.random() * 3000;
      }
      const idle = figure.state.getCurrent(0);
      if (idle) {
        const t = now / 1000 + CAST_PHASE[props.who];
        idle.trackTime = ((t % CAST_IDLE_SECONDS) + CAST_IDLE_SECONDS) % CAST_IDLE_SECONDS;
      }
      figure.update(dt);
      if (armFront) {
        const reaction = figure.state.getCurrent(1);
        armFront.visible = !!reaction?.animation?.name.startsWith("react");
        if (armFront.visible) {
          armFront.position.copyFrom(figure.position);
          armFront.scale.copyFrom(figure.scale);
          armFront.update(0);
          // Directly above the reels (Game.svelte labels that layer
          // "ht-board"): over the symbols it reaches into, but under the UI,
          // the win banners and the transitions. Top of the whole stage drew
          // the baton over a banner that opened during the reaction.
          const kids = pixi.stage.children;
          const board = kids.findIndex((c) => c.label === "ht-board" || c.children[0]?.label === "ht-board");
          const mine = kids.indexOf(armFront);
          const want = board < 0 ? kids.length - 1 : board + (mine > board ? 1 : 0);
          if (mine !== want) pixi.stage.setChildIndex(armFront, want);
        }
      }
    };
    pixi.ticker.add(tick);
    // settle physics at rest before the first frame is seen
    figure.skeleton.updateWorldTransform(Physics.reset);

    return () => {
      pixi.ticker.remove(tick);
      figure.removeFromParent();
      figure.destroy();
      armFront?.removeFromParent();
      armFront?.destroy();
      spine = null;
    };
  });

  // ── reactions ─────────────────────────────────────────────────────────────
  const play = (name: "react" | "reactBig") => {
    if (!spine) return;
    const state = spine.state;
    // Mix IN from the idle underneath rather than popping: start from an empty
    // track, queue the reaction with its own mix, then queue the fade back out.
    state.setEmptyAnimation(1, 0);
    const entry = state.addAnimation(1, name, false, 0);
    entry.mixDuration = MIX;
    entry.timeScale = stateBetDerived.timeScale();
    state.addEmptyAnimation(1, MIX, 0);
  };

  let seenCast = stateGame.castReaction.seq;
  let seenWarden = stateGame.wardenReaction.seq;

  $effect(() => {
    const seq = stateGame.castReaction.seq;
    if (!spine || seq === seenCast) return;
    seenCast = seq;
    const kind = stateGame.castReaction.kind;
    if (kind === "idle") return;
    if (props.who === "prisoner") play(kind === "win" ? "react" : "reactBig");
    else if (kind === "trigger") play("reactBig");
  });

  $effect(() => {
    const seq = stateGame.wardenReaction.seq;
    if (!spine || seq === seenWarden) return;
    seenWarden = seq;
    if (props.who === "warden") play("react");
  });

  // ── placement: symmetric (user, 2026-10-21: 位子怪、不對稱、離盤面太近) ──
  //
  // Both figures keep the existing art scale and shared floor. Equal rest
  // heights and symmetric side bands are preserved; the full-motion envelope
  // shifts their centres inward only when the outer hand needs more room.
  const REF_HEIGHT = RIG.prisoner.box[3] - RIG.prisoner.box[1];
  const REF_TOP_TO_FEET = RIG.prisoner.root[1] - RIG.prisoner.box[1];
  // Same HEIGHT on screen (user, 2026-10-21: 兩個人物不一樣高): each figure is
  // scaled by its own box height, so the warden's cap top lines up with the
  // prisoner's head and both stand on one floor line. Widths are compared after
  // that rescale.
  const heightRatio = (who: CastWho) => REF_HEIGHT / (RIG[who].box[3] - RIG[who].box[1]);
  // Four idle phases × all clips, 60 Hz; 383.637 art px + 8 px guard.
  const OUTWARD_REACH = 392; // design/qa/character_fix_20261029/outward-envelope.json
  const WIDEST = Math.max(...(Object.keys(RIG) as CastWho[]).map((w) => (RIG[w].box[2] - RIG[w].box[0]) * heightRatio(w))) * 1.06; // + idle sway
  $effect(() => {
    if (!spine) return;
    const rig = RIG[props.who];
    const [bx0, , bx1] = rig.box;
    const [rootX] = rig.root;
    const mirror = props.side === "left";
    const toCanvasX = (x: number) => std.x + (x - std.width * std.anchor) * std.scale;
    const canvasWidth = context.stateLayoutDerived.canvasSizes().width;

    const [leftLimit, rightLimit] =
      props.side === "right"
        ? [toCanvasX(props.innerEdge + BOARD_GAP), canvasWidth - SCREEN_GAP * std.scale]
        : [SCREEN_GAP * std.scale, toCanvasX(props.innerEdge - BOARD_GAP)];
    const natural = (props.height / REF_HEIGHT) * std.scale * 0.82;
    const sRef = Math.max(0, Math.min(natural, (rightLimit - leftLimit) / WIDEST));
    const s = sRef * heightRatio(props.who);

    const centre = ((bx0 + bx1) * 0.5 - rootX) * (mirror ? -1 : 1);
    spine.scale.set(mirror ? -s : s, s);
    const bandCentre = (leftLimit + rightLimit) * 0.5;
    const outward = OUTWARD_REACH * sRef;
    const safeCentre = props.side === "left"
      ? Math.max(bandCentre, SCREEN_GAP * std.scale + outward)
      : Math.min(bandCentre, canvasWidth - SCREEN_GAP * std.scale - outward);
    spine.x = safeCentre - centre * s;
    const naturalY = std.y + (props.topY - std.height * std.anchor) * std.scale + REF_TOP_TO_FEET * sRef;
    // Feature entry shows the whole figure, including shoes. Move it upward
    // to the safe floor without changing art scale or motion amplitude.
    const floor = context.stateLayoutDerived.canvasSizes().height - SCREEN_GAP * std.scale;
    spine.y = props.inline ? Math.min(naturalY, floor - (rig.box[3] - rig.root[1]) * s) : naturalY;
  });
</script>

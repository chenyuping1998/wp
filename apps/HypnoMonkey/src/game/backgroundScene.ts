import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { BACKGROUND_SIZE } from './backgroundMotion';
import { circusPropPose, circusBuntingPose, circusLightPose } from './circusBackgroundMotion';

/** Fixed painted architecture with independent circus props and stage lights. */
export function createBackgroundScene(textures: Record<string, Texture>) {
 const root = new Container(); root.label = 'Hypno circus / fixed architecture'; root.eventMode = 'none';
 const day = new Sprite(textures.mgBgBase), stage = new Sprite(textures.mgBgFree);
 for (const sprite of [day, stage]) { sprite.width = BACKGROUND_SIZE.width; sprite.height = BACKGROUND_SIZE.height; root.addChild(sprite); }
 stage.alpha = 0;
 const bunting = new Sprite(textures.mgBgCloud); bunting.anchor.set(.5, 0); bunting.position.set(960, 30); bunting.width = 1650; bunting.height = 180; root.addChild(bunting);
 const sign = new Container(); sign.label = 'Rotating spiral sign'; root.addChild(sign);
 // Crop at the face/stand join: only the round face turns, not the wooden pole.
 const source = textures.mgBgTourist, faceEnd = .48, faceTop = .026;
 const faceTexture = new Texture({ source: source.source, frame: new Rectangle(0, source.height * faceTop, source.width, source.height * (faceEnd - faceTop)) });
 const standTexture = new Texture({ source: source.source, frame: new Rectangle(0, source.height * faceEnd, source.width, source.height * (1 - faceEnd)) });
 const stand = new Sprite(standTexture); stand.anchor.set(.5, 1); stand.width = 132; stand.height = 280 * (1 - faceEnd); sign.addChild(stand);
 const face = new Sprite(faceTexture); face.anchor.set(.5); face.width = 132; face.height = 280 * (faceEnd - faceTop); face.position.set(0, -280 * (1 - faceEnd) - face.height / 2); sign.addChild(face);
 const balloons = new Sprite(textures.mgBgIcecream); balloons.label = 'Tethered circus balloons'; balloons.anchor.set(.5, 1); balloons.width = 145; balloons.height = 300; root.addChild(balloons);
 const lights = [-1, 1].map(side => {
  const light = new Graphics().poly([0, 0, -240, 890, 240, 890]).fill({ color: 0xffe4a3, alpha: .17 });
  light.position.set(side < 0 ? 220 : 1700, 45); light.blendMode = 'add'; root.addChild(light); return light;
 });
 let elapsed = 0, nightness = 0, target = 0, reduced = false, disposed = false, burstAge = 2;
 let signX = 200, balloonX = 1670, ground = 1000, propScale = 1;
 function update(seconds: number) {
  if (disposed) return;
  const dt = Math.min(.1, Math.max(0, seconds));
  if (!reduced) { elapsed += dt; burstAge = Math.min(2, burstAge + dt); }
  nightness += Math.sign(target - nightness) * Math.min(Math.abs(target - nightness), dt / .7);
  stage.alpha = nightness;
  const time = reduced ? 0 : elapsed, a = circusPropPose(time, reduced ? 2 : burstAge);
  face.rotation = a.signRotation;
  sign.position.set(signX, ground); sign.scale.set(propScale);
  balloons.position.set(balloonX, ground); balloons.rotation = a.balloonRotation;
  balloons.scale.set(145 / textures.mgBgIcecream.width * propScale, 300 / textures.mgBgIcecream.height * propScale);
  bunting.rotation = circusBuntingPose(time); bunting.alpha = 1 - nightness * .15;
  lights.forEach((light, index) => { const p = circusLightPose(time, index); light.rotation = p.rotation; light.alpha = nightness * p.alpha; light.visible = nightness > .001; });
 }
 // clearLeft: screen px the bet bar's bottom-left cluster reaches in from the
 // left edge (game/barFootprint, bar v4). With a corner cluster both props stand
 // just right of it — the sign, then the balloons — on the open ground left of
 // the board, because the corners where they used to stand now hold the buy
 // tile/menu and the spin/turbo/autoplay discs (2026-11-09). 0 keeps the old
 // places at the screen edges.
 function setBounds(width: number, height: number, figureHeight = height * .65, groundY = height * .87, clearLeft = 0) {
  const scale = Math.max(width / BACKGROUND_SIZE.width, height / BACKGROUND_SIZE.height);
  root.scale.set(scale); root.position.set((width - BACKGROUND_SIZE.width * scale) / 2, (height - BACKGROUND_SIZE.height * scale) / 2);
  const left = -root.x / scale, right = (width - root.x) / scale;
  ground = (groundY - root.y) / scale; propScale = figureHeight * .36 / (300 * scale);
  if (clearLeft > 0) {
   const signW = 132 * propScale, balloonW = 145 * propScale, gap = .4 * balloonW;
   signX = left + clearLeft / scale + gap + signW / 2;
   balloonX = signX + signW / 2 + gap + balloonW / 2;
  } else {
   signX = left + Math.min(160, (right - left) * .12); balloonX = right - Math.min(190, (right - left) * .13);
  }
  update(0);
 }
 update(0);
 return { root, update, setBounds,
  setNight(value: boolean) { target = value ? 1 : 0; },
  setReducedMotion(value: boolean) { reduced = value; update(0); },
  burstProps() { if (disposed || reduced || burstAge < 2) return false; burstAge = 0; update(0); return true; },
  snapshot() { return { elapsed, nightness, burstAge, reduced, architecture: { x: day.x, y: day.y, rotation: day.rotation }, faceRotation: face.rotation, balloonRotation: balloons.rotation, buntingRotation: bunting.rotation, lights: lights.map(l => ({ rotation: l.rotation, alpha: l.alpha })), props: [{ height: 280 * propScale * root.scale.y, groundY: root.y + ground * root.scale.y }, { height: 300 * propScale * root.scale.y, groundY: root.y + ground * root.scale.y }] }; },
  destroy() { if (disposed) return; disposed = true; root.destroy({ children: true }); faceTexture.destroy(); standTexture.destroy(); },
 };
}

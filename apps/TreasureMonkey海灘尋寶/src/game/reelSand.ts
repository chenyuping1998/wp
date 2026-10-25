// Ballistic sand, in board pixels. Shared by the actual reel overlay and its animation lab.
export type SandGrain = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; color: number; spin: number };
const COLORS = [0xf3d397, 0xd5ad69, 0xffe8b3, 0xb98c51];
export class ReelSand {
 grains: SandGrain[] = [];
 private previous: boolean[] = [];
 private carry: number[] = [];
 private seed = 1827;
 private random() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0; return this.seed / 4294967296; }
 private emit(x: number, floor: number, count: number, stop: boolean) {
  for (let i = 0; i < count; i++) {
   const side = this.random() < .5 ? -1 : 1;
   this.grains.push({
    x: x + (this.random() - .5) * (stop ? 84 : 52), y: floor - 3,
    vx: side * (stop ? 28 + this.random() * 115 : 16 + this.random() * 55),
    vy: -(stop ? 70 + this.random() * 115 : 40 + this.random() * 80),
    age: 0, life: stop ? .48 + this.random() * .26 : .32 + this.random() * .25,
    size: 1.4 + this.random() * (stop ? 2.7 : 1.7),
    color: COLORS[Math.floor(this.random() * COLORS.length)], spin: this.random() * Math.PI,
   });
  }
  // Hard cap also bounds rapid stop/start and a five-reel slam stop.
  if (this.grains.length > 180) this.grains.splice(0, this.grains.length - 180);
 }
 step(dt: number, spinning: boolean[], centers: number[], floor: number, turbo = false, reduced = false) {
  const delta = Math.max(0, Math.min(dt, .05));
  for (const grain of this.grains) {
   grain.age += delta;
   grain.vy += 400 * delta;
   grain.x += grain.vx * delta;
   grain.y += grain.vy * delta;
  }
  this.grains = this.grains.filter(grain => grain.age < grain.life && grain.y < floor + 5);
  spinning.forEach((active, reel) => {
   const wasActive = this.previous[reel] ?? false;
   if (active) {
    this.carry[reel] = (this.carry[reel] ?? 0) + delta * (reduced ? 5 : turbo ? 21 : 30);
    const count = Math.floor(this.carry[reel]);
    this.carry[reel] -= count;
    if (count) this.emit(centers[reel], floor, count, false);
   } else {
    this.carry[reel] = 0;
    if (wasActive) this.emit(centers[reel], floor, reduced ? 4 : turbo ? 10 : 20, true);
   }
   this.previous[reel] = active;
  });
 }
 clear() { this.grains = []; this.previous = []; this.carry = []; }
}

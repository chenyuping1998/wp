/** Presentation only: never writes reel positions, results or book timing. */
export type ReelLook = { blur: number; landing: number; rail: number };
const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (v: number) => { const t = clamp(v); return t*t*(3-2*t); };
export const pulse = (age: number, strength = 1) => age < 0 || age > 1.8 ? 0 : strength * smooth(age/.075) * Math.exp(-age/.42);
export const reelLook = (motion: string, ageMs: number, turbo = false, fromBlur = 0): ReelLook => {
 const age = Math.max(0, ageMs);
 if (motion === 'spinning') return { blur: fromBlur + (1-fromBlur)*smooth(age/(turbo?45:110)), landing: 0, rail: .055 };
 const blur = fromBlur * (1-smooth(age/(turbo?55:125)));
 if (motion === 'bouncing') return { blur, landing: pulse(age/1000*3, turbo?.3:1), rail: 0 };
 return { blur, landing: 0, rail: 0 };
};
export const frameStep = (now: number, last: number, hidden: boolean) => hidden ? 0 : Math.min(.05, Math.max(0,(now-last)/1000));

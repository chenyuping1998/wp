import config from './config';
export type FeatureTier = { key: 'bonus' | 'bonus_hits'; tier: 'midnight_passage' | 'phantom_express'; mode: string; title: string; scatters: number; summary: string; splash: string; accent: number; titleKey: string };
const wheel = (config as any).wheel ?? {};
const cap = wheel.maxMultiplier ?? (config as any).multiplierWheel?.maxMultiplier ?? 100;
export const FEATURE_TIERS: FeatureTier[] = [
{ key:'bonus', tier:'midnight_passage', mode:'BONUS', title:'MIDNIGHT PASSAGE', scatters:3,
 summary:`Every paying free spin turns the pressure wheel. The new multiplier applies to all line wins immediately, never decreases and stays until the feature ends. Maximum multiplier: ${cap}×.`,
 splash:'EACH PAYING SPIN TURNS THE PRESSURE WHEEL. YOUR NEW MULTIPLIER APPLIES IMMEDIATELY AND NEVER FALLS.', accent:0x83e7c9,titleKey:'' },
{ key:'bonus_hits', tier:'phantom_express', mode:'BONUS_HITS', title:'PHANTOM EXPRESS', scatters:4,
 summary:`The premium wheel selects multiples of five, up to ${cap}×. Each paying spin turns it once. The selected multiplier applies to all line wins immediately and never decreases.`,
 splash:'THE PREMIUM PRESSURE WHEEL SELECTS MULTIPLES OF FIVE. EACH PAYING SPIN CAN RAISE YOUR HELD MULTIPLIER.',accent:0xe7be77,titleKey:'' }
];
export const tierByBonusTier = (tier:string|null) => FEATURE_TIERS.find(x=>x.tier===tier)??null;

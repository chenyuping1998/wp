/** Quiet stone and metal sounds leave room for the character performance. */
export const interfacePressGain=.45;
export const interfaceSoundDesign={
 open:[{cue:'sfx_button',gain:.28,rate:.94},{cue:'sfx_medusa_jewel',gain:.18,rate:.88}],
 close:[{cue:'sfx_button',gain:.25,rate:.9}],
 tab:[{cue:'sfx_button',gain:.34,rate:1.06}],
} as const;
export type InterfaceCue=keyof typeof interfaceSoundDesign;

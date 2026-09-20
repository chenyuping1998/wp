import { waitForTimeout } from 'utils-shared/wait';

export const wheelState = $state({ held: 1, previous: 1, selected: 1, values: [] as number[], visible: false, landed: false, rotation: 0 });

/** Presentation only: the authoritative book supplies the outcome and eligible set. */
export async function animateWheel(event: { previous: number; value: number; eligibleValues: number[] }, turbo: boolean) {
 wheelState.previous = event.previous;
 wheelState.held = event.previous;
 wheelState.selected = event.value;
 wheelState.values = [...event.eligibleValues];
 wheelState.rotation = 0;
 wheelState.landed = false;
 wheelState.visible = true;
 await waitForTimeout(turbo ? 100 : 320);
 const index = Math.max(0, wheelState.values.indexOf(event.value));
 wheelState.rotation = 1440 - index * 360 / Math.max(1, wheelState.values.length);
 await waitForTimeout(turbo ? 1250 : 2400);
 wheelState.held = event.value;
 wheelState.landed = true;
 await waitForTimeout(turbo ? 600 : 1000);
 wheelState.visible = false;
}

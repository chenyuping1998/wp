import UI from './src/components/UI.svelte';
import UiGameName from './src/components/UiGameName.svelte';

import messagesMap from './src/i18n/messagesMap';
import { i18nDerived } from './src/i18n/i18nDerived';
import { uiTheme, setUiTheme, type UiTheme } from './src/theme.svelte';

// Behaviour pieces for a game that draws its own bar (uiTheme.customLayout):
// the spin/stop decision, the stake-change cooldown and hold-to-repeat, and the
// replay controls — so a custom face does not have to re-derive rules
// certification already settled. (Ported from wp-dragon 80395e5e, 2026-11-11,
// for Wild Alchemy's bar v3; cycleTurbo is not, this tree has one turbo tier.)
import ButtonBetProvider from './src/components/ButtonBetProvider.svelte';
import ButtonReplay from './src/components/ButtonReplay.svelte';
import LabelReplayMultiplier from './src/components/LabelReplayMultiplier.svelte';
import { createBetRepeat, markBetChanged } from './src/platformUx.svelte';
export { ButtonBetProvider, ButtonReplay, LabelReplayMultiplier, createBetRepeat, markBetChanged };

export * from './src/types';

export { messagesMap, i18nDerived, UI, UiGameName, uiTheme, setUiTheme, type UiTheme };

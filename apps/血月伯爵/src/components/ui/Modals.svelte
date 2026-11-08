<script lang="ts">
	import type { Snippet } from 'svelte';

	// Reuse the shared modals for everything except the pay table / game rules,
	// which we override locally with WildParty-specific content.
	import ModalError from 'components-ui-html/src/components/ModalError.svelte';
	import ModalBetMenu from 'components-ui-html/src/components/ModalBetMenu.svelte';
	import ModalBuyBonusConfirm from 'components-ui-html/src/components/ModalBuyBonusConfirm.svelte';
	import ModalAutoSpin from 'components-ui-html/src/components/ModalAutoSpin.svelte';
	import ModalAutoSpinMessage from 'components-ui-html/src/components/ModalAutoSpinMessage.svelte';
	// Plain notifications — the insufficient-balance notice the bet button
	// raises. Distinct from ModalAutoSpinMessage above, which opens with "AUTO
	// PLAY HAS STOPPED DUE TO" and is only correct when a run actually stopped.
	import ModalMessage from 'components-ui-html/src/components/ModalMessage.svelte';
	import ModalSettings from 'components-ui-html/src/components/ModalSettings.svelte';

	// the feature-buy menu is this game's own (DeadwoodExpress's layout): scene,
	// hero, price and button per card — see ModalBuyBonus.svelte
	import ModalBuyBonus from './ModalBuyBonus.svelte';
	import ModalPayTable from './ModalPayTable.svelte';
	import ModalGameRules from './ModalGameRules.svelte';

	type Props = {
		version: Snippet;
	};

	const props: Props = $props();
</script>

<ModalError />
<ModalBetMenu />
<ModalBuyBonus />
<ModalBuyBonusConfirm />
<ModalAutoSpin />
<ModalAutoSpinMessage />
<ModalMessage />
<ModalPayTable />
<ModalGameRules />
<ModalSettings />

<!-- version snippet retained for parity with the shared Modals API -->
<div style="display:none">{@render props.version()}</div>


<style lang="scss">
 :global(html){font-size:16px;--gb-display-font:'Blood Moon Cinzel',Georgia,serif;--gb-body-font:'Segoe UI',sans-serif}
 :global(html[data-ui-skin='bloodmoon'] .pop-up-wrap){color:#e9d9c1;font-family:var(--gb-body-font)}
 :global(html[data-ui-skin='bloodmoon'] .pop-up-wrap h1),:global(html[data-ui-skin='bloodmoon'] .pop-up-wrap h2),:global(html[data-ui-skin='bloodmoon'] .pop-up-wrap h3){font-family:var(--gb-display-font);color:#e4c79f;letter-spacing:.08em}
 :global(html[data-ui-skin='bloodmoon'] .ui-popup-standard-content-wrap){background:linear-gradient(145deg,#231323,#0b0d18 65%,#321224)!important;border:1px solid #927151!important;border-radius:14px!important;box-shadow:0 20px 90px #000b,inset 0 0 0 5px #100e1b!important}
 :global(html[data-ui-skin='bloodmoon'] .button .rectangle){background:#201321!important;border:1px solid #715041!important;border-radius:7px!important}
 :global(html[data-ui-skin='bloodmoon'] .button:hover .rectangle){background:#482036!important;border-color:#c79b70!important}
 :global(html[data-ui-skin='bloodmoon'] .button span){color:#ecd6b8!important;font-family:var(--gb-display-font)}
 :global(html[data-ui-skin='bloodmoon'] .button:has(.selected) .rectangle),:global(html[data-ui-skin='bloodmoon'] .button:has(.rectangle[style*='2px white solid']) .rectangle){background:#5c1934!important;border-color:#d5ad77!important;box-shadow:0 0 12px #9b305744!important}
 :global(html[data-ui-skin='bloodmoon'] .close-button){color:#e9cda2!important}
 @media(max-width:500px){:global(html){font-size:13px}}
</style>

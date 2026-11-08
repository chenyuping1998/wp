<script lang="ts">
 import {type Snippet} from 'svelte';
 import {GlobalStyle} from 'components-ui-html';
 import {Authenticate,LoadI18n} from 'components-shared';
 import Game from '../components/Game.svelte';
 import LocalAuthenticate from '../components/LocalAuthenticate.svelte';
 import {setContext} from '../game/context';
 import {isLocalDemo} from '../game/demo';
 import messagesMap from '../i18n/messagesMap';
 const {children}:{children:Snippet}=$props();setContext();const local=isLocalDemo();
</script>
<GlobalStyle>
 {#if local}<LocalAuthenticate><LoadI18n {messagesMap}><Game/></LoadI18n></LocalAuthenticate>
 {:else}<Authenticate><LoadI18n {messagesMap}><Game/></LoadI18n></Authenticate>{/if}
</GlobalStyle>
{@render children()}

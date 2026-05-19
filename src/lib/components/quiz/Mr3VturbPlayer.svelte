<script lang="ts">
	import VturbPlayer from '$lib/components/ui/VturbPlayer.svelte';
	import { MR3_CTA_REVEAL_EVENT, MR3_VTURB_DELAY_SEC } from '$lib/constants/mr3-vturb';

	const PLAYER_SCRIPT_SRC =
		'https://scripts.converteai.net/a258539d-3567-40da-9aac-f9a431adf59f/players/6a0c79c1ec6c56d65aedf197/v4/player.js';
	const PLAYER_ID = 'vid-6a0c79c1ec6c56d65aedf197';

	function handleReveal() {
		document.dispatchEvent(new CustomEvent(MR3_CTA_REVEAL_EVENT));
	}
</script>

<div class="relative w-full mt-6 min-w-0">
	<VturbPlayer
		playerId={PLAYER_ID}
		scriptSrc={PLAYER_SCRIPT_SRC}
		revealHiddenAfterPlayback={{
			seconds: MR3_VTURB_DELAY_SEC,
			selectors: ['#quiz-mr3-cta-wrap', '.quiz-mr3-cta-delay'],
			persist: true
		}}
		onReveal={handleReveal}
	/>
</div>

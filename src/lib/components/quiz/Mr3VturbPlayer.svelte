<script lang="ts">
	import VturbPlayer from '$lib/components/ui/VturbPlayer.svelte';
	import { MR3_CTA_REVEAL_EVENT, MR3_VTURB_DELAY_SEC } from '$lib/constants/mr3-vturb';

	const PLAYER_SCRIPT_SRC =
		'https://scripts.converteai.net/cb674c2a-44f8-4af3-949d-f12749d714fb/players/6a2ad66d8001297f97e63237/v4/player.js';
	const PLAYER_ID = 'vid-6a2ad66d8001297f97e63237';

	/** Estável: evita re-attach do gate a cada render. Revela no tempo real do vídeo. */
	const MR3_PLAYBACK_GATE = {
		seconds: MR3_VTURB_DELAY_SEC,
		onReached: () => {
			document.dispatchEvent(new CustomEvent(MR3_CTA_REVEAL_EVENT));
		}
	};
</script>

<div class="relative w-full mt-6 min-w-0">
	<VturbPlayer playerId={PLAYER_ID} scriptSrc={PLAYER_SCRIPT_SRC} playbackGate={MR3_PLAYBACK_GATE} />
</div>

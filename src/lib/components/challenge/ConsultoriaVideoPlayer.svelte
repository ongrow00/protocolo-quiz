<script lang="ts">
	import VturbPlayer from '$lib/components/ui/VturbPlayer.svelte';

	const PLAYER_ID = 'vid-6a2adb430c1eee5bdae0d44b';
	const PLAYER_SCRIPT_SRC =
		'https://scripts.converteai.net/cb674c2a-44f8-4af3-949d-f12749d714fb/players/6a2adb430c1eee5bdae0d44b/v4/player.js';
</script>

<div class="relative w-full overflow-hidden rounded-t-challenge bg-[#1c1c1c]">
	<VturbPlayer
		playerId={PLAYER_ID}
		scriptSrc={PLAYER_SCRIPT_SRC}
		clickToTogglePlayback
	/>
</div>

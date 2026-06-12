<script lang="ts">
	import { postQuizStore } from '$lib/stores/post-quiz.store';

	const name = $derived($postQuizStore.name);

	function handleInput(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		postQuizStore.setName(target.value);
	}
</script>

<div class="flex flex-col gap-6">
	<div class="space-y-2">
		<h1 class="text-2xl font-extrabold text-heading leading-none">Qual é o seu nome?</h1>
		<p class="text-sm text-body leading-relaxed">
			Usaremos seu nome para personalizar sua experiência.
		</p>
	</div>
	<input
		type="text"
		inputmode="text"
		placeholder="Digite seu nome"
		value={name}
		oninput={handleInput}
		required
		minlength="2"
		class="w-full px-4 py-4 rounded-2xl border-2 border-line bg-surface text-body placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors"
		autocomplete="name"
	/>
</div>

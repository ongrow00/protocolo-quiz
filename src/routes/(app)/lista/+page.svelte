<script lang="ts">
	import { browser } from '$app/environment';
	import ChallengePageShell from '$lib/components/challenge/ChallengePageShell.svelte';
	import { SHOPPING_LIST, type ShoppingCategory } from '$lib/data/shopping-list';

	const STORAGE_KEY = 'pd-shopping-checked';

	function loadChecked(): Set<string> {
		if (!browser) return new Set();
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return new Set();
			return new Set(JSON.parse(raw) as string[]);
		} catch {
			return new Set();
		}
	}

	function saveChecked(set: Set<string>) {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
		} catch {}
	}

	let checked = $state<Set<string>>(loadChecked());

	function toggle(id: string) {
		const next = new Set(checked);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		checked = next;
		saveChecked(next);
	}

	function checkedInCat(cat: ShoppingCategory) {
		return cat.items.filter((i) => checked.has(i.id)).length;
	}
</script>

<ChallengePageShell>
	<div class="mx-auto max-w-sm space-y-5 pb-2">
		{#each SHOPPING_LIST as category (category.id)}
			{@const done = checkedInCat(category)}
			{@const total = category.items.length}
			{@const catDone = done === total}

			<section>
				<div class="mb-2 flex items-center justify-between px-1">
					<h2 class="text-[15px] font-bold leading-tight {catDone ? 'text-muted/50' : 'text-heading'}">
						{category.title}
					</h2>
					<span
						class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold {catDone
							? 'bg-accent/10 text-accent'
							: 'bg-surface-2 text-muted'}"
					>
						{done}/{total}
					</span>
				</div>

				<div class="overflow-hidden rounded-2xl bg-surface">
					{#each category.items as item, i (item.id)}
						{@const isChecked = checked.has(item.id)}
						{@const isLast = i === category.items.length - 1}

						<button
							type="button"
							onclick={() => toggle(item.id)}
							class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-surface-2/60 {!isLast
								? 'border-b border-line/40'
								: ''}"
						>
							<span
								class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 {isChecked
									? 'border-accent bg-accent'
									: 'border-line'}"
							>
								{#if isChecked}
									<svg
										class="h-3 w-3 text-bg"
										viewBox="0 0 12 12"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<polyline points="2,6 5,9 10,3" />
									</svg>
								{/if}
							</span>

							<span
								class="flex-1 text-[15px] font-medium leading-snug transition-all duration-150 {isChecked
									? 'text-muted/50 line-through'
									: 'text-body'}"
							>
								{item.name}
							</span>

							<span
								class="shrink-0 text-[13px] font-medium {isChecked ? 'text-muted/40' : 'text-muted'}"
							>
								{item.qty}
							</span>
						</button>
					{/each}
				</div>
			</section>
		{/each}

		<p class="px-1 text-center text-xs leading-relaxed text-muted/50">
			Quantidades estimadas para 14 dias, 1 pessoa.
		</p>
	</div>
</ChallengePageShell>

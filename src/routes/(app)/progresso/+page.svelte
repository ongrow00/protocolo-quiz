<script lang="ts">
	import ChallengeHeader from '$lib/components/challenge/ChallengeHeader.svelte';
	import ChallengeOverviewBar from '$lib/components/challenge/ChallengeOverviewBar.svelte';
	import { CHALLENGE_TOTAL_DAYS } from '$lib/constants/challenge-storage-keys';
	import { challengeStore } from '$lib/stores/challenge.store';
	import { getAllDaySummaries, globalPercentComplete } from '$lib/utils/challenge-progress';

	const globalPercent = $derived(globalPercentComplete($challengeStore));
	const summaries = $derived(getAllDaySummaries($challengeStore));

	const statusLabel = (status: string) => {
		if (status === 'completed') return 'Concluído';
		if (status === 'current') return 'Em andamento';
		if (status === 'locked') return 'Bloqueado';
		return 'Pendente';
	};
</script>

<div class="mx-auto flex w-full max-w-sm flex-col gap-5 pt-2">
		<ChallengeHeader subtitle="Acompanhe sua evolução" />

		<div class="rounded-2xl border border-line bg-surface p-6 text-center shadow-sm">
			<p class="text-5xl font-extrabold text-accent">{globalPercent}%</p>
			<p class="mt-1 text-sm text-muted">do desafio completo</p>
			<div class="mt-6 flex justify-center gap-8">
				<div>
					<p class="text-3xl font-extrabold text-heading">{$challengeStore.streak}</p>
					<p class="text-xs font-medium text-muted">dias de streak</p>
				</div>
				<div>
					<p class="text-3xl font-extrabold text-heading">
						{summaries.filter((d) => d.status === 'completed').length}
					</p>
					<p class="text-xs font-medium text-muted">de {CHALLENGE_TOTAL_DAYS} dias</p>
				</div>
			</div>
		</div>

		<ChallengeOverviewBar percent={globalPercent} label="Barra geral" />

		<div class="rounded-2xl border border-line bg-surface shadow-sm overflow-hidden">
			<p class="border-b border-line px-4 py-3 text-sm font-bold text-heading">Histórico</p>
			<ul class="divide-y divide-line">
				{#each summaries as item (item.day)}
					<li class="flex items-center justify-between px-4 py-3">
						<div>
							<p class="text-sm font-semibold text-heading">Dia {item.day}</p>
							<p class="text-xs text-muted">
								{item.mealsDone}/{item.mealsTotal} refeições · {item.percent}%
							</p>
						</div>
						<span
							class="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase
								{item.status === 'completed'
								? 'bg-accent-soft text-accent'
								: item.status === 'current'
									? 'bg-accent/10 text-accent'
									: 'bg-surface-2 text-muted'}"
						>
							{statusLabel(item.status)}
						</span>
					</li>
				{/each}
			</ul>
		</div>
</div>

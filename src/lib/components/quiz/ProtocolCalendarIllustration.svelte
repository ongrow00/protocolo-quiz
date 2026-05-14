<script lang="ts">
	import { onMount } from 'svelte';

	const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

	/** Uma célula da grelha: só `protocolDay` 1–14 nos dias do fluxo; null = vazio (alinhamento da semana). */
	type Cell = {
		protocolDay: number | null;
	};

	function startOfLocalDay(d: Date): Date {
		const x = new Date(d);
		x.setHours(0, 0, 0, 0);
		return x;
	}

	function addLocalDays(d: Date, n: number): Date {
		const x = new Date(d);
		x.setDate(x.getDate() + n);
		return x;
	}

	function dateKey(d: Date): string {
		return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
	}

	function buildGrid(): Cell[] {
		const today = startOfLocalDay(new Date());
		const day1 = addLocalDays(today, 1);
		const day14 = addLocalDays(day1, 13);

		const protocolByKey = new Map<string, number>();
		for (let i = 0; i < 14; i++) {
			const d = addLocalDays(day1, i);
			protocolByKey.set(dateKey(d), i + 1);
		}

		const gridStart = new Date(day1);
		while (gridStart.getDay() !== 0) {
			gridStart.setDate(gridStart.getDate() - 1);
		}
		const gridEnd = new Date(day14);
		while (gridEnd.getDay() !== 6) {
			gridEnd.setDate(gridEnd.getDate() + 1);
		}

		const cells: Cell[] = [];
		for (let d = new Date(gridStart); d.getTime() <= gridEnd.getTime(); d.setDate(d.getDate() + 1)) {
			const k = dateKey(d);
			cells.push({
				protocolDay: protocolByKey.get(k) ?? null
			});
		}

		return cells;
	}

	let cells = $state<Cell[]>([]);

	onMount(() => {
		cells = buildGrid();
	});
</script>

<div class="w-full max-w-sm mx-auto p-4" aria-hidden="true">
	<div class="grid grid-cols-7 gap-y-2 text-[10px] font-medium text-muted mb-3">
		{#each WEEKDAYS as w}
			<div class="text-center py-2">{w}</div>
		{/each}
	</div>
	{#if cells.length > 0}
		<div class="grid grid-cols-7 gap-y-4 gap-x-1 text-sm">
			{#each cells as cell, i (i)}
				<div class="relative flex h-11 items-center justify-center">
					{#if cell.protocolDay != null}
						<span
							class="protocol-cell"
							style="--n: {cell.protocolDay}"
							title="Dia {cell.protocolDay} do protocolo"
						>
							<svg class="protocol-svg" viewBox="0 0 36 36" aria-hidden="true">
								<rect
									class="protocol-ring-path"
									x="2"
									y="2"
									width="32"
									height="32"
									rx="5"
									ry="5"
									fill="none"
									stroke="var(--color-accent)"
									stroke-width="2"
									pathLength="100"
								/>
							</svg>
							<span class="protocol-inner">{cell.protocolDay}</span>
							<span class="protocol-done-badge">
								<svg viewBox="0 0 12 12" class="protocol-done-check" aria-hidden="true">
									<path
										fill="none"
										stroke="currentColor"
										stroke-width="2.2"
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M2.5 6.2 5 8.7 9.8 2.8"
									/>
								</svg>
							</span>
						</span>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-7 gap-y-4 gap-x-1">
			{#each Array.from({ length: 42 }, (_, idx) => idx) as idx (idx)}
				<div class="h-11 rounded-lg bg-surface-2/60 animate-pulse" aria-hidden="true"></div>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Traço do perímetro a “desenhar” (loading na borda), depois preenchimento cinza. */
	@keyframes protocol-ring-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes protocol-inner-fill {
		to {
			background-color: var(--color-surface-2);
			color: var(--color-heading);
			box-shadow: inset 0 0 0 1px var(--color-line);
		}
	}

	@keyframes protocol-badge-pop {
		0% {
			opacity: 0;
			transform: scale(0.35);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.protocol-cell {
		--cell-total: 0.6s;
		--stagger: calc((var(--n, 1) - 1) * (10s - var(--cell-total)) / 13);
		position: relative;
		box-sizing: border-box;
		display: block;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.375rem;
		overflow: visible;
	}

	.protocol-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.protocol-ring-path {
		stroke-dasharray: 100;
		stroke-dashoffset: 100;
		stroke-linecap: round;
		stroke-linejoin: round;
		animation: protocol-ring-draw 0.44s ease-out forwards;
		animation-delay: var(--stagger);
	}

	.protocol-inner {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		line-height: 1;
		font-weight: 600;
		color: var(--color-muted);
		background-color: transparent;
		animation: protocol-inner-fill 0.16s ease-out forwards;
		animation-delay: calc(var(--stagger) + 0.44s);
	}

	.protocol-done-badge {
		position: absolute;
		top: -5px;
		right: -5px;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 15px;
		height: 15px;
		border-radius: 9999px;
		background-color: #22c55e;
		color: #ffffff;
		box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
		opacity: 0;
		transform: scale(0.35);
		pointer-events: none;
		animation: protocol-badge-pop 0.3s cubic-bezier(0.34, 1.45, 0.64, 1) forwards;
		animation-delay: calc(var(--stagger) + 0.44s + 0.16s);
	}

	.protocol-done-check {
		width: 9px;
		height: 9px;
		display: block;
	}

	@media (prefers-reduced-motion: reduce) {
		.protocol-ring-path {
			animation: none;
			stroke-dashoffset: 0;
			opacity: 0;
		}

		.protocol-inner {
			animation: none;
			background-color: var(--color-surface-2);
			color: var(--color-heading);
			box-shadow: inset 0 0 0 1px var(--color-line);
		}

		.protocol-done-badge {
			animation: none;
			opacity: 1;
			transform: scale(1);
		}
	}
</style>

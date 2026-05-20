<script lang="ts">
	import { page } from '$app/stores';

	type TabId = 'protocolo' | 'lista' | 'treino' | 'consultoria';

	const tabs: { id: TabId; label: string; href: string; match: (path: string) => boolean }[] = [
		{ id: 'protocolo', label: 'Protocolo', href: '/inicio', match: (p) => p === '/inicio' },
		{ id: 'lista', label: 'Lista', href: '/lista', match: (p) => p === '/lista' },
		{ id: 'treino', label: 'Treino', href: '/treino', match: (p) => p === '/treino' },
		{
			id: 'consultoria',
			label: 'Consultoria',
			href: '/consultoria',
			match: (p) => p === '/consultoria'
		}
	];
</script>

<div
	class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
	style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))"
>
	<nav
		class="pointer-events-auto grid h-[4rem] w-[300px] grid-cols-4 items-center rounded-[1.75rem] border border-line/40 bg-surface px-3"
		aria-label="Navegação principal"
	>
		{#each tabs as tab (tab.id)}
			{@const active = tab.match($page.url.pathname)}
			<a
				href={tab.href}
				class="flex flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 py-1 transition-colors duration-200 {active
					? 'text-accent'
					: 'text-[#c5c5c5]'}"
				aria-current={active ? 'page' : undefined}
			>
				<span
					class="flex h-7 w-7 items-center justify-center {tab.id === 'consultoria'
						? 'relative'
						: ''}"
					aria-hidden="true"
				>
					{#if tab.id === 'protocolo'}
						{#if active}
							<svg class="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path
									d="M9 3a1 1 0 00-1 1v1H6a3 3 0 00-3 3v11a3 3 0 003 3h12a3 3 0 003-3V8a3 3 0 00-3-3h-2V4a1 1 0 10-2 0v1H10V4a1 1 0 00-1-1zm-1 6a1 1 0 011-1h6a1 1 0 110 2H9a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H9a1 1 0 01-1-1z"
								/>
							</svg>
						{:else}
							<svg
								class="h-[22px] w-[22px]"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.75"
								aria-hidden="true"
							>
								<rect x="4" y="5" width="16" height="16" rx="2" />
								<path d="M8 3v2M16 3v2M4 10h16M9 14h2M13 14h2M9 17h2" stroke-linecap="round" />
							</svg>
						{/if}
					{:else if tab.id === 'lista'}
						{#if active}
							<svg class="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path
									fill-rule="evenodd"
									d="M3 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V5zm0 6a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm7-12a1 1 0 011-1h10a1 1 0 110 2H11a1 1 0 01-1-1zm0 6a1 1 0 011-1h10a1 1 0 110 2H11a1 1 0 01-1-1zm0 6a1 1 0 011-1h10a1 1 0 110 2H11a1 1 0 01-1-1z"
									clip-rule="evenodd"
								/>
							</svg>
						{:else}
							<svg
								class="h-[22px] w-[22px]"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.75"
								aria-hidden="true"
							>
								<path d="M9 6h12M9 12h12M9 18h12" stroke-linecap="round" />
								<circle cx="5" cy="6" r="1" fill="currentColor" stroke="none" />
								<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
								<circle cx="5" cy="18" r="1" fill="currentColor" stroke="none" />
							</svg>
						{/if}
					{:else if tab.id === 'treino'}
						{#if active}
							<svg
								class="h-[22px] w-[22px]"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path
									d="M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7-4.077 0-8.153-.82-10.371-2.462c-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3a2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1"
								/>
								<path d="M15 14a5 5 0 0 0-7.584 2" />
								<path d="M9.964 6.825C8.019 7.977 9.5 13 8 15" />
							</svg>
						{:else}
							<svg
								class="h-[22px] w-[22px]"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.75"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path
									d="M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7-4.077 0-8.153-.82-10.371-2.462c-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3a2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1"
								/>
								<path d="M15 14a5 5 0 0 0-7.584 2" />
								<path d="M9.964 6.825C8.019 7.977 9.5 13 8 15" />
							</svg>
						{/if}
					{:else if active}
						<svg class="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path
								d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676a.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"
							/>
						</svg>
					{:else}
						<svg
							class="h-[22px] w-[22px]"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.75"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path
								d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676a.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"
							/>
						</svg>
					{/if}
					{#if tab.id === 'consultoria' && !active}
						<span class="nav-notification-dot" aria-hidden="true"></span>
					{/if}
				</span>
				<span class="text-[10px] font-semibold leading-none tracking-tight">{tab.label}</span>
			</a>
		{/each}
	</nav>
</div>

<style>
	.nav-notification-dot {
		position: absolute;
		top: 0;
		right: -2px;
		width: 7px;
		height: 7px;
		border-radius: 9999px;
		background-color: var(--color-farol-red);
		box-shadow: 0 0 0 1.5px var(--color-surface);
		animation: nav-notification-blink 1.1s ease-in-out infinite;
	}

	@keyframes nav-notification-blink {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.2;
			transform: scale(0.85);
		}
	}
</style>

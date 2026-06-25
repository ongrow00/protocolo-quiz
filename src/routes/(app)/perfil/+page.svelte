<script lang="ts">
	import { goto } from '$app/navigation';
	import ProfileMenuRow from '$lib/components/challenge/ProfileMenuRow.svelte';
	import ProfileMenuSection from '$lib/components/challenge/ProfileMenuSection.svelte';
	import ProfileDadosPessoaisSheet from '$lib/components/profile/ProfileDadosPessoaisSheet.svelte';
	import ProfileLegalSheet from '$lib/components/profile/ProfileLegalSheet.svelte';
	import ProfilePaymentHistorySheet from '$lib/components/profile/ProfilePaymentHistorySheet.svelte';
	import { authStore } from '$lib/stores/auth.store';
	import { accessStore } from '$lib/stores/access.store';
	import { challengeStore } from '$lib/stores/challenge.store';
	import { postQuizStore } from '$lib/stores/post-quiz.store';
	import { profileStore } from '$lib/stores/profile.store';

	const LEGAL_SHEET_IDS = [
		'termos-de-uso',
		'politica-de-privacidade',
		'politica-de-assinatura',
		'garantia-de-reembolso'
	] as const;

	type LegalSheetId = (typeof LEGAL_SHEET_IDS)[number];

	type SheetId = 'dados-pessoais' | 'historico-pagamentos' | LegalSheetId;

	let activeSheet = $state<SheetId | null>(null);

	function openSheet(id: SheetId) {
		activeSheet = id;
	}

	function closeSheet() {
		activeSheet = null;
	}

	function isLegalSheet(id: SheetId | null): id is LegalSheetId {
		return id !== null && (LEGAL_SHEET_IDS as readonly string[]).includes(id);
	}

	async function signOut() {
		await authStore.signOut();
		accessStore.reset();
		challengeStore.reset();
		postQuizStore.reset();
		profileStore.reset();
		goto('/', { replaceState: true });
	}
</script>

<div class="mx-auto flex w-full max-w-sm flex-col gap-7 pt-2 pb-6">
	<ProfileMenuSection title="Configurações">
		<ProfileMenuRow label="Dados pessoais" isLast onclick={() => openSheet('dados-pessoais')}>
			{#snippet icon()}
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<rect x="3" y="5" width="18" height="14" rx="2" />
					<circle cx="9" cy="12" r="2" />
					<path d="M15 10h4M15 14h4" stroke-linecap="round" />
				</svg>
			{/snippet}
		</ProfileMenuRow>
	</ProfileMenuSection>

	<ProfileMenuSection title="Pagamentos">
		<ProfileMenuRow label="Histórico de pagamentos" isLast onclick={() => openSheet('historico-pagamentos')}>
			{#snippet icon()}
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<circle cx="12" cy="12" r="8" />
					<path d="M12 8v4l2.5 2.5" stroke-linecap="round" stroke-linejoin="round" />
					<path d="M16 4l1.5-1.5M8 4 6.5 2.5" stroke-linecap="round" />
				</svg>
			{/snippet}
		</ProfileMenuRow>
	</ProfileMenuSection>

	<ProfileMenuSection title="Termos">
		<ProfileMenuRow label="Termos de uso" onclick={() => openSheet('termos-de-uso')}>
			{#snippet icon()}
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path d="M8 4h8l3 3v13H5V4l3-3z" stroke-linejoin="round" />
					<path d="M9 12h6M9 16h4" stroke-linecap="round" />
				</svg>
			{/snippet}
		</ProfileMenuRow>
		<ProfileMenuRow label="Política de Privacidade" onclick={() => openSheet('politica-de-privacidade')}>
			{#snippet icon()}
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z" stroke-linejoin="round" />
				</svg>
			{/snippet}
		</ProfileMenuRow>
		<ProfileMenuRow label="Política de assinatura" onclick={() => openSheet('politica-de-assinatura')}>
			{#snippet icon()}
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path d="M8 4h8l3 3v13H5V4l3-3z" stroke-linejoin="round" />
					<path d="M14 4v3h3" />
					<path d="M9 15l2 2 4-4" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			{/snippet}
		</ProfileMenuRow>
		<ProfileMenuRow label="Garantia de reembolso" isLast onclick={() => openSheet('garantia-de-reembolso')}>
			{#snippet icon()}
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path d="M12 4a8 8 0 1 0 8 8" stroke-linecap="round" />
					<path d="M12 8v4l2 2" stroke-linecap="round" stroke-linejoin="round" />
					<path d="M4 4v4h4M4 8l4-4" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			{/snippet}
		</ProfileMenuRow>
	</ProfileMenuSection>

	<ProfileMenuSection title="Ações">
		<ProfileMenuRow label="Sair" isLast onclick={signOut}>
			{#snippet icon()}
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path d="M10 17l-5-5 5-5" stroke-linecap="round" stroke-linejoin="round" />
					<path d="M5 12h11M15 5h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2" stroke-linecap="round" />
				</svg>
			{/snippet}
		</ProfileMenuRow>
	</ProfileMenuSection>
</div>

<ProfileDadosPessoaisSheet open={activeSheet === 'dados-pessoais'} onClose={closeSheet} />

<ProfilePaymentHistorySheet
	open={activeSheet === 'historico-pagamentos'}
	onClose={closeSheet}
/>

<ProfileLegalSheet
	open={isLegalSheet(activeSheet)}
	docId={isLegalSheet(activeSheet) ? activeSheet : null}
	onClose={closeSheet}
/>

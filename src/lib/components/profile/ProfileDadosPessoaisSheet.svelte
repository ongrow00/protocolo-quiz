<script lang="ts">
	import InsetFormRow from '$lib/components/profile/InsetFormRow.svelte';
	import InsetFormSection from '$lib/components/profile/InsetFormSection.svelte';
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import { get } from 'svelte/store';
	import { profileStore, type ProfileData } from '$lib/stores/profile.store';
	import { postQuizStore } from '$lib/stores/post-quiz.store';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let draft = $state<ProfileData>({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		documentType: 'CPF',
		document: '',
		street: '',
		number: '',
		neighborhood: '',
		city: '',
		state: '',
		zip: '',
		country: 'Brasil',
		photoDataUrl: null
	});

	$effect(() => {
		if (!open) return;
		const data = { ...get(profileStore) };
		const nameParts = $postQuizStore.name?.trim().split(/\s+/).filter(Boolean) ?? [];
		if (!data.firstName && nameParts[0]) data.firstName = nameParts[0];
		if (!data.lastName && nameParts.length > 1) data.lastName = nameParts.slice(1).join(' ');
		draft = data;
	});

	const fullName = $derived(
		[draft.firstName, draft.lastName].filter(Boolean).join(' ') || '—'
	);

	const inputClass =
		'w-full min-w-0 bg-transparent text-right text-[14px] font-medium text-heading outline-none placeholder:text-muted/40';

	function save() {
		profileStore.setAll({ ...draft });
		onClose();
	}

	function handleClose() {
		onClose();
	}
</script>

<BottomSheet {open} toolbar onClose={handleClose} onSave={save}>
	<div class="flex flex-col gap-6 pb-4">
		<InsetFormSection title="Identificação">
			<InsetFormRow label="Nome">
				{#snippet input()}
					<input type="text" class={inputClass} bind:value={draft.firstName} placeholder="Nome" />
				{/snippet}
			</InsetFormRow>
			<InsetFormRow label="Sobrenome">
				{#snippet input()}
					<input type="text" class={inputClass} bind:value={draft.lastName} placeholder="Sobrenome" />
				{/snippet}
			</InsetFormRow>
			<InsetFormRow label="Nome completo">
				{#snippet value()}
					<span class="text-right text-[14px] font-medium text-heading">{fullName}</span>
				{/snippet}
			</InsetFormRow>
			<InsetFormRow label="E-mail">
				{#snippet input()}
					<input
						type="email"
						class={inputClass}
						bind:value={draft.email}
						placeholder="seu@email.com"
						autocomplete="email"
					/>
				{/snippet}
			</InsetFormRow>
			<InsetFormRow label="Telefone">
				{#snippet input()}
					<input
						type="tel"
						class={inputClass}
						bind:value={draft.phone}
						placeholder="(00) 00000-0000"
						autocomplete="tel"
					/>
				{/snippet}
			</InsetFormRow>
			<InsetFormRow label="Tipo de documento" showChevron>
				{#snippet value()}
					<span class="text-[14px] font-medium text-heading">{draft.documentType}</span>
				{/snippet}
			</InsetFormRow>
			<InsetFormRow label="Documento" isLast>
				{#snippet input()}
					<input
						type="text"
						class={inputClass}
						bind:value={draft.document}
						placeholder="000.000.000-00"
						inputmode="numeric"
					/>
				{/snippet}
			</InsetFormRow>
		</InsetFormSection>

		<InsetFormSection title="Endereço">
			<InsetFormRow label="Logradouro">
				{#snippet input()}
					<input type="text" class={inputClass} bind:value={draft.street} placeholder="Rua, avenida" />
				{/snippet}
			</InsetFormRow>
			<InsetFormRow label="Número">
				{#snippet input()}
					<input type="text" class={inputClass} bind:value={draft.number} placeholder="Nº" />
				{/snippet}
			</InsetFormRow>
			<InsetFormRow label="Bairro">
				{#snippet input()}
					<input type="text" class={inputClass} bind:value={draft.neighborhood} placeholder="Bairro" />
				{/snippet}
			</InsetFormRow>
			<InsetFormRow label="Cidade">
				{#snippet input()}
					<input type="text" class={inputClass} bind:value={draft.city} placeholder="Cidade" />
				{/snippet}
			</InsetFormRow>
			<InsetFormRow label="Estado">
				{#snippet input()}
					<input type="text" class={inputClass} bind:value={draft.state} placeholder="Estado" />
				{/snippet}
			</InsetFormRow>
			<InsetFormRow label="CEP">
				{#snippet input()}
					<input
						type="text"
						class={inputClass}
						bind:value={draft.zip}
						placeholder="00000-000"
						inputmode="numeric"
					/>
				{/snippet}
			</InsetFormRow>
			<InsetFormRow label="País" isLast>
				{#snippet input()}
					<input type="text" class={inputClass} bind:value={draft.country} placeholder="País" />
				{/snippet}
			</InsetFormRow>
		</InsetFormSection>
	</div>
</BottomSheet>

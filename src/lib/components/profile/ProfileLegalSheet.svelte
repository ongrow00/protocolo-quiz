<script lang="ts">
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import { LEGAL_DOCS } from '$lib/data/legal-docs';

	interface Props {
		open: boolean;
		docId: string | null;
		onClose: () => void;
	}

	let { open, docId, onClose }: Props = $props();

	const doc = $derived(docId ? LEGAL_DOCS[docId] : undefined);
</script>

<BottomSheet open={open && !!doc} title={doc?.title ?? ''} onClose={onClose}>
	{#if doc}
		<p class="mb-4 text-xs text-muted">Última atualização: {doc.updatedAt}</p>
		<div class="legal-body pb-4">
			{@html doc.html}
		</div>
	{/if}
</BottomSheet>

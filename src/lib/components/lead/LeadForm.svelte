<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { quizStore } from '$lib/stores/quiz.store';
	import { postQuizStore } from '$lib/stores/post-quiz.store';
	import { leadStore } from '$lib/stores/lead.store';
	import { resultProfile } from '$lib/stores/result.store';
	import { sessionStore } from '$lib/stores/session.store';
	import { submitLead } from '$lib/services/lead.service';
	import { trackLeadSubmit } from '$lib/services/analytics.service';
	import { validateLeadForm } from '$lib/utils/validation';
	import { primaryObjectiveLabel } from '$lib/utils/primary-objective';
	import FormField from './FormField.svelte';
	import SubmitButton from './SubmitButton.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';

	const leadState = $derived($leadStore);
	const profile = $derived($resultProfile);
	const quiz = $derived($quizStore);
	const session = $derived($sessionStore);
	const postQuiz = $derived($postQuizStore);

	let fieldErrors = $state({} as Record<string, string>);

	/** Nome em /nome fica no postQuizStore; o formulário usa leadStore — alinhar para não enviar vazio ao Supabase */
	$effect(() => {
		const fromPost = postQuiz.name.trim();
		const inLead = leadState.name.trim();
		if (fromPost && !inLead) {
			untrack(() => leadStore.setField('name', fromPost));
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		const resolvedName = leadState.name.trim() || postQuiz.name.trim();
		const { valid, errors } = validateLeadForm(resolvedName, leadState.email);
		fieldErrors = errors;
		if (!valid) return;

		if (!profile) {
			leadStore.setError('Perfil não encontrado. Por favor, reinicie o quiz.');
			return;
		}

		leadStore.setLoading(true);

		try {
			const objective = primaryObjectiveLabel(quiz.answers);
			const waRaw = (postQuiz.whatsapp || '').replace(/\D/g, '');
			const waLocal =
				waRaw.startsWith('55') && waRaw.length > 2 ? waRaw.slice(2) : waRaw;
			const whatsappPayload =
				waLocal.length >= 10 && waLocal.length <= 11 ? waRaw.slice(0, 32) : undefined;

			await submitLead({
				...(quiz.funnelSessionId ? { funnelSessionId: quiz.funnelSessionId } : {}),
				name: resolvedName,
				email: leadState.email.trim().toLowerCase(),
				profileId: profile.id,
				scores: quiz.scores,
				answers: quiz.answers,
				visitedQuestions: quiz.visitedQuestions,
				startedAt: quiz.startedAt,
				completedAt: quiz.completedAt,
				whatsapp: whatsappPayload,
				objective: objective,
				clickedComecarAgora: postQuiz.clickedComecarAgora,
				utm: Object.keys(session.utm).length > 0 ? session.utm : undefined,
				offer: session.offer ?? undefined
			});

			trackLeadSubmit(profile.id);
			leadStore.setSubmitted();
			quizStore.reset();
			await goto('/obrigado');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Algo deu errado. Por favor, tente novamente.';
			leadStore.setError(msg);
		}
	}
</script>

<form onsubmit={handleSubmit} novalidate class="flex flex-col gap-5">
	<div class="space-y-1">
		<h2 class="text-xl font-bold text-heading leading-snug">Receba seu plano personalizado</h2>
		<p class="text-sm text-muted">
			Enviamos seu resultado completo + próximos passos diretamente no seu e-mail.
		</p>
	</div>

	<FormField
		id="name"
		label="Seu nome"
		value={leadState.name}
		placeholder="Como podemos te chamar?"
		autocomplete="given-name"
		error={fieldErrors.name}
		oninput={(v) => leadStore.setField('name', v)}
	/>

	<FormField
		id="email"
		label="Seu melhor e-mail"
		type="email"
		value={leadState.email}
		placeholder="voce@exemplo.com"
		autocomplete="email"
		error={fieldErrors.email}
		oninput={(v) => leadStore.setField('email', v)}
	/>

	{#if leadState.error}
		<ErrorMessage message={leadState.error} />
	{/if}

	<SubmitButton loading={leadState.loading} />

	<p class="text-xs text-center text-muted">
		Sem spam. Você pode cancelar a qualquer momento.
	</p>
</form>

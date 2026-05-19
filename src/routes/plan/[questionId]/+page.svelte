<script lang="ts">
	import { browser } from '$app/environment';
	import { goto, afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { get } from 'svelte/store';
	import { quizStore, currentQuestion, quizNavigationEnded } from '$lib/stores/quiz.store';
	import { quizConfig } from '$lib/data/quiz.config';
	import { computeVisibleQuestions } from '$lib/utils/branching';
	import QuizShell from '$lib/components/quiz/QuizShell.svelte';

	// Quando as respostas escondem o passo atual (ex.: ramo de medicamento), alinha URL/store sem depender só de afterNavigate
	$effect(() => {
		if (!browser) return;
		const state = $quizStore;
		if (!state.startedAt) return;
		const qid = page.params.questionId;
		if (!qid) return;
		const visible = computeVisibleQuestions(quizConfig.questions, state.answers);
		const urlOk = visible.some((q) => q.id === qid);
		const storeId = state.currentQuestionId;
		const storeOk = storeId != null && visible.some((q) => q.id === storeId);

		if (!urlOk) {
			const def = quizConfig.questions.find((x) => x.id === qid);
			const order = def?.order ?? 0;
			const candidate = visible.find((q) => q.order >= order) ?? visible[0];
			if (candidate) {
				quizStore.goTo(candidate.id);
				void goto(`/plan/${candidate.id}`, { replaceState: true });
			}
			return;
		}
		if (!storeOk && storeId != null) {
			quizStore.goTo(qid);
		}
	});

	// Sincroniza store com URL após navegação (refresh, link direto, browser back/forward, avançar/voltar).
	afterNavigate(({ to }) => {
		const qid = to?.params?.questionId;
		if (qid) quizNavigationEnded.update((n) => n + 1); // rede de segurança: libera lock advancing
		if (!qid) return;
		const state = get(quizStore);
		if (state.currentQuestionId === qid) return;
		const visible = computeVisibleQuestions(quizConfig.questions, state.answers);
		if (visible.some((q) => q.id === qid)) {
			quizStore.goTo(qid);
		} else if (state.currentQuestionId && visible.some((q) => q.id === state.currentQuestionId)) {
			const targetPath = `/plan/${state.currentQuestionId}`;
			if (to?.url?.pathname !== targetPath) {
				goto(targetPath, { replaceState: true });
			}
		} else {
			// URL e store inválidos (ex.: link antigo) — vai para primeira visível ou home
			const first = visible[0];
			if (first) {
				quizStore.goTo(first.id);
				goto(`/plan/${first.id}`, { replaceState: true });
			} else {
				goto('/plan', { replaceState: true });
			}
		}
	});
</script>

<svelte:head>
	<title>Protocolo Desbloqueio</title>
</svelte:head>

{#if $currentQuestion}
	<QuizShell />
{/if}

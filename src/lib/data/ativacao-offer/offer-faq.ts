import type { OfferFaq } from '$lib/components/post-quiz/ResultsOfferPage.svelte';

export const ATIVACAO_OFFER_FAQ: OfferFaq = {
	intro:
		'Aqui estão algumas das perguntas que mais recebemos sobre a Consultoria Liberdade.',
	items: [
		{
			q: 'Vou passar fome durante o acompanhamento?',
			a: 'Não. O plano é adaptado à sua rotina e preferências para que você consiga emagrecer sem viver presa em restrições extremas.'
		},
		{
			q: 'E se eu tiver uma rotina corrida e não conseguir seguir tudo certinho?',
			a: 'A consultoria foi criada para a vida real. Ajustamos o plano conforme sua rotina, horários, viagens e dificuldades do dia a dia.'
		},
		{
			q: 'Posso comer pizza, sushi, hambúrguer ou sair no fim de semana?',
			a: 'Sim. Você terá acesso à Lista da Liberdade, com centenas de refeições adaptáveis para continuar emagrecendo sem deixar de viver.'
		},
		{
			q: 'O suporte realmente funciona todos os dias?',
			a: 'Sim. Você terá acompanhamento da equipe clínica de segunda a sábado diretamente pelo WhatsApp.'
		},
		{
			q: 'Preciso treinar ou ir para academia para ter resultados?',
			a: 'Não necessariamente. O foco principal é o destravamento metabólico e a alimentação adaptada ao seu corpo e objetivo.'
		},
		{
			q: 'Como vou receber meu plano e acompanhar minha evolução?',
			a: 'Tudo fica disponível no aplicativo WebDiet, onde você acompanha plano alimentar, evolução e suporte da equipe.'
		},
		{
			q: 'E se eu já tentei emagrecer várias vezes e sempre engordei tudo de novo?',
			a: 'A consultoria foi criada exatamente para evitar o efeito sanfona, estabilizando os resultados após os primeiros 14 dias.'
		},
		{
			q: 'E se eu entrar e achar que não faz sentido para mim?',
			a: 'Você tem 21 dias de garantia incondicional. Basta chamar no WhatsApp e devolvemos 100% do valor sem burocracia.'
		}
	]
};

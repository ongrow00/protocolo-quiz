export type MealFollowUpAnswer = 'sim' | 'nao';

export type MealFollowUpQuestion = {
	id: string;
	text: string;
};

export const MEAL_FOLLOW_UP_QUESTIONS: MealFollowUpQuestion[] = [
	{
		id: 'maintain-alone-14d',
		text: 'Você sente que conseguiria manter esse resultado sozinha depois dos 14 dias?'
	},
	{
		id: 'yo-yo-before',
		text: 'Você já emagreceu antes… e depois ganhou peso novamente?'
	},
	{
		id: 'know-maintain-weight',
		text: 'Hoje, você sente que sabe exatamente como manter o peso sem voltar ao efeito sanfona?'
	},
	{
		id: 'need-proximity',
		text: 'Você sente que precisa de mais proximidade para transformar seu corpo de forma definitiva?'
	}
];

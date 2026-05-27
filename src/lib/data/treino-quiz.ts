export interface TreinoQuizShowIf {
	questionId: string;
	values: string[];
}

export interface TreinoQuizQuestion {
	id: string;
	text: string;
	type: 'single' | 'multiple';
	options: { id: string; text: string }[];
	maxSelections?: number;
	showIf?: TreinoQuizShowIf;
}

export const treinoQuizQuestions: TreinoQuizQuestion[] = [
	{
		id: 'treino_local',
		text: 'Onde você vai treinar?',
		type: 'single',
		options: [
			{ id: 'academia', text: 'Academia' },
			{ id: 'casa', text: 'Em casa' }
		]
	},
	{
		id: 'treino_equipamentos_academia',
		text: 'Quais equipamentos você terá disponível?',
		type: 'multiple',
		showIf: { questionId: 'treino_local', values: ['academia'] },
		options: [
			{ id: 'academia_completa', text: 'Academia completa' },
			{ id: 'leg_press', text: 'Leg press' },
			{ id: 'cadeira_extensora', text: 'Cadeira extensora' },
			{ id: 'puxador', text: 'Puxador' },
			{ id: 'smith', text: 'Smith' },
			{ id: 'halteres', text: 'Halteres' },
			{ id: 'colchonete', text: 'Colchonete' },
			{ id: 'step', text: 'Step / plataforma' }
		]
	},
	{
		id: 'treino_equipamentos_casa',
		text: 'Quais equipamentos você terá disponível?',
		type: 'multiple',
		showIf: { questionId: 'treino_local', values: ['casa'] },
		options: [
			{ id: 'nenhum_equipamento', text: 'Só peso do corpo e móveis' },
			{ id: 'halteres', text: 'Halteres' },
			{ id: 'mochila_peso', text: 'Mochila com peso' },
			{ id: 'colchonete', text: 'Colchonete' },
			{ id: 'sofa_cadeira', text: 'Sofá/cadeira firme' },
			{ id: 'step', text: 'Step' }
		]
	},
	{
		id: 'treino_frequencia',
		text: 'Quantos dias consegue treinar por semana?',
		type: 'single',
		options: [
			{ id: '2x', text: '2x por semana' },
			{ id: '3x', text: '3x por semana' },
			{ id: '4x', text: '4x por semana' },
			{ id: '5x', text: '5x por semana' },
			{ id: '6x', text: '6x por semana' },
			{ id: 'todos', text: 'Todos os dias' }
		]
	},
	{
		id: 'treino_dores',
		text: 'Você possui dores ou limitações físicas?',
		type: 'multiple',
		options: [
			{ id: 'nenhuma', text: 'Nenhuma' },
			{ id: 'joelho', text: 'Joelho' },
			{ id: 'lombar', text: 'Lombar' },
			{ id: 'ombro', text: 'Ombro' },
			{ id: 'quadril', text: 'Quadril' },
			{ id: 'punho', text: 'Punho' },
			{ id: 'tornozelo', text: 'Tornozelo' }
		]
	},
	{
		id: 'treino_restricoes_exercicio',
		text: 'Existe algum exercício que você não consegue de fazer?',
		type: 'multiple',
		options: [
			{ id: 'agachamento', text: 'Agachamento' },
			{ id: 'flexao', text: 'Flexão de braço' },
			{ id: 'prancha', text: 'Prancha' },
			{ id: 'passada', text: 'Passada' },
			{ id: 'chao', text: 'Exercícios no chão' },
			{ id: 'salto', text: 'Exercícios com salto' }
		]
	}
];

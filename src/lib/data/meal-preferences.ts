export type MealBlockId = 'cafe' | 'almoco' | 'lanche' | 'janta';

export type MealFoodItem = {
	id: string;
	label: string;
	emoji: string;
};

export type MealBlock = {
	id: MealBlockId;
	title: string;
	items: MealFoodItem[];
};

export const MEAL_SELECTION_LIMIT = 4;

const BREAKFAST_ITEMS: MealFoodItem[] = [
	{ id: 'pao-frango', label: 'Pão + Frango', emoji: '🥖' },
	{ id: 'pao-ovo', label: 'Pão + Ovo', emoji: '🍳' },
	{ id: 'pao-queijo', label: 'Pão + Queijo', emoji: '🧀' },
	{ id: 'pao-presunto-queijo', label: 'Pão + Presunto e Queijo', emoji: '🥪' },
	{ id: 'tapioca-queijo', label: 'Tapioca de Queijo', emoji: '🌮' },
	{ id: 'tapioca-frango', label: 'Tapioca de Frango', emoji: '🌮' },
	{ id: 'cuscuz-ovo', label: 'Cuscuz + Ovo', emoji: '🌽' },
	{ id: 'pao-de-queijo', label: 'Pão de Queijo', emoji: '🧀' },
	{ id: 'omelete', label: 'Omelete', emoji: '🍳' },
	{ id: 'maca', label: 'Maçã', emoji: '🍎' },
	{ id: 'banana', label: 'Banana', emoji: '🍌' },
	{ id: 'mamao', label: 'Mamão', emoji: '🥭' },
	{ id: 'cafe-leite', label: 'Café + Leite Desnatado', emoji: '☕' },
	{ id: 'cafe', label: 'Café', emoji: '☕' },
	{ id: 'iogurte', label: 'Iogurte', emoji: '🥛' }
];

const MAIN_MEAL_ITEMS: MealFoodItem[] = [
	{ id: 'arroz', label: 'Arroz', emoji: '🍚' },
	{ id: 'feijao-preto', label: 'Feijão Preto', emoji: '🫘' },
	{ id: 'cuscuz', label: 'Cuscuz', emoji: '🌽' },
	{ id: 'macarrao', label: 'Macarrão', emoji: '🍝' },
	{ id: 'batata-doce', label: 'Batata Doce', emoji: '🍠' },
	{ id: 'mandioca', label: 'Mandioca', emoji: '🥔' },
	{ id: 'inhame', label: 'Inhame', emoji: '🥔' },
	{ id: 'batata-inglesa', label: 'Batata Inglesa', emoji: '🥔' },
	{ id: 'abobora', label: 'Abóbora', emoji: '🎃' },
	{ id: 'frango-grelhado', label: 'Frango Grelhado', emoji: '🍗' },
	{ id: 'carne-assada', label: 'Carne Assada', emoji: '🥩' },
	{ id: 'carne-grelhada', label: 'Carne Grelhada', emoji: '🥩' },
	{ id: 'carne-porco-lombo', label: 'Carne de Porco Lombo', emoji: '🐷' },
	{ id: 'patinho-moido', label: 'Patinho Moído', emoji: '🥩' },
	{ id: 'peixe', label: 'Peixe', emoji: '🐟' },
	{ id: 'salada-alface-tomate', label: 'Salada de Alface e Tomate', emoji: '🍅' },
	{ id: 'salada-alface', label: 'Salada de Alface', emoji: '🥬' },
	{ id: 'salada-legumes', label: 'Salada de Legumes', emoji: '🥗' }
];

export const MEAL_BLOCKS: MealBlock[] = [
	{ id: 'cafe', title: 'Café da Manhã', items: BREAKFAST_ITEMS },
	{ id: 'almoco', title: 'Almoço', items: MAIN_MEAL_ITEMS },
	{ id: 'lanche', title: 'Lanche da Tarde', items: BREAKFAST_ITEMS },
	{ id: 'janta', title: 'Janta', items: MAIN_MEAL_ITEMS }
];

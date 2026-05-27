export type MealBlockId = 'cafe' | 'almoco' | 'lanche' | 'janta';

export type MealFoodItem = {
	id: string;
	label: string;
	emoji: string;
};

export type MealBlock = {
	id: MealBlockId;
	title: string;
	carbs: MealFoodItem[];
	proteins: MealFoodItem[];
	carbLabel?: string;
	proteinLabel?: string;
};

export type MealSelections = Record<MealBlockId, { carbs: string[]; proteins: string[] }>;

export const MEAL_SELECTION_LIMIT = 4;

// ---------------------------------------------------------------------------
// Café da Manhã
// ---------------------------------------------------------------------------

const BREAKFAST_CARBS: MealFoodItem[] = [
	{ id: 'cafe-carb-pao-frances', label: 'Pão Francês', emoji: '🥖' },
	{ id: 'cafe-carb-tapioca', label: 'Tapioca', emoji: '🌮' },
	{ id: 'cafe-carb-cuscuz', label: 'Cuscuz', emoji: '🌽' },
	{ id: 'cafe-carb-pao-forma', label: 'Pão de Forma', emoji: '🍞' },
	{ id: 'cafe-carb-rap10', label: 'Rap 10', emoji: '🌯' },
	{ id: 'cafe-carb-torrada', label: 'Torrada Bauducco', emoji: '🍪' },
	{ id: 'cafe-carb-biscoito-arroz', label: 'Biscoito de Arroz', emoji: '🍘' },
	{ id: 'cafe-carb-banana', label: 'Banana', emoji: '🍌' }
];

const BREAKFAST_PROTEINS: MealFoodItem[] = [
	{ id: 'cafe-prot-ovo-mussarela', label: 'Ovo + Mussarela', emoji: '🍳' },
	{ id: 'cafe-prot-frango-mussarela', label: 'Frango + Mussarela', emoji: '🍗' },
	{ id: 'cafe-prot-patinho-mussarela', label: 'Patinho + Mussarela', emoji: '🥩' },
	{ id: 'cafe-prot-atum-requeijao', label: 'Atum + Requeijão', emoji: '🐟' },
	{ id: 'cafe-prot-queijo', label: 'Queijo', emoji: '🧀' },
	{ id: 'cafe-prot-frango-requeijao', label: 'Frango + Requeijão', emoji: '🍗' },
	{ id: 'cafe-prot-2ovos', label: 'Ovos', emoji: '🥚' },
	{ id: 'cafe-prot-queijo-whey', label: 'Queijo + Whey', emoji: '🧀' }
];

// ---------------------------------------------------------------------------
// Almoço
// ---------------------------------------------------------------------------

const LUNCH_CARBS: MealFoodItem[] = [
	{ id: 'almoco-carb-arroz', label: 'Arroz Branco', emoji: '🍚' },
	{ id: 'almoco-carb-mandioca', label: 'Mandioca', emoji: '🥔' },
	{ id: 'almoco-carb-macarrao', label: 'Macarrão', emoji: '🍝' },
	{ id: 'almoco-carb-batata-inglesa', label: 'Batata Inglesa', emoji: '🥔' },
	{ id: 'almoco-carb-batata-doce', label: 'Batata Doce', emoji: '🍠' },
	{ id: 'almoco-carb-abobora', label: 'Abóbora Cabotiá', emoji: '🎃' },
	{ id: 'almoco-carb-arroz-feijao', label: 'Arroz + Feijão', emoji: '🫘' },
	{ id: 'almoco-carb-inhame', label: 'Inhame', emoji: '🥔' }
];

const LUNCH_PROTEINS: MealFoodItem[] = [
	{ id: 'almoco-prot-patinho', label: 'Patinho', emoji: '🥩' },
	{ id: 'almoco-prot-frango', label: 'Peito de Frango', emoji: '🍗' },
	{ id: 'almoco-prot-tilapia', label: 'Tilápia', emoji: '🐟' },
	{ id: 'almoco-prot-suino', label: 'Filé Suíno', emoji: '🥩' },
	{ id: 'almoco-prot-ovos', label: 'Ovos', emoji: '🥚' },
	{ id: 'almoco-prot-soja', label: 'Proteína de Soja', emoji: '🌱' },
	{ id: 'almoco-prot-moela', label: 'Moela', emoji: '🍖' },
	{ id: 'almoco-prot-figado', label: 'Fígado', emoji: '🍖' }
];

// ---------------------------------------------------------------------------
// Lanche da Tarde — frutas (carbs) + acompanhamentos proteicos
// ---------------------------------------------------------------------------

const SNACK_CARBS: MealFoodItem[] = [
	{ id: 'lanche-carb-banana', label: 'Banana Prata', emoji: '🍌' },
	{ id: 'lanche-carb-maca', label: 'Maçã', emoji: '🍎' },
	{ id: 'lanche-carb-mamao', label: 'Mamão Formosa', emoji: '🥭' },
	{ id: 'lanche-carb-manga', label: 'Manga', emoji: '🥭' },
	{ id: 'lanche-carb-laranja', label: 'Laranja', emoji: '🍊' },
	{ id: 'lanche-carb-uva', label: 'Uva', emoji: '🍇' },
	{ id: 'lanche-carb-melancia', label: 'Melancia', emoji: '🍉' },
	{ id: 'lanche-carb-abacaxi', label: 'Abacaxi', emoji: '🍍' },
	{ id: 'lanche-carb-morango', label: 'Morango', emoji: '🍓' },
	{ id: 'lanche-carb-pera', label: 'Pera', emoji: '🍐' }
];

const SNACK_PROTEINS: MealFoodItem[] = [
	{ id: 'lanche-prot-iogurte', label: 'Iogurte Natural', emoji: '🥛' },
	{ id: 'lanche-prot-whey', label: 'Whey Protein', emoji: '🥤' },
	{ id: 'lanche-prot-queijo-minas', label: 'Queijo Minas', emoji: '🧀' },
	{ id: 'lanche-prot-castanhas', label: 'Mix de Castanhas', emoji: '🥜' },
	{ id: 'lanche-prot-ovo-cozido', label: 'Ovo Cozido', emoji: '🥚' },
	{ id: 'lanche-prot-pasta-amendoim', label: 'Pasta de Amendoim', emoji: '🥜' },
	{ id: 'lanche-prot-cottage', label: 'Queijo Cottage', emoji: '🧀' },
	{ id: 'lanche-prot-omelete', label: 'Omelete', emoji: '🍳' }
];

// ---------------------------------------------------------------------------
// Jantar (mesmas opções do almoço — formato prato)
// ---------------------------------------------------------------------------

const DINNER_CARBS: MealFoodItem[] = [
	{ id: 'janta-carb-arroz', label: 'Arroz Branco', emoji: '🍚' },
	{ id: 'janta-carb-mandioca', label: 'Mandioca', emoji: '🥔' },
	{ id: 'janta-carb-macarrao', label: 'Macarrão', emoji: '🍝' },
	{ id: 'janta-carb-batata-inglesa', label: 'Batata Inglesa', emoji: '🥔' },
	{ id: 'janta-carb-batata-doce', label: 'Batata Doce', emoji: '🍠' },
	{ id: 'janta-carb-abobora', label: 'Abóbora Cabotiá', emoji: '🎃' },
	{ id: 'janta-carb-arroz-feijao', label: 'Arroz + Feijão', emoji: '🫘' },
	{ id: 'janta-carb-inhame', label: 'Inhame', emoji: '🥔' }
];

const DINNER_PROTEINS: MealFoodItem[] = [
	{ id: 'janta-prot-patinho', label: 'Patinho', emoji: '🥩' },
	{ id: 'janta-prot-frango', label: 'Peito de Frango', emoji: '🍗' },
	{ id: 'janta-prot-tilapia', label: 'Tilápia', emoji: '🐟' },
	{ id: 'janta-prot-suino', label: 'Filé Suíno', emoji: '🥩' },
	{ id: 'janta-prot-ovos', label: 'Ovos', emoji: '🥚' },
	{ id: 'janta-prot-soja', label: 'Proteína de Soja', emoji: '🌱' },
	{ id: 'janta-prot-moela', label: 'Moela', emoji: '🍖' },
	{ id: 'janta-prot-figado', label: 'Fígado', emoji: '🍖' }
];

// ---------------------------------------------------------------------------
// Blocos exportados
// ---------------------------------------------------------------------------

export const MEAL_BLOCKS: MealBlock[] = [
	{
		id: 'cafe',
		title: 'Café da Manhã',
		carbs: BREAKFAST_CARBS,
		proteins: BREAKFAST_PROTEINS
	},
	{
		id: 'almoco',
		title: 'Almoço',
		carbs: LUNCH_CARBS,
		proteins: LUNCH_PROTEINS
	},
	{
		id: 'lanche',
		title: 'Lanche da Tarde',
		carbs: SNACK_CARBS,
		proteins: SNACK_PROTEINS,
		carbLabel: 'Fruta',
		proteinLabel: 'Proteína'
	},
	{
		id: 'janta',
		title: 'Janta',
		carbs: DINNER_CARBS,
		proteins: DINNER_PROTEINS
	}
];

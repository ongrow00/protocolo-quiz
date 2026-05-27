import type { MealSelections } from '$lib/data/meal-preferences';
import { extractFoodKey } from '$lib/data/meal-nutrition';

export type ShoppingItem = {
	id: string;
	name: string;
	qty: string;
};

export type ShoppingCategory = {
	id: 'cafe' | 'almoco' | 'lanche' | 'janta' | 'basicos';
	title: string;
	items: ShoppingItem[];
};

type FoodShoppingInfo = {
	name: string;
	qty14days: string;
};

const CAFE_CARB_SHOPPING: Record<string, FoodShoppingInfo> = {
	'pao-frances': { name: 'Pão francês', qty14days: '3 unidades' },
	'tapioca': { name: 'Goma de tapioca', qty14days: '150 g' },
	'cuscuz': { name: 'Fubá pré-cozido (cuscuz)', qty14days: '270 g' },
	'pao-forma': { name: 'Pão de forma integral', qty14days: '6 fatias' },
	'rap10': { name: 'Rap 10', qty14days: '3 unidades' },
	'torrada': { name: 'Torrada Bauducco', qty14days: '12 unidades' },
	'biscoito-arroz': { name: 'Biscoito de arroz', qty14days: '90 g' },
	'banana': { name: 'Banana prata (café)', qty14days: '3 unidades' }
};

const CAFE_PROT_SHOPPING: Record<string, FoodShoppingInfo> = {
	'ovo-mussarela': { name: 'Ovos (café)', qty14days: '3 unidades' },
	'frango-mussarela': { name: 'Peito de frango (café)', qty14days: '90 g' },
	'patinho-mussarela': { name: 'Patinho (café)', qty14days: '90 g' },
	'atum-requeijao': { name: 'Atum em lata', qty14days: '225 g' },
	'queijo': { name: 'Queijo fatiado', qty14days: '6 fatias' },
	'frango-requeijao': { name: 'Frango desfiado (café)', qty14days: '135 g' },
	'2ovos': { name: 'Ovos (café)', qty14days: '6 unidades' },
	'queijo-whey': { name: 'Whey protein (café)', qty14days: '45 g' }
};

const ALMOCO_CARB_SHOPPING: Record<string, FoodShoppingInfo> = {
	'arroz': { name: 'Arroz branco', qty14days: '1,3 kg' },
	'mandioca': { name: 'Mandioca', qty14days: '1,3 kg' },
	'macarrao': { name: 'Macarrão', qty14days: '1,2 kg' },
	'batata-inglesa': { name: 'Batata inglesa', qty14days: '3,2 kg' },
	'batata-doce': { name: 'Batata doce', qty14days: '2,1 kg' },
	'abobora': { name: 'Abóbora cabotiá', qty14days: '4,5 kg' },
	'arroz-feijao': { name: 'Arroz + Feijão (almoço)', qty14days: '700 g arroz + 1 kg feijão' },
	'inhame': { name: 'Inhame', qty14days: '1,4 kg' }
};

const ALMOCO_PROT_SHOPPING: Record<string, FoodShoppingInfo> = {
	'patinho': { name: 'Patinho (almoço)', qty14days: '2,2 kg' },
	'frango': { name: 'Peito de frango (almoço)', qty14days: '2,2 kg' },
	'tilapia': { name: 'Filé de tilápia (almoço)', qty14days: '2,2 kg' },
	'suino': { name: 'Filé suíno (almoço)', qty14days: '2,2 kg' },
	'ovos': { name: 'Ovos (almoço)', qty14days: '28 unidades' },
	'soja': { name: 'Proteína de soja (almoço)', qty14days: '2,2 kg' },
	'moela': { name: 'Moela (almoço)', qty14days: '2,2 kg' },
	'figado': { name: 'Fígado (almoço)', qty14days: '2,2 kg' }
};

const LANCHE_FRUIT_SHOPPING: Record<string, FoodShoppingInfo> = {
	'banana': { name: 'Banana prata (lanche)', qty14days: '10 unidades' },
	'maca': { name: 'Maçã', qty14days: '7 unidades' },
	'mamao': { name: 'Mamão formosa', qty14days: '3 unidades' },
	'manga': { name: 'Manga', qty14days: '4 unidades' },
	'laranja': { name: 'Laranja', qty14days: '7 unidades' },
	'uva': { name: 'Uva', qty14days: '1 kg' },
	'melancia': { name: 'Melancia', qty14days: '2 kg (fatias)' },
	'abacaxi': { name: 'Abacaxi', qty14days: '2 unidades' },
	'morango': { name: 'Morango', qty14days: '700 g' },
	'pera': { name: 'Pera', qty14days: '5 unidades' }
};

const JANTA_CARB_SHOPPING: Record<string, FoodShoppingInfo> = {
	'arroz': { name: 'Arroz branco (janta)', qty14days: '1,3 kg' },
	'mandioca': { name: 'Mandioca (janta)', qty14days: '1,3 kg' },
	'macarrao': { name: 'Macarrão (janta)', qty14days: '1,2 kg' },
	'batata-inglesa': { name: 'Batata inglesa (janta)', qty14days: '3,2 kg' },
	'batata-doce': { name: 'Batata doce (janta)', qty14days: '2,1 kg' },
	'abobora': { name: 'Abóbora cabotiá (janta)', qty14days: '4,5 kg' },
	'arroz-feijao': { name: 'Arroz + Feijão (janta)', qty14days: '650 g arroz + 1 kg feijão' },
	'inhame': { name: 'Inhame (janta)', qty14days: '1,4 kg' }
};

const JANTA_PROT_SHOPPING: Record<string, FoodShoppingInfo> = {
	'patinho': { name: 'Patinho (janta)', qty14days: '2,1 kg' },
	'frango': { name: 'Peito de frango (janta)', qty14days: '2,1 kg' },
	'tilapia': { name: 'Filé de tilápia (janta)', qty14days: '2,1 kg' },
	'suino': { name: 'Filé suíno (janta)', qty14days: '2,1 kg' },
	'ovos': { name: 'Ovos (janta)', qty14days: '28 unidades' },
	'soja': { name: 'Proteína de soja (janta)', qty14days: '2,1 kg' },
	'moela': { name: 'Moela (janta)', qty14days: '2,1 kg' },
	'figado': { name: 'Fígado (janta)', qty14days: '2,1 kg' }
};

const BASICOS: ShoppingItem[] = [
	{ id: 'azeite', name: 'Azeite extravirgem', qty: '500 mL' },
	{ id: 'sal', name: 'Sal', qty: '1 pacote' },
	{ id: 'tempero-verde', name: 'Tempero (salsinha, cebolinha)', qty: '2 maços' },
	{ id: 'alho', name: 'Alho', qty: '1 cabeça' },
	{ id: 'cebola', name: 'Cebola', qty: '4 unidades' },
	{ id: 'alface', name: 'Alface', qty: '3 pés' },
	{ id: 'tomate', name: 'Tomate', qty: '8 unidades' },
	{ id: 'cenoura', name: 'Cenoura', qty: '6 unidades' },
	{ id: 'pepino', name: 'Pepino', qty: '3 unidades' }
];

function buildCategory(
	id: ShoppingCategory['id'],
	title: string,
	carbIds: string[],
	protIds: string[],
	carbMap: Record<string, FoodShoppingInfo>,
	protMap: Record<string, FoodShoppingInfo>
): ShoppingCategory {
	const items: ShoppingItem[] = [];
	const seen = new Set<string>();

	for (const itemId of carbIds) {
		const key = extractFoodKey(itemId);
		if (seen.has(key)) continue;
		seen.add(key);
		const info = carbMap[key];
		if (info) items.push({ id: `${id}-carb-${key}`, name: info.name, qty: info.qty14days });
	}

	for (const itemId of protIds) {
		const key = extractFoodKey(itemId);
		if (seen.has(key)) continue;
		seen.add(key);
		const info = protMap[key];
		if (info) items.push({ id: `${id}-prot-${key}`, name: info.name, qty: info.qty14days });
	}

	return { id, title, items };
}

export function generateShoppingList(selections: MealSelections): ShoppingCategory[] {
	const categories: ShoppingCategory[] = [];

	const cafe = buildCategory(
		'cafe',
		'Café da Manhã',
		selections.cafe.carbs,
		selections.cafe.proteins,
		CAFE_CARB_SHOPPING,
		CAFE_PROT_SHOPPING
	);
	if (cafe.items.length > 0) categories.push(cafe);

	// Mussarela/requeijão extras para café (deduzido das proteínas)
	const cafeProtKeys = selections.cafe.proteins.map(extractFoodKey);
	const needsMussarela = cafeProtKeys.some((k) =>
		['ovo-mussarela', 'frango-mussarela', 'patinho-mussarela'].includes(k)
	);
	const needsRequeijao = cafeProtKeys.some((k) =>
		['atum-requeijao', 'frango-requeijao'].includes(k)
	);
	if (needsMussarela) {
		cafe.items.push({ id: 'cafe-mussarela', name: 'Mussarela fatiada (café)', qty: '150 g' });
	}
	if (needsRequeijao) {
		cafe.items.push({ id: 'cafe-requeijao', name: 'Requeijão light (café)', qty: '200 g' });
	}

	const almoco = buildCategory(
		'almoco',
		'Almoço',
		selections.almoco.carbs,
		selections.almoco.proteins,
		ALMOCO_CARB_SHOPPING,
		ALMOCO_PROT_SHOPPING
	);
	if (almoco.items.length > 0) categories.push(almoco);

	const lanche = buildCategory(
		'lanche',
		'Lanche da Tarde',
		selections.lanche.carbs,
		selections.lanche.proteins,
		LANCHE_FRUIT_SHOPPING,
		{}
	);
	// Fase 4 (dias 11-14): itens especiais
	lanche.items.push(
		{ id: 'lanche-castanhas', name: 'Mix de castanhas', qty: '200 g' },
		{ id: 'lanche-queijo-minas', name: 'Queijo minas', qty: '300 g' }
	);
	if (lanche.items.length > 0) categories.push(lanche);

	const janta = buildCategory(
		'janta',
		'Janta',
		selections.janta.carbs,
		selections.janta.proteins,
		JANTA_CARB_SHOPPING,
		JANTA_PROT_SHOPPING
	);
	if (janta.items.length > 0) categories.push(janta);

	categories.push({
		id: 'basicos',
		title: 'Básicos & Temperos',
		items: BASICOS
	});

	return categories;
}

/**
 * Lista estática de fallback (usada quando não há seleções).
 */
export const SHOPPING_LIST: ShoppingCategory[] = generateShoppingList({
	cafe: {
		carbs: ['cafe-carb-pao-frances', 'cafe-carb-tapioca', 'cafe-carb-cuscuz', 'cafe-carb-pao-forma'],
		proteins: ['cafe-prot-ovo-mussarela', 'cafe-prot-frango-mussarela', 'cafe-prot-2ovos', 'cafe-prot-queijo-whey']
	},
	almoco: {
		carbs: ['almoco-carb-arroz', 'almoco-carb-batata-doce', 'almoco-carb-macarrao', 'almoco-carb-arroz-feijao'],
		proteins: ['almoco-prot-frango', 'almoco-prot-patinho', 'almoco-prot-tilapia', 'almoco-prot-ovos']
	},
	lanche: {
		carbs: ['lanche-carb-banana', 'lanche-carb-maca', 'lanche-carb-morango', 'lanche-carb-laranja'],
		proteins: ['lanche-prot-iogurte', 'lanche-prot-whey', 'lanche-prot-queijo-minas', 'lanche-prot-castanhas']
	},
	janta: {
		carbs: ['janta-carb-arroz', 'janta-carb-mandioca', 'janta-carb-batata-inglesa', 'janta-carb-inhame'],
		proteins: ['janta-prot-frango', 'janta-prot-patinho', 'janta-prot-suino', 'janta-prot-figado']
	}
});

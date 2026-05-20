export type ShoppingItem = {
	id: string;
	name: string;
	qty: string;
};

export type ShoppingCategory = {
	id: 'cafe' | 'almoco' | 'lanche' | 'janta';
	title: string;
	items: ShoppingItem[];
};

export const SHOPPING_LIST: ShoppingCategory[] = [
	{
		id: 'cafe',
		title: 'Café da Manhã',
		items: [
			{ id: 'pao-frances', name: 'Pão francês', qty: '14 unidades' },
			{ id: 'ovos', name: 'Ovos', qty: '14 unidades' },
			{ id: 'queijo-mussarela', name: 'Queijo mussarela fatiado', qty: '200 g' },
			{ id: 'presunto', name: 'Presunto fatiado', qty: '200 g' },
			{ id: 'tapioca-goma', name: 'Goma de tapioca', qty: '500 g' },
			{ id: 'cuscuz-fuba', name: 'Fubá pré-cozido (cuscuz)', qty: '500 g' },
			{ id: 'iogurte-cafe', name: 'Iogurte natural desnatado', qty: '2 potes (170 g)' },
			{ id: 'banana', name: 'Banana prata', qty: '14 unidades' },
			{ id: 'maca', name: 'Maçã', qty: '7 unidades' },
			{ id: 'cafe-po', name: 'Café em pó', qty: '200 g' },
			{ id: 'leite-desnatado', name: 'Leite desnatado', qty: '1 L' }
		]
	},
	{
		id: 'almoco',
		title: 'Almoço',
		items: [
			{ id: 'arroz-branco', name: 'Arroz branco', qty: '2 kg' },
			{ id: 'feijao-preto', name: 'Feijão preto', qty: '1 kg' },
			{ id: 'frango-peito', name: 'Peito de frango', qty: '1,5 kg' },
			{ id: 'carne-patinho', name: 'Patinho moído', qty: '500 g' },
			{ id: 'carne-grelhada', name: 'Alcatra (carne grelhada)', qty: '500 g' },
			{ id: 'lombo-porco', name: 'Lombo de porco', qty: '400 g' },
			{ id: 'peixe-file', name: 'Filé de tilápia', qty: '500 g' },
			{ id: 'alface', name: 'Alface', qty: '2 pés' },
			{ id: 'tomate', name: 'Tomate', qty: '6 unidades' },
			{ id: 'cenoura', name: 'Cenoura', qty: '4 unidades' },
			{ id: 'batata-doce', name: 'Batata doce', qty: '1 kg' },
			{ id: 'azeite', name: 'Azeite extravirgem', qty: '250 mL' },
			{ id: 'sal', name: 'Sal', qty: '1 pacote' },
			{ id: 'tempero', name: 'Tempero verde (salsinha, cebolinha)', qty: '1 maço' }
		]
	},
	{
		id: 'lanche',
		title: 'Lanche da Tarde',
		items: [
			{ id: 'iogurte-lanche', name: 'Iogurte natural desnatado', qty: '7 potes (170 g)' },
			{ id: 'mamao', name: 'Mamão papaya', qty: '3 unidades' },
			{ id: 'castanha-caju', name: 'Castanha de caju torrada (s/ sal)', qty: '200 g' },
			{ id: 'amendoa', name: 'Amêndoa', qty: '100 g' },
			{ id: 'pao-queijo-lanche', name: 'Pão de queijo (congelado)', qty: '400 g' },
			{ id: 'omelete-ingredientes', name: 'Ovos extras (omelete)', qty: '7 unidades' }
		]
	},
	{
		id: 'janta',
		title: 'Janta',
		items: [
			{ id: 'arroz-janta', name: 'Arroz branco (incluso acima)', qty: '—' },
			{ id: 'feijao-janta', name: 'Feijão (incluso acima)', qty: '—' },
			{ id: 'frango-janta', name: 'Frango (incluso acima)', qty: '—' },
			{ id: 'macarrao', name: 'Macarrão', qty: '500 g' },
			{ id: 'mandioca', name: 'Mandioca', qty: '500 g' },
			{ id: 'inhame', name: 'Inhame', qty: '400 g' },
			{ id: 'abobora', name: 'Abóbora', qty: '400 g' },
			{ id: 'legumes-janta', name: 'Legumes variados para salada', qty: '1 mix' },
			{ id: 'farofa', name: 'Farinha de mandioca (farofa)', qty: '500 g' }
		]
	}
];

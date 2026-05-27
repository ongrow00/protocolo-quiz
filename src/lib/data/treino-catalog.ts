import type { CatalogWorkout, TreinoLetter, TreinoLocal } from '$lib/data/treino-types';

function slot(
	slotNum: 1 | 2 | 3 | 4 | 5,
	principal: { name: string; requires: string[]; tags?: string[]; blockedDores?: string[]; blockedRest?: string[] },
	opcao2: { name: string; requires: string[]; tags?: string[]; blockedDores?: string[]; blockedRest?: string[] }
) {
	return {
		slot: slotNum,
		principal: {
			kind: 'principal' as const,
			name: principal.name,
			requiresEquipment: principal.requires,
			tags: principal.tags ?? [],
			blockedByDores: principal.blockedDores,
			blockedByRestricoes: principal.blockedRest
		},
		opcao2: {
			kind: 'opcao2' as const,
			name: opcao2.name,
			requiresEquipment: opcao2.requires,
			tags: opcao2.tags ?? [],
			blockedByDores: opcao2.blockedDores,
			blockedByRestricoes: opcao2.blockedRest
		}
	};
}

const ACADEMIA_A: CatalogWorkout = {
	letter: 'A',
	local: 'academia',
	stationTitle: 'Estação Leg Press',
	whereToStay: 'Permaneça próximo ao aparelho de Leg Press durante toda a sessão.',
	baseMaterials: [
		'Par de halteres (leves a moderados)',
		'Haltere de carga moderada',
		'Colchonete',
		'Step ou plataforma elevada'
	],
	slots: [
		slot(1, { name: 'Leg Press', requires: ['leg_press'], tags: ['agachamento'] }, { name: 'Cadeira extensora', requires: ['cadeira_extensora'], tags: ['agachamento'] }),
		slot(2, { name: 'Agachamento segurando halter', requires: ['halteres'], tags: ['agachamento'] }, { name: 'Agachamento no banco segurando halter', requires: ['halteres', 'banco'], tags: ['agachamento'] }),
		slot(3, { name: 'Desenvolvimento de ombros em pé', requires: ['halteres'], tags: ['ombro_overhead'] }, { name: 'Elevação lateral com halteres', requires: ['halteres'] }),
		slot(4, { name: 'Elevação de quadril no step com halter', requires: ['halteres', 'step', 'colchonete'] }, { name: 'Elevação de quadril no chão', requires: ['colchonete'] }),
		slot(5, { name: 'Prancha', requires: ['colchonete'], tags: ['prancha', 'chao'] }, { name: 'Prancha com joelhos apoiados', requires: ['colchonete'], tags: ['prancha', 'chao'] })
	]
};

const ACADEMIA_B: CatalogWorkout = {
	letter: 'B',
	local: 'academia',
	stationTitle: 'Estação Puxador',
	whereToStay: 'Permaneça próximo ao aparelho de puxada durante toda a sessão.',
	baseMaterials: ['Par de halteres (leves a moderados)', 'Colchonete'],
	slots: [
		slot(1, { name: 'Puxada aberta', requires: ['puxador'] }, { name: 'Puxada fechada', requires: ['puxador'] }),
		slot(2, { name: 'Passada para trás alternada', requires: [], tags: ['passada'] }, { name: 'Passada alternada para frente', requires: [], tags: ['passada'] }),
		slot(3, { name: 'Remada baixa com barra', requires: ['puxador'] }, { name: 'Remada com halter', requires: ['halteres'] }),
		slot(4, { name: 'Agachamento com peso do corpo', requires: [], tags: ['agachamento'] }, { name: 'Agachamento com peso do corpo no banco', requires: ['banco'], tags: ['agachamento'] }),
		slot(5, { name: 'Abdominal com pernas elevadas', requires: ['colchonete'], tags: ['chao'] }, { name: 'Abdominal curto', requires: ['colchonete'], tags: ['chao'] })
	]
};

const ACADEMIA_C: CatalogWorkout = {
	letter: 'C',
	local: 'academia',
	stationTitle: 'Estação Smith',
	whereToStay: 'Permaneça próximo ao aparelho Smith durante toda a sessão.',
	baseMaterials: ['Par de halteres leves', 'Haltere de carga moderada', 'Colchonete'],
	slots: [
		slot(1, { name: 'Agachamento no Smith', requires: ['smith'], tags: ['agachamento'] }, { name: 'Agachamento segurando halter', requires: ['halteres'], tags: ['agachamento'] }),
		slot(2, { name: 'Flexão de braço', requires: [], tags: ['flexao'] }, { name: 'Flexão com joelhos apoiados', requires: [], tags: ['flexao'] }),
		slot(3, { name: 'Desenvolvimento de ombros em pé', requires: ['halteres'], tags: ['ombro_overhead'] }, { name: 'Elevação frontal com halteres', requires: ['halteres'] }),
		slot(4, { name: 'Agachamento sumô segurando halter', requires: ['halteres'], tags: ['agachamento'] }, { name: 'Agachamento sumô no banco (peso do corpo)', requires: ['banco'], tags: ['agachamento'] }),
		slot(5, { name: 'Abdominal com pernas elevadas', requires: ['colchonete'], tags: ['chao'] }, { name: 'Abdominal curto', requires: ['colchonete'], tags: ['chao'] })
	]
};

const CASA_A: CatalogWorkout = {
	letter: 'A',
	local: 'casa',
	stationTitle: 'Treino A — Casa',
	whereToStay: 'Permaneça em um espaço livre, próximo ao colchonete, durante toda a sessão.',
	baseMaterials: [
		'Pesos leves a moderados (halteres, garrafas ou mochila com carga)',
		'Carga moderada para agachamento',
		'Colchonete',
		'Sofá, cadeira firme ou superfície estável equivalente'
	],
	slots: [
		slot(1, { name: 'Agachamento apoiando as costas na parede', requires: [], tags: ['agachamento'] }, { name: 'Agachamento no sofá', requires: ['sofa_cadeira'], tags: ['agachamento'] }),
		slot(2, { name: 'Agachamento segurando carga', requires: ['halteres', 'mochila_peso'], tags: ['agachamento'] }, { name: 'Agachamento no sofá segurando carga', requires: ['sofa_cadeira', 'mochila_peso'], tags: ['agachamento'] }),
		slot(3, { name: 'Desenvolvimento de ombros em pé', requires: ['halteres', 'mochila_peso'], tags: ['ombro_overhead'] }, { name: 'Elevação lateral com pesos', requires: ['halteres', 'mochila_peso'] }),
		slot(4, { name: 'Elevação de quadril apoiada no sofá com carga', requires: ['sofa_cadeira', 'mochila_peso'] }, { name: 'Elevação de quadril no chão', requires: ['colchonete'] }),
		slot(5, { name: 'Prancha', requires: ['colchonete'], tags: ['prancha', 'chao'] }, { name: 'Prancha com joelhos apoiados', requires: ['colchonete'], tags: ['prancha', 'chao'] })
	]
};

const CASA_B: CatalogWorkout = {
	letter: 'B',
	local: 'casa',
	stationTitle: 'Treino B — Casa',
	whereToStay: 'Permaneça em um espaço livre, próximo ao colchonete, durante toda a sessão.',
	baseMaterials: ['Par de pesos para remada', 'Colchonete'],
	slots: [
		slot(1, { name: 'Remada curvada com pesos', requires: ['halteres', 'mochila_peso'] }, { name: 'Remada unilateral com peso', requires: ['halteres', 'mochila_peso'] }),
		slot(2, { name: 'Passada para trás alternada', requires: [], tags: ['passada'] }, { name: 'Passada alternada para frente', requires: [], tags: ['passada'] }),
		slot(3, { name: 'Remada baixa improvisada com mochila', requires: ['mochila_peso'] }, { name: 'Remada com pesos', requires: ['halteres', 'mochila_peso'] }),
		slot(4, { name: 'Agachamento com peso do corpo', requires: [], tags: ['agachamento'] }, { name: 'Agachamento com peso do corpo no sofá', requires: ['sofa_cadeira'], tags: ['agachamento'] }),
		slot(5, { name: 'Abdominal com pernas elevadas', requires: ['colchonete'], tags: ['chao'] }, { name: 'Abdominal curto', requires: ['colchonete'], tags: ['chao'] })
	]
};

const CASA_C: CatalogWorkout = {
	letter: 'C',
	local: 'casa',
	stationTitle: 'Treino C — Casa',
	whereToStay: 'Permaneça em um espaço livre, próximo ao colchonete, durante toda a sessão.',
	baseMaterials: [
		'Pesos leves para ombros',
		'Carga moderada',
		'Colchonete',
		'Sofá ou cadeira firme'
	],
	slots: [
		slot(1, { name: 'Agachamento segurando carga', requires: ['halteres', 'mochila_peso'], tags: ['agachamento'] }, { name: 'Agachamento livre', requires: [], tags: ['agachamento'] }),
		slot(2, { name: 'Flexão de braço', requires: [], tags: ['flexao'] }, { name: 'Flexão com joelhos apoiados', requires: [], tags: ['flexao'] }),
		slot(3, { name: 'Desenvolvimento de ombros em pé', requires: ['halteres', 'mochila_peso'], tags: ['ombro_overhead'] }, { name: 'Elevação frontal com pesos', requires: ['halteres', 'mochila_peso'] }),
		slot(4, { name: 'Agachamento sumô segurando carga', requires: ['halteres', 'mochila_peso'], tags: ['agachamento'] }, { name: 'Agachamento sumô no sofá', requires: ['sofa_cadeira'], tags: ['agachamento'] }),
		slot(5, { name: 'Abdominal com pernas elevadas', requires: ['colchonete'], tags: ['chao'] }, { name: 'Abdominal curto', requires: ['colchonete'], tags: ['chao'] })
	]
};

const CATALOG: Record<TreinoLocal, Record<TreinoLetter, CatalogWorkout>> = {
	academia: { A: ACADEMIA_A, B: ACADEMIA_B, C: ACADEMIA_C },
	casa: { A: CASA_A, B: CASA_B, C: CASA_C }
};

export function getCatalogWorkout(local: TreinoLocal, letter: TreinoLetter): CatalogWorkout {
	return CATALOG[local][letter];
}

/** Expand quiz selections into available equipment ids */
export function resolveAvailableEquipment(answers: Record<string, string | string[]>): Set<string> {
	const local = (answers.treino_local as string) ?? 'academia';
	const key = local === 'casa' ? 'treino_equipamentos_casa' : 'treino_equipamentos_academia';
	const raw = answers[key];
	const selected = Array.isArray(raw) ? raw : raw ? [raw] : [];
	const available = new Set<string>();

	if (local === 'academia') {
		if (selected.includes('academia_completa')) {
			['leg_press', 'cadeira_extensora', 'puxador', 'smith', 'halteres', 'colchonete', 'step', 'banco'].forEach(
				(e) => available.add(e)
			);
			return available;
		}
		for (const id of selected) available.add(id);
		available.add('colchonete');
		available.add('halteres');
		available.add('banco');
		return available;
	}

	if (selected.includes('nenhum_equipamento')) {
		available.add('colchonete');
		available.add('sofa_cadeira');
		return available;
	}
	for (const id of selected) available.add(id);
	if (!available.has('colchonete')) available.add('colchonete');
	return available;
}

export function getDores(answers: Record<string, string | string[]>): string[] {
	const raw = answers.treino_dores;
	const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
	return arr.filter((id) => id !== 'nenhuma');
}

export function getRestricoes(answers: Record<string, string | string[]>): string[] {
	const raw = answers.treino_restricoes_exercicio;
	return Array.isArray(raw) ? raw : raw ? [raw] : [];
}

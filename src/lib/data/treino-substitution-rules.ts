import type {
	CatalogExerciseSlot,
	CatalogExerciseVariant,
	SelectionReason,
	VariantKind
} from '$lib/data/treino-types';

function variantBlocked(
	variant: CatalogExerciseVariant,
	dores: string[],
	restricoes: string[]
): boolean {
	if (variant.blockedByDores?.some((d) => dores.includes(d))) return true;
	if (variant.blockedByRestricoes?.some((r) => restricoes.includes(r))) return true;

	for (const tag of variant.tags) {
		if (restricoes.includes(tag)) return true;
	}

	const painToTags: Record<string, string[]> = {
		joelho: ['agachamento', 'passada'],
		lombar: ['agachamento'],
		ombro: ['ombro_overhead', 'flexao'],
		quadril: ['agachamento'],
		punho: ['flexao'],
		tornozelo: ['passada', 'salto']
	};

	for (const dor of dores) {
		const blocked = painToTags[dor];
		if (blocked?.some((t) => variant.tags.includes(t))) return true;
	}

	return false;
}

function hasEquipment(variant: CatalogExerciseVariant, available: Set<string>): boolean {
	if (variant.requiresEquipment.length === 0) return true;
	return variant.requiresEquipment.every((eq) => available.has(eq));
}

export function pickVariant(
	slot: CatalogExerciseSlot,
	available: Set<string>,
	dores: string[],
	restricoes: string[],
	preferEasier: boolean
): { kind: VariantKind; reason: SelectionReason } {
	const principalOk =
		!variantBlocked(slot.principal, dores, restricoes) && hasEquipment(slot.principal, available);
	const opcao2Ok =
		!variantBlocked(slot.opcao2, dores, restricoes) && hasEquipment(slot.opcao2, available);

	if (principalOk && !preferEasier) return { kind: 'principal', reason: 'default' };
	if (opcao2Ok && (preferEasier || !principalOk)) {
		return {
			kind: 'opcao2',
			reason: preferEasier ? 'sedentary' : principalOk ? 'default' : 'equipment'
		};
	}
	if (principalOk) return { kind: 'principal', reason: 'equipment' };
	if (opcao2Ok) return { kind: 'opcao2', reason: 'restriction' };

	const pBlocked = variantBlocked(slot.principal, dores, restricoes);
	const oBlocked = variantBlocked(slot.opcao2, dores, restricoes);
	if (!pBlocked) return { kind: 'principal', reason: 'pain' };
	if (!oBlocked) return { kind: 'opcao2', reason: 'pain' };
	return { kind: 'opcao2', reason: 'default' };
}

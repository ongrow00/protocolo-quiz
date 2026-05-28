#!/usr/bin/env node
/**
 * Copia PNGs de exercícios (nomes originais do export) para static/images/treino/exercises/{slug}.png
 *
 * Uso:
 *   node scripts/copy-treino-exercise-images.mjs /caminho/para/pasta/com/pngs
 *
 * Aceita também arquivos em ~/.cursor/projects/.../assets/ com prefixo do exercício.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DEST = path.join(ROOT, 'static/images/treino/exercises');

/** Prefixo do arquivo exportado → slug final (sem .png) */
const PREFIX_TO_SLUG = [
	['Leg_Press', 'leg-press'],
	['Cadeira_extensora', 'cadeira-extensora'],
	['Agachamento_segurando_carga', 'agachamento-segurando-carga'],
	['Agachamento_no_banco_segurando_halter', 'agachamento-no-banco-segurando-halter'],
	['Agachamento_no_Smith', 'agachamento-no-smith'],
	['Agachamento_sumo__segurando_halter', 'agachamento-sumo-segurando-halter'],
	['Agachamento_sumo__segurando_carga', 'agachamento-sumo-segurando-carga'],
	['Agachamento_sumo__no_sofa_', 'agachamento-sumo-no-sofa'],
	['Agachamento_no_sofa__segurando_carga', 'agachamento-no-sofa-segurando-carga'],
	['Agachamento_no_sofa_', 'agachamento-no-sofa'],
	['Agachamento_com_peso_do_corpo_no_sofa_', 'agachamento-com-peso-do-corpo-no-sofa'],
	['Agachamento_com_peso_do_corpo_no_banco', 'agachamento-com-peso-do-corpo-no-banco'],
	['Agachamento_com_peso_do_corpo', 'agachamento-com-peso-do-corpo'],
	['Agachamento_apoiando_as_costas_na_parede', 'agachamento-apoiando-as-costas-na-parede'],
	['Desenvolvimento_de_ombros_em_pe_', 'desenvolvimento-de-ombros-em-pe'],
	['Elevac_a_o_de_quadril_no_step_com_halter', 'elevacao-de-quadril-no-step-com-halter'],
	['Elevac_a_o_de_quadril_apoiada_no_sofa__com_carga', 'elevacao-de-quadril-apoiada-no-sofa-com-carga'],
	['Elevac_a_o_de_quadril_no_cha_o', 'elevacao-de-quadril-no-chao'],
	['Elevac_a_o_lateral_com_pesos', 'elevacao-lateral-com-pesos'],
	['Elevac_a_o_frontal_com_pesos', 'elevacao-frontal-com-pesos'],
	['Elevac_a_o_frontal_com_halteres', 'elevacao-frontal-com-halteres'],
	['Puxada_aberta', 'puxada-aberta'],
	['Puxada_fechada', 'puxada-fechada'],
	['Passada_para_tra_s_alternada', 'passada-para-tras-alternada'],
	['Passada_alternada_para_frente', 'passada-alternada-para-frente'],
	['Remada_baixa_com_barra', 'remada-baixa-com-barra'],
	['Remada_baixa_improvisada_com_mochila', 'remada-baixa-improvisada-com-mochila'],
	['Remada_curvada_com_pesos', 'remada-curvada-com-pesos'],
	['Remada_unilateral_com_peso', 'remada-unilateral-com-peso'],
	['Remada_com_pesos', 'remada-com-pesos'],
	['Remada_com_halter', 'remada-com-halter'],
	['Flexa_o_de_brac_o', 'flexao-de-braco'],
	['Flexa_o_com_joelhos_apoiados', 'flexao-com-joelhos-apoiados'],
	['Prancha_com_joelhos_apoiados', 'prancha-com-joelhos-apoiados'],
	['Prancha', 'prancha'],
	['Abdominal_com_pernas_elevadas', 'abdominal-com-pernas-elevadas'],
	['Abdominal_curto', 'abdominal-curto']
];

function matchSlug(filename) {
	const base = path.basename(filename, path.extname(filename));
	for (const [prefix, slug] of PREFIX_TO_SLUG) {
		if (base === prefix || base.startsWith(`${prefix}-`)) return slug;
	}
	return null;
}

function main() {
	const sourceDir = process.argv[2];
	if (!sourceDir) {
		console.error('Informe a pasta com os PNGs: node scripts/copy-treino-exercise-images.mjs <pasta>');
		process.exit(1);
	}

	const absSource = path.resolve(sourceDir);
	if (!fs.existsSync(absSource)) {
		console.error('Pasta não encontrada:', absSource);
		process.exit(1);
	}

	fs.mkdirSync(DEST, { recursive: true });

	const files = fs.readdirSync(absSource).filter((f) => f.toLowerCase().endsWith('.png'));
	const written = new Set();
	let copied = 0;
	let skipped = 0;

	for (const file of files.sort()) {
		const slug = matchSlug(file);
		if (!slug) continue;
		if (written.has(slug)) {
			skipped++;
			continue;
		}
		const destPath = path.join(DEST, `${slug}.png`);
		fs.copyFileSync(path.join(absSource, file), destPath);
		written.add(slug);
		copied++;
		console.log(`${file} → ${slug}.png`);
	}

	console.log(`\n${copied} imagens em ${DEST}`);
	if (skipped) console.log(`${skipped} duplicatas ignoradas`);

	const expected = new Set(PREFIX_TO_SLUG.map(([, s]) => s));
	const missing = [...expected].filter((s) => !written.has(s));
	if (missing.length) {
		console.warn('\nSlugs ainda faltando:', missing.join(', '));
	}
}

main();

/**
 * Gera, no navegador, um PDF A4 "clean" com o cardápio completo dos 14 dias
 * do protocolo do usuário (4 opções por refeição, com kcal e ingredientes).
 *
 * As libs (jspdf + jspdf-autotable) são importadas dinamicamente para não
 * pesar o bundle inicial do funil — só carregam quando o usuário clica em
 * "Imprimir agora".
 */

import { browser } from '$app/environment';
import { CHALLENGE_TOTAL_DAYS } from '$lib/constants/challenge-storage-keys';
import {
	getDayPlan,
	activeBlocksForDay,
	MEAL_BLOCK_TITLES,
	getPhase
} from '$lib/data/challenge-plan';
import type { ChallengeMealBlockId, MealOption } from '$lib/data/challenge-plan';
import { formatKcal } from '$lib/utils/macros';

// Paleta da marca
const BRAND_GREEN = '#162E21';
const BLOCK_BG = '#EAF0EC';
const LINE = '#E2E6E3';
const MUTED = '#5B665E';

const PAGE = { marginX: 14, marginTop: 24, marginBottom: 16 } as const;

const PHASE_LABELS: Record<number, string> = {
	1: 'Fase 1 · Low Carb',
	2: 'Fase 2 · Jejum',
	3: 'Fase 3 · Jejum + Low Carb',
	4: 'Fase 4 · Jejum + Low Carb Extremo'
};

export interface GenerateProtocolPdfOptions {
	/** Primeiro nome do usuário, para personalizar o subtítulo. */
	userName?: string;
	/** Sobrescreve a data exibida (default: hoje). */
	date?: Date;
}

/** Rasteriza o logo SVG (/pd-logo-color.svg) em PNG para embutir no PDF. */
async function loadLogoPng(
	widthPx = 384
): Promise<{ dataUrl: string; ratio: number } | null> {
	try {
		const res = await fetch('/pd-logo-color.svg');
		const svgText = await res.text();
		const svg64 = btoa(unescape(encodeURIComponent(svgText)));
		const img = new Image();
		img.src = `data:image/svg+xml;base64,${svg64}`;
		await img.decode();

		const ratio = img.height && img.width ? img.height / img.width : 22 / 96;
		const w = widthPx;
		const h = Math.round(w * ratio);

		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext('2d');
		if (!ctx) return null;
		ctx.drawImage(img, 0, 0, w, h);
		return { dataUrl: canvas.toDataURL('image/png'), ratio };
	} catch {
		return null;
	}
}

function formatDate(date: Date): string {
	try {
		return new Intl.DateTimeFormat('pt-BR', {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		}).format(date);
	} catch {
		return date.toLocaleDateString('pt-BR');
	}
}

function optionCellContent(option: MealOption): string {
	// A lista de ingredientes já contém a composição completa (com quantidades
	// e salada quando houver). O `name` é redundante com ela, então usamos só
	// uma linha para não duplicar a informação.
	const ingredients = option.ingredients.filter(Boolean).join(' · ');
	return ingredients || option.name;
}

export async function generateProtocolPdf(
	opts: GenerateProtocolPdfOptions = {}
): Promise<void> {
	const doc = await buildProtocolPdf(opts);
	if (!doc) return;
	doc.save('protocolo-desbloqueio.pdf');
}

/** Monta e retorna o documento jsPDF (sem disparar o download). */
export async function buildProtocolPdf(opts: GenerateProtocolPdfOptions = {}) {
	if (!browser) return null;

	const [{ jsPDF }, autoTableMod, logo] = await Promise.all([
		import('jspdf'),
		import('jspdf-autotable'),
		loadLogoPng()
	]);
	const autoTable = autoTableMod.default;

	const doc = new jsPDF({ unit: 'mm', format: 'a4' });
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();

	const userName = opts.userName?.trim();
	const dateLabel = formatDate(opts.date ?? new Date());
	const totalPagesExp = '{pd_total_pages}';

	// Logo dimensionado para ~42mm de largura
	const logoW = 42;
	const logoH = logo ? logoW * logo.ratio : 9.6;

	// ── Monta o corpo da tabela: cabeçalhos de dia/refeição + 4 opções cada ──
	type Row = (string | { content: string; colSpan?: number; styles?: object })[];
	const body: Row[] = [];

	for (let day = 1; day <= CHALLENGE_TOTAL_DAYS; day++) {
		const plan = getDayPlan(day);
		if (!plan) continue;

		const phaseLabel = PHASE_LABELS[getPhase(day)] ?? `Fase ${getPhase(day)}`;

		body.push([
			{
				content: `Dia ${day}  ·  ${phaseLabel}`,
				colSpan: 4,
				styles: {
					fillColor: BRAND_GREEN,
					textColor: '#FFFFFF',
					fontStyle: 'bold',
					fontSize: 11,
					cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }
				}
			}
		]);

		for (const block of activeBlocksForDay(day)) {
			const options = plan.blocks[block as ChallengeMealBlockId];
			if (!options?.length) continue;

			body.push([
				{
					content: MEAL_BLOCK_TITLES[block as ChallengeMealBlockId],
					colSpan: 4,
					styles: {
						fillColor: BLOCK_BG,
						textColor: BRAND_GREEN,
						fontStyle: 'bold',
						fontSize: 9.5,
						cellPadding: { top: 2, bottom: 2, left: 4, right: 4 }
					}
				}
			]);

			for (const option of options) {
				body.push([
					'', // checkbox desenhado no didDrawCell
					{ content: `Opção ${option.optionIndex}`, styles: { fontStyle: 'bold' } },
					optionCellContent(option),
					{ content: formatKcal(option.calories), styles: { halign: 'right' } }
				]);
			}
		}
	}

	autoTable(doc, {
		startY: PAGE.marginTop + 12,
		margin: {
			top: PAGE.marginTop,
			bottom: PAGE.marginBottom,
			left: PAGE.marginX,
			right: PAGE.marginX
		},
		body,
		theme: 'plain',
		styles: {
			font: 'helvetica',
			fontSize: 9,
			textColor: '#22302A',
			cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
			lineColor: LINE,
			lineWidth: 0.1,
			valign: 'middle',
			overflow: 'linebreak'
		},
		columnStyles: {
			0: { cellWidth: 9, cellPadding: { left: 4, right: 0, top: 3, bottom: 3 } },
			1: { cellWidth: 20, textColor: BRAND_GREEN, cellPadding: { left: 2, right: 2, top: 3, bottom: 3 } },
			2: { cellWidth: 'auto' },
			3: { cellWidth: 24, textColor: MUTED }
		},
		// Linhas divisórias apenas entre as opções (não nos cabeçalhos)
		didParseCell: (data) => {
			const isHeaderRow = (data.cell.colSpan ?? 1) > 1;
			if (isHeaderRow) {
				data.cell.styles.lineWidth = 0;
			} else {
				data.cell.styles.lineWidth = { top: 0, bottom: 0.1, left: 0, right: 0 } as never;
			}
		},
		// Desenha o quadradinho (checkbox) na primeira coluna de cada opção
		didDrawCell: (data) => {
			if (data.section !== 'body' || data.column.index !== 0) return;
			if ((data.cell.colSpan ?? 1) > 1) return; // pula linhas de cabeçalho

			const size = 3.4;
			const x = data.cell.x + 4;
			const y = data.cell.y + (data.cell.height - size) / 2;
			doc.setDrawColor(150, 162, 154);
			doc.setLineWidth(0.3);
			doc.roundedRect(x, y, size, size, 0.7, 0.7, 'S');
		},
		didDrawPage: (data) => {
			// Cabeçalho: logo no topo (todas as páginas)
			if (logo) {
				doc.addImage(logo.dataUrl, 'PNG', PAGE.marginX, 9, logoW, logoH);
			} else {
				doc.setFont('helvetica', 'bold');
				doc.setFontSize(13);
				doc.setTextColor(BRAND_GREEN);
				doc.text('Protocolo Desbloqueio', PAGE.marginX, 16);
			}

			// Subtítulo só na primeira página
			if (data.pageNumber === 1) {
				doc.setFont('helvetica', 'normal');
				doc.setFontSize(10);
				doc.setTextColor(MUTED);
				const who = userName ? ` · ${userName}` : '';
				doc.text(`Seu cardápio de 14 dias${who}`, PAGE.marginX, 21 + logoH - 4);
				doc.setFontSize(8);
				doc.text(dateLabel, pageWidth - PAGE.marginX, 13, { align: 'right' });
			}

			// Rodapé
			doc.setFont('helvetica', 'normal');
			doc.setFontSize(8);
			doc.setTextColor(MUTED);
			doc.text(
				`Protocolo Desbloqueio · Página ${data.pageNumber} de ${totalPagesExp}`,
				pageWidth / 2,
				pageHeight - 8,
				{ align: 'center' }
			);
		}
	});

	if (typeof doc.putTotalPages === 'function') {
		doc.putTotalPages(totalPagesExp);
	}

	return doc;
}

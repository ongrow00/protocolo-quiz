import type { Question } from './types';

const emptyScores = {};

/**
 * Funil Protocolo de Desbloqueio — perfil, histórico/metabolismo, meta de proteína, calibração do protocolo (step 4).
 * Microresultados: mr-1 prova social, mr-protein meta de proteína, mr-2 projeção 14 dias, mr-3 vídeo, mr-4 calendário.
 */
export const questions: Question[] = [
	// ——— STEP 1 — PERFIL ———
	{
		id: 'goal_type',
		order: 1,
		section: 'Perfil',
		text: 'Qual é o seu principal objetivo?',
		subtext: 'Para iniciar, selecione um objetivo.',
		type: 'single',
		required: true,
		variable: 'goal_type',
		options: [
			{ id: 'goal-emagrecer', text: 'Emagrecer', scores: emptyScores, imageUrl: '/assets/emagrecer.png' },
			{ id: 'goal-definir', text: 'Definir o corpo', scores: emptyScores, imageUrl: '/assets/ganhar-massa.png' }
		]
	},
	{
		id: 'weight_medication_use',
		order: 3,
		section: 'Perfil',
		text: 'Você utiliza algum medicamento para emagrecer?',
		subtext: 'Não há resposta certa ou errada. Isso nos ajuda a ajustar o protocolo ao seu contexto.',
		type: 'single',
		required: true,
		variable: 'weight_medication_use',
		options: [
			{ id: 'med-glp1', text: 'Uso GLP-1', scores: emptyScores },
			{ id: 'med-outro', text: 'Uso outro medicamento', scores: emptyScores },
			{ id: 'med-nao', text: 'Não utilizo', scores: emptyScores }
		]
	},
	{
		id: 'info_medication',
		order: 4,
		section: '',
		text: '',
		subtext: '',
		type: 'info',
		required: false,
		showIf: {
			logic: 'OR',
			conditions: [
				{ questionId: 'weight_medication_use', operator: 'eq', value: 'med-glp1' },
				{ questionId: 'weight_medication_use', operator: 'eq', value: 'med-outro' }
			]
		},
		copyTitle: 'Seu protocolo vai respeitar o seu tratamento.',
		copyBody:
			'Quem usa GLP-1 ou outros medicamentos para emagrecimento tem necessidades específicas. Seu plano será pensado para trabalhar com o seu corpo, não contra ele.',
		ctaText: 'Continuar'
	},
	{
		id: 'age_years',
		order: 5,
		section: 'Perfil',
		text: 'Qual é a sua idade?',
		subtext: 'Metabolismo e recuperação mudam com a idade. Seu protocolo vai respeitar isso.',
		type: 'ruler',
		required: true,
		variable: 'age_years',
		min: 18,
		max: 99,
		unit: 'anos'
	},
	{
		id: 'height_cm',
		order: 6,
		section: 'Perfil',
		text: 'Qual é a sua altura?',
		type: 'ruler',
		required: true,
		variable: 'height_cm',
		min: 100,
		max: 220,
		unit: 'cm'
	},
	{
		id: 'weight_current_kg',
		order: 7,
		section: 'Perfil',
		text: 'Qual é o seu peso atual?',
		subtext: 'Esse é seu ponto de partida. Toda transformação começa com um número real.',
		type: 'ruler',
		required: true,
		variable: 'weight_current_kg',
		min: 30,
		max: 200,
		unit: 'kg'
	},
	{
		id: 'weight_goal_kg',
		order: 8,
		section: 'Perfil',
		text: 'Quantos quilos você deseja perder em 14 dias?',
		subtext:
			'Com base no seu perfil, você pode perder entre **1 e 7 kg** nos próximos **14 dias**.',
		type: 'ruler',
		required: true,
		variable: 'weight_goal_kg',
		min: 30,
		max: 200,
		unit: 'kg'
	},
	{
		id: 'life_change_on_goal',
		order: 10,
		section: 'Perfil',
		text: 'O que mais mudaria na sua vida ao alcançar seu objetivo?',
		subtext: 'Marque todas que se aplicam.',
		type: 'multiple',
		required: true,
		variable: 'life_change_on_goal',
		options: [
			{ id: 'lc-autoestima', text: 'Minha autoestima', scores: emptyScores },
			{ id: 'lc-energia', text: 'Minha energia', scores: emptyScores },
			{ id: 'lc-aparencia', text: 'Minha aparência', scores: emptyScores },
			{ id: 'lc-saude', text: 'Minha saúde', scores: emptyScores },
			{ id: 'lc-confianca', text: 'Minha confiança', scores: emptyScores }
		]
	},
	{
		id: 'mr-1',
		order: 11,
		section: 'Protocolo',
		text: 'Mulheres como você',
		type: 'microresult',
		required: false,
		ctaText: 'Continuar →'
	},
	{
		id: 'mr-protein',
		order: 12,
		section: 'Protocolo',
		text: 'Meta de proteína',
		type: 'microresult',
		required: false,
		ctaText: 'Continuar →'
	},
	// ——— STEP 2 — HISTÓRICO E METABOLISMO ———
	{
		id: 'weight_trend_recent',
		order: 20,
		section: 'Histórico',
		text: 'Nos últimos anos, seu peso:',
		type: 'single',
		required: true,
		variable: 'weight_trend_recent',
		options: [
			{ id: 'wt-subiu', text: 'Aumentou progressivamente', scores: emptyScores },
			{ id: 'wt-oscilou', text: 'Oscilou bastante', scores: emptyScores },
			{ id: 'wt-estavel', text: 'Ficou estável', scores: emptyScores },
			{ id: 'wt-yoyo', text: 'Emagreci e voltei a ganhar', scores: emptyScores }
		]
	},
	{
		id: 'diet_attempts_count',
		order: 21,
		section: 'Histórico',
		text: 'Você já tentou emagrecer antes?',
		type: 'single',
		required: true,
		variable: 'diet_attempts_count',
		options: [
			{ id: 'da-varias', text: 'Sim, várias vezes', scores: emptyScores },
			{ id: 'da-poucas', text: 'Sim, poucas vezes', scores: emptyScores },
			{ id: 'da-primeira', text: 'Não, é a primeira vez', scores: emptyScores }
		]
	},
	{
		id: 'sticking_point_after_weeks',
		order: 22,
		section: 'Histórico',
		text: 'O que normalmente acontece depois das primeiras semanas?',
		type: 'single',
		required: true,
		variable: 'sticking_point_after_weeks',
		options: [
			{ id: 'sp-motivacao', text: 'Perco a motivação', scores: emptyScores },
			{ id: 'sp-resultados', text: 'Não vejo resultados rápidos', scores: emptyScores },
			{ id: 'sp-rotina', text: 'Minha rotina atrapalha', scores: emptyScores },
			{ id: 'sp-habitos', text: 'Volto aos hábitos antigos', scores: emptyScores }
		]
	},
	{
		id: 'metabolism_phrase_fit',
		order: 23,
		section: 'Histórico',
		text: 'Qual dessas frases mais parece com você?',
		type: 'single',
		required: true,
		variable: 'metabolism_phrase_fit',
		options: [
			{ id: 'mp-travou', text: 'Meu emagrecimento travou', scores: emptyScores },
			{ id: 'mp-yoyo', text: 'Emagreço e volto a engordar', scores: emptyScores },
			{ id: 'mp-devagar', text: 'Meu corpo responde muito devagar', scores: emptyScores },
			{ id: 'mp-animo', text: 'Estou sem ânimo para recomeçar', scores: emptyScores }
		]
	},
	{
		id: 'health_conditions',
		order: 24,
		section: 'Histórico',
		text: 'Possui alguma condição que pode influenciar seu emagrecimento?',
		subtext: 'Marque todas que se aplicam.',
		type: 'multiple',
		required: true,
		variable: 'health_conditions',
		options: [
			{ id: 'hc-nenhuma', text: 'Nenhuma', scores: emptyScores },
			{ id: 'hc-sop', text: 'SOP', scores: emptyScores },
			{ id: 'hc-hipotireoidismo', text: 'Hipotireoidismo', scores: emptyScores },
			{ id: 'hc-diabetes', text: 'Diabetes', scores: emptyScores },
			{ id: 'hc-ansiedade', text: 'Ansiedade', scores: emptyScores },
			{ id: 'hc-depressao', text: 'Depressão', scores: emptyScores },
			{ id: 'hc-outra', text: 'Outra', scores: emptyScores }
		]
	},
	{
		id: 'body_bother_areas',
		order: 25,
		section: 'Histórico',
		text: 'Quais áreas do seu corpo mais te incomodam hoje?',
		subtext: 'Opcional: marque as que se aplicam.',
		type: 'multiple',
		required: false,
		variable: 'body_bother_areas',
		options: [
			{
				id: 'bb-papada',
				text: 'Papada',
				scores: emptyScores,
				imageUrl: '/assets/body-bother-papada.png',
				imageUrlMale: '/assets/body-bother-m-papada.png',
				imagePlacement: 'right'
			},
			{
				id: 'bb-costas',
				text: 'Costas',
				scores: emptyScores,
				imageUrl: '/assets/body-bother-costas.png',
				imageUrlMale: '/assets/body-bother-m-costas.png',
				imagePlacement: 'right'
			},
			{
				id: 'bb-peito',
				text: 'Peito',
				scores: emptyScores,
				imageUrl: '/assets/body-bother-peito.png',
				imageUrlMale: '/assets/body-bother-m-peito.png',
				imagePlacement: 'right'
			},
			{
				id: 'bb-barriga',
				text: 'Barriga',
				scores: emptyScores,
				imageUrl: '/assets/body-bother-barriga.png',
				imageUrlMale: '/assets/body-bother-m-barriga.png',
				imagePlacement: 'right'
			},
			{
				id: 'bb-braco',
				text: 'Braço',
				scores: emptyScores,
				imageUrl: '/assets/body-bother-braco.png',
				imageUrlMale: '/assets/body-bother-m-braco.png',
				imagePlacement: 'right'
			},
			{
				id: 'bb-culote',
				text: 'Culote',
				scores: emptyScores,
				imageUrl: '/assets/body-bother-culote.png',
				imageUrlMale: '/assets/body-bother-m-culote.png',
				imagePlacement: 'right'
			},
			{
				id: 'bb-bumbum',
				text: 'Bumbum',
				scores: emptyScores,
				imageUrl: '/assets/body-bother-bumbum.png',
				imageUrlMale: '/assets/body-bother-m-bumbum.png',
				imagePlacement: 'right'
			},
			{
				id: 'bb-perna',
				text: 'Perna',
				scores: emptyScores,
				imageUrl: '/assets/body-bother-perna.png',
				imageUrlMale: '/assets/body-bother-m-perna.png',
				imagePlacement: 'right'
			}
		]
	},
	{
		id: 'body_fat_level',
		order: 26,
		section: 'Histórico',
		text: 'Como você se enxerga hoje?',
		subtext: 'Não precisa ser exato. Escolha a imagem mais próxima.',
		type: 'body_fat_grid',
		required: true,
		variable: 'body_fat_level'
	},
	{
		id: 'body_fat_goal',
		order: 27,
		section: 'Histórico',
		text: 'Você gostaria de se enxergar quando alcançar seu objetivo final?',
		subtext: 'O corpo que mais se aproxima do seu objetivo.',
		type: 'body_fat_grid',
		required: true,
		variable: 'body_fat_goal'
	},
	{
		id: 'mr-2',
		order: 28,
		section: 'Protocolo',
		text: 'Projeção inicial',
		type: 'microresult',
		required: false,
		ctaText: 'Continuar →'
	},
	{
		id: 'mr-3',
		order: 29,
		section: 'Protocolo',
		text: 'Seu Protocolo de Desbloqueio',
		type: 'microresult',
		required: false,
		ctaText: 'Continuar →'
	},
	{
		id: 'mr-4',
		order: 30,
		section: 'Protocolo',
		text: 'Composição corporal',
		type: 'microresult',
		required: false,
		ctaText: 'Continuar →'
	},
	{
		id: 'protocolo_4_etapas',
		order: 31,
		section: 'Protocolo',
		text: '',
		type: 'info',
		required: false,
		copyTitle: 'Seu Protocolo de Desbloqueio em 4 etapas',
		copyBody:
			'Suas metas de calorias e proteínas são ajustadas semanalmente conforme a sua evolução.',
		ctaText: 'Continuar'
	},
	// ——— STEP 4 — CALIBRAÇÃO DO PROTOCOLO ———
	{
		id: 'protocol_knowledge',
		order: 60,
		section: 'Sobre',
		text: 'Você já conhece a metodologia do Protocolo de Desbloqueio?',
		subtext:
			'O protocolo metabólico de 14 dias que força o corpo a sair do modo de defesa, perdendo de 4 a 7kg rápido e sem passar fome',
		type: 'single',
		required: true,
		variable: 'protocol_knowledge',
		options: [
			{ id: 'pk-nao', text: 'Ainda não — quero destravar meu corpo', scores: emptyScores },
			{ id: 'pk-sim', text: 'Já ouvi falar — quero ver como funciona', scores: emptyScores }
		]
	},
	{
		id: 'weight_loss_attempts',
		order: 61,
		section: 'Sobre',
		text: 'O que você já tentou para emagrecer?',
		subtext: 'Marque tudo o que você já tentou, pode ser mais de uma.',
		type: 'multiple',
		required: true,
		variable: 'weight_loss_attempts',
		options: [
			{ id: 'wla-lowcarb', text: 'Dieta low carb ou corte de carboidratos', scores: emptyScores },
			{ id: 'wla-calorias', text: 'Contar calorias ou usar app de dieta', scores: emptyScores },
			{ id: 'wla-desafio', text: 'Desafio de 21 dias ou similar', scores: emptyScores },
			{ id: 'wla-nutri', text: 'Acompanhamento nutricional', scores: emptyScores },
			{ id: 'wla-remedio', text: 'Remédio, chá ou suplemento pra emagrecer', scores: emptyScores },
			{ id: 'wla-treino', text: 'Treino pesado pra compensar a comida', scores: emptyScores },
			{ id: 'wla-nada', text: 'Várias coisas, mas nada funcionou', scores: emptyScores }
		]
	},
	{
		id: 'failed_attempts_feeling',
		order: 62,
		section: 'Sobre',
		text: 'Como você se sentiu depois das tentativas que falharam?',
		type: 'single',
		required: true,
		variable: 'failed_attempts_feeling',
		options: [
			{ id: 'faf-frustrada', text: 'Frustrada — fiz tudo certo e o peso não caiu', scores: emptyScores },
			{ id: 'faf-cansada', text: 'Cansada — emagrecer virou luta sem fim', scores: emptyScores },
			{ id: 'faf-invisivel', text: 'Invisível — nem eu mesma me reconheço mais', scores: emptyScores },
			{
				id: 'faf-sem-esperanca',
				text: 'Sem esperança — comecei a achar que não tem solução pra mim',
				scores: emptyScores
			},
			{ id: 'faf-sanfona', text: 'Refém do efeito sanfona — perco e ganho tudo de volta', scores: emptyScores }
		]
	},
	{
		id: 'goal_feeling_after_loss',
		order: 63,
		section: 'Sobre',
		text: 'Qual sentimento você quer reviver após alcançar sua meta em 14 dias?',
		subtext: 'Marque todas que se aplicam.',
		type: 'multiple',
		required: true,
		variable: 'goal_feeling_after_loss',
		options: [
			{ id: 'gfl-fotos', text: 'Confiança para aparecer nas fotos', scores: emptyScores },
			{ id: 'gfl-energia', text: 'Leveza e energia no dia a dia', scores: emptyScores },
			{ id: 'gfl-espelho', text: 'Orgulho ao me olhar no espelho', scores: emptyScores },
			{ id: 'gfl-roupas', text: 'Liberdade para usar as roupas que quero', scores: emptyScores }
		]
	},
	{
		id: 'overweight_bother',
		order: 64,
		section: 'Sobre',
		text: 'Qual reflexo do sobrepeso mais te incomoda?',
		subtext: 'Vamos calibrar o Protocolo pelo que mais te incomoda.',
		type: 'single',
		required: true,
		variable: 'overweight_bother',
		options: [
			{ id: 'ob-autoestima', text: 'Autoestima — me sinto menos confiante', scores: emptyScores },
			{ id: 'ob-roupas', text: 'As roupas ficam apertando', scores: emptyScores },
			{ id: 'ob-energia', text: 'Falta energia — me sinto desmotivada', scores: emptyScores },
			{ id: 'ob-flacidez', text: 'Flacidez — tento esconder alguns lugares', scores: emptyScores },
			{ id: 'ob-sair', text: 'Evito sair para alguns lugares', scores: emptyScores }
		]
	}
];

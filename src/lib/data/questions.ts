import type { Question } from './types';

const emptyScores = {};

/**
 * Funil Protocolo de Desbloqueio — perfil, histórico/metabolismo, rotina alimentar, personalização da dieta.
 * Microresultados: mr-1 prova social, mr-2 projeção 14 dias, mr-3 vídeo, mr-4 composição; em seguida tela info das 4 etapas.
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
		id: 'gender',
		order: 2,
		section: 'Perfil',
		text: 'Qual é o seu sexo?',
		subtext: 'Isso ajusta referências visuais e o protocolo ao seu perfil.',
		type: 'single',
		required: true,
		variable: 'gender',
		optionsLayout: 'horizontal',
		options: [
			{ id: 'gender-m', text: 'Masculino', scores: emptyScores, imageUrl: '/assets/homem.png' },
			{ id: 'gender-f', text: 'Feminino', scores: emptyScores, imageUrl: '/assets/mulher.png' }
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
		text: 'Como você quer se ver após alcançar seu objetivo?',
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
	// ——— STEP 3 — ROTINA E ALIMENTAÇÃO ———
	{
		id: 'routine_pace',
		order: 40,
		section: 'Rotina',
		text: 'Como é sua rotina hoje?',
		type: 'single',
		required: true,
		variable: 'routine_pace',
		options: [
			{ id: 'rp-corrid', text: 'Muito corrida', scores: emptyScores },
			{ id: 'rp-agitada', text: 'Agitada', scores: emptyScores },
			{ id: 'rp-equilibrada', text: 'Equilibrada', scores: emptyScores },
			{ id: 'rp-tranquila', text: 'Tranquila', scores: emptyScores }
		]
	},
	{
		id: 'eating_pattern',
		order: 41,
		section: 'Rotina',
		text: 'Como é o seu padrão alimentar hoje?',
		type: 'single',
		required: true,
		variable: 'eating_pattern',
		options: [
			{ id: 'ep-organizado', text: 'Organizado', scores: emptyScores },
			{ id: 'ep-irregular', text: 'Irregular', scores: emptyScores },
			{ id: 'ep-delivery', text: 'Muito delivery', scores: emptyScores },
			{ id: 'ep-pulo', text: 'Pulo refeições', scores: emptyScores }
		]
	},
	{
		id: 'hunger_peak_times',
		order: 42,
		section: 'Rotina',
		text: 'Em quais momentos do dia você sente mais fome?',
		subtext: 'Marque todos que se aplicam.',
		type: 'multiple',
		required: true,
		variable: 'hunger_peak_times',
		options: [
			{ id: 'hp-manha', text: 'Manhã', scores: emptyScores },
			{ id: 'hp-almoco', text: 'Almoço', scores: emptyScores },
			{ id: 'hp-tarde', text: 'Tarde', scores: emptyScores },
			{ id: 'hp-noite', text: 'Noite', scores: emptyScores },
			{ id: 'hp-madrugada', text: 'Madrugada', scores: emptyScores }
		]
	},
	{
		id: 'food_choice_drivers',
		order: 43,
		section: 'Rotina',
		text: 'O que mais influencia suas escolhas alimentares?',
		type: 'single',
		required: true,
		variable: 'food_choice_drivers',
		options: [
			{ id: 'fcd-fome', text: 'Fome', scores: emptyScores },
			{ id: 'fcd-ansiedade', text: 'Ansiedade', scores: emptyScores },
			{ id: 'fcd-estresse', text: 'Estresse', scores: emptyScores },
			{ id: 'fcd-tedio', text: 'Tédio', scores: emptyScores },
			{ id: 'fcd-disponivel', text: 'O que estiver disponível', scores: emptyScores }
		]
	},
	{
		id: 'ultraprocessed_frequency',
		order: 44,
		section: 'Rotina',
		text: 'Com que frequência você consome doces ou ultraprocessados?',
		type: 'single',
		required: true,
		variable: 'ultraprocessed_frequency',
		options: [
			{ id: 'uf-diario', text: 'Todo dia', scores: emptyScores },
			{ id: 'uf-semana', text: 'Algumas vezes por semana', scores: emptyScores },
			{ id: 'uf-raro', text: 'Raramente', scores: emptyScores },
			{ id: 'uf-quase-nunca', text: 'Quase nunca', scores: emptyScores }
		]
	},
	{
		id: 'activity_level',
		order: 45,
		section: 'Rotina',
		text: 'Qual é o seu nível de atividade física?',
		type: 'single',
		required: true,
		variable: 'activity_level',
		options: [
			{ id: 'al-sedentaria', text: 'Sedentária', scores: emptyScores },
			{ id: 'al-leve', text: 'Levemente ativa', scores: emptyScores },
			{ id: 'al-moderada', text: 'Moderadamente ativa', scores: emptyScores },
			{ id: 'al-muito', text: 'Muito ativa', scores: emptyScores }
		]
	},
	{
		id: 'sleep_quality',
		order: 46,
		section: 'Rotina',
		text: 'Como está sua qualidade de sono?',
		type: 'single',
		required: true,
		variable: 'sleep_quality',
		options: [
			{ id: 'sq-bem', text: 'Durmo bem', scores: emptyScores },
			{ id: 'sq-cansada', text: 'Acordo cansada', scores: emptyScores },
			{ id: 'sq-dificuldade', text: 'Tenho dificuldade para dormir', scores: emptyScores },
			{ id: 'sq-pouco', text: 'Durmo pouco', scores: emptyScores }
		]
	},
	{
		id: 'water_cups_per_day',
		order: 47,
		section: 'Rotina',
		text: 'Quantos copos de água você bebe por dia?',
		type: 'single',
		required: true,
		variable: 'water_cups_per_day',
		options: [
			{ id: 'wc-menos2', text: 'Menos de 2', scores: emptyScores },
			{ id: 'wc-2-4', text: '2 a 4', scores: emptyScores },
			{ id: 'wc-4-6', text: '4 a 6', scores: emptyScores },
			{ id: 'wc-mais6', text: 'Mais de 6', scores: emptyScores }
		]
	},
	{
		id: 'mr-4',
		order: 48,
		section: 'Protocolo',
		text: 'Composição corporal',
		type: 'microresult',
		required: false,
		ctaText: 'Continuar →'
	},
	{
		id: 'protocolo_4_etapas',
		order: 49,
		section: 'Protocolo',
		text: '',
		type: 'info',
		required: false,
		copyTitle: 'Seu Protocolo de Desbloqueio em 4 etapas',
		copyBody:
			'Suas metas de calorias e proteínas são ajustadas semanalmente conforme a sua evolução.',
		ctaText: 'Continuar'
	},
	// ——— STEP 4 — PERSONALIZAÇÃO DA DIETA ———
	{
		id: 'breakfast_in_plan',
		order: 60,
		section: 'Dieta',
		text: 'Deseja incluir café da manhã no plano?',
		type: 'single',
		required: true,
		variable: 'breakfast_in_plan',
		options: [
			{ id: 'bf-sim', text: 'Sim', scores: emptyScores },
			{ id: 'bf-nao', text: 'Não', scores: emptyScores }
		]
	},
	{
		id: 'meals_per_day',
		order: 61,
		section: 'Dieta',
		text: 'Quantas refeições prefere fazer por dia?',
		type: 'single',
		required: true,
		variable: 'meals_per_day',
		options: [
			{ id: 'mpd-2', text: '2', scores: emptyScores },
			{ id: 'mpd-3', text: '3', scores: emptyScores },
			{ id: 'mpd-4', text: '4', scores: emptyScores },
			{ id: 'mpd-5', text: '5', scores: emptyScores },
			{ id: 'mpd-6', text: '6+', scores: emptyScores }
		]
	},
	{
		id: 'foods_like',
		order: 62,
		section: 'Dieta',
		text: 'Quais alimentos você mais gosta?',
		subtext: 'Marque todas que se aplicam.',
		type: 'multiple',
		required: true,
		variable: 'foods_like',
		options: [
			{ id: 'fl-tudo', text: 'Como de tudo', scores: emptyScores },
			{ id: 'fl-arroz-feijao', text: 'Arroz e feijão', scores: emptyScores },
			{ id: 'fl-massas', text: 'Massas e pães', scores: emptyScores },
			{ id: 'fl-frutas', text: 'Frutas', scores: emptyScores },
			{ id: 'fl-doces', text: 'Doces', scores: emptyScores },
			{ id: 'fl-fast', text: 'Pizza / hambúrguer', scores: emptyScores },
			{ id: 'fl-japonesa', text: 'Comida japonesa', scores: emptyScores },
			{ id: 'fl-arabe', text: 'Comida árabe', scores: emptyScores }
		]
	},
	{
		id: 'foods_avoid',
		order: 63,
		section: 'Dieta',
		text: 'Tem alimentos que prefere evitar?',
		subtext: 'Marque todas que se aplicam.',
		type: 'multiple',
		required: true,
		variable: 'foods_avoid',
		options: [
			{ id: 'fa-tudo', text: 'Como de tudo', scores: emptyScores },
			{ id: 'fa-vermelha', text: 'Carne vermelha', scores: emptyScores },
			{ id: 'fa-frango', text: 'Frango', scores: emptyScores },
			{ id: 'fa-ovos', text: 'Ovos', scores: emptyScores },
			{ id: 'fa-laticinios', text: 'Laticínios', scores: emptyScores },
			{ id: 'fa-carbo', text: 'Carboidratos', scores: emptyScores },
			{ id: 'fa-peixe', text: 'Peixes', scores: emptyScores },
			{ id: 'fa-nenhum', text: 'Nenhum', scores: emptyScores }
		]
	},
	{
		id: 'diet_restrictions',
		order: 64,
		section: 'Dieta',
		text: 'Possui alguma restrição alimentar?',
		subtext: 'Marque todas que se aplicam.',
		type: 'multiple',
		required: true,
		variable: 'diet_restrictions',
		options: [
			{ id: 'diet-nenhuma', text: 'Nenhuma', scores: emptyScores },
			{ id: 'diet-lactose', text: 'Lactose', scores: emptyScores },
			{ id: 'diet-gluten', text: 'Glúten', scores: emptyScores },
			{ id: 'diet-vegetariana', text: 'Vegetariana', scores: emptyScores },
			{ id: 'diet-vegana', text: 'Vegana', scores: emptyScores },
			{ id: 'diet-alergias', text: 'Alergias', scores: emptyScores }
		]
	},
	{
		id: 'meal_prep_time',
		order: 65,
		section: 'Dieta',
		text: 'Quanto tempo você tem para preparar refeições?',
		type: 'single',
		required: true,
		variable: 'meal_prep_time',
		options: [
			{ id: 'mpt-15', text: 'Menos de 15 min', scores: emptyScores },
			{ id: 'mpt-30', text: '15 a 30 min', scores: emptyScores },
			{ id: 'mpt-60', text: '30 a 60 min', scores: emptyScores },
			{ id: 'mpt-bastante', text: 'Tenho bastante tempo', scores: emptyScores }
		]
	},
	{
		id: 'plan_variety_pref',
		order: 66,
		section: 'Dieta',
		text: 'Prefere um plano:',
		type: 'single',
		required: true,
		variable: 'plan_variety_pref',
		options: [
			{ id: 'pvp-simples', text: 'Simples e prático', scores: emptyScores },
			{ id: 'pvp-variado', text: 'Variado', scores: emptyScores },
			{ id: 'pvp-tantofaz', text: 'Tanto faz', scores: emptyScores }
		]
	}
];

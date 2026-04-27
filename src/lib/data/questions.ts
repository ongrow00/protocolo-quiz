import type { Question } from './types';

const emptyScores = {};

export const questions: Question[] = [
	// ——— 1. OBJETIVO ———
	{
		id: 'goal_type',
		order: 1,
		section: 'Objetivo',
		text: 'Qual é seu objetivo principal hoje?',
		subtext: 'Para iniciar, selecione um objetivo.',
		type: 'single',
		required: true,
		variable: 'goal_type',
		options: [
			{ id: 'goal-emagrecer', text: 'Emagrecer', scores: emptyScores, imageUrl: '/assets/emagrecer.png' },
			{ id: 'goal-massa', text: 'Ganhar Massa', scores: emptyScores, imageUrl: '/assets/ganhar-massa.png' }
		]
	},
	{
		id: 'gender',
		order: 2,
		section: 'Objetivo',
		text: 'Qual é o seu sexo?',
		subtext: 'Metabolismo, hormônios e resposta ao treino funcionam de formas diferentes isso muda seu plano.',
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
		section: 'Objetivo',
		text: 'Você usa ou já pensou em usar medicamentos como Ozempic ou Mounjaro?',
		subtext: 'Não há resposta certa ou errada. Isso nos ajuda a ajustar nutrição e treino para o seu contexto real.',
		type: 'single',
		required: true,
		variable: 'weight_medication_use',
		showIf: {
			conditions: [{ questionId: 'goal_type', operator: 'eq', value: 'goal-emagrecer' }],
			logic: 'AND'
		},
		options: [
			{ id: 'med-sim', text: 'Sim, uso atualmente', scores: emptyScores },
			{ id: 'med-nao', text: 'Não uso', scores: emptyScores },
			{ id: 'med-interesse', text: 'Tenho interesse em usar', scores: emptyScores }
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
			conditions: [{ questionId: 'weight_medication_use', operator: 'eq', value: 'med-sim' }],
			logic: 'AND'
		},
		copyTitle: 'Seu protocolo vai respeitar o seu tratamento.',
		copyBody:
			'Quem usa Ozempic, Monjaro ou similares tem necessidades específicas. Seu plano vai ser pensado pra trabalhar com o seu corpo, não contra ele.',
		ctaText: 'Continuar'
	},
	{
		id: 'body_goal_emagrecer',
		order: 6,
		section: 'Objetivo',
		text: 'Como você quer estar daqui a alguns meses?',
		subtext: 'Visualizar o destino aumenta muito a consistência. Escolha o que mais representa seu objetivo.',
		type: 'single',
		required: true,
		variable: 'body_goal',
		showIf: { conditions: [{ questionId: 'goal_type', operator: 'eq', value: 'goal-emagrecer' }], logic: 'AND' },
		options: [
			{ id: 'body-magro', text: 'Magro(a) e definido(a)', scores: emptyScores },
			{ id: 'body-barriga', text: 'Menos barriga', scores: emptyScores },
			{ id: 'body-saude', text: 'Com saúde, sem exageros', scores: emptyScores }
		]
	},
	{
		id: 'body_goal_massa',
		order: 6,
		section: 'Objetivo',
		text: 'Como você quer estar daqui a alguns meses?',
		subtext: 'Visualizar o destino aumenta muito a consistência. Escolha o que mais representa seu objetivo.',
		type: 'single',
		required: true,
		variable: 'body_goal',
		showIf: { conditions: [{ questionId: 'goal_type', operator: 'eq', value: 'goal-massa' }], logic: 'AND' },
		options: [
			{ id: 'body-musculo', text: 'Musculoso(a) e forte', scores: emptyScores },
			{ id: 'body-grande', text: 'Grande e definido(a)', scores: emptyScores },
			{ id: 'body-atletico', text: 'Atlético(a), sem exagerar no volume', scores: emptyScores }
		]
	},
	{
		id: 'success_metrics',
		order: 7,
		section: 'Objetivo',
		text: 'Como você vai saber que está progredindo?',
		subtext: 'Quem define como mede o sucesso tem 2x mais chance de manter a consistência. (até 3 opções)',
		type: 'multiple',
		required: true,
		maxSelections: 3,
		variable: 'success_metrics',
		options: [
			{ id: 'sm-massa', text: 'Ganho de massa muscular', scores: emptyScores },
			{ id: 'sm-forca', text: 'Aumento de força', scores: emptyScores },
			{ id: 'sm-resistencia', text: 'Maior resistência', scores: emptyScores },
			{ id: 'sm-gordura', text: 'Redução de gordura corporal', scores: emptyScores },
			{ id: 'sm-peso', text: 'Perda de peso na balança', scores: emptyScores },
			{ id: 'sm-medidas', text: 'Medidas corporais (cintura, quadril...)', scores: emptyScores },
			{ id: 'sm-condicionamento', text: 'Melhoria no condicionamento geral', scores: emptyScores }
		]
	},
	{
		id: 'focus_areas',
		order: 8,
		section: 'Objetivo',
		text: 'Em quais partes do corpo você quer focar mais?',
		subtext: 'Seu plano vai priorizar essas regiões sem abandonar o restante.',
		type: 'multiple',
		required: true,
		variable: 'focus_areas',
		options: [
			{ id: 'fa-inteiro', text: 'Corpo inteiro', scores: emptyScores },
			{ id: 'fa-ombros', text: 'Ombros', scores: emptyScores },
			{ id: 'fa-biceps', text: 'Bíceps', scores: emptyScores },
			{ id: 'fa-costas', text: 'Costas', scores: emptyScores },
			{ id: 'fa-peito', text: 'Peito', scores: emptyScores },
			{ id: 'fa-abdomen', text: 'Abdômen', scores: emptyScores },
			{ id: 'fa-gluteos', text: 'Glúteos', scores: emptyScores },
			{ id: 'fa-pernas', text: 'Pernas', scores: emptyScores }
		]
	},
	{
		id: 'mr-1',
		order: 9,
		section: 'Objetivo',
		text: 'Checkpoint: Objetivo definido',
		type: 'microresult',
		required: false,
		ctaText: 'Perfeito, continuar →'
	},
	// ——— 2. TREINO ———
	{
		id: 'workout_location',
		order: 10,
		section: 'Treino',
		text: 'Onde você vai treinar?',
		subtext:
			'Seu ambiente define seus exercícios. Sem problema nenhum montamos planos para qualquer situação.',
		type: 'single',
		required: true,
		variable: 'workout_location',
		options: [
			{ id: 'loc-casa', text: 'Em casa', scores: emptyScores },
			{ id: 'loc-academia', text: 'Academia completa', scores: emptyScores },
			{ id: 'loc-condominio', text: 'Academia pequena ou de condomínio', scores: emptyScores },
			{ id: 'loc-varia', text: 'Varia', scores: emptyScores }
		]
	},
	{
		id: 'cardio_enabled',
		order: 11,
		section: 'Treino',
		text: 'Você quer incluir cardio no seu plano?',
		subtext:
			'Cardio bem dosado acelera a queima de gordura e melhora condicionamento mas só incluímos se fizer sentido pra você.',
		type: 'single',
		required: true,
		variable: 'cardio_enabled',
		options: [
			{ id: 'cardio-sim', text: 'Sim, quero incluir', scores: emptyScores },
			{ id: 'cardio-nao', text: 'Não por enquanto', scores: emptyScores }
		]
	},
	{
		id: 'cardio_equipment',
		order: 12,
		section: 'Treino',
		text: 'Quais equipamentos você tem para cardio?',
		subtext: 'Selecione as opções que você tem disponível.',
		type: 'multiple',
		required: false,
		variable: 'cardio_equipment',
		showIf: {
			conditions: [{ questionId: 'cardio_enabled', operator: 'eq', value: 'cardio-sim' }],
			logic: 'AND'
		},
		options: [
			{ id: 'ce-esteira', text: 'Esteira / Corrida', scores: emptyScores },
			{ id: 'ce-bike', text: 'Bicicleta ergométrica', scores: emptyScores },
			{ id: 'ce-eliptico', text: 'Elíptico', scores: emptyScores },
			{ id: 'ce-caminhada', text: 'Apenas caminhada', scores: emptyScores }
		]
	},
	{
		id: 'workout_time_pref',
		order: 13,
		section: 'Treino',
		text: 'Quando você costuma (ou pretende) treinar?',
		subtext: 'Treinar no horário certo para você aumenta muito a aderência.',
		type: 'single',
		required: true,
		variable: 'workout_time_pref',
		options: [
			{ id: 'time-manha', text: 'Manhã', scores: emptyScores },
			{ id: 'time-tarde', text: 'Tarde', scores: emptyScores },
			{ id: 'time-noite', text: 'Noite', scores: emptyScores },
			{ id: 'time-varia', text: 'Varia, não tenho horário fixo', scores: emptyScores }
		]
	},
	{
		id: 'workout_duration_pref',
		order: 14,
		section: 'Treino',
		text: 'Quanto tempo você tem disponível por treino?',
		subtext: 'Seja honesto(a), um treino de 30 minutos bem feito bate qualquer treino longo feito pela metade.',
		type: 'single',
		required: true,
		variable: 'workout_duration_pref',
		options: [
			{ id: 'dur-30', text: '30 minutos ou menos', scores: emptyScores },
			{ id: 'dur-45', text: 'Uns 45 minutos', scores: emptyScores },
			{ id: 'dur-60', text: 'Cerca de 1 hora', scores: emptyScores },
			{ id: 'dur-60plus', text: 'Mais de 1 hora', scores: emptyScores }
		]
	},
	{
		id: 'workout_days',
		order: 15,
		section: 'Treino',
		text: 'Em quais dias da semana você gostaria de treinar?',
		subtext: 'Escolha os dias que melhor se encaixam na sua rotina.',
		type: 'multiple',
		required: true,
		variable: 'workout_days',
		optionsLayout: 'grid',
		options: [
			{ id: 'day-seg', text: 'Segunda', scores: emptyScores },
			{ id: 'day-ter', text: 'Terça', scores: emptyScores },
			{ id: 'day-qua', text: 'Quarta', scores: emptyScores },
			{ id: 'day-qui', text: 'Quinta', scores: emptyScores },
			{ id: 'day-sex', text: 'Sexta', scores: emptyScores },
			{ id: 'day-sab', text: 'Sábado', scores: emptyScores },
			{ id: 'day-dom', text: 'Domingo', scores: emptyScores }
		]
	},
	{
		id: 'mr-2',
		order: 16,
		section: 'Treino',
		text: 'Checkpoint: Treino configurado',
		type: 'microresult',
		required: false,
		ctaText: 'Continuar →'
	},
	// ——— 3. CORPO ———
	{
		id: 'body_fat_level',
		order: 17,
		section: 'Corpo',
		text: 'Qual dessas imagens mais se parece com você agora?',
		subtext: 'Não precisa ser exato. Escolha a mais próxima.',
		type: 'body_fat_grid',
		required: true,
		variable: 'body_fat_level'
		// 6 estágios. Valor salvo: índice 0..5. Imagens H_1..H_6 / M_1..M_6; labels 11-12% a 31-40%.
	},
	{
		id: 'body_fat_goal',
		order: 18,
		section: 'Corpo',
		text: 'Como você gostaria de se enxergar quando alcançar seu objetivo?',
		subtext: 'O corpo que mais se aproxima do seu objetivo.',
		type: 'body_fat_grid',
		required: true,
		variable: 'body_fat_goal'
	},
	{
		id: 'height_cm',
		order: 19,
		section: 'Corpo',
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
		order: 20,
		section: 'Corpo',
		text: 'Qual é o seu peso hoje?',
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
		order: 21,
		section: 'Corpo',
		text: 'Qual o seu objetivo de peso?',
		subtext: 'Vamos calcular quanto tempo e esforço será necessário para você chegar lá.',
		type: 'ruler',
		required: true,
		variable: 'weight_goal_kg',
		min: 30,
		max: 200,
		unit: 'kg'
	},
	{
		id: 'age_years',
		order: 22,
		section: 'Corpo',
		text: 'Qual é a sua idade?',
		subtext: 'Metabolismo e recuperação mudam com a idade. Seu plano vai respeitar isso.',
		type: 'ruler',
		required: true,
		variable: 'age_years',
		min: 18,
		max: 99,
		unit: 'anos'
	},
	// ——— 4. EXPERIÊNCIA (perguntas trazidas para antes do checkpoint Corpo) ———
	{
		id: 'fitness_level',
		order: 23,
		section: 'Experiência',
		text: 'Como você se descreveria hoje, sendo bem honesto(a)?',
		subtext: 'Sem vergonha. Quanto mais preciso, melhor seu plano.',
		type: 'single',
		required: true,
		variable: 'fitness_level',
		options: [
			{
				id: 'fl-iniciante',
				text: 'Iniciante - pouco ou nenhum histórico de treino',
				scores: emptyScores
			},
			{
				id: 'fl-intermediario',
				text: 'Intermediário - treino de vez em quando, mas sem consistência',
				scores: emptyScores
			},
			{
				id: 'fl-avancado',
				text: 'Avançado - treino regularmente há mais de 6 meses',
				scores: emptyScores
			}
		]
	},
	{
		id: 'injuries',
		order: 24,
		section: 'Experiência',
		text: 'Você tem alguma dor ou limitação que o treino precisa respeitar?',
		subtext: 'Seu plano vai proteger essas regiões, não ignorar.',
		type: 'multiple',
		required: false,
		variable: 'injuries',
		options: [
			{ id: 'inj-nenhuma', text: 'Nenhuma, estou bem', scores: emptyScores },
			{ id: 'inj-coluna', text: 'Coluna / lombar', scores: emptyScores },
			{ id: 'inj-joelhos', text: 'Joelhos', scores: emptyScores },
			{ id: 'inj-ombros', text: 'Ombros', scores: emptyScores },
			{ id: 'inj-pescoco', text: 'Pescoço', scores: emptyScores },
			{ id: 'inj-bracos', text: 'Braços / cotovelos', scores: emptyScores },
			{ id: 'inj-pernas', text: 'Pernas / quadril', scores: emptyScores },
			{ id: 'inj-pes', text: 'Pés / tornozelos', scores: emptyScores }
		]
	},
	{
		id: 'mr-3',
		order: 25,
		section: 'Corpo',
		text: 'Checkpoint: Ponto de partida definido',
		type: 'microresult',
		required: false,
		ctaText: 'Quero chegar lá →'
	},
	// ——— 5. ESTILO DE VIDA ———
	{
		id: 'exercise_meaning',
		order: 26,
		section: 'Estilo de vida',
		text: 'Quando você pensa em treinar, qual frase mais representa você?',
		subtext: 'Responder com sinceridade ajuda a criar um plano que funcione de verdade na sua rotina.',
		type: 'single',
		required: true,
		variable: 'exercise_meaning',
		options: [
			{ id: 'em-dificil', text: 'Sei que preciso, mas é difícil começar', scores: emptyScores },
			{ id: 'em-animo', text: 'Começo motivado(a), mas não consigo manter', scores: emptyScores },
			{ id: 'em-rotina', text: 'Já faz parte da minha rotina', scores: emptyScores }
		]
	},
	{
		id: 'energy_level',
		order: 27,
		section: 'Estilo de vida',
		text: 'Como você se sente na maior parte dos dias?',
		subtext: 'Seu nível de energia influencia muito sua consistência nos treinos.',
		type: 'single',
		required: true,
		variable: 'energy_level',
		options: [
			{ id: 'energy-cansado', text: 'Cansado(a) quase sempre', scores: emptyScores },
			{ id: 'energy-media', text: 'Energia média', scores: emptyScores },
			{ id: 'energy-disposto', text: 'Me sinto bem disposto(a)', scores: emptyScores }
		]
	},
	{
		id: 'daily_walk_range',
		order: 28,
		section: 'Estilo de vida',
		text: 'Fora dos treinos, como é seu nível de movimento no dia a dia?',
		subtext: 'Seu nível de atividade fora do treino influencia diretamente seus resultados.',
		type: 'single',
		required: true,
		variable: 'daily_walk_range',
		options: [
			{ id: 'walk-sentado', text: 'Fico sentado(a) a maior parte do dia', scores: emptyScores },
			{ id: 'walk-moderado', text: 'Me movimento moderadamente', scores: emptyScores },
			{ id: 'walk-ativo', text: 'Sou bem ativo(a)', scores: emptyScores }
		]
	},
	{
		id: 'sleep_hours_range',
		order: 29,
		section: 'Estilo de vida',
		text: 'Quantas horas você dorme por noite, em média?',
		subtext: 'O sono influencia recuperação muscular, metabolismo e disposição.',
		type: 'single',
		required: true,
		variable: 'sleep_hours_range',
		options: [
			{ id: 'sleep-menos5', text: 'Menos de 5 horas', scores: emptyScores },
			{ id: 'sleep-5-6', text: '5 a 6 horas', scores: emptyScores },
			{ id: 'sleep-7-8', text: '7 a 8 horas', scores: emptyScores },
			{ id: 'sleep-mais8', text: 'Mais de 8 horas', scores: emptyScores }
		]
	},
	{
		id: 'stress_management',
		order: 30,
		section: 'Estilo de vida',
		text: 'Quando o estresse aparece, o que você costuma fazer?',
		subtext: 'O estresse pode impactar diretamente seus hábitos e sua alimentação.',
		type: 'multiple',
		required: false,
		variable: 'stress_management',
		options: [
			{ id: 'st-exercicio', text: 'Me exercito ou faço algo ativo', scores: emptyScores },
			{ id: 'st-criativo', text: 'Faço algo criativo', scores: emptyScores },
			{ id: 'st-alcool', text: 'Bebo álcool ou fumo', scores: emptyScores },
			{ id: 'st-comer', text: 'Como mais do que o normal', scores: emptyScores },
			{ id: 'st-caminhar', text: 'Saio para caminhar ou ficar ao ar livre', scores: emptyScores }
		]
	},
	{
		id: 'eating_style',
		order: 31,
		section: 'Estilo de vida',
		text: 'Como você descreveria sua alimentação hoje?',
		subtext: 'Entender sua relação com a alimentação ajuda a montar um plano mais realista.',
		type: 'single',
		required: true,
		variable: 'eating_style',
		options: [
			{ id: 'eat-emocao', text: 'Como por emoção ou ansiedade', scores: emptyScores },
			{ id: 'eat-impulso', text: 'Como por impulso', scores: emptyScores },
			{ id: 'eat-razoavel', text: 'Tenho uma rotina alimentar razoável', scores: emptyScores },
			{ id: 'eat-consciente', text: 'Me alimento de forma consciente', scores: emptyScores }
		]
	},
	{
		id: 'diet_restrictions',
		order: 32,
		section: 'Estilo de vida',
		text: 'Você tem alguma restrição ou preferência alimentar?',
		subtext: 'Isso ajuda a adaptar recomendações nutricionais para você.',
		type: 'multiple',
		required: false,
		variable: 'diet_restrictions',
		options: [
			{ id: 'diet-nenhuma', text: 'Nenhuma', scores: emptyScores },
			{ id: 'diet-diabetes', text: 'Diabetes', scores: emptyScores },
			{ id: 'diet-vegano', text: 'Vegetariano(a) / Vegano(a)', scores: emptyScores },
			{ id: 'diet-gluten', text: 'Sem glúten', scores: emptyScores },
			{ id: 'diet-lactose', text: 'Intolerância à lactose', scores: emptyScores },
			{ id: 'diet-amendoim', text: 'Alergia a amendoim ou castanhas', scores: emptyScores }
		]
	},
	{
		id: 'mr-5',
		order: 33,
		section: 'Estilo de vida',
		text: 'Checkpoint: Estilo de vida mapeado',
		type: 'microresult',
		required: false,
		ctaText: 'Continuar →'
	},
	// ——— 6. RESULTADO ———
	{
		id: 'body_change_habit',
		order: 34,
		section: 'Resultado',
		text: 'Quando você tenta mudar seu corpo, o que costuma acontecer?',
		subtext: 'Queremos entender o que normalmente acontece nas suas tentativas.',
		type: 'single',
		required: true,
		variable: 'body_change_habit',
		options: [
			{ id: 'bch-animo-paro', text: 'Começo animado, mas paro', scores: emptyScores },
			{ id: 'bch-por-tempo', text: 'Consigo por um tempo', scores: emptyScores },
			{ id: 'bch-varias-vezes', text: 'Já tentei várias vezes', scores: emptyScores },
			{ id: 'bch-metodo-certo', text: 'Ainda não achei o método certo', scores: emptyScores }
		]
	},
	{
		id: 'body_concerns',
		order: 35,
		section: 'Resultado',
		text: 'O que mais te incomoda hoje no seu corpo?',
		subtext: 'Marque um ou mais motivo que mais pesa para você hoje.',
		type: 'multiple',
		required: false,
		variable: 'body_concerns',
		options: [
			{ id: 'bc-roupas', text: 'Roupas não servem mais', scores: emptyScores },
			{ id: 'bc-espelho', text: 'Não gosto do espelho', scores: emptyScores },
			{ id: 'bc-energia', text: 'Falta de energia', scores: emptyScores },
			{ id: 'bc-autoestima', text: 'Autoestima baixa', scores: emptyScores },
			{ id: 'bc-sentir-melhor', text: 'Quero me sentir melhor', scores: emptyScores }
		]
	},
	{
		id: 'plan_help_level',
		order: 36,
		section: 'Resultado',
		text: 'Se tivesse um plano claro e acompanhamento, quanto isso ajudaria?',
		subtext: 'Pessoas com suporte costumam manter mais consistência.',
		type: 'single',
		required: true,
		variable: 'plan_help_level',
		options: [
			{ id: 'phl-pouco', text: 'Ajudaria um pouco', scores: emptyScores },
			{ id: 'phl-bastante', text: 'Ajudaria bastante', scores: emptyScores },
			{ id: 'phl-muito', text: 'Ajudaria muito', scores: emptyScores },
			{ id: 'phl-essencial', text: 'Seria essencial', scores: emptyScores }
		]
	},
	{
		id: 'phrase_describes_you',
		order: 37,
		section: 'Resultado',
		text: 'Qual frase mais descreve você hoje?',
		subtext: 'Seja sincero(a), isso ajuda a personalizar seu plano.',
		type: 'single',
		required: true,
		variable: 'phrase_describes_you',
		options: [
			{ id: 'pd-pronto', text: 'Estou pronto para mudar', scores: emptyScores },
			{ id: 'pd-plano-certo', text: 'Consigo com o plano certo', scores: emptyScores },
			{ id: 'pd-metodo', text: 'Preciso de um método', scores: emptyScores },
			{ id: 'pd-diferente', text: 'Preciso de algo diferente', scores: emptyScores }
		]
	},
	{
		id: 'worry_if_no_change',
		order: 38,
		section: 'Resultado',
		text: 'O que mais preocupa se nada mudar?',
		subtext: 'Pensar nisso ajuda a entender o que realmente importa.',
		type: 'multiple',
		required: false,
		variable: 'worry_if_no_change',
		options: [
			{ id: 'win-insatisfeito', text: 'Continuar insatisfeito', scores: emptyScores },
			{ id: 'win-saude', text: 'Piorar a saúde', scores: emptyScores },
			{ id: 'win-arrepender', text: 'Me arrepender depois', scores: emptyScores },
			{ id: 'win-ciclo', text: 'Ficar no mesmo ciclo', scores: emptyScores }
		]
	},
	{
		id: 'change_impact',
		order: 39,
		section: 'Resultado',
		text: 'Se você mudasse seu corpo, o que mais mudaria?',
		subtext: 'Imagine o impacto positivo dessa transformação.',
		type: 'multiple',
		required: false,
		variable: 'change_impact',
		options: [
			{ id: 'ci-confianca', text: 'Minha confiança', scores: emptyScores },
			{ id: 'ci-aparencia', text: 'Minha aparência', scores: emptyScores },
			{ id: 'ci-saude', text: 'Minha saúde', scores: emptyScores },
			{ id: 'ci-energia', text: 'Minha energia', scores: emptyScores },
			{ id: 'ci-vida-social', text: 'Minha vida social', scores: emptyScores }
		]
	},
	{
		id: 'event_type',
		order: 40,
		section: 'Resultado',
		text: 'Tem algum evento importante se aproximando que aumenta sua motivação?',
		type: 'single',
		required: true,
		variable: 'event_type',
		options: [
			{ id: 'event-nenhuma', text: 'Nenhum', scores: emptyScores },
			{ id: 'event-viagem', text: 'Viagem / Férias', scores: emptyScores },
			{ id: 'event-casamento', text: 'Casamento', scores: emptyScores },
			{ id: 'event-aniversario', text: 'Aniversário importante', scores: emptyScores },
			{ id: 'event-formatura', text: 'Formatura', scores: emptyScores },
			{ id: 'event-familia', text: 'Reunião de família', scores: emptyScores },
			{ id: 'event-outro', text: 'Outro', scores: emptyScores }
		]
	},
	{
		id: 'event_date',
		order: 41,
		section: 'Resultado',
		text: 'Qual é a data do evento?',
		subtext: 'Vou ajustar seu ritmo para você chegar bem até lá.',
		type: 'date',
		required: true,
		variable: 'event_date',
		showIf: {
			conditions: [{ questionId: 'event_type', operator: 'neq', value: 'event-nenhuma' }],
			logic: 'AND'
		}
	}
];

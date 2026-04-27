export type CategoryKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type OptionScores = Partial<Record<CategoryKey, number>>;
export type QuestionType =
	| 'single'
	| 'multiple'
	| 'scale'
	| 'boolean'
	| 'info'
	| 'microresult'
	| 'number'
	| 'date'
	| 'text'
	| 'slider'
	| 'ruler'
	| 'body_fat_grid';

export interface QuizOption {
	id: string;
	text: string;
	/** Optional description shown below the title in smaller font */
	description?: string;
	scores: OptionScores;
	imageUrl?: string;
}

export interface BranchCondition {
	questionId: string;
	operator: 'eq' | 'neq' | 'includes' | 'excludes';
	value: string | string[];
}

export interface Question {
	id: string;
	order: number;
	section?: string;
	text: string;
	subtext?: string;
	type: QuestionType;
	options?: QuizOption[];
	showIf?: { conditions: BranchCondition[]; logic?: 'AND' | 'OR' };
	required: boolean;
	maxSelections?: number;
	/** For analytics / MR templates */
	variable?: string;
	/** Info / microresult: title and copy */
	copyTitle?: string;
	copyBody?: string;
	copyBullets?: string[];
	ctaText?: string;
	/** number/date/text/slider */
	min?: number;
	max?: number;
	placeholder?: string;
	unit?: string;
	/** Options layout: horizontal row (e.g. 1-5 scale), minimal (no card/tábua), or grid (e.g. 4 columns) */
	optionsLayout?: 'horizontal' | 'minimal' | 'grid';
}

export interface ResultProfile {
	id: string;
	name: string;
	tagline: string;
	description: string;
	imageUrl: string;
	cta: { text: string; url?: string };
	threshold: { primaryCategory: CategoryKey; minimumScore?: number };
	accentColor: string;
}

export interface QuizConfig {
	questions: Question[];
	profiles: ResultProfile[];
}

export type Answers = Record<string, string | string[]>;
export type Scores = Record<CategoryKey, number>;

export interface QuizState {
	currentQuestionId: string | null;
	answers: Answers;
	scores: Scores;
	visitedQuestions: string[];
	startedAt: number | null;
	completedAt: number | null;
}

/** UTM params from the first URL the user landed on (campaign tracking) */
export interface UtmParams {
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
	utm_term?: string;
	utm_content?: string;
}

/** Session-level campaign params: UTM + offer (for funnel variant on result/offer screen) */
export interface SessionParams {
	utm: UtmParams;
	offer: string | null;
}

export interface LeadData {
	name: string;
	email: string;
	profileId: string;
	scores: Scores;
	answers: Answers;
	visitedQuestions?: string[];
	startedAt?: number | null;
	completedAt?: number | null;
	/** Telefone do pós-quiz (ex.: E.164 55...) */
	whatsapp?: string;
	/** Objetivo principal (rótulo), derivado de goal_type */
	objective?: string;
	/** Clicou no CTA "COMEÇAR AGORA" na oferta */
	clickedComecarAgora?: boolean;
	utm?: UtmParams;
	offer?: string | null;
}

import type { DrinkingStyle, MealStyle, GoMealFrequency, GroupMealBudget } from '@/lib/types';

export const BUDGET_VALUES = ['UNDER_1000', 'UNDER_1500', 'UNDER_2000', 'OVER_2000'] as const;
export const DRINKING_STYLE_VALUES = ['NO_ALCOHOL', 'SOMETIMES', 'ENJOY_DRINKING'] as const;
export const MEAL_STYLE_VALUES = ['TALK_DEEP', 'CASUAL_CHAT', 'BRAINSTORM'] as const;
export const GO_MEAL_FREQUENCY_VALUES = ['WEEKLY', 'BIWEEKLY', 'MONTHLY'] as const;

export const BUDGET_OPTIONS: GroupMealBudget[] = [...BUDGET_VALUES];
export const DRINKING_STYLE_OPTIONS: DrinkingStyle[] = [...DRINKING_STYLE_VALUES];
export const MEAL_STYLE_OPTIONS: MealStyle[] = [...MEAL_STYLE_VALUES];
export const GO_MEAL_FREQUENCY_OPTIONS: GoMealFrequency[] = [...GO_MEAL_FREQUENCY_VALUES];

export const DRINKING_STYLE_LABELS: Record<DrinkingStyle, string> = {
  NO_ALCOHOL: '飲まない',
  SOMETIMES: 'たまに飲む',
  ENJOY_DRINKING: '飲むのが好き'
};

export const MEAL_STYLE_LABELS: Record<MealStyle, string> = {
  TALK_DEEP: 'じっくり話す',
  CASUAL_CHAT: 'カジュアル',
  BRAINSTORM: 'アイデア出し'
};

export const GO_MEAL_FREQUENCY_LABELS: Record<GoMealFrequency, string> = {
  WEEKLY: '週1以上',
  BIWEEKLY: '2週間に1回',
  MONTHLY: '月1回'
};

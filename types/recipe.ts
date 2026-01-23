export type Ingredient = {
  name: string;
  amount: string;
  unit?: string;
};

export type Step = {
  order: number;
  instruction: string;
  timerMinutes?: number;
};

export type RecipeData = {
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: Step[];
  cookTimeMinutes: number;
  servings: number;
  tags: string[];
};

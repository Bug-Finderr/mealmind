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

export type RecipeMeta = {
  cookTimeMinutes: number;
  servings: number;
  tags: string[];
  aiGenerated?: boolean;
};

export type RecipeData = {
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: Step[];
  meta: RecipeMeta;
};

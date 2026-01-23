import { v } from "convex/values";
import { internalAction } from "./_generated/server";

export const generateRecipe = internalAction({
  args: { ingredients: v.array(v.string()) },
  handler: async (_, { ingredients }) => {
    const { generateText, Output } = await import("ai");
    const { google } = await import("@ai-sdk/google");
    const { z } = await import("zod");

    const recipeSchema = z.object({
      title: z.string(),
      description: z.string(),
      ingredients: z.array(
        z.object({
          name: z.string(),
          amount: z.string(),
          unit: z.string().optional(),
        }),
      ),
      steps: z.array(
        z.object({
          order: z.number(),
          instruction: z.string(),
          timerMinutes: z.number().optional(),
        }),
      ),
      cookTimeMinutes: z.number(),
      servings: z.number(),
      tags: z.array(z.string()),
    });

    const { output } = await generateText({
      model: google("gemini-3-flash-preview"),
      system: `You are a helpful cooking assistant. Create a delicious, practical recipe using the provided ingredients. Include precise measurements (in metric units) and clear step-by-step instructions. Add timer durations (in minutes) for steps that need timing like boiling, baking, or simmering. Keep it achievable for home cooks.`,
      prompt: `Create a recipe using these ingredients: ${ingredients.join(", ")}`,
      output: Output.object({ schema: recipeSchema }),
    });

    return output;
  },
});

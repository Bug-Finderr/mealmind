import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { getAuthUserId } from "@convex-dev/auth/server";
import { generateText, type LanguageModel, Output } from "ai";
import { v } from "convex/values";
import { z } from "zod";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { type ActionCtx, action, internalAction } from "./_generated/server";

const DEFAULT_MODEL_KEY = "gpt-5-mini";

type ProviderFn = (provider: string) => LanguageModel;

function getProvider(provider: string): ProviderFn {
  switch (provider) {
    case "openai":
      return openai;
    case "anthropic":
      return anthropic;
    default:
      return google;
  }
}

async function resolveModel(
  ctx: ActionCtx,
  userId: Id<"users"> | null | undefined,
  preference: "imageAnalysisModel" | "recipeGenerationModel",
): Promise<LanguageModel> {
  if (!userId) return google(DEFAULT_MODEL_KEY);

  const user = await ctx.runQuery(internal.users.getById, { userId });
  const modelKey = user?.preferences?.[preference] ?? DEFAULT_MODEL_KEY;
  const config = await ctx.runQuery(internal.models.getByKey, {
    key: modelKey,
  });

  return getProvider(config?.provider ?? "google")(modelKey);
}

export const extractIngredients = action({
  args: { imageBase64: v.string() },
  handler: async (ctx, { imageBase64 }) => {
    const userId = await getAuthUserId(ctx);
    const model = await resolveModel(ctx, userId, "imageAnalysisModel");

    const schema = z.object({
      ingredients: z
        .array(z.string())
        .describe("List of ingredient names found in the image"),
    });

    const { output } = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: imageBase64 },
            {
              type: "text",
              text: "Identify all food ingredients visible in this image. Return only the ingredient names (e.g., 'chicken breast', 'tomatoes', 'olive oil'). Be specific but concise. If you see packaged items, identify what's inside.",
            },
          ],
        },
      ],
      output: Output.object({ schema }),
    });

    return output?.ingredients ?? [];
  },
});

export const generateRecipe = internalAction({
  args: {
    ingredients: v.array(v.string()),
    userId: v.optional(v.id("users")),
    userPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { ingredients, userId, userPrompt }) => {
    const model = await resolveModel(ctx, userId, "recipeGenerationModel");

    const schema = z.object({
      title: z.string(),
      description: z.string(),
      ingredients: z.array(
        z.object({
          name: z.string(),
          amount: z.string(),
          unit: z
            .string()
            .describe(
              "Unit of measurement (in metric units), or empty string if not applicable",
            ),
        }),
      ),
      steps: z.array(
        z.object({
          order: z.number(),
          instruction: z.string(),
          timerMinutes: z
            .number()
            .describe("Timer in minutes, or 0 if no timer needed"),
        }),
      ),
      meta: z.object({
        cookTimeMinutes: z.number(),
        servings: z.number(),
        tags: z.array(z.string()),
      }),
    });

    const userPreferences = userPrompt
      ? `\n\nUser preferences: ${userPrompt}`
      : "";

    const { output } = await generateText({
      model,
      system:
        "You are a helpful cooking assistant. Create a delicious, practical recipe using the provided ingredients. Include precise measurements and clear step-by-step instructions. Add timer durations (in minutes) for steps that need timing like boiling, baking, or simmering. Keep it achievable for home cooks. If the user provides preferences or mood context, tailor the recipe accordingly.",
      prompt: `Create a recipe using these ingredients: ${ingredients.join(", ")}${userPreferences}`,
      output: Output.object({ schema }),
    });

    return output;
  },
});

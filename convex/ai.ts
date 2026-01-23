import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { v } from "convex/values";
import { z } from "zod";
import { action, internalAction } from "./_generated/server";

const model = google("gemini-3-flash-preview");

export const extractIngredients = action({
  args: { imageBase64: v.string() },
  handler: async (_, { imageBase64 }) => {
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
            {
              type: "image",
              image: imageBase64,
            },
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
  args: { ingredients: v.array(v.string()) },
  handler: async (_, { ingredients }) => {
    const schema = z.object({
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
      model,
      system: `You are a helpful cooking assistant. Create a delicious, practical recipe using the provided ingredients. Include precise measurements (in metric units) and clear step-by-step instructions. Add timer durations (in minutes) for steps that need timing like boiling, baking, or simmering. Keep it achievable for home cooks.`,
      prompt: `Create a recipe using these ingredients: ${ingredients.join(", ")}`,
      output: Output.object({ schema }),
    });

    return output;
  },
});

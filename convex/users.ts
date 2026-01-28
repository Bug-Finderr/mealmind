import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";

export const currentUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const updateName = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { name });
  },
});

export const upgradeToPremium = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { isPremium: true });
  },
});

export const updateModelPreferences = mutation({
  args: {
    imageAnalysisModel: v.optional(v.string()),
    recipeGenerationModel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    const currentPrefs = user?.preferences ?? {};

    // Validate model access for paid models
    if (args.imageAnalysisModel) {
      const model = await ctx.db
        .query("models")
        .withIndex("by_modelId", (q) =>
          q.eq("modelId", args.imageAnalysisModel!),
        )
        .first();
      if (!model) throw new Error("Invalid model");
      if (model.tier === "paid" && !user?.isPremium)
        throw new Error("Premium required for this model");
    }
    if (args.recipeGenerationModel) {
      const model = await ctx.db
        .query("models")
        .withIndex("by_modelId", (q) =>
          q.eq("modelId", args.recipeGenerationModel!),
        )
        .first();
      if (!model) throw new Error("Invalid model");
      if (model.tier === "paid" && !user?.isPremium)
        throw new Error("Premium required for this model");
    }

    await ctx.db.patch(userId, {
      preferences: {
        ...currentPrefs,
        ...(args.imageAnalysisModel && {
          imageAnalysisModel: args.imageAnalysisModel,
        }),
        ...(args.recipeGenerationModel && {
          recipeGenerationModel: args.recipeGenerationModel,
        }),
      },
    });
  },
});

export const getById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

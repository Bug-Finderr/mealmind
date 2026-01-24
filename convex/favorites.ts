import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const toggle = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, { recipeId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recipe = await ctx.db.get(recipeId);
    if (!recipe || recipe.userId !== userId) throw new Error("Not authorized");

    const newValue = !recipe.favorited;
    await ctx.db.patch(recipeId, { favorited: newValue });
    return newValue;
  },
});

export const isFavorited = query({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, { recipeId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const recipe = await ctx.db.get(recipeId);
    if (!recipe || recipe.userId !== userId) return false;

    return recipe.favorited ?? false;
  },
});

export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return ctx.db
      .query("recipes")
      .withIndex("by_user_favorited", (q) =>
        q.eq("userId", userId).eq("favorited", true),
      )
      .order("desc")
      .collect();
  },
});

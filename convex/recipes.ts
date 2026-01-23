import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, mutation, query } from "./_generated/server";

type RecipeData = {
  title: string;
  description: string;
  ingredients: { name: string; amount: string; unit?: string }[];
  steps: { order: number; instruction: string; timerMinutes?: number }[];
  cookTimeMinutes: number;
  servings: number;
  tags: string[];
};

const recipeValidator = v.object({
  title: v.string(),
  description: v.string(),
  ingredients: v.array(
    v.object({
      name: v.string(),
      amount: v.string(),
      unit: v.optional(v.string()),
    }),
  ),
  steps: v.array(
    v.object({
      order: v.number(),
      instruction: v.string(),
      timerMinutes: v.optional(v.number()),
    }),
  ),
  cookTimeMinutes: v.number(),
  servings: v.number(),
  tags: v.array(v.string()),
});

export const generate = action({
  args: { ingredients: v.array(v.string()) },
  handler: async (ctx, { ingredients }): Promise<Id<"recipes">> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recipe: RecipeData = await ctx.runAction(internal.ai.generateRecipe, {
      ingredients,
    });

    const recipeId: Id<"recipes"> = await ctx.runMutation(
      internal.recipes.saveInternal,
      { userId, recipe },
    );

    return recipeId;
  },
});

export const saveInternal = internalMutation({
  args: {
    userId: v.id("users"),
    recipe: recipeValidator,
  },
  handler: async (ctx, { userId, recipe }) => {
    return ctx.db.insert("recipes", {
      userId,
      ...recipe,
      aiGenerated: true,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return ctx.db
      .query("recipes")
      .withIndex("by_user_recent", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const recipe = await ctx.db.get(id);
    if (!recipe || recipe.userId !== userId) return null;

    return recipe;
  },
});

export const remove = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recipe = await ctx.db.get(id);
    if (!recipe || recipe.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(id);
  },
});

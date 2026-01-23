import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { RecipeData } from "../types/recipe";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, mutation, query } from "./_generated/server";

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
  args: {
    ingredients: v.array(v.string()),
    userPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { ingredients, userPrompt }): Promise<Id<"recipes">> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recipe: RecipeData = await ctx.runAction(internal.ai.generateRecipe, {
      ingredients,
      userId,
      userPrompt,
    });

    const recipeId: Id<"recipes"> = await ctx.runMutation(
      internal.recipes.saveInternal,
      { userId, recipe },
    );

    return recipeId;
  },
});

export const create = mutation({
  args: { recipe: recipeValidator },
  handler: async (ctx, { recipe }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("recipes", {
      userId,
      ...recipe,
      aiGenerated: true,
      createdAt: Date.now(),
    });
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

export const update = mutation({
  args: { id: v.id("recipes"), recipe: recipeValidator },
  handler: async (ctx, { id, recipe }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(id, recipe);
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

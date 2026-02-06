import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import type { RecipeData } from "../types/recipe";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, mutation, query } from "./_generated/server";

const FREE_LIMIT = 10;
const PREMIUM_MONTHLY_LIMIT = 100;

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
  meta: v.object({
    cookTimeMinutes: v.number(),
    servings: v.number(),
    tags: v.array(v.string()),
    aiGenerated: v.optional(v.boolean()),
  }),
});

function getStartOfMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

async function countAiRecipes(
  ctx: { db: any },
  userId: Id<"users">,
  since?: number,
) {
  const q = ctx.db
    .query("recipes")
    .withIndex("by_user_recent", (q: any) => {
      const base = q.eq("userId", userId);
      return since ? base.gte("createdAt", since) : base;
    })
    .filter((q: any) => q.eq(q.field("meta.aiGenerated"), true));
  return (await q.collect()).length;
}

export const getUsage = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    const isPremium = user?.isPremium ?? false;
    const limit = isPremium ? PREMIUM_MONTHLY_LIMIT : FREE_LIMIT;
    const used = await countAiRecipes(
      ctx,
      userId,
      isPremium ? getStartOfMonth() : undefined,
    );

    return { used, limit, isPremium };
  },
});

export const generate = action({
  args: {
    ingredients: v.array(v.string()),
    userPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { ingredients, userPrompt }): Promise<Id<"recipes">> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const usage = await ctx.runQuery(api.recipes.getUsage, {});
    if (usage && usage.used >= usage.limit) {
      throw new ConvexError(
        usage.isPremium
          ? `Monthly generation limit reached. Resets next month.`
          : `Free generation limit reached. Upgrade to Premium for extended access.`,
      );
    }

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
      meta: { ...recipe.meta, aiGenerated: recipe.meta.aiGenerated ?? false },
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
      meta: { ...recipe.meta, aiGenerated: true },
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

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    favoritesOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, { paginationOpts, favoritesOnly }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { page: [], isDone: true, continueCursor: "" };

    let query = ctx.db
      .query("recipes")
      .withIndex("by_user_recent", (q) => q.eq("userId", userId))
      .filter((q) => q.neq(q.field("archived"), true));

    if (favoritesOnly)
      query = query.filter((q) => q.eq(q.field("favorited"), true));

    return query.order("desc").paginate(paginationOpts);
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

    await ctx.db.patch(id, {
      ...recipe,
      meta: {
        ...recipe.meta,
        aiGenerated: recipe.meta.aiGenerated ?? existing.meta.aiGenerated,
      },
    });
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

export const archive = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recipe = await ctx.db.get(id);
    if (!recipe || recipe.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(id, { archived: true });
  },
});

import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("models")
      .filter((q) => q.eq(q.field("enabled"), true))
      .collect();
  },
});

export const getByKey = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query("models")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
  },
});

const MODELS = [
  {
    key: "gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "google",
    tier: "free",
  },
  {
    key: "gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    provider: "google",
    tier: "paid",
  },
  {
    key: "gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "openai",
    tier: "free",
  },
  {
    key: "gpt-5",
    name: "GPT-5",
    provider: "openai",
    tier: "paid",
  },
  {
    key: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    tier: "paid",
  },
  {
    key: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    tier: "paid",
  },
  {
    key: "claude-opus-4-5",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    tier: "paid",
  },
];

export const seed = internalMutation({
  handler: async (ctx) => {
    for (const model of MODELS) {
      const existing = await ctx.db
        .query("models")
        .withIndex("by_key", (q) => q.eq("key", model.key))
        .first();

      if (!existing) {
        await ctx.db.insert("models", { ...model, enabled: true });
      }
    }
  },
});

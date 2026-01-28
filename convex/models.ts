import { internalMutation, query } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("models")
      .withIndex("by_enabled", (q) => q.eq("enabled", true))
      .collect();
  },
});

const MODELS = [
  {
    modelId: "google:gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "google",
    tier: "free",
  },
  {
    modelId: "google:gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    provider: "google",
    tier: "paid",
  },
  {
    modelId: "openai:gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "openai",
    tier: "free",
  },
  {
    modelId: "openai:gpt-5",
    name: "GPT-5",
    provider: "openai",
    tier: "paid",
  },
  {
    modelId: "anthropic:claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    tier: "paid",
  },
  {
    modelId: "anthropic:claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    tier: "paid",
  },
  {
    modelId: "anthropic:claude-opus-4-5",
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
        .withIndex("by_modelId", (q) => q.eq("modelId", model.modelId))
        .first();

      if (!existing) {
        await ctx.db.insert("models", { ...model, enabled: true });
      }
    }
  },
});

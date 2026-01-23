import { v } from "convex/values";
import { internalQuery, query } from "./_generated/server";

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

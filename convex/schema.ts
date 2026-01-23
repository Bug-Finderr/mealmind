import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  ingredients: defineTable({
    userId: v.id("users"),
    name: v.string(),
    source: v.union(v.literal("manual"), v.literal("photo")),
    addedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_recent", ["userId", "addedAt"]),

  recipes: defineTable({
    userId: v.id("users"),
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
    aiGenerated: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_recent", ["userId", "createdAt"]),
});

export default schema;

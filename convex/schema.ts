import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  // Extend users table with custom fields
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    isPremium: v.optional(v.boolean()),
    preferences: v.optional(
      v.object({
        imageAnalysisModel: v.optional(v.string()),
        recipeGenerationModel: v.optional(v.string()),
      }),
    ),
  }).index("email", ["email"]),

  models: defineTable({
    key: v.string(),
    name: v.string(),
    provider: v.string(),
    tier: v.string(),
    enabled: v.boolean(),
  })
    .index("by_key", ["key"])
    .index("by_enabled", ["enabled"]),

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
    createdAt: v.number(),
    favorited: v.optional(v.boolean()),
    archived: v.optional(v.boolean()),
    meta: v.object({
      cookTimeMinutes: v.number(),
      servings: v.number(),
      tags: v.array(v.string()),
      aiGenerated: v.boolean(),
    }),
  })
    .index("by_user", ["userId"])
    .index("by_user_recent", ["userId", "createdAt"])
    .index("by_user_favorited", ["userId", "favorited", "createdAt"]),
});

export default schema;

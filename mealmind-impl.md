# MealMind Implementation Guide

Technical reference for building MealMind. See `mealmind-prd.md` for product requirements.

---

## 1. Project Setup

### 1.1 Initialize with React Native Reusables

```bash
cd /Users/bug/Dev/mealmind

# Initialize project
bunx --bun @react-native-reusables/cli@latest init

# When prompted, select:
# - Project name: mealmind
# - TypeScript: Yes
# - Styling: NativeWind/Uniwind
# - Additional: Biome, Lefthook
```

### 1.2 Project Structure (After Init)

```
mealmind/
├── app/                          # Expo Router pages
│   ├── (auth)/                   # Auth group
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                   # Main tab group
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── index.tsx             # Home
│   │   ├── favorites.tsx
│   │   ├── explore.tsx           # P1
│   │   └── profile.tsx
│   ├── recipe/
│   │   ├── [id].tsx              # Recipe detail
│   │   ├── edit.tsx              # Editor
│   │   └── cook.tsx              # Cooking mode
│   └── _layout.tsx               # Root layout
├── components/
│   ├── ui/                       # RN Reusables components
│   ├── IngredientInput.tsx
│   ├── IngredientChip.tsx
│   ├── RecipeCard.tsx
│   ├── CookingStep.tsx
│   └── TimerDisplay.tsx
├── convex/
│   ├── _generated/               # Auto-generated
│   ├── schema.ts
│   ├── auth.ts
│   ├── users.ts
│   ├── ingredients.ts
│   ├── recipes.ts
│   ├── favorites.ts
│   ├── votes.ts                  # P1
│   └── ai.ts
├── lib/
│   ├── convex.tsx                # Convex provider
│   ├── auth.tsx                  # Auth context
│   ├── posthog.ts                # Analytics
│   └── utils.ts
├── hooks/
│   ├── useIngredients.ts
│   ├── useRecipes.ts
│   ├── useTimer.ts
│   └── useAnalytics.ts
├── types/
│   └── index.ts                  # Shared types
├── .env                          # Local env vars
├── biome.json
├── lefthook.yml
└── package.json
```

### 1.3 Install Dependencies

```bash
# Core
bun add convex
bun add ai @ai-sdk/google @ai-sdk/openai @ai-sdk/anthropic

# Expo packages
bunx expo install expo-camera expo-image-picker expo-secure-store expo-notifications

# Analytics
bun add posthog-react-native

# Dev
bun add -D @types/react @types/react-native
```

---

## 2. Convex Setup

### 2.1 Initialize Convex

```bash
# Login and create project
npx convex dev

# This will:
# 1. Prompt GitHub login
# 2. Create new project (name: mealmind)
# 3. Generate convex/ folder
# 4. Start dev server
```

### 2.2 Environment Variables

```bash
# .env (local development)
EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Convex Dashboard → Settings → Environment Variables
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
POSTHOG_API_KEY=your-posthog-key
```

### 2.3 Convex Provider Setup

```typescript
// lib/convex.tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL!,
  {
    unsavedChangesWarning: false, // Required for RN
  }
);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
}
```

### 2.4 React Native Polyfills (If Needed)

```typescript
// lib/polyfills.ts
// Import BEFORE any Convex imports in _layout.tsx

// Only needed if you encounter window.addEventListener errors
if (typeof global !== "undefined") {
  const listeners: Record<string, Set<Function>> = {};

  if (!(global as any).window) {
    (global as any).window = {};
  }

  const win = (global as any).window;

  if (!win.addEventListener) {
    win.addEventListener = (type: string, listener: Function) => {
      if (!listeners[type]) listeners[type] = new Set();
      listeners[type].add(listener);
    };
  }

  if (!win.removeEventListener) {
    win.removeEventListener = (type: string, listener: Function) => {
      listeners[type]?.delete(listener);
    };
  }

  if (!win.dispatchEvent) {
    win.dispatchEvent = (event: { type: string }) => {
      listeners[event.type]?.forEach((fn) => fn(event));
      return true;
    };
  }
}

export {};
```

---

## 3. Database Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Identity
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),

    // Preferences
    preferredModel: v.optional(v.string()),
    interestTags: v.optional(v.array(v.string())),

    // Stats
    recipesGenerated: v.optional(v.number()),
    recipesCookedCount: v.optional(v.number()),

    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

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
    imageUrl: v.optional(v.string()),

    ingredients: v.array(v.object({
      name: v.string(),
      amount: v.string(),
      unit: v.optional(v.string()),
    })),

    steps: v.array(v.object({
      order: v.number(),
      instruction: v.string(),
      timerMinutes: v.optional(v.number()),
    })),

    cookTimeMinutes: v.number(),
    prepTimeMinutes: v.optional(v.number()),
    servings: v.number(),
    difficulty: v.optional(v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    )),

    tags: v.array(v.string()),
    cuisine: v.optional(v.string()),

    isPublic: v.boolean(),
    aiGenerated: v.boolean(),
    sourceModel: v.optional(v.string()),

    viewCount: v.optional(v.number()),
    saveCount: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_recent", ["userId", "createdAt"])
    .index("by_public", ["isPublic", "createdAt"]),

  favorites: defineTable({
    userId: v.id("users"),
    recipeId: v.id("recipes"),
    savedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_recent", ["userId", "savedAt"])
    .index("by_recipe", ["recipeId"])
    .index("by_user_recipe", ["userId", "recipeId"]),

  votes: defineTable({
    userId: v.id("users"),
    recipeId: v.id("recipes"),
    value: v.union(v.literal(1), v.literal(-1)),
    createdAt: v.number(),
  })
    .index("by_user_recipe", ["userId", "recipeId"])
    .index("by_recipe", ["recipeId"]),
});
```

---

## 4. Convex Functions

### 4.1 Ingredients

```typescript
// convex/ingredients.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("ingredients")
      .withIndex("by_user_recent", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    source: v.union(v.literal("manual"), v.literal("photo")),
  },
  handler: async (ctx, { name, source }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check for duplicate
    const existing = await ctx.db
      .query("ingredients")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("name"), name.toLowerCase().trim()))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("ingredients", {
      userId,
      name: name.toLowerCase().trim(),
      source,
      addedAt: Date.now(),
    });
  },
});

export const addBatch = mutation({
  args: {
    names: v.array(v.string()),
    source: v.union(v.literal("manual"), v.literal("photo")),
  },
  handler: async (ctx, { names, source }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const ids = [];
    for (const name of names) {
      const id = await ctx.db.insert("ingredients", {
        userId,
        name: name.toLowerCase().trim(),
        source,
        addedAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

export const remove = mutation({
  args: { id: v.id("ingredients") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    const ingredient = await ctx.db.get(id);

    if (!ingredient || ingredient.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(id);
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const ingredients = await ctx.db
      .query("ingredients")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const ing of ingredients) {
      await ctx.db.delete(ing._id);
    }
  },
});
```

### 4.2 Recipes

```typescript
// convex/recipes.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./auth";

export const getById = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const listByUser = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 20 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("recipes")
      .withIndex("by_user_recent", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    ingredients: v.array(v.object({
      name: v.string(),
      amount: v.string(),
      unit: v.optional(v.string()),
    })),
    steps: v.array(v.object({
      order: v.number(),
      instruction: v.string(),
      timerMinutes: v.optional(v.number()),
    })),
    cookTimeMinutes: v.number(),
    servings: v.number(),
    tags: v.array(v.string()),
    aiGenerated: v.boolean(),
    sourceModel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();

    return await ctx.db.insert("recipes", {
      ...args,
      userId,
      isPublic: false,
      viewCount: 0,
      saveCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("recipes"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    ingredients: v.optional(v.array(v.object({
      name: v.string(),
      amount: v.string(),
      unit: v.optional(v.string()),
    }))),
    steps: v.optional(v.array(v.object({
      order: v.number(),
      instruction: v.string(),
      timerMinutes: v.optional(v.number()),
    }))),
    cookTimeMinutes: v.optional(v.number()),
    servings: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { id, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    const recipe = await ctx.db.get(id);

    if (!recipe || recipe.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    const recipe = await ctx.db.get(id);

    if (!recipe || recipe.userId !== userId) {
      throw new Error("Not authorized");
    }

    // Also remove favorites
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_recipe", (q) => q.eq("recipeId", id))
      .collect();

    for (const fav of favorites) {
      await ctx.db.delete(fav._id);
    }

    await ctx.db.delete(id);
  },
});
```

### 4.3 Favorites

```typescript
// convex/favorites.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "./auth";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user_recent", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    // Fetch full recipe data
    const recipes = await Promise.all(
      favorites.map(async (fav) => {
        const recipe = await ctx.db.get(fav.recipeId);
        return recipe ? { ...recipe, savedAt: fav.savedAt } : null;
      })
    );

    return recipes.filter(Boolean);
  },
});

export const isFavorite = query({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, { recipeId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_recipe", (q) =>
        q.eq("userId", userId).eq("recipeId", recipeId)
      )
      .first();

    return !!favorite;
  },
});

export const add = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, { recipeId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already favorited
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_recipe", (q) =>
        q.eq("userId", userId).eq("recipeId", recipeId)
      )
      .first();

    if (existing) return existing._id;

    // Increment save count on recipe
    const recipe = await ctx.db.get(recipeId);
    if (recipe) {
      await ctx.db.patch(recipeId, {
        saveCount: (recipe.saveCount || 0) + 1,
      });
    }

    return await ctx.db.insert("favorites", {
      userId,
      recipeId,
      savedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, { recipeId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_recipe", (q) =>
        q.eq("userId", userId).eq("recipeId", recipeId)
      )
      .first();

    if (favorite) {
      await ctx.db.delete(favorite._id);

      // Decrement save count
      const recipe = await ctx.db.get(recipeId);
      if (recipe && recipe.saveCount) {
        await ctx.db.patch(recipeId, {
          saveCount: Math.max(0, recipe.saveCount - 1),
        });
      }
    }
  },
});

export const toggle = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, { recipeId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_recipe", (q) =>
        q.eq("userId", userId).eq("recipeId", recipeId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      await ctx.db.insert("favorites", {
        userId,
        recipeId,
        savedAt: Date.now(),
      });
      return true;
    }
  },
});
```

### 4.4 AI Actions

```typescript
// convex/ai.ts
"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

const getModel = (modelId?: string) => {
  switch (modelId) {
    case "gpt-4o":
      return openai("gpt-4o");
    case "gpt-4o-mini":
      return openai("gpt-4o-mini");
    case "claude-sonnet":
      return anthropic("claude-sonnet-4-20250514");
    case "claude-opus":
      return anthropic("claude-opus-4-20250514");
    case "gemini-pro":
      return google("gemini-2.0-pro");
    case "gemini-flash":
    default:
      return google("gemini-2.0-flash");
  }
};

export const extractIngredients = action({
  args: {
    imageBase64: v.string(),
  },
  handler: async (ctx, { imageBase64 }) => {
    const model = google("gemini-2.0-flash");

    const { text } = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and list all visible food ingredients.
Return ONLY a JSON array of ingredient names, nothing else.
Example: ["chicken breast", "carrots", "onion", "garlic"]
Be specific (e.g., "chicken breast" not just "chicken").
Only include actual food items, not containers or non-food objects.`,
            },
            {
              type: "image",
              image: imageBase64,
            },
          ],
        },
      ],
    });

    try {
      // Clean up response (remove markdown code blocks if present)
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse ingredients:", text);
      throw new Error("Failed to extract ingredients from image");
    }
  },
});

export const generateRecipe = action({
  args: {
    ingredients: v.array(v.string()),
    modelId: v.optional(v.string()),
    preferences: v.optional(
      v.object({
        cuisine: v.optional(v.string()),
        difficulty: v.optional(v.string()),
        maxTimeMinutes: v.optional(v.number()),
        dietary: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, { ingredients, modelId, preferences }) => {
    const model = getModel(modelId);

    const prefString = preferences
      ? `
Preferences:
- Cuisine: ${preferences.cuisine || "any"}
- Difficulty: ${preferences.difficulty || "any"}
- Max cooking time: ${preferences.maxTimeMinutes || "any"} minutes
- Dietary restrictions: ${preferences.dietary?.join(", ") || "none"}
`
      : "";

    const { text } = await generateText({
      model,
      prompt: `Create a recipe using these ingredients: ${ingredients.join(", ")}
${prefString}
You can suggest additional common pantry items if needed (oil, salt, pepper, etc).

Return ONLY valid JSON in this exact format:
{
  "title": "Recipe Name",
  "description": "Brief appetizing description (1-2 sentences)",
  "ingredients": [
    { "name": "ingredient name", "amount": "1", "unit": "cup" }
  ],
  "steps": [
    { "order": 1, "instruction": "Step instruction", "timerMinutes": null }
  ],
  "cookTimeMinutes": 30,
  "prepTimeMinutes": 15,
  "servings": 4,
  "difficulty": "easy",
  "tags": ["quick", "healthy"],
  "cuisine": "Asian"
}

Notes:
- timerMinutes should be a number or null (for steps that need timing)
- difficulty must be "easy", "medium", or "hard"
- Include 4-6 relevant tags
- Steps should be clear and actionable`,
    });

    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      const recipe = JSON.parse(cleaned);

      // Validate required fields
      if (!recipe.title || !recipe.ingredients || !recipe.steps) {
        throw new Error("Invalid recipe structure");
      }

      return recipe;
    } catch (e) {
      console.error("Failed to parse recipe:", text);
      throw new Error("Failed to generate recipe");
    }
  },
});

export const suggestTags = action({
  args: {
    title: v.string(),
    ingredients: v.array(v.string()),
  },
  handler: async (ctx, { title, ingredients }) => {
    const model = google("gemini-2.0-flash");

    const { text } = await generateText({
      model,
      prompt: `Suggest 4-6 relevant tags for this recipe:
Title: ${title}
Ingredients: ${ingredients.join(", ")}

Return ONLY a JSON array of tag strings.
Example: ["quick", "healthy", "vegetarian", "asian", "spicy"]

Consider:
- Cooking time (quick, slow-cooked)
- Health aspects (healthy, comfort-food, light)
- Dietary (vegetarian, vegan, gluten-free, dairy-free)
- Cuisine type (asian, italian, mexican, etc)
- Meal type (breakfast, lunch, dinner, snack)
- Characteristics (spicy, creamy, crispy)`,
    });

    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (e) {
      return ["homemade"];
    }
  },
});
```

---

## 5. PostHog Integration

### 5.1 Setup

```typescript
// lib/posthog.ts
import PostHog from "posthog-react-native";

export const posthog = new PostHog(
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY!,
  {
    host: "https://app.posthog.com",
    // Enable session recording (optional)
    // enableSessionReplay: true,
  }
);

// Helper functions
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  posthog.capture(eventName, properties);
};

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  posthog.identify(userId, properties);
};

export const resetUser = () => {
  posthog.reset();
};
```

### 5.2 Analytics Hook

```typescript
// hooks/useAnalytics.ts
import { useCallback } from "react";
import { trackEvent, identifyUser } from "@/lib/posthog";

export function useAnalytics() {
  const track = useCallback(
    (event: string, properties?: Record<string, any>) => {
      trackEvent(event, {
        ...properties,
        timestamp: new Date().toISOString(),
      });
    },
    []
  );

  return {
    // Auth events
    trackSignUp: (method: "email" | "google") =>
      track("user_signed_up", { method }),

    trackLogin: (method: "email" | "google") =>
      track("user_logged_in", { method }),

    // Ingredient events
    trackIngredientAdded: (source: "manual" | "photo", count: number) =>
      track("ingredient_added", { source, count }),

    trackPhotoAnalyzed: (ingredientCount: number, success: boolean) =>
      track("photo_analyzed", { ingredient_count: ingredientCount, success }),

    // Recipe events
    trackRecipeGenerated: (model: string, ingredientCount: number, durationMs: number) =>
      track("recipe_generated", {
        model,
        ingredient_count: ingredientCount,
        duration_ms: durationMs,
      }),

    trackRecipeSaved: (aiGenerated: boolean, tags: string[]) =>
      track("recipe_saved", { ai_generated: aiGenerated, tags }),

    trackRecipeEdited: (fieldsChanged: string[]) =>
      track("recipe_edited", { fields_changed: fieldsChanged }),

    // Cooking events
    trackCookingStarted: (recipeId: string, stepCount: number) =>
      track("cooking_started", { recipe_id: recipeId, step_count: stepCount }),

    trackCookingCompleted: (recipeId: string, durationMinutes: number) =>
      track("cooking_completed", {
        recipe_id: recipeId,
        duration_minutes: durationMinutes,
      }),

    trackTimerUsed: (stepNumber: number, durationMinutes: number) =>
      track("timer_used", { step_number: stepNumber, duration_minutes: durationMinutes }),

    // Engagement events
    trackFavoriteAdded: (recipeId: string) =>
      track("favorite_added", { recipe_id: recipeId }),

    trackModelChanged: (fromModel: string, toModel: string) =>
      track("model_changed", { from_model: fromModel, to_model: toModel }),

    // User identification
    identify: identifyUser,
  };
}
```

### 5.3 Provider Setup

```typescript
// app/_layout.tsx
import { PostHogProvider } from "posthog-react-native";
import { posthog } from "@/lib/posthog";

export default function RootLayout() {
  return (
    <PostHogProvider client={posthog}>
      <ConvexClientProvider>
        {/* ... rest of app */}
      </ConvexClientProvider>
    </PostHogProvider>
  );
}
```

---

## 6. Key Components

### 6.1 Ingredient Input

```typescript
// components/IngredientInput.tsx
import { useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Camera, Plus } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface Props {
  onCameraPress: () => void;
}

export function IngredientInput({ onCameraPress }: Props) {
  const [value, setValue] = useState("");
  const addIngredient = useMutation(api.ingredients.add);

  const handleAdd = async () => {
    if (!value.trim()) return;

    await addIngredient({
      name: value.trim(),
      source: "manual",
    });

    setValue("");
  };

  return (
    <View className="flex-row items-center gap-2">
      <TextInput
        className="flex-1 border border-gray-300 rounded-lg px-4 py-3"
        placeholder="Add ingredient..."
        value={value}
        onChangeText={setValue}
        onSubmitEditing={handleAdd}
        returnKeyType="done"
      />

      <TouchableOpacity
        onPress={handleAdd}
        className="bg-orange-500 p-3 rounded-lg"
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onCameraPress}
        className="bg-gray-200 p-3 rounded-lg"
      >
        <Camera size={24} color="#666" />
      </TouchableOpacity>
    </View>
  );
}
```

### 6.2 Timer Hook

```typescript
// hooks/useTimer.ts
import { useState, useEffect, useCallback, useRef } from "react";
import * as Notifications from "expo-notifications";

interface TimerState {
  isRunning: boolean;
  remainingSeconds: number;
  totalSeconds: number;
}

export function useTimer(initialMinutes: number, label?: string) {
  const [state, setState] = useState<TimerState>({
    isRunning: false,
    remainingSeconds: initialMinutes * 60,
    totalSeconds: initialMinutes * 60,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setState((s) => ({ ...s, isRunning: true }));
  }, []);

  const pause = useCallback(() => {
    setState((s) => ({ ...s, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isRunning: false,
      remainingSeconds: initialMinutes * 60,
      totalSeconds: initialMinutes * 60,
    });
  }, [initialMinutes]);

  useEffect(() => {
    if (state.isRunning && state.remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setState((s) => ({
          ...s,
          remainingSeconds: s.remainingSeconds - 1,
        }));
      }, 1000);
    } else if (state.remainingSeconds === 0 && state.isRunning) {
      // Timer completed
      setState((s) => ({ ...s, isRunning: false }));

      // Send notification
      Notifications.scheduleNotificationAsync({
        content: {
          title: "Timer Complete!",
          body: label || "Your timer has finished",
          sound: true,
        },
        trigger: null, // Immediate
      });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.remainingSeconds, label]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    ...state,
    formattedTime: formatTime(state.remainingSeconds),
    progress: 1 - state.remainingSeconds / state.totalSeconds,
    start,
    pause,
    reset,
    toggle: state.isRunning ? pause : start,
  };
}
```

---

## 7. Verification Checklist

### Setup
- [ ] Project initialized with RN Reusables CLI
- [ ] Convex connected (`npx convex dev` runs)
- [ ] Environment variables configured
- [ ] PostHog SDK initialized

### Auth
- [ ] Email signup works
- [ ] Email login works
- [ ] Google OAuth works (if implemented)
- [ ] Logout clears session

### Ingredients
- [ ] Can add ingredient (text)
- [ ] Can remove ingredient
- [ ] Can clear all ingredients
- [ ] Photo capture works
- [ ] AI extracts ingredients from photo
- [ ] Extracted ingredients are editable

### Recipes
- [ ] AI generates recipe from ingredients
- [ ] Recipe preview shows all data
- [ ] Can edit recipe before saving
- [ ] Recipe saves to database
- [ ] Recipe detail view works
- [ ] Can delete recipe

### Favorites
- [ ] Can add recipe to favorites
- [ ] Can remove from favorites
- [ ] Favorites list shows saved recipes
- [ ] Heart icon toggles correctly

### Cooking Mode
- [ ] Step-by-step view works
- [ ] Can navigate between steps
- [ ] Timer starts/pauses
- [ ] Timer notification fires
- [ ] Can complete cooking session

### Settings
- [ ] Model selection persists
- [ ] Profile info displays
- [ ] Logout works

### Analytics
- [ ] PostHog receives events
- [ ] User identification works
- [ ] Key events tracked

---

## 8. Running the Project

```bash
# Terminal 1: Convex dev server
npx convex dev

# Terminal 2: Expo dev server
bun run dev

# Or for specific platforms
bun run ios
bun run android
```

---

## 9. Demo Recording Checklist

1. **Intro** (30s)
   - Show app icon and splash
   - Brief explanation of what MealMind does

2. **Auth Flow** (1min)
   - Sign up with email
   - Show logged in state

3. **Add Ingredients - Text** (1min)
   - Type several ingredients
   - Show ingredient chips
   - Remove one ingredient

4. **Add Ingredients - Photo** (1min)
   - Open camera
   - Take photo of fridge/ingredients
   - Show AI extraction
   - Edit extracted list

5. **Generate Recipe** (1.5min)
   - Tap generate button
   - Show loading state
   - Display generated recipe
   - Edit title or step
   - Save recipe

6. **Favorites** (30s)
   - Add to favorites
   - View favorites tab
   - Heart icon state

7. **Cooking Mode** (2min)
   - Start cooking
   - Navigate through steps
   - Start a timer
   - Show timer countdown
   - Complete cooking

8. **Settings** (30s)
   - Show model selection
   - Change model preference

9. **Wrap Up** (30s)
   - Recap features
   - Show tech stack used

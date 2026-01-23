# MealMind PRD

**Version:** 1.0
**Author:** @Bug-Finderr
**Deadline:** January 21, 2026

---

## 1. Executive Summary

**MealMind** is a mobile app that transforms available ingredients into personalized recipes using AI. Users input ingredients via text or photo, receive AI-generated recipes, and cook with step-by-step guidance including timers.

**Core Value Proposition:** "What can I cook with what I have?"

---

## 2. Problem Statement

### User Pain Points
1. **Decision fatigue** - "What should I cook tonight?" is a daily struggle
2. **Food waste** - Ingredients expire because users don't know what to make with them
3. **Recipe discovery** - Traditional recipe apps require knowing what you want first
4. **Cooking guidance** - Following recipes while cooking is clunky (scrolling, timers)

### Market Gap
- Existing recipe apps are search-based (you need to know what you want)
- Ingredient-based apps lack AI sophistication (simple keyword matching)
- No seamless cooking mode with integrated timers

---

## 3. Target Users

### Primary Persona: "Busy Home Cook"
- Age: 25-45
- Cooks 3-5 times/week
- Has random ingredients in fridge
- Values convenience over culinary perfection
- Tech-comfortable, uses phone while cooking

### Secondary Persona: "Learning Cook"
- Age: 18-30
- Wants to cook more but lacks ideas
- Needs step-by-step guidance
- Appreciates AI suggestions

---

## 4. Requirements

### 4.1 Functional Requirements

#### P0 - Core (Must Ship)

| ID | Feature | Description | Acceptance Criteria |
|----|---------|-------------|---------------------|
| F1 | Ingredient Input (Text) | Add ingredients by typing | User can add/remove ingredients, see list |
| F2 | AI Recipe Generation | Generate recipe from ingredients | Returns complete recipe with steps, times |
| F3 | Ingredient Input (Photo) | Take photo, AI extracts ingredients | Photo → AI → editable ingredient list |
| F4 | Recipe Editor | Edit AI recipe before saving | Can modify title, ingredients, steps |
| F5 | Recipe Detail View | Display full recipe | Shows all info, ingredients, steps |
| F6 | Favorites | Save recipes to collection | Add/remove from favorites, view list |
| F7 | Cooking Mode | Step-by-step with timers | Navigate steps, start/pause timers |
| F8 | Model Selection | Choose AI model in settings | Persist preference, use for generation |
| F9 | User Auth | Sign up / login | Email + OAuth (Google) |

#### P1 - Stretch (If Time)

| ID | Feature | Description |
|----|---------|-------------|
| F10 | Explore Feed | Browse community recipes |
| F11 | Recipe Sharing | Publish recipe publicly |
| F12 | Voting | Upvote/downvote recipes |
| F13 | Interest Tags | Filter feed by preferences |
| F14 | User Stats | View cooking analytics |

### 4.2 Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Recipe generation time | < 15 seconds |
| Image analysis time | < 5 seconds |
| App startup time | < 2 seconds |
| Offline support | View saved recipes offline |
| Platform support | iOS 15+, Android 10+ |

---

## 5. User Stories

### Ingredient Management
- User wants to type ingredients they have so they can get recipe suggestions 
- User wants to photograph their fridge so AI can identify ingredients
- User wants to edit extracted ingredients if AI made mistakes

### Recipe Generation
- User wants AI to suggest recipes based on their ingredients
- User wants to edit the AI recipe before saving it
- User wants to regenerate if they don't like the suggestion

### Recipe Management
- User wants to save recipes to their favorites
- User wants to view their saved recipes anytime
- User wants to delete recipes they no longer want

### Cooking
- User wants step-by-step cooking instructions
- User wants timers for steps that need them
- User wants to mark steps as complete

### Settings
- User wants to choose their preferred AI model
- User wants to view their cooking statistics (P1)

---

## 6. User Flows

### Flow 1: Generate Recipe from Text Input
```
Home Screen
    ↓
[Type ingredient] → Add to list
    ↓
[Tap "Generate Recipe"]
    ↓
Loading (AI generating)
    ↓
Recipe Preview Screen
    ↓
[Edit] → Recipe Editor → [Save]
    or
[Save directly]
    ↓
Recipe saved to Favorites
```

### Flow 2: Generate Recipe from Photo
```
Home Screen
    ↓
[Tap Camera icon]
    ↓
Camera opens → Take photo
    ↓
Loading (AI extracting)
    ↓
Ingredient list (editable)
    ↓
[Confirm] → Generate Recipe flow
```

### Flow 3: Cooking Mode
```
Recipe Detail Screen
    ↓
[Start Cooking]
    ↓
Cooking Mode Screen
    ↓
Step 1 displayed
    ↓
[Start Timer] (if step has timer)
    ↓
Timer countdown (notification when done)
    ↓
[Next Step] → Step 2...
    ↓
[Finish] → Back to Recipe
```

---

## 7. Technical Architecture

### 7.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP                               │
│                    (Expo + React Native)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  Home    │  │Favorites │  │ Explore  │  │ Profile  │         │
│  │  Screen  │  │  Screen  │  │  Screen  │  │  Screen  │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       │             │             │             │               │
│       └─────────────┴─────────────┴─────────────┘               │
│                           │                                     │
│                    ConvexProvider                               │
│                    (Real-time sync)                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ WebSocket + HTTP
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                        CONVEX                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     FUNCTIONS                           │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │    │
│  │  │ Queries │  │Mutations│  │ Actions │  │  Auth   │     │    │
│  │  └─────────┘  └─────────┘  └────┬────┘  └─────────┘     │    │
│  └─────────────────────────────────┼───────────────────────┘    │
│                                    │                            │
│  ┌─────────────────────────────────▼───────────────────────┐    │
│  │                    DATABASE                             │    │
│  │  users │ recipes │ favorites │ ingredients │ votes      │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ AI Actions (HTTP)
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Gemini    │  │   OpenAI    │  │  Anthropic  │              │
│  │  (default)  │  │   (paid)    │  │   (paid)    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                 │
│  ┌─────────────┐                                                │
│  │   PostHog   │  ← Analytics + User Stats                      │
│  └─────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Expo SDK 54 | Latest stable, great DX |
| **UI Components** | React Native Reusables | shadcn/ui for RN, consistent design |
| **Styling** | NativeWind/Uniwind | Tailwind for RN, rapid UI dev |
| **Navigation** | Expo Router | File-based routing |
| **Backend** | Convex | Real-time, serverless, TypeScript |
| **Database** | Convex | Built-in, reactive queries |
| **Auth** | Convex Auth | Built-in, OAuth support |
| **AI** | AI SDK 6 | Multi-provider, unified API |
| **AI Models** | Gemini, OpenAI, Anthropic | Flexibility, quality options |
| **Analytics** | PostHog | Open-source, product analytics |
| **Linting** | Biome | Fast, unified linter/formatter |
| **Git Hooks** | Lefthook | Pre-commit checks |

### 7.3 Why These Choices

**Convex over Supabase/Firebase:**
- Real-time subscriptions built-in (no extra setup)
- TypeScript end-to-end (schema → functions → client)
- Actions can call external APIs (AI providers)
- Developer already familiar (from previous project)

**AI SDK 6 over direct API calls:**
- Unified interface for multiple providers
- Easy provider switching
- Built-in streaming support
- Image input support

**PostHog over Mixpanel/Amplitude:**
- Open-source, self-hostable option
- Free tier sufficient for project
- React Native SDK available
- Feature flags for future use

---

## 8. Data Model

### 8.1 Entity Relationship Diagram

```
┌───────────────┐       ┌──────────────┐
│    users      │       │   recipes    │
├───────────────┤       ├──────────────┤
│ _id           │──┐    │ _id          │
│ email         │  │    │ userId      ←┼────┐
│ name          │  │    │ title        │    │
│ avatarUrl     │  │    │ description  │    │
│ preferredModel│  │    │ imageUrl     │    │
│ interestTags  │  │    │ ingredients[]│    │
│ createdAt     │  │    │ steps[]      │    │
└───────────────┘  │    │ cookTime     │    │
                   │    │ servings     │    │
                   │    │ tags[]       │    │
                   │    │ isPublic     │    │
                   │    │ aiGenerated  │    │
                   │    │ createdAt    │    │
                   │    └──────────────┘    │
                   │                        │
                   │    ┌──────────────┐    │
                   │    │  favorites   │    │
                   │    ├──────────────┤    │
                   │    │ _id          │    │
                   └───→│ userId       │    │
                        │ recipeId    ←┼────┤
                        │ savedAt      │    │
                        └──────────────┘    │
                                            │
                        ┌──────────────┐    │
                        │ ingredients  │    │
                        ├──────────────┤    │
                        │ _id          │    │
                        │ userId      ←┼────┤
                        │ name         │    │
                        │ source       │    │
                        │ addedAt      │    │
                        └──────────────┘    │
                                            │
                        ┌──────────────┐    │
                        │    votes     │    │
                        ├──────────────┤    │
                        │ _id          │    │
                        │ userId      ←┼────┘
                        │ recipeId     │
                        │ value (+1/-1)│
                        │ createdAt    │
                        └──────────────┘
```

### 8.2 Schema Definition

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Auth fields (managed by Convex Auth)
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),

    // Preferences
    preferredModel: v.optional(v.string()), // "gemini-flash" | "gpt-4o" | "claude-sonnet"
    interestTags: v.optional(v.array(v.string())),

    // Stats (for PostHog integration)
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
    sourceModel: v.optional(v.string()), // Which AI model generated it

    // Engagement (for Explore)
    viewCount: v.optional(v.number()),
    saveCount: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_recent", ["userId", "createdAt"])
    .index("by_public", ["isPublic", "createdAt"])
    .index("by_tags", ["tags"]),

  favorites: defineTable({
    userId: v.id("users"),
    recipeId: v.id("recipes"),
    savedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_recent", ["userId", "savedAt"])
    .index("by_recipe", ["recipeId"])
    .index("by_user_recipe", ["userId", "recipeId"]),

  // P1: Voting for Explore
  votes: defineTable({
    userId: v.id("users"),
    recipeId: v.id("recipes"),
    value: v.union(v.literal(1), v.literal(-1)),
    createdAt: v.number(),
  })
    .index("by_user_recipe", ["userId", "recipeId"])
    .index("by_recipe", ["recipeId"]),

  // Analytics events (for PostHog backup/custom analysis)
  analyticsEvents: defineTable({
    userId: v.optional(v.id("users")),
    eventName: v.string(),
    properties: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_event", ["eventName", "timestamp"]),
});
```

---

## 9. API Design

### 9.1 Convex Queries

```typescript
// Read operations (reactive, real-time)

// Ingredients
ingredients.listByUser() → Ingredient[]
ingredients.count() → number

// Recipes
recipes.getById(id) → Recipe | null
recipes.listByUser(limit?, cursor?) → { recipes: Recipe[], nextCursor? }
recipes.listFavorites(limit?, cursor?) → { recipes: Recipe[], nextCursor? }
recipes.listPublic(limit?, cursor?, tags?) → { recipes: Recipe[], nextCursor? } // P1
recipes.search(query, filters?) → Recipe[] // P1

// Users
users.getCurrentUser() → User | null
users.getPreferences() → { preferredModel, interestTags }
users.getStats() → { recipesGenerated, recipesCookedCount, favoriteCount }
```

### 9.2 Convex Mutations

```typescript
// Write operations

// Ingredients
ingredients.add(name, source) → ingredientId
ingredients.addBatch(names[], source) → ingredientId[]
ingredients.remove(id) → void
ingredients.clear() → void

// Recipes
recipes.create(recipe) → recipeId
recipes.update(id, updates) → void
recipes.delete(id) → void
recipes.togglePublic(id) → boolean // P1
recipes.incrementCookCount(id) → void

// Favorites
favorites.add(recipeId) → favoriteId
favorites.remove(recipeId) → void
favorites.toggle(recipeId) → boolean

// Users
users.updatePreferences(preferredModel?, interestTags?) → void
users.incrementRecipesGenerated() → void

// Votes (P1)
votes.cast(recipeId, value) → void
votes.remove(recipeId) → void
```

### 9.3 Convex Actions (AI)

```typescript
// External API calls (not reactive)

ai.extractIngredients(imageBase64: string) → string[]
// Uses Gemini Vision to identify food items in image

ai.generateRecipe(ingredients: string[], preferences?: {
  cuisine?: string,
  difficulty?: string,
  maxTime?: number,
  dietary?: string[],
}) → GeneratedRecipe
// Uses selected AI model to create recipe

ai.suggestTags(title: string, ingredients: string[]) → string[]
// Auto-generate relevant tags

ai.generateRecipeImage(title: string, description: string) → string
// P1: Generate image for recipe using DALL-E/Imagen
```

---

## 10. Analytics & User Stats (PostHog)

### 10.1 Events to Track

| Event | Properties | Purpose |
|-------|------------|---------|
| `user_signed_up` | method (email/google) | Acquisition |
| `ingredient_added` | source (manual/photo), count | Usage patterns |
| `photo_analyzed` | ingredient_count, success | AI feature usage |
| `recipe_generated` | model, ingredient_count, time_ms | AI performance |
| `recipe_saved` | ai_generated, tags | Content creation |
| `recipe_edited` | fields_changed | User refinement |
| `cooking_started` | recipe_id, step_count | Engagement |
| `cooking_completed` | recipe_id, duration_minutes | Completion |
| `timer_used` | step_number, duration | Feature usage |
| `favorite_added` | recipe_id | Engagement |
| `model_changed` | from_model, to_model | Preferences |
| `recipe_shared` | recipe_id | P1: Virality |

### 10.2 User Properties

```typescript
// Set on PostHog user profile
{
  email: string,
  created_at: Date,
  preferred_model: string,
  total_recipes_generated: number,
  total_recipes_cooked: number,
  favorite_cuisines: string[],
  avg_cooking_time: number,
  is_premium: boolean, // Future
}
```

### 10.3 User Stats Dashboard (P1)

Display in Profile screen:
- Recipes generated this month
- Recipes cooked
- Most used ingredients
- Favorite cuisines
- Cooking time saved (vs ordering)
- Streak (days cooking)

---

## 11. Navigation Structure

```
App
├── (auth)                    # Auth group (unauthenticated)
│   ├── login.tsx
│   └── signup.tsx
│
├── (tabs)                    # Main tabs (authenticated)
│   ├── index.tsx             # Home - Ingredient input
│   ├── favorites.tsx         # Saved recipes
│   ├── explore.tsx           # Community (P1)
│   └── profile.tsx           # Settings & stats
│
├── recipe/
│   ├── [id].tsx              # Recipe detail
│   ├── edit.tsx              # Edit recipe
│   └── cook.tsx              # Cooking mode
│
└── _layout.tsx               # Root layout
```

---

## 12. Implementation Plan

### Phase 1: Foundation (Days 1-2)
- [ ] Initialize project with React Native Reusables CLI
- [ ] Setup Convex backend
- [ ] Configure Convex Auth (email + Google OAuth)
- [ ] Create tab navigation structure
- [ ] Build auth screens (login/signup)
- [ ] Setup PostHog SDK

### Phase 2: Core Features (Days 3-5)
- [ ] Ingredient input component (text)
- [ ] Camera integration for photo input
- [ ] AI action: extract ingredients from image
- [ ] AI action: generate recipe
- [ ] Recipe preview/editor screen
- [ ] Save recipe flow

### Phase 3: Recipe Management (Days 5-6)
- [ ] Recipe detail screen
- [ ] Favorites functionality
- [ ] Favorites list screen
- [ ] Model selection in settings
- [ ] User preferences persistence

### Phase 4: Cooking Experience (Days 7-8)
- [ ] Cooking mode screen
- [ ] Step-by-step navigation
- [ ] Timer functionality
- [ ] Timer notifications
- [ ] Completion tracking

### Phase 5: Polish & Demo (Day 9)
- [ ] UI polish (animations, loading states)
- [ ] Error handling
- [ ] Analytics verification
- [ ] Demo video recording
- [ ] README documentation

### Stretch Goals (If Time)
- [ ] Explore feed
- [ ] Recipe sharing
- [ ] Voting system
- [ ] User stats dashboard

---

## 13. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI image recognition accuracy | Medium | Medium | Show extracted ingredients for user editing |
| AI recipe quality | Low | Medium | User can edit before saving, regenerate option |
| Time constraints | Medium | High | P0 features first, clear scope |
| Convex RN compatibility | Low | High | Already solved in previous project |
| OAuth setup complexity | Medium | Medium | Start with email, add OAuth if time |
| PostHog RN integration | Low | Low | Good RN SDK, fallback to web SDK |

---

## 14. Success Metrics

### Project Submission
- [ ] All P0 features functional
- [ ] Demo video 5-10 minutes
- [ ] README with setup instructions
- [ ] Clean code structure

### Professor's Rubric Alignment
| Criteria | Target | Points |
|----------|--------|--------|
| Project Idea & Use Case | Clear ingredient→recipe→cook flow | 10 |
| Frontend Implementation | Polished Expo + RN Reusables UI | 25 |
| Backend API Design | Clean Convex functions | 20 |
| Database Design | Indexed schema, relationships | 15 |
| Full-Stack Integration | Real-time + AI actions | 15 |
| UI/UX & User Flow | Intuitive navigation | 10 |
| Code Quality | TypeScript, Biome, structure | 5 |
| **Total** | | **100** |

---

## 15. References

### Documentation
- [Expo SDK 54](https://expo.dev/changelog/sdk-54)
- [React Native Reusables](https://reactnativereusables.com/docs)
- [Convex React Native](https://docs.convex.dev/quickstart/react-native)
- [Convex Auth](https://docs.convex.dev/auth/convex-auth)
- [AI SDK 6](https://ai-sdk.dev/docs/introduction)
- [PostHog React Native](https://posthog.com/docs/libraries/react-native)

### Inspiration
- [Supercook](https://www.supercook.com/) - Ingredient-based recipe search
- [Whisk](https://whisk.com/) - Recipe management
- [Pestle](https://apps.apple.com/app/pestle-recipe-manager/id1574776971) - Cooking mode reference

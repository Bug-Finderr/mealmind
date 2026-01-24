# MealMind PRD

**Version:** 1.0
**Author:** @Bug-Finderr

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
| ~~F1~~ | User Auth | Sign up / login | Email + OAuth (Google) |
| ~~F2~~ | Ingredient Input (Text) | Add ingredients by typing | User can add/remove ingredients, see list |
| ~~F3~~ | AI Recipe Generation | Generate recipe from ingredients and show | Returns complete recipe with steps, times |
| ~~F4~~ | Ingredient Input (Photo) | Take photo, AI extracts ingredients | Photo → AI → editable ingredient list |
| ~~F5~~ | Recipe Editor | Edit AI recipe before saving | Can modify title, ingredients, steps |
| ~~F6~~ | History & Favorites | View all generations, filter favorites | Infinite scroll, swipe-to-delete, favorites filter |
| ~~F7~~ | Cooking Mode | Step-by-step with timers | Navigate steps, start/pause timers |
| ~~F8~~ | User Profile | View/edit profile, sign out | Display name/email, edit name, sign out button |
| ~~F9~~ | Payment Method | Add payment to unlock premium AI models | Stripe integration, unlock paid models |
| ~~F10~~ | Model Selection | Choose AI model in settings | Persist preference, use for generation |

#### P1 - Stretch (If Time)

| ID | Feature | Description |
|----|---------|-------------|
| ~~F11~~ | App Refinement | Test and refine existing features |
| ~~F12~~ | Offline Support | View saved recipes offline |
| F13 | Notifications | Reminders for cooking steps |
| F14 | Explore Feed | Browse community recipes |
| F15 | Recipe Sharing | Publish recipe publicly |
| F16 | Voting | Upvote/downvote recipes |
| F17 | Interest Tags | Filter feed by preferences |
| F18 | User Stats | View cooking analytics |

### 4.2 Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Recipe generation time | < 15 seconds |
| Image analysis time | < 5 seconds |
| App startup time | < 2 seconds |
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
- User wants to view their recipe history
- User wants to filter history to show only favorites
- User wants to delete recipes
- User wants to favorite/unfavorite recipes from detail view

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
Recipe saved to History (optionally favorited)
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
│  │  Home    │  │ History  │  │ Explore  │  │ Profile  │         │
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
│  │  users │ recipes │ ingredients │ models │ votes (P1)    │    │
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
| **Payments** | Stripe | Premium subscriptions |
| **Linting** | Biome | Fast, unified linter/formatter |
| **Git Hooks** | Lefthook | Pre-commit checks |

### 7.3 Why These Choices

**Convex over Supabase/Firebase:**
- Real-time subscriptions built-in (no extra setup)
- TypeScript end-to-end (schema → functions → client)
- Actions can call external APIs (AI providers)
- Developer already familiar (from previous project)

**Vercel AI SDK over direct API calls:**
- Unified interface for multiple providers (Google, OpenAI, Anthropic)
- Easy provider switching based on user preference
- Structured output with Zod schema validation
- Image input support for ingredient extraction

**Stripe for Payments:**
- Industry standard for mobile payments
- React Native SDK with PaymentSheet
- Easy integration with Convex actions

---

## 8. Data Model

### 8.1 Entity Relationship Diagram

```
┌─────────────────────┐       ┌──────────────────┐
│       users         │       │     recipes      │
├─────────────────────┤       ├──────────────────┤
│ _id                 │──┐    │ _id              │
│ email               │  │    │ userId          ←┼────┐
│ name                │  │    │ title            │    │
│ image               │  │    │ description      │    │
│ isPremium           │  │    │ ingredients[]    │    │
│ preferences: {      │  │    │ steps[]          │    │
│   imageAnalysisModel│  │    │ favorited        │    │
│   recipeGeneration  │  │    │ archived         │    │
│ }                   │  │    │ createdAt        │    │
└─────────────────────┘  │    │ meta: {          │    │
                         │    │   cookTimeMinutes│    │
                         │    │   servings       │    │
                         │    │   tags[]         │    │
                         │    │   aiGenerated    │    │
                         │    │ }                │    │
                         │    └──────────────────┘    │
                         │                            │
                         │    ┌──────────────────┐    │
                         │    │   ingredients    │    │
                         │    ├──────────────────┤    │
                         │    │ _id              │    │
                         └───→│ userId           │    │
                              │ name             │    │
                              │ source           │    │
                              │ addedAt          │    │
                              └──────────────────┘    │
                                                      │
                              ┌──────────────────┐    │
                              │     models       │    │
                              ├──────────────────┤    │
                              │ _id              │    │
                              │ key              │    │
                              │ name             │    │
                              │ provider         │    │
                              │ tier (free/paid) │    │
                              │ enabled          │    │
                              └──────────────────┘    │
                                                      │
                              ┌──────────────────┐    │
                              │  votes (P1)      │    │
                              ├──────────────────┤    │
                              │ _id              │    │
                              │ userId          ←┼────┘
                              │ recipeId         │
                              │ value (+1/-1)    │
                              │ createdAt        │
                              └──────────────────┘
```

---

## 10. Analytics & User Stats (Future - P1)

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

### 10.2 User Properties (Future)

```typescript
// Future analytics user profile
{
  email: string,
  created_at: Date,
  preferred_model: string,
  total_recipes_generated: number,
  total_recipes_cooked: number,
  favorite_cuisines: string[],
  avg_cooking_time: number,
  is_premium: boolean,
}
```

### 10.3 User Stats Dashboard (P1)

Display in Settings screen:
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
├── (auth)/                   # Auth group (unauthenticated)
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   └── _layout.tsx
│
├── (tabs)/                   # Main tabs (authenticated)
│   ├── index.tsx             # Home - Ingredient input & generation
│   ├── history.tsx           # Recipe history with favorites filter
│   ├── settings.tsx          # Profile, premium, AI model selection
│   └── _layout.tsx
│
├── recipe/
│   ├── [id].tsx              # Recipe detail view
│   └── cook.tsx              # Cooking mode with timers
│
├── index.tsx                 # Entry point (auth redirect)
└── _layout.tsx
```

---

## 13. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI image recognition accuracy | Medium | Medium | Show extracted ingredients for user editing |
| AI recipe quality | Low | Medium | User can edit before saving, regenerate option |
| Time constraints | Medium | High | P0 features first, clear scope |
| OAuth setup complexity | Medium | Medium | Start with email, add OAuth if time |
| PostHog RN integration | Low | Low | Good RN SDK, fallback to web SDK |

---

## 14. Success Metrics

### Project Submission
- [x] All P0 features functional
- [x] Demo video 5-10 minutes
- [x] README with setup instructions
- [x] Clean code structure

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

# MealMind

**Transform your ingredients into delicious recipes with AI.**

MealMind is a mobile app that answers the daily question: "What can I cook with what I have?" Input your ingredients via text or photo, get AI-generated recipes tailored to your mood, and cook with step-by-step guidance including timers.

[Demo Video](https://drive.google.com/file/d/10YXxPVpyhMwENesuLZd72MSdRbCCq03b/view?usp=sharing)

---

## Features

- **Ingredient Input** - Add ingredients manually or scan your fridge with your camera
- **AI Recipe Generation** - Get personalized recipes based on your ingredients and preferences
- **Recipe Editor** - Customize AI-generated recipes before saving
- **History** - Browse all generations, filter by favorites, swipe-to-delete
- **Cooking Mode** - Step-by-step instructions with per-step timers
- **AI Model Selection** - Choose from multiple AI providers (Gemini, OpenAI, Anthropic)
- **Premium Tier** - Unlock advanced AI models with a one-time payment

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Expo SDK 54 + React Native |
| **Routing** | Expo Router (file-based) |
| **Backend** | Convex (serverless, real-time) |
| **Auth** | Convex Auth (email + Google OAuth) |
| **AI** | AI SDK 6 (Gemini, OpenAI, Anthropic) |
| **Payments** | Stripe (React Native SDK) |
| **Styling** | Tailwind CSS via Uniwind |
| **UI Components** | React Native Reusables |

---

## Project Structure

```
mealmind/
├── app/
│   ├── (auth)/               # Auth screens
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/               # Main app tabs
│   │   ├── index.tsx         # Home - ingredient input
│   │   ├── history.tsx       # Recipe history + favorites filter
│   │   └── settings.tsx      # Profile & preferences
│   └── recipe/
│       ├── [id].tsx          # Recipe detail
│       └── cook.tsx          # Cooking mode
├── convex/                   # Backend functions
│   ├── schema.ts             # Database schema
│   ├── ai.ts                 # AI actions (extract, generate)
│   ├── recipes.ts            # Recipe CRUD + paginated list
│   ├── users.ts              # User profile
│   ├── favorites.ts          # Favorites toggle
│   ├── ingredients.ts        # Ingredient management
│   ├── models.ts             # AI model config
│   └── stripe.ts             # Payment processing
├── components/
│   ├── ui/...                # Reusable UI primitives
│   └── ...
├── types/...                 # Shared TypeScript types
└── lib/...                   # Utility functions
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (package manager)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Convex account](https://convex.dev/)
- iOS Simulator / Android Emulator / Physical device

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Bug-Finderr/mealmind.git
   cd mealmind
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up Convex**
   ```bash
   bunx convex dev
   ```
   Follow the prompts to create a new project or link an existing one.

4. **Configure environment variables**

   Edit `.env.local` in the project root:
   ```env
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

   Add secrets to Convex dashboard:
   - `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI API key
   - `OPENAI_API_KEY` - OpenAI API key (for premium)
   - `ANTHROPIC_API_KEY` - Anthropic API key (for premium)
   - `STRIPE_SECRET_KEY` - Stripe secret key

5. **Seed the AI models database**
   ```bash
   bunx convex run internal.models:seed
   ```

6. **Start development servers**
   ```bash
   bun dev
   ```
   This starts both Expo and Convex dev servers via mprocs.

### Running on Device

- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Physical Device**: Scan QR code with Expo Go app

---

## Development Commands

```bash
bun dev              # Start Expo + Convex dev servers
bun dev:expo         # Start Expo only
bun dev:db           # Start Convex only
bun lint             # Run Biome linter with auto-fix
```

### Adding UI Components

```bash
bunx --bun @react-native-reusables/cli@latest add [...components]
```

---

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `users` | User profiles with premium status and model preferences |
| `recipes` | Generated/saved recipes with ingredients and steps |
| `ingredients` | User's current ingredient list |
| `models` | Available AI models with tier (free/paid) |

### Key Fields

**recipes**
- `ingredients[]` - Array of `{ name, amount, unit? }`
- `steps[]` - Array of `{ order, instruction, timerMinutes? }`
- `favorited` - Boolean for favorites filter
- `archived` - Soft delete flag (swipe-to-delete)
- `meta` - Object containing `{ cookTimeMinutes, servings, tags[], aiGenerated }`

**users**
- `isPremium` - Unlocks paid AI models
- `preferences` - Object containing `{ imageAnalysisModel, recipeGenerationModel }`

---

## AI Integration

MealMind uses the Vercel AI SDK to support multiple providers.

Users can select their preferred model in Settings. Premium models require a $9.99 one-time upgrade.

---

## Authentication

MealMind supports:
- **Email/Password** - Traditional signup/login
- **Google OAuth** - One-tap sign-in

Authentication is handled by Convex Auth with secure session management.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Expo](https://expo.dev/) - React Native framework
- [Convex](https://convex.dev/) - Backend platform
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI integration
- [React Native Reusables](https://reactnativereusables.com/) - UI components
- [Stripe](https://stripe.com/) - Payment processing

<br>

> This file was formatted with AI assistance.

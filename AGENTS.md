# Zola Development Guide

## Commands

```bash
pnpm dev       # Start dev server with Turbopack
pnpm build     # Production build (outputs standalone)
pnpm start     # Start production server
pnpm lint      # Run ESLint
pnpm type-check # Run TypeScript type check
```

## Architecture

**Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Vercel AI SDK, Zustand, TanStack Query, Drizzle ORM, PostgreSQL.

### Directory Structure

- `app/` — Next.js App Router pages and API routes
  - `api/` — API routes (chat, models, tracking, etc.)
  - `components/` — Page-specific React components
- `components/` — Shared UI components
  - `ui/` — shadcn/ui base components
  - `prompt-kit/` — AI chat UI components
  - `icons/` — Custom icon components
- `lib/` — Core application logic
  - `db/` — Drizzle ORM schema and queries
  - `models/` — Model configuration (OpenAI, Claude, Gemini, Mistral, DeepSeek, Grok, Perplexity, Ollama, OpenRouter)
  - `chat-store/` — Zustand store for chat state
  - `user-preference-store/` — User preferences (theme, layout)
  - `model-store/` — Model selection state
  - `sessions/` — Session management (cookie-based)
  - `tracking/` — Analytics/fingerprinting
  - `openproviders/` — Third-party API provider integrations

### Supported Models

The app integrates with multiple LLM providers via Vercel AI SDK:

- OpenAI, Anthropic (Claude), Google (Gemini), Mistral, DeepSeek, xAI (Grok), Perplexity
- Ollama (local models with auto-detection)
- OpenRouter (BYOK - bring your own API key)

### State Management

- **Zustand** for client-side state (chat messages, user preferences, selected model)
- **TanStack Query** for server state
- **Drizzle ORM** for persistent storage (PostgreSQL)
- **Session-based** - no auth, cookie-based sessions

### API Routes

- `/api/chat` — Main chat endpoint streaming AI responses
- `/api/models` — Model listing and detection
- `/api/tracking` — Session/fingerprint tracking

### UI Components

Built on Radix UI primitives with Tailwind CSS styling. Uses `motion-primitives` for animations and `sonner` for toasts.

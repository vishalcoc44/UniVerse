# UniVerse - Global Rules

## Project Overview

UniVerse is a unified campus platform (a "super app" for universities) built with Next.js 16, Supabase, and Google Gemini AI. It consolidates social networking, academic support, career tools, and daily campus utilities into a single platform scoped to each university.

## Project Type

**Full-stack Web App** - Next.js 16 App Router with Supabase backend (Auth, Database, Realtime, Edge Functions)

---

## Tech Stack

### Core
- **Next.js** 16 (App Router, React 19)
- **TypeScript** 5.8+
- **Tailwind CSS** 3.4

### Backend
- **Supabase** - Auth, PostgreSQL, Realtime, Edge Functions
- **Prisma** 6 - ORM for database
- **Deno** - Edge function runtime

### Frontend
- **React** 19, **React DOM** 19
- **shadcn/ui** - UI components (Radix Primitives)
- **Framer Motion** 12 - Animations
- **TanStack Query** 5 - Server state
- **React Hook Form** + **Zod** - Forms & validation
- **Recharts** - Charts/visualization

### AI
- **Google Gemini 2.5 Flash** - AI model
- **@google/generative-ai** - SDK

---

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server
bun run dev          # Using Bun (faster)

# Build
npm run build        # Production build
npm run start        # Start production server

# Database
npx prisma db push   # Push schema to DB
npx prisma studio    # Open DB GUI
npm run update-schema  # Sync schema to Supabase

# Linting
npm run lint         # Run Next.js lint

# Edge Functions
supabase functions serve          # Serve locally
supabase functions deploy <name>  # Deploy function
```

---

## Directory Structure

```
universe-connect/
├── prisma/
│   └── schema.prisma              # Database schema (source of truth)
├── supabase/
│   └── functions/                  # Edge functions (Deno)
│       ├── academic-ai/           # AI tutor
│       ├── generate-flashcards/   # Flashcard generator
│       ├── match-jobs/            # Job matching
│       └── evaluate-interview/    # Interview evaluator
├── src/
│   ├── app/                       # Next.js pages (App Router)
│   │   ├── page.tsx               # Home/landing
│   │   ├── dashboard/             # Main dashboard
│   │   ├── feed/                  # Social feed
│   │   ├── academic/              # AI tutor & study tools
│   │   ├── career/                # Resume, jobs, career
│   │   ├── marketplace/           # Buy/sell
│   │   ├── events/                # Event discovery
│   │   ├── clubs/                 # Student clubs
│   │   ├── travel/                # Ride sharing
│   │   ├── wellness/              # Mood tracking
│   │   ├── messages/              # Direct messaging
│   │   ├── forums/               # Anonymous forums
│   │   ├── research/             # Research hub
│   │   ├── news/                 # University news
│   │   ├── utilities/            # Bus tracker, campus map
│   │   ├── settings/             # User settings
│   │   └── api/                  # API routes
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui (do not modify)
│   │   ├── layout/               # Sidebar, Header, DashboardLayout
│   │   ├── feed/                 # PostCard, SharePostBox
│   │   ├── academic/             # ChatInterface, tools/
│   │   ├── career/               # ResumeUploader, JobBoard
│   │   └── ...                   # Other feature components
│   ├── hooks/                    # Custom hooks
│   │   ├── useUserUniversity.ts  # Get user's university
│   │   ├── useUserSettings.ts    # User preferences
│   │   └── use-mobile.tsx        # Mobile detection
│   └── lib/                      # Utilities
│       ├── supabase.ts           # Browser client
│       ├── server-supabase.ts   # Server client
│       ├── ai.ts                 # AI service wrapper
│       └── utils.ts              # cn() class merger
└── public/                       # Static assets
```

---

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema - all tables defined here |
| `src/lib/supabase.ts` | Client-side Supabase connection |
| `src/lib/server-supabase.ts` | Server-side Supabase connection |
| `src/lib/ai.ts` | AI chat and flashcard service |
| `src/components/providers.tsx` | App-wide providers (Theme, QueryClient) |
| `src/components/layout/Sidebar.tsx` | Main navigation |
| `src/app/layout.tsx` | Root layout with providers |

---

## Patterns & Conventions

### File Naming
- Components: `PascalCase.tsx` (e.g., `PostCard.tsx`)
- Hooks: `camelCase.ts` (e.g., `useUserUniversity.ts`)
- Utils: `camelCase.ts` (e.g., `utils.ts`)
- Pages: `page.tsx`

### Component Structure
- Use 'use client' for interactive components
- Prefer Server Components by default
- Group related components in feature folders

### Styling
- Use Tailwind CSS with `cn()` from `@/lib/utils`
- shadcn/ui components in `src/components/ui/`
- Do NOT manually modify ui components - use prop overrides

### State Management
- Server state: TanStack Query
- Client state: React useState/useReducer
- User settings: useUserSettings hook (persisted to DB)

### Database
- Always use Prisma for DB access
- Follow schema defined in `prisma/schema.prisma`
- RLS policies enforce security at DB level

### Authentication
- Supabase Auth handles all auth
- Use `supabase.auth.getUser()` for protected actions
- Server components use `createServerClient` for auth

### API Routes
- Use Next.js Route Handlers in `src/app/api/`
- Edge functions in `supabase/functions/`

---

## Architecture

### Data Flow
```
Client → Components → Hooks → lib/supabase → Supabase (Auth/DB)
                                    ↓
                              Edge Functions (AI)
                                    ↓
                              Gemini API
```

### University Scoping
- Content can be `CAMPUS` (university-only) or `UNIVERSE` (all universities)
- RLS policies enforce visibility based on user's university

### Real-time Features
- Messages use Supabase Realtime (WebSocket)
- Subscribe to `messages` table for new messages

---

## Security

- All tables have RLS policies
- Never expose API keys on client
- Edge functions handle AI processing server-side
- Validate all user inputs with Zod

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
DIRECT_URL=
GEMINI_API_KEY=
GOOGLE_MAPS_SERVER_KEY=
```

---

## Related Docs

- [README.md](./README.md) - Project overview
- [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) - Detailed technical guide
- [PRD.md](./PRD.md) - Product requirements
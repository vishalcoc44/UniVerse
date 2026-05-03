# UniVerse - Product Requirements Document (PRD)

---

## 1. Executive Summary

UniVerse is a unified campus platform that serves as a "super app" for university students, consolidating social networking, academic support, career tools, and daily campus utilities into a single, thoughtfully designed experience. Built with Next.js 16, Supabase (PostgreSQL), and Google Gemini AI, the platform addresses the fragmentation problem where students must juggle multiple apps for different campus needs.

The core value proposition is simple: **One platform, your entire campus experience**. Students can scroll a social feed, get instant AI-powered academic help, analyze their resumes, buy/sell textbooks, find rides, track their wellness, and collaborate on research—all within their university ecosystem.

The MVP goal is to deliver a fully functional campus platform with core features spanning social, academic, career, marketplace, and utility categories, with real-time updates and a modern, accessible interface.

---

## 2. Mission

### Product Mission Statement
To unify the fragmented digital campus experience into a single platform that connects students academically, socially, and practically—empowering them to succeed in their university journey.

### Core Principles

1. **University-Scoped** — All content is scoped to the user's university (CAMPUS) or visible across universities (UNIVERSE), creating relevant, localized experiences.

2. **AI-First Assistance** — AI-powered features (tutor, resume analysis, flashcard generation) provide 24/7 support that scales with student needs.

3. **Privacy & Safety** — Anonymous forums and robust RLS (Row Level Security) policies protect user data while enabling open expression.

4. **Real-Time Connectivity** — Supabase Realtime powers instant messaging and live updates, making the platform feel responsive and alive.

5. **Holistic Student Lifecycle** — From academic support to career preparation to wellness tracking, the platform supports students at every stage of their journey.

---

## 3. Target Users

### Primary User Personas

| Persona | Description | Technical Comfort |
|---------|-------------|-------------------|
| **The Active Student** | Engaged in classes, clubs, and social activities. Uses multiple apps and wants everything in one place. | High - early adopter of new tech |
| **The Focused Learner** | Prioritizes academics, uses AI tutoring heavily, needs study tools and resources. | Medium-High - comfortable with tech for learning |
| **The Career-Oriented** | Active on job boards, resume building, networking. Values career features. | Medium-High - uses professional platforms |
| **The Social Butterfly** | Active on social feed, messages, events. Loves connecting with peers. | High - always on social media |
| **The Practical Utilizer** | Uses marketplace, travel, utilities. Values efficiency and convenience. | Medium - uses tech when it helps |

### Key User Needs & Pain Points

- **Pain Point**: "I have too many apps—Canvas for classes, GroupMe for messaging, LinkedIn for jobs, Facebook for groups."
- **Need**: Unified experience where everything campus-related lives in one app.
- **Pain Point**: "I can't get help at 2 AM when I'm studying for an exam."
- **Need**: 24/7 AI tutoring that understands context.
- **Pain Point**: "I need to sell my textbooks before graduation but don't know who to sell to."
- **Need**: University-scoped marketplace with verified students.
- **Pain Point**: "My resume might not be ATS-compatible but I don't know how to fix it."
- **Need**: Instant AI-powered resume analysis with actionable feedback.

---

## 4. MVP Scope

### Core Functionality

- ✅ **Social Feed**: Dual-feed system (Campus/Universe), posts with images/videos/links/polls, reactions, comments, bookmarks
- ✅ **Academic AI Tutor**: 24/7 AI chat using Google Gemini, markdown/code rendering, conversation context
- ✅ **Flashcard Generator**: AI-powered generation of Q&A cards from study notes
- ✅ **Career Resume Analyzer**: PDF/text resume upload, ATS scoring, section-by-section feedback
- ✅ **Job Board**: University-scoped job listings with filters
- ✅ **Marketplace**: Buy/sell textbooks, electronics, furniture with university scope
- ✅ **Events & Clubs**: Event discovery, RSVP, club management, attendance tracking
- ✅ **Travel/Rides**: Carpooling, ride offers and requests
- ✅ **Wellness Tracking**: Daily mood logging with trend visualization
- ✅ **Messages**: Direct realtime messaging between students
- ✅ **Forums**: Anonymous course-specific discussion boards
- ✅ **Research Hub**: Research project collaboration and opportunities
- ✅ **News Feed**: University announcements and news
- ✅ **Utilities**: Bus tracking, campus map, discounts

### Technical

- ✅ **Authentication**: Supabase Auth with email/password, Google OAuth, GitHub OAuth
- ✅ **Database**: PostgreSQL with Prisma ORM
- ✅ **Row Level Security**: Every table protected with appropriate policies
- ✅ **Realtime**: Supabase Realtime for messages and notifications
- ✅ **Edge Functions**: Deno-based serverless AI functions

### Integration

- ❌ **Google Calendar integration** (deferred to future phase)
- ❌ **LinkedIn sync** (deferred)
- ❌ **Zoom integration for study groups** (deferred)

### Deployment

- ✅ **PWA Support**: Progressive Web App with offline support, push notifications, installable on mobile
- ❌ **Native Mobile Apps** (iOS/Android) - deferred to future phase when PWA reaches maturity
- ❌ **Advanced analytics dashboard** (deferred)

---

## 5. User Stories

### Primary User Stories

1. **As a student**, I want to switch between Campus (my university only) and Universe (all universities) feed views, so I can see hyper-local updates or browse broadly.

2. **As a student**, I want to ask the AI tutor any academic question at any time and get instant, context-aware responses with code block rendering, so I can study effectively 24/7.

3. **As a student**, I want to upload my resume and receive an ATS compatibility score with specific improvement suggestions, so I can make my resume more competitive.

4. **As a student**, I want to list items for sale in my university marketplace and browse items from other students nearby, so I can buy/sell textbooks and goods conveniently.

5. **As a student**, I want to find or offer rides to campus with seat availability and pricing, so I can carpool and save money on commuting.

6. **As a student**, I want to log my daily mood and see a visual trend over time, so I can be aware of my mental wellness patterns.

7. **As a student**, I want to message other students directly with real-time delivery, so I can coordinate on projects and social activities.

8. **As a student**, I want to post anonymously in course-specific forums, so I can ask questions without social pressure.

### Technical User Stories

1. **As a developer**, I want all database queries to go through RLS policies, so no user can access data outside their permission scope.

2. **As a developer**, I want AI processing to happen in edge functions, so API keys never touch the client browser.

---

## 6. Core Architecture & Patterns

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Next.js 16)                    │
│   Pages/Routes → Components → Hooks → Lib (Supabase Client) │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Next.js Route Handlers)      │
│          /api/images, /api/career/analyze-resume            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Supabase (Backend-as-a-Service)             │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────────┐ │
│  │   Auth   │  │ Database  │  │    Edge Functions       │ │
│  │  (JWT)   │  │(Postgres) │  │ (Deno - AI Processing)   │ │
│  └──────────┘  └───────────┘  └──────────────────────────┘ │
│  ┌──────────┐  ┌───────────┐                               │
│  │ Realtime │  │  pgvector │                               │
│  │(WebSocket)│ │(Embeddings)│                              │
│  └──────────┘  └───────────┘                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│         Google Gemini AI, Google Maps API, Cloud Storage   │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
universe-connect/
├── prisma/
│   └── schema.prisma          # Database schema (source of truth)
├── supabase/
│   └── functions/
│       ├── academic-ai/       # AI tutor edge function
│       ├── generate-flashcards/
│       ├── match-jobs/
│       └── evaluate-interview/
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── feed/, academic/, career/, events/, clubs/
│   │   ├── marketplace/, travel/, wellness/, messages/
│   │   ├── forums/, research/, news/, utilities/
│   │   └── api/              # API routes
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # shadcn/ui primitives
│   │   ├── feed/, academic/, career/, layout/, etc.
│   ├── hooks/                # Custom React hooks
│   │   ├── useUserUniversity.ts
│   │   ├── useUserSettings.ts
│   │   └── use-mobile.tsx
│   └── lib/                  # Utilities
│       ├── supabase.ts       # Browser client
│       ├── server-supabase.ts # Server client
│       ├── ai.ts             # AI service wrapper
│       └── utils.ts          # cn() utility
└── public/                   # Static assets
```

### Key Design Patterns

1. **App Router File-Based Routing** — Each folder in `src/app/` is a route; `page.tsx` is the page component.
2. **Server Components by Default** — Next.js App Router uses RSC; 'use client' for interactive components.
3. **Component Folder Organization** — Features grouped by domain (academic/, career/, feed/) with tools/ subfolders.
4. **Supabase Client Separation** — Browser client for client-side, Server client for Server Components/API.
5. **RLS at Database Level** — Security enforced in PostgreSQL, not just application code.

---

## 7. PWA Architecture

### Progressive Web App Implementation

UniVerse will be implemented as a Progressive Web App (PWA) to provide a native-like mobile experience without the overhead of separate mobile apps.

### PWA Components

| Component | Purpose |
|-----------|---------|
| **manifest.json** | App metadata (name, icons, theme_color, display mode) |
| **Service Worker** | Cache strategies, offline support, background sync |
| **Next PWA** | Next.js integration for automatic service worker generation |
| **Push Notifications** | Real-time alerts for messages, events, updates |

### PWA Features

- ✅ **Installable**: Add to home screen on iOS and Android
- ✅ **Offline Support**: Core pages accessible without internet
- ✅ **Push Notifications**: Messages, event reminders, activity updates
- ✅ **App-like**: Standalone display mode, splash screen
- ✅ **Responsive**: Adaptive layouts for mobile, tablet, desktop
- ✅ **Fast**: Service worker caching for instant loads

### PWA Configuration

```typescript
// next.config.js with next-pwa
module.exports = {
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
  },
}
```

```json
// manifest.json
{
  "name": "UniVerse",
  "short_name": "UniVerse",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Caching Strategy

| Resource Type | Strategy |
|--------------|----------|
| Static assets (JS, CSS) | Cache First |
| API data | Network First |
| Images | Cache First with expiration |
| Pages | Stale While Revalidate |

---

## 8. Tools/Features

### Feature Specifications

| Feature | Description | Key Components |
|---------|-------------|----------------|
| **PWA** | Progressive Web App with offline support, push notifications, installable | manifest.json, service-worker.ts, next-pwa |
| **Social Feed** | Dual-feed (Campus/Universe) with posts, polls, media | PostCard, SharePostBox, CommentModal, PollCard |
| **Academic AI** | 24/7 AI tutor with context, markdown rendering | ChatInterface, ChatPreview, StudyCircles |
| **Study Tools** | Flashcard gen, GPA calc, quiz gen, study planner | FlashcardGenerator, GPACalculator, QuizGenerator |
| **Career Center** | Resume analysis, job board, mentorship | ResumeUploader, AnalysisDashboard, JobBoard |
| **Marketplace** | Buy/sell, lost & found, roommate finder | ProductCard, SellModal, RoommateFinder |
| **Events** | Discovery, RSVP, management | EventCard, EventCreationModal |
| **Travel** | Ride matching, carpooling | RideFinder, RideCard |
| **Wellness** | Mood tracking, trend charts | MoodSelector, TrendChart |
| **Messages** | Direct realtime chat | ChatWindow, ConversationList |
| **Forums** | Anonymous course discussions | (integrated in forums page) |
| **Research** | Project collaboration | ProjectCard, ResearchProjectsCard |
| **News** | University announcements | NewsCard, NewsHero |
| **Utilities** | Bus tracking, campus map, discounts | BusTracker, CampusMap, DiscountHub |

---

## 8. Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16 (App Router) | Framework |
| **TypeScript** | Latest | Type safety |
| **Supabase** | Latest | BaaS - Auth, Database, Realtime |
| **Prisma** | Latest | ORM |
| **PostgreSQL** | 15+ | Primary database |
| **pgvector** | Latest | Vector embeddings for semantic search |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19 | UI Framework |
| **Tailwind CSS** | Latest | Styling |
| **shadcn/ui** | Latest | UI Components (Radix Primitives) |
| **Framer Motion** | Latest | Animations |
| **Recharts** | Latest | Charts/visualization |
| **React Hook Form** | Latest | Form handling |
| **Zod** | Latest | Validation |
| **TanStack Query** | Latest | Server state management |
| **next-pwa** | Latest | PWA service worker generation |

### AI & Edge

| Technology | Purpose |
|------------|---------|
| **Google Gemini 2.5 Flash** | Primary AI model |
| **Deno** | Edge function runtime |
| **Supabase Edge Functions** | Serverless AI processing |

### Deployment

| Technology | Purpose |
|------------|---------|
| **Netlify** | Frontend deployment with PWA support |
| **Vercel** | Alternative deployment |
| **PWA** | Progressive Web App for mobile experience |

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_pooled_connection_string
DIRECT_URL=your_direct_connection_string
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_SERVER_KEY=your_google_maps_key
```

---

## 9. Security & Configuration

### Authentication & Authorization

- **Supabase Auth** handles all authentication:
  - Email/password registration and login
  - OAuth with Google and GitHub
  - JWT tokens with automatic refresh
- **Profile table** links to auth.users with university scope
- **Role-based access**: STUDENT, FACULTY, ADMIN, ALUMNI

### Row Level Security (RLS)

Every table has RLS policies enforcing:
- **SELECT**: Public if scope=UNIVERSE or universityId matches user's university
- **INSERT**: Only authenticated users
- **UPDATE/DELETE**: Only the record author

### Configuration Management

- Environment variables in `.env` file
- Supabase secrets for edge function environment variables
- User preferences stored in UserSettings table

### Security Scope

- ✅ **In Scope**: Auth, RLS, API key protection, input validation, XSS prevention
- ✅ **In Scope**: OAuth security, secure cookie handling, middleware route protection
- ❌ **Out of Scope**: Third-party API security beyond integration scope
- ❌ **Out of Scope**: DDoS protection (handled by deployment platform)

---

## 10. API Specification

### Edge Functions

#### academic-ai
- **Purpose**: AI tutoring chat
- **Input**: `{ messages: [{ role: 'user'|'assistant', content: string }], universityId?: string }`
- **Output**: `{ response: string }`
- **Auth**: Supabase JWT required

#### generate-flashcards
- **Purpose**: Generate Q&A cards from notes
- **Input**: `{ topic: string }`
- **Output**: `{ flashcards: [{ front: string, back: string }] }`
- **Auth**: Supabase JWT required

#### match-jobs
- **Purpose**: AI job matching
- **Auth**: Supabase JWT required

#### evaluate-interview
- **Purpose**: Mock interview evaluation
- **Auth**: Supabase JWT required

### API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/images` | GET | List images from public/images |
| `/api/career/analyze-resume` | POST | Analyze resume (multipart/form-data) |
| `/api/maps/places` | GET | Google Places search proxy |
| `/api/maps/directions` | GET | Google Directions proxy |

---

## 11. Success Criteria

### Functional Requirements

- ✅ User can register with email or OAuth (Google/GitHub)
- ✅ User can switch between Campus and Universe feeds
- ✅ User can create posts with text, images, links, polls
- ✅ User can chat with AI tutor and get contextual responses
- ✅ User can upload resume and receive ATS analysis
- ✅ User can list items for sale in marketplace
- ✅ User can find and offer rides
- ✅ User can log daily mood and view trends
- ✅ User can send direct messages with realtime delivery
- ✅ User can post anonymously in course forums

### Quality Indicators

- Page load time < 3 seconds
- API response time < 1 second (edge functions < 5 seconds)
- Mobile-responsive design
- Accessible (WCAG 2.1 AA)
- Zero critical security vulnerabilities

### User Experience Goals

- Intuitive navigation with sidebar
- Consistent design language across features
- Smooth animations and transitions
- Clear feedback for all user actions

---

## 12. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Core infrastructure and authentication

- ✅ Supabase project setup with PostgreSQL
- ✅ Prisma schema implementation
- ✅ Next.js project initialization
- ✅ Authentication (email/password, OAuth)
- ✅ Basic layout (Sidebar, Header)
- ✅ RLS policies on core tables

### Phase 2: Core Features (Weeks 3-5)
**Goal**: Primary feature delivery

- ✅ Social feed with Campus/Universe toggle
- ✅ Academic AI tutor with edge function
- ✅ Career resume analyzer
- ✅ Marketplace basics
- ✅ User profile and settings

### Phase 3: Extended Features (Weeks 6-8)
**Goal**: Feature completeness

- ✅ Events and clubs
- ✅ Travel/ride sharing
- ✅ Wellness tracking
- ✅ Messages (realtime)
- ✅ Forums (anonymous)
- ✅ Research hub

### Phase 4: Polish & Launch (Weeks 9-10)
**Goal**: Production readiness

- ✅ Testing and bug fixes
- ✅ Performance optimization
- ✅ Mobile responsiveness
- ✅ PWA implementation (manifest, service worker, offline support)
- ✅ Documentation
- ✅ Deployment to Netlify

---

## 13. Future Considerations

### Post-MVP Enhancements

- **PWA Enhancements**: Advanced push notifications, offline mode, background sync, app-like experience
- **Video/Audio Posts**: Media support in feed
- **Study Groups**: Group study coordination with video calls
- **Advanced AI**: Personalized learning recommendations
- **Gamification**: Reputation points, badges, leaderboards
- **Alumni Network**: Extended access for alumni
- **Payment Integration**: In-app transactions for marketplace
- **Native Apps**: (Optional) React Native apps if PWA isn't sufficient

### Integration Opportunities

- Google Calendar sync
- LinkedIn profile import
- Canvas/LMS integration
- University SSO

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **AI API costs** | High | Implement caching, rate limiting, usage monitoring |
| **Database scaling** | Medium | Use connection pooling, optimize queries |
| **Auth security** | High | Regular security audits, keep dependencies updated |
| **Realtime performance** | Medium | Implement message pagination, offline support |
| **Third-party API limits** | Medium | Fallback mechanisms, graceful degradation |

---

## 15. Appendix

### Related Documents

- [README.md](../README.md) - Project overview and setup
- [PROJECT_GUIDE.md](../PROJECT_GUIDE.md) - Detailed technical documentation
- [prisma/schema.prisma](../prisma/schema.prisma) - Database schema
- [.github/prompts/supabase.prompt.md](../.github/prompts/supabase.prompt.md) - Supabase best practices

### Tech Stack Links

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Google Gemini](https://ai.google.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

### Repository Structure

```
universe-connect/
├── src/app/           # 20+ page routes
├── src/components/   # 50+ custom components
├── src/hooks/        # 4 custom hooks
├── src/lib/          # 4 utility files
├── supabase/functions/ # 4 edge functions
└── prisma/           # Database schema
```

---

*Document generated from UniVerse project codebase analysis.*
*Total Features: 15+ | Pages: 20+ | Components: 50+ | Edge Functions: 4*
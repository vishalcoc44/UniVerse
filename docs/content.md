# System Architecture & Connection Map — UniVerse Connect

---

## 1. The Blueprint (10,000-Foot View)

**UniVerse** is a multi-tenant campus super-app serving university students with social feeds, real-time messaging, AI-powered academics, career tools, marketplace, ride-sharing, wellness tracking, clubs, events, forums, and campus utilities — all scoped by a `University` tenant via a `CAMPUS` vs `UNIVERSE` content scope enum. The stack is **Next.js 16 (App Router)** + **React 19** on the frontend, **Supabase** (PostgreSQL + Auth + Realtime + Storage + Edge Functions) as the entire backend, **Gemini 2.5 Flash** for AI, and **shadcn/ui** + **Tailwind CSS** + **Framer Motion** for the UI layer. There is no dedicated backend server — all "backend" logic lives in Next.js server actions, two API routes, and two Supabase Edge Functions.

---

## 2. Component & Module Wiring

### Entry Point Chain

```
RootLayout (src/app/layout.tsx)
  └─ <Providers>  ← QueryClientProvider, TooltipProvider, Toaster, Sonner
       └─ <TopLoader>  ← Custom NProgress intercepting <a> clicks + pushState
       └─ <Template>  ← Framer Motion page transition (fade/slide)
            │
            ├─ Landing (/) ── standalone, no auth shell
            ├─ Auth (/auth, /signup, /request-university) ── standalone
            │
            └─ ALL 16 authenticated routes ── each wraps content in:
                 <DashboardLayout>  ← THE central orchestrator component
                 ├── <Sidebar>  ← 16 nav items, 3 groups, user avatar, unread badge
                 ├── <Header>   ← Breadcrumbs, search, notifications, action slot
                 └── {children} ← Page-specific content
```

**Key architectural fact:** There are **no nested Next.js `layout.tsx` files**. Only the root `src/app/layout.tsx` exists. The `DashboardLayout` is a **component-level wrapper**, not a filesystem layout — every authenticated `page.tsx` manually imports and renders it.

### Route Map (18 routes + 2 API endpoints)

| Route | Role | Orchestrator? |
|---|---|---|
| `/` | Landing page (marketing) | Standalone |
| `/auth` | Login (email + OAuth) | Standalone |
| `/signup` | Registration | Standalone |
| `/request-university` | University application form | Standalone |
| `/dashboard` | Overview hub (stats, events, feed snapshot) | **Yes** — 5 domains |
| `/feed` | Social wall (Campus/Universe tabs, CRUD, realtime) | **Yes** — realtime |
| `/messages` | DM + group chat (realtime, typing indicators) | **Yes** — realtime |
| `/academic` | AI chat, resources, study groups, tools | **Yes** — server actions |
| `/career` | Resume analysis, mock interviews, alumni | **Yes** — API route |
| `/events` | Calendar, RSVP, creation, details | **Yes** |
| `/forums` | Anonymous threads, polls, voting | **Yes** |
| `/marketplace` | Buy/sell, roommates, lost & found | **Yes** — server actions |
| `/clubs` | Clubs directory, join/create | Moderate |
| `/research` | Research projects, collaboration | Moderate |
| `/news` | Campus news feed | Moderate |
| `/travel` | Cab pooling, ride requests | Simple |
| `/wellness` | Mood tracking, trend charts | Moderate |
| `/settings` | 6 settings panels (Profile, Appearance, Notifications, Privacy, Integrations, Accessibility) | **Yes** |
| `/updates` | Changelog / what's new | Simple |
| `/utilities` | Campus map, bus tracker, discounts | Moderate |
| `POST /api/career/analyze-resume` | Gemini-powered resume analysis | API |
| `GET /api/images` | Reads public/images/ directory | API |

### Component Directory (49 shadcn/ui primitives + ~60 feature components)

```
src/components/
├── layout/       → DashboardLayout, Sidebar, Header, TopLoader, PageTransition
├── landing/      → PreviewMarquee, LightboxModal
├── ui/           → 49 shadcn/ui primitives (Button, Dialog, Tabs, etc.)
├── dashboard/    → StatCard, EventCard, QuickActionCard, UpcomingItem, MiniCalendar
├── feed/         → PostCard, SharePostBox, CommentModal
├── messages/     → ConversationList, ChatWindow, UserSearchModal, GroupCreateDialog
├── academic/     → ChatInterface, ChatPreview, ResourceGrid, StudyCircles, tools/*
├── career/       → ResumeUploader, AnalysisDashboard, tools/*
├── events/       → EventCreationModal, EventDetailsModal, EventAttendeesModal, FeaturedEvent
├── forums/       → ForumCategoryGrid, ThreadList, AnonymousPostComposer
├── marketplace/  → ProductGrid, ProductCard, SellModal, RoommateFinder, LostFound
├── clubs/        → ClubCard, ClubGrid
├── news/         → NewsCard, NewsCategoryList, NewsHero
├── research/     → ProjectCard
├── travel/       → RideFinder, RideCard
├── wellness/     → MoodSelector, TrendChart, InsightCard
├── settings/     → ProfileSettings, AppearanceSettings, NotificationSettings, ...
├── updates/      → ReleaseTimeline, FeedbackWidget
└── utilities/    → CampusMap, BusTracker, DiscountHub
```

### Per-Route Breakdown — Imports & Components Used

#### Unauthenticated Routes (no DashboardLayout)

| Route | Key Imports |
|---|---|
| `/` (Landing) | `Button`, `PostCard`, `EventCard`, `StatCard`, `ProductCard`, `PreviewMarquee`, `LightboxModal`, framer-motion |
| `/auth` | `Button`, `Input`, `Label`, `Alert`, supabase client |
| `/signup` | `Button`, `Input`, `Label`, `Alert`, supabase client |
| `/request-university` | `Button`, `Input`, `Label`, `Alert`, supabase client |

#### Authenticated Routes (wrapped in DashboardLayout)

| Route | Orchestrator? | Components Used |
|---|---|---|
| `/dashboard` | **Yes** | `DashboardLayout`, `StatCard` ×4, `EventCard`, `QuickActionCard`, `UpcomingItem`, `MiniCalendar`, `Badge`, `Button` |
| `/feed` | **Yes** | `DashboardLayout`, `SharePostBox`, `PostCard`, `CommentModal`, `Tabs`, `AlertDialog`, `useUserUniversity` hook |
| `/messages` | **Yes** | `DashboardLayout`, `ConversationList`, `ChatWindow`, `UserSearchModal`, `GroupCreateDialog`, `Card` |
| `/academic` | **Yes** | `DashboardLayout`, `ChatInterface`, `ChatPreview`, `ResourceGrid`, `StudyCircles`, `FocusTimer`, `GPACalculator`, `FlashcardGenerator`, `Tabs` |
| `/career` | **Yes** | `DashboardLayout`, `ResumeUploader`, `AnalysisDashboard`, `MockInterviewer`, `AlumniDirectory`, `Tabs`, `Badge` |
| `/events` | **Yes** | `DashboardLayout`, `EventCard` (from dashboard), `EventCreationModal`, `FeaturedEvent`, `EventAttendeesModal`, `EventDetailsModal`, `Tabs`, `useUserUniversity` |
| `/forums` | **Yes** | `DashboardLayout`, `ForumCategoryGrid`, `ThreadList`, `AnonymousPostComposer` |
| `/marketplace` | **Yes** | `DashboardLayout`, `ProductGrid`, `RoommateFinder`, `SellModal`, `LostFound`, `Tabs` |
| `/clubs` | Moderate | `DashboardLayout`, `ClubGrid`, `Dialog` (inline create), `Select` |
| `/news` | **Yes** | `DashboardLayout`, `NewsHero`, `NewsCategoryList`, `NewsCard`, `Tabs`, `useUserUniversity` |
| `/research` | Moderate | `DashboardLayout`, `ProjectCard`, `Dialog` (inline create), `Select` |
| `/settings` | **Yes** | `DashboardLayout`, `ProfileSettings`, `AppearanceSettings`, `NotificationSettings`, `PrivacySettings`, `IntegrationsSettings`, `AccessibilitySettings`, `Tabs` |
| `/wellness` | **Yes** | `DashboardLayout`, `MoodSelector`, `TrendChart`, `InsightCard` |
| `/travel` | Simple | `DashboardLayout`, `RideFinder` |
| `/updates` | Simple | `DashboardLayout`, `ReleaseTimeline`, `FeedbackWidget` |
| `/utilities` | Moderate | `DashboardLayout`, `CampusMap`, `BusTracker`, `DiscountHub`, `Tabs` |

### Component Dependency Graph — Key Orchestrators

```
RootLayout (layout.tsx)
  └─ Providers (QueryClient, Tooltip, Toaster, Sonner)
     └─ TopLoader
     └─ Template (framer-motion fade)
        │
        ├─ Landing Page (/) ← standalone, no DashboardLayout
        │   uses: StatCard, EventCard, PostCard, ProductCard, PreviewMarquee, LightboxModal
        │
        ├─ Auth Pages (/auth, /signup, /request-university) ← standalone
        │
        └─ All other pages ← wrapped in DashboardLayout
            │
            DashboardLayout ← THE central orchestrator
            ├── Sidebar
            │   └── NavItemComponent (16 nav items across 3 groups)
            │   └── Avatar (user profile at bottom)
            └── Header
                └── Search, Notifications, Messages badge, Logout
```

#### Top Orchestrator Pages (compose 5+ child components):

1. `/dashboard` — `StatCard` (×4), `EventCard`, `QuickActionCard` (×4), `UpcomingItem`, `MiniCalendar`
2. `/academic` — `ChatInterface`/`ChatPreview`, `ResourceGrid`, `StudyCircles`, `FocusTimer`, `GPACalculator`, `FlashcardGenerator`
3. `/career` — `ResumeUploader`, `AnalysisDashboard`, `MockInterviewer`, `AlumniDirectory`
4. `/settings` — 6 settings panels via tabs
5. `/feed` — `SharePostBox`, `PostCard`, `CommentModal`
6. `/messages` — `ConversationList`, `ChatWindow`, `UserSearchModal`, `GroupCreateDialog`
7. `/events` — `EventCard`, `FeaturedEvent`, `EventCreationModal`, `EventDetailsModal`, `EventAttendeesModal`
8. `/marketplace` — `ProductGrid`, `SellModal`, `RoommateFinder`, `LostFound`

### Shared Layout Pattern

Every authenticated route follows the exact same pattern:

```tsx
<DashboardLayout title={...} subtitle="..." breadcrumb={[...]} action={optionalButton}>
  {/* page content */}
</DashboardLayout>
```

This renders as:
```
┌──────────┬───────────────────────────────────────┐
│          │  Header (breadcrumb, search, actions)  │
│ Sidebar  ├───────────────────────────────────────┤
│ (collap- │                                       │
│  sible)  │   Page Content (children)             │
│          │                                       │
└──────────┴───────────────────────────────────────┘
```

- Sidebar auto-collapses after 1s, expands on hover. 85px collapsed / 280px expanded.
- Header is sticky, shows page title, subtitle, breadcrumbs, and an optional `action` slot.
- No route uses Next.js file-system `layout.tsx` nesting — `DashboardLayout` is purely component-level.

### Hooks shared across routes:
- `src/hooks/useUserUniversity.ts` — used by `/feed`, `/events`, `/news` for campus-scoped queries
- `src/hooks/useUserSettings.ts` — user preferences
- `src/hooks/use-mobile.tsx` — responsive breakpoint detection
- `src/hooks/use-toast.ts` — toast notifications

---

## 3. The Data Lifecycle (Golden Path)

### Example: User Creates a Post on the Feed

```
┌──────────────────────────────────────────────────────────────────┐
│  1. USER ACTION                                                  │
│  SharePostBox.tsx → user types content, selects scope, clicks    │
│  "Post"                                                          │
└─────────────────────────────┬────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. AUTH CHECK (client-side)                                     │
│  supabase.auth.getUser() → extracts user.id from cookie-based   │
│  JWT session managed by @supabase/ssr                            │
└─────────────────────────────┬────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. CONTEXT FETCH (client-side)                                  │
│  supabase.from('Profile').select('universityId')                 │
│    .eq('id', user.id).single()                                   │
│  → gets the user's university for scope tagging                  │
└─────────────────────────────┬────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. MUTATION (client-side → Supabase PostgreSQL)                 │
│  supabase.from('Post').insert({                                  │
│    id: crypto.randomUUID(),                                      │
│    content, scope, universityId, authorId, type, category        │
│  })                                                              │
│  → RLS policy validates: auth.uid() = authorId                   │
│  → Row inserted into Post table                                  │
└─────────────────────────────┬────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. REALTIME PROPAGATION                                         │
│  Supabase Realtime postgres_changes on 'Post' table fires        │
│  → Feed page channel 'public:Post' receives INSERT event         │
│  → Triggers fetchPosts() re-fetch                                │
└─────────────────────────────┬────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  6. READ (client-side → Supabase PostgreSQL)                     │
│  supabase.from('Post')                                           │
│    .select('*, Profile!Post_authorId_fkey(fullName, username,    │
│      avatarUrl, University(abbreviation))')                       │
│    .order('createdAt', { ascending: false })                     │
│  → RLS policy: CAMPUS posts filtered by universityId match       │
│  → UNIVERSE posts visible to all                                 │
└─────────────────────────────┬────────────────────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  7. UI RENDER                                                    │
│  PostCard.tsx receives post data via props → renders author,     │
│  content, like/comment/share buttons, timestamps                 │
└──────────────────────────────────────────────────────────────────┘
```

### Example: AI Academic Chat (RAG Pipeline)

```
  ChatInterface → user sends question
       │
       ▼
  saveChatMessage(chatId, 'user', content) → AcademicAIChatMessage
       │
       ▼
  chatAction(history)  [Server Action — runs on Node.js]
       │
       ├─ 1. Generate query embedding via gemini-embedding-001
       │     (taskType: RETRIEVAL_QUERY)
       │
       ├─ 2. supabase.rpc('match_documents', {
       │        query_embedding, threshold: 0.1, count: 8
       │     })
       │     → pgvector cosine similarity search on ResourceEmbedding
       │
       ├─ 3. Build augmented system prompt with retrieved context chunks
       │
       └─ 4. Send full history + context to gemini-2.5-flash
              → Returns AI response string
       │
       ▼
  saveChatMessage(chatId, 'assistant', response)
       │
       ▼
  UI renders markdown response via react-markdown
```

### Example: Sending a Message

```
ChatWindow.handleSend()
  → supabase.from('Message').insert({ conversationId, senderId, content })
  → supabase.from('Conversation').update({ updatedAt }) → bump conversation
  → Realtime channel `chat:{id}` fires postgres_changes on Message
  → fetchMessages() re-runs → UI updates
  → Messages page `messages-global` channel also fires → conversation list updates
  → Sidebar `sidebar-unread-count` channel fires → badge updates
```

### Example: Resume Analysis (Career)

```
ResumeUploader.handleUpload()
  → supabase.auth.getUser() → get user ID
  → supabase.storage.from('resumes').upload(filePath, file) → store PDF in Supabase Storage
  → fetch('/api/career/analyze-resume', { method: 'POST', body: FormData })
      → API route extracts file → sends to Gemini 2.5 Flash for analysis
      → Returns { feedback: ResumeFeedback, score: number }
  → supabase.from('Resume').insert({ userId, fileName, fileUrl, score, feedback, satsCheck })
  → onUploadComplete() → AnalysisDashboard refreshes → fetches latest Resume row
```

### Example: User Signup & Profile Bootstrap

```
/signup page → user fills email, password, fullName, username
       │
       ▼
  supabase.auth.signUp({ email, password, options: { data: { fullName, username } } })
       │  → Supabase Auth creates row in auth.users
       │  → JWT issued, stored in cookie via @supabase/ssr
       ▼
  handle_new_user() DB trigger fires automatically
       │  → Reads auth.users metadata (fullName, username)
       │  → Runs enforce_profile_university_domain() trigger
       │     → Matches email domain against University.domains[]
       │     → Resolves universityId if domain matches
       ▼
  Profile row auto-inserted:
       { id: auth.uid(), email, fullName, username, universityId, role: 'STUDENT' }
       │
       ▼
  Client redirects → /dashboard
       │
       ▼
  Middleware (middleware.ts) intercepts request
       │  → supabase.auth.getUser() refreshes JWT in cookies (3s timeout)
       ▼
  /dashboard page loads → supabase.auth.getUser() → valid session
       → Profile + stats queries fire → user sees their dashboard
```

### Example: RSVP to an Event

```
events/page.tsx → user clicks "RSVP" on an EventCard
       │
       ▼
  supabase.auth.getUser() → get user.id
       │
       ▼
  Check existing RSVP:
  supabase.from('EventRSVP')
    .select('id, status')
    .eq('eventId', eventId)
    .eq('userId', user.id)
    .single()
       │
       ├─ if exists → supabase.from('EventRSVP').delete().eq('id', rsvp.id)  (toggle off)
       │
       └─ if not exists →
            supabase.from('EventRSVP').insert({ eventId, userId, status: 'GOING' })
            → RLS validates: auth.uid() = userId
       │
       ▼
  Attendee count re-fetched:
  supabase.from('EventRSVP')
    .select('id', { count: 'exact' })
    .eq('eventId', eventId)
       │
       ▼
  UI updates RSVP button state + attendee count badge
  (No realtime subscription — count is re-fetched manually on toggle)
```

### Example: Anonymous Forum Post

```
AnonymousPostComposer.tsx → user writes post, toggles "Post Anonymously", submits
       │
       ▼
  supabase.auth.getUser() → get user.id  (identity captured for moderation, never shown)
       │
       ▼
  supabase.from('Profile').select('universityId').eq('id', user.id).single()
       │
       ▼
  Generate anonymousSeed (random string) → used to render consistent "Anonymous User #X" avatar
  without ever revealing real identity in the UI
       │
       ▼
  supabase.from('ForumThread').insert({
    title, content,
    isAnonymous: true,
    authorId: user.id,          ← stored in DB for moderation
    anonymousSeed,              ← shown in UI instead of real name
    universityId,
    scope: selectedScope,
    category, tags
  })
  → RLS policy validates: auth.uid() = authorId
       │
       ▼
  ThreadList.tsx re-fetches ForumThread rows
    .select('*, ForumVote(*)')
    .order('createdAt', { ascending: false })
  → UI renders thread with "Anonymous" avatar derived from anonymousSeed
  → Real authorId is NEVER exposed in the select query to the client
```

### Example: Create a Marketplace Listing (Server Action)

```
SellModal.tsx → user fills title, description, price, type, scope → submits
       │
       ▼
  import { createListing } from '@/app/marketplace/actions'  [Server Action]
       │
       ▼
  createListing(formData)  [runs on Node.js server]
       │
       ├─ createClient() → createServerClient (cookies-based auth)
       │
       ├─ supabase.auth.getUser() → throws 'Unauthorized' if no session
       │
       ├─ supabase.from('Profile').select('universityId')
       │    .eq('id', user.id).single()
       │    → resolves university for campus scoping
       │
       └─ supabase.from('MarketplaceListing').insert({
              title, description, price, type, imageUrl,
              status: 'ACTIVE',
              sellerId: user.id,
              universityId,
              scope: selectedScope
            })
            → RLS policy validates: auth.uid() = sellerId
       │
       ▼
  Server action returns { success: true, listing }
       │
       ▼
  SellModal closes → marketplace/page.tsx calls getListings() server action
  → ProductGrid re-renders with new listing included
```

### Example: Log a Mood (Wellness)

```
MoodSelector.tsx → user selects mood score (1–10), adds notes, picks activities → submits
       │
       ▼
  supabase.auth.getUser() → get user.id
       │
       ▼
  supabase.from('MoodLog').insert({
    userId: user.id,
    moodScore,           ← integer 1–10
    notes,               ← optional text
    activities[],        ← e.g. ['exercise', 'sleep', 'social']
    loggedAt: new Date().toISOString()
  })
  → RLS policy validates: auth.uid() = userId
       │
       ▼  (parallel)
  TrendChart.tsx re-fetches:
  supabase.from('MoodLog')
    .select('moodScore, loggedAt')
    .eq('userId', user.id)
    .order('loggedAt', { ascending: true })
    .limit(30)
  → recharts LineChart re-renders with new data point appended

  InsightCard.tsx re-fetches:
  supabase.from('MoodLog')
    .select('moodScore')
    .eq('userId', user.id)
    .gte('loggedAt', sevenDaysAgo)
  → Computes average score → updates "Your week in review" card
  (No realtime — both components independently re-fetch on parent state change)
```

### Example: Request a Ride (Travel — Cross-Domain Flow)

```
RideFinder.tsx → user finds a RideOffer and clicks "Request Ride"
       │
       ▼
  supabase.auth.getUser() → get user.id (passenger)
       │
       ▼
  supabase.from('RideRequest').insert({
    offerId: selectedRide.id,
    passengerId: user.id,
    status: 'PENDING'
  })
  → RLS validates: auth.uid() = passengerId
       │
       ▼
  Cross-domain: Auto-create a DM conversation with the driver
       │
       ├─ supabase.from('Conversation').insert({ isGroup: false, createdBy: user.id })
       │    → handle_conversation_creator_status() trigger fires
       │       → sets creator's ConversationParticipant.status = 'ACCEPTED' automatically
       │
       ├─ supabase.from('ConversationParticipant').insert([
       │    { conversationId, userId: user.id,              role: 'MEMBER', status: 'ACCEPTED' },
       │    { conversationId, userId: selectedRide.driverId, role: 'MEMBER', status: 'PENDING' }
       │  ])
       │
       └─ supabase.from('Message').insert({
              conversationId,
              senderId: user.id,
              content: `Hi! I'd like to join your ride from ${ride.from} to ${ride.to}.`
            })
       │
       ▼
  Messages page `messages-global` Realtime channel fires
  → Conversation list updates on both passenger's and driver's screens
  → Driver sees new PENDING conversation request + pre-filled message
  → RideFinder UI shows "Request Sent" state
```

### Example: Landing Page — Image Gallery & Preview Marquee (/)

```
Landing page (app/page.tsx) mounts — 'use client' component
       │
       ▼
  useEffect fires on mount:
  fetch('/api/images')
       │  → GET /api/images route handler runs on Node.js
       │  → fs.readdirSync('public/images/') reads disk
       │  → Filters for .png, .jpg, .jpeg, .gif, .webp, .svg extensions
       │  → Returns string[] of public-accessible paths e.g. ["/images/hero.png"]
       ▼
  setImages(data) → images state populated
       │
       ▼
  PreviewMarquee.tsx receives images[] prop
       │  → Renders scrolling strip of app screenshots
       │  → Displayed in a sticky banner at the top of the page
       │  → Auto-hides when scrollY > 500px (via framer-motion scrollY.onChange listener)
       │  → User can manually close it (isManuallyClosed = true) — won't reappear on scroll up
       ▼
  LightboxModal.tsx — user clicks a screenshot in the marquee
       │  → setIsModalOpen(true), setActiveIndex(clickedIndex)
       │  → Full-screen overlay renders selected image
       │  → Arrow keys / buttons navigate between images in the images[] array
       ▼
  Framer Motion scroll progress bar:
  useScroll() → scrollYProgress feeds scaleX of fixed top bar
       │  → Gives visual scroll depth indicator across the entire landing page
       ▼
  No Supabase calls on the landing page — fully public, no auth required
  CTA buttons link to /auth and /signup via Next.js <Link>
```

### Example: Login Flow — Email + OAuth (auth/)

```
/auth page (app/auth/page.tsx) — 'use client'
       │
       ▼
  ── Path A: Email/Password Login ──
  User fills email + password → clicks "Sign In"
       │
       ▼
  supabase.auth.signInWithPassword({ email, password })
       │  → Supabase Auth validates credentials
       │  → On success: JWT + refresh token written to cookies via @supabase/ssr
       │  → On failure: returns AuthError → displayed as <Alert> in UI
       ▼
  router.push('/dashboard')  [Next.js client-side navigation]
       │  → middleware.ts intercepts /dashboard request
       │  → supabase.auth.getUser() validates session cookie → passes through
       ▼
  /dashboard page loads with authenticated user session

  ── Path B: OAuth (Google / GitHub) ──
  User clicks "Continue with Google"
       │
       ▼
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` }
  })
       │  → Browser redirects to Google OAuth consent screen
       │  → User grants permission
       │  → Google redirects back to /auth/callback with ?code=...
       ▼
  /auth/callback route handler:
  supabase.auth.exchangeCodeForSession(code)
       │  → JWT issued, stored in cookies
       │  → handle_new_user() trigger fires if first login → auto-creates Profile row
       ▼
  Redirect to /dashboard
```

### Example: Request University Registration (request-university/)

```
/request-university page — 'use client'
User fills: university name, abbreviation, location, website,
           admin name, admin email, admin phone, domains[]
       │
       ▼
  react-hook-form + zod validates form fields client-side
  → email domain format check, required field enforcement
       │
       ▼
  supabase.auth.getUser() → confirm requestor is authenticated
       │
       ▼
  supabase.from('University').insert({
    name, abbreviation, location, website,
    adminName, adminEmail, adminPhone,
    domains: domainsArray,        ← e.g. ['university.edu', 'uni.ac.in']
    status: 'PENDING'             ← goes into approval queue
  })
  → RLS policy: any authenticated user can INSERT
  → No immediate access granted — status must be changed to 'APPROVED' by admin
       │
       ▼
  Success toast shown → form resets
  → User is informed that review takes 2–3 business days
  → Until approved, enforce_profile_university_domain() trigger will NOT
    match this university when new students sign up with its email domain
```

### Example: Dashboard — Multi-Domain Stats Aggregation (/dashboard)

```
/dashboard page (app/dashboard/page.tsx) mounts — 'use client'
       │
       ▼
  supabase.auth.getUser() → get user.id
       │
       ▼  (5 parallel Supabase queries fire simultaneously via Promise.all)
       │
       ├─ 1. EVENTS COUNT
       │    supabase.from('Event')
       │      .select('id', { count: 'exact' })
       │      .eq('universityId', universityId)
       │      .gte('date', today)
       │    → count of upcoming events → StatCard "Upcoming Events"
       │
       ├─ 2. CLUBS MEMBERSHIP
       │    supabase.from('ClubMember')
       │      .select('id', { count: 'exact' })
       │      .eq('userId', user.id)
       │    → count of clubs joined → StatCard "Clubs Joined"
       │
       ├─ 3. RESUME SCORE
       │    supabase.from('Resume')
       │      .select('score')
       │      .eq('userId', user.id)
       │      .order('createdAt', { ascending: false })
       │      .limit(1)
       │    → latest resume ATS score → StatCard "Resume Score"
       │
       ├─ 4. MOOD STREAK
       │    supabase.from('MoodLog')
       │      .select('loggedAt')
       │      .eq('userId', user.id)
       │      .order('loggedAt', { ascending: false })
       │      .limit(7)
       │    → consecutive daily log count → StatCard "Wellness Streak"
       │
       └─ 5. UPCOMING EVENTS (full rows)
            supabase.from('Event')
              .select('*, Club(name, logoUrl)')
              .eq('universityId', universityId)
              .gte('date', today)
              .order('date', { ascending: true })
              .limit(3)
            → rendered as EventCard components in "What's Coming Up" section
       │
       ▼
  setStats({ eventsCount, clubsCount, resumeScore, moodStreak })
  setUpcomingEvents(events)
       │
       ▼
  UI renders 4x StatCard + 3x EventCard + QuickActionCard grid (8 actions)
  + UpcomingItem list + MiniCalendar
  (No realtime — dashboard data is static; user must navigate away and back to refresh)
```

### Example: Join a Club (/clubs)

```
/clubs page (app/clubs/page.tsx) mounts — 'use client'
       │
       ▼
  supabase.auth.getUser() → get user.id
  supabase.from('Profile').select('universityId').eq('id', user.id).single()
       │
       ▼
  ClubGrid.tsx fetches clubs:
  supabase.from('Club')
    .select('*, ClubMember(userId)')     ← join to know if current user is a member
    .or(`universityId.eq.${universityId},scope.eq.UNIVERSE`)
    .order('name', { ascending: true })
  → Each ClubCard shows: logo, name, description, member count, "Join/Leave" button
       │
       ▼  User clicks "Join" on a ClubCard
       │
       ▼
  supabase.from('ClubMember').insert({
    clubId: selectedClub.id,
    userId: user.id,
    role: 'MEMBER'
  })
  → RLS validates: auth.uid() = userId
       │
       ▼
  Optimistic UI update: ClubCard immediately shows "Joined" state + increments member count
  clubs list re-fetched silently in background to sync actual DB state

  ── Create a New Club ──
  User clicks "New Club" in Header action slot → Dialog opens
  Fills: name, description, logoUrl, scope (CAMPUS / UNIVERSE)
       │
       ▼
  supabase.from('Club').insert({ name, description, logoUrl, scope, universityId })
  → supabase.from('ClubMember').insert({ clubId: newClub.id, userId: user.id, role: 'ADMIN' })
  → Dialog closes → ClubGrid re-fetches → new club appears with current user as admin
```

### Example: Create a Research Project (/research)

```
/research page (app/research/page.tsx) mounts — 'use client'
       │
       ▼
  supabase.auth.getUser() → get user.id
  supabase.from('Profile').select('universityId').eq('id', user.id).single()
       │
       ▼
  Fetch research projects:
  supabase.from('ResearchProject')
    .select('*, Profile!ResearchProject_leadId_fkey(fullName, avatarUrl),
             ProjectCollaborator(userId, role)')
    .or(`universityId.eq.${universityId},scope.eq.UNIVERSE`)
    .order('createdAt', { ascending: false })
  → ProjectCard renders: title, description, status badge, lead name/avatar, collaborator count
       │
       ▼  User clicks "New Project" → Dialog opens
       │
       ▼
  Fills: title, description, status (OPEN / IN_PROGRESS / COMPLETED), scope
       │
       ▼
  supabase.from('ResearchProject').insert({
    title, description, status,
    leadId: user.id,
    universityId,
    scope
  })
  → RLS validates: auth.uid() = leadId
       │
       ▼
  supabase.from('ProjectCollaborator').insert({
    projectId: newProject.id,
    userId: user.id,
    role: 'LEAD'
  })
  → Lead is auto-added as first collaborator with LEAD role
       │
       ▼
  Dialog closes → research page re-fetches → new ProjectCard appears

  ── Joining an Existing Project ──
  User clicks "Collaborate" on a ProjectCard
       │
       ▼
  supabase.from('ProjectCollaborator').insert({
    projectId, userId: user.id, role: 'MEMBER'
  })
  → RLS validates: auth.uid() = userId
       → Project.leadId receives notification (if notification system is wired)
```

### Example: Browse Campus News (/news)

```
/news page (app/news/page.tsx) mounts — 'use client'
       │
       ▼
  useUserUniversity() hook fires:
  supabase.auth.getUser() → user.id
  supabase.from('Profile').select('universityId, role').eq('id', user.id).single()
  → returns { universityId, role, loading }
       │
       ▼  (tab determines scope — "Campus" or "All Universities")
       │
       ├─ Tab: "Campus"
       │    supabase.from('Post')
       │      .select('*, Profile!Post_authorId_fkey(fullName, avatarUrl, role,
       │               University(name, abbreviation))')
       │      .eq('universityId', universityId)
       │      .eq('category', 'NEWS')               ← category filter distinguishes news posts
       │      .order('createdAt', { ascending: false })
       │      .limit(20)
       │    → Returns posts scoped to the user's campus tagged as NEWS category
       │
       └─ Tab: "All Universities"
            supabase.from('Post')
              .select('*, Profile!Post_authorId_fkey(fullName, avatarUrl, role,
                       University(name, abbreviation))')
              .eq('scope', 'UNIVERSE')
              .eq('category', 'NEWS')
              .order('createdAt', { ascending: false })
              .limit(20)
       │
       ▼
  NewsHero renders the top pinned/featured news item
  NewsCategoryList renders category pills (Academic, Events, Sports, General...)
  NewsCard renders each article with author avatar, university badge, timestamp
       │
       ▼  User clicks on a category pill
       │
       ▼
  Re-runs query with additional .eq('subCategory', selectedCategory) filter
  → NewsCard list updates with filtered results
  (No realtime — news is refreshed on category change or manual page reload)
```

### Example: Update Account Settings (/settings)

```
/settings page (app/settings/page.tsx) mounts — 'use client'
Six tabs: Profile | Appearance | Notifications | Privacy | Integrations | Accessibility
       │
       ▼
  useUserSettings() hook fires:
  supabase.auth.getUser() → user.id
  supabase.from('UserSettings')
    .select('*')
    .eq('userId', user.id)
    .single()
  → If row doesn't exist: INSERT default row (upsert pattern)
  → Returns full settings object (30+ columns)
       │
       ▼  ── Profile Tab (ProfileSettings.tsx) ──
  Separately fetches:
  supabase.from('Profile').select('*').eq('id', user.id).single()
  → Pre-populates fullName, username, bio, avatarUrl, department, yearOfStudy fields

  User edits fields → clicks "Save Changes"
       │
       ▼
  supabase.from('Profile').update({
    fullName, username, bio, department, yearOfStudy
  }).eq('id', user.id)
  → RLS validates: auth.uid() = id

  If avatar changed:
  supabase.storage.from('post-images').upload(`avatars/${user.id}`, file)
  → Gets public URL → supabase.from('Profile').update({ avatarUrl: publicUrl })
       │
       ▼  ── Notifications Tab ──
  User toggles "Notify on Direct Messages" OFF
  updateSettings({ notifyDirectMessages: false })
       │
       ▼
  supabase.from('UserSettings').upsert({
    userId: user.id,
    notifyDirectMessages: false
    ...rest of current settings
  }, { onConflict: 'userId' })
       │
       ▼  ── Privacy Tab — Online Status Toggle ──
  User toggles "Show Online Status" OFF
       │
       ▼
  updateSettings({ showOnlineStatus: false })
  ALSO separately:
  supabase.from('Profile').update({ showOnlineStatus: false }).eq('id', user.id)
  → useUserSettings hook syncs the change to BOTH UserSettings AND Profile tables
  (The dual-write is a known coupling in the hook — Profile.showOnlineStatus drives
   the Sidebar's "online" indicator dot)
       │
       ▼  ── Accessibility Tab ──
  User increases fontScale to 1.25 or enables highContrast mode
       │
       ▼
  updateSettings({ fontScale: 1.25, highContrast: true })
  → useUserSettings upserts to UserSettings
  → Parent component reads settings and injects CSS variables / Tailwind classes
    globally via data attributes on <body> or <html> tag
```

### Example: View Changelog (/updates)

```
/updates page (app/updates/page.tsx) mounts — 'use client'
       │
       ▼
  DashboardLayout renders with title="What's New", subtitle="Latest updates & releases"
       │
       ▼
  ReleaseTimeline.tsx mounts
       │  → Data is STATIC — hardcoded release entries in the component itself
       │  → No Supabase call, no API call
       │  → Each timeline entry has: version tag, date, feature list, badge (New/Fix/Improvement)
       │  → Framer Motion staggered animation reveals entries as user scrolls
       ▼
  FeedbackWidget.tsx mounts
       │
       ▼
  User types feedback text → clicks "Submit Feedback"
       │
       ▼
  supabase.auth.getUser() → get user.id
       │
       ▼
  supabase.from('Post').insert({
    content: feedbackText,
    authorId: user.id,
    universityId,
    scope: 'CAMPUS',
    category: 'FEEDBACK',        ← reuses Post table with a FEEDBACK category
    type: 'TEXT'
  })
  → Success toast: "Thanks for your feedback!"
  (Feedback is stored as a Post row with category='FEEDBACK' —
   no dedicated Feedback table exists in the schema)
```

### Example: Use Campus Utilities — Bus Tracker (/utilities)

```
/utilities page (app/utilities/page.tsx) mounts — 'use client'
Three tabs: Campus Map | Bus Tracker | Discount Hub
       │
       ▼
  supabase.auth.getUser() → user.id
  supabase.from('Profile').select('universityId').eq('id', user.id).single()
       │
       ▼  ── Bus Tracker Tab (BusTracker.tsx) ──

  Fetch live shuttle data:
  supabase.from('UtilityShuttle')
    .select('*')
    .eq('universityId', universityId)
    .order('routeNumber', { ascending: true })
  → Renders each route: routeName, status (ACTIVE/DELAYED/OUT OF SERVICE),
    nextStop, etaMinutes, schedule[], serviceAlerts, isAccessible badge

  Auto-refresh: setInterval fires every 30 seconds
  → Re-runs same query → etaMinutes and status update without user action

  User clicks "Suggest a Route" → inline form opens
       │
       ▼
  supabase.from('UtilitySuggestion').insert({
    universityId,
    suggestedBy: user.id,
    category: 'SHUTTLE',
    title: routeName,
    routeNumber, operatingHours, schedule,   ← SHUTTLE-specific overlay columns
    status: 'PENDING'
  })
  → Admin reviews suggestions in a separate admin panel
       │
       ▼  ── Campus Map Tab (CampusMap.tsx) ──

  supabase.from('UtilityService')
    .select('*')
    .eq('universityId', universityId)
  → Returns services with mapX, mapY coordinates
  → Rendered as pins on an SVG or CSS grid map canvas
  → Clicking a pin shows popup: name, category, hours, contact, website

       │
       ▼  ── Discount Hub Tab (DiscountHub.tsx) ──

  supabase.from('UtilityDiscount')
    .select('*')
    .eq('universityId', universityId)
    .eq('isActive', true)
    .order('expiresAt', { ascending: true })
  → Cards show: brand logo, offer text, promo code, expiry date, redeem type
  → "Copy Code" button copies code to clipboard → toast confirms
  → "View Deal" button opens brand link in new tab
```

---

## 4. API Contracts & Storage

### API Routes

| Endpoint | Method | Input | Output | Auth |
|---|---|---|---|---|
| `/api/career/analyze-resume` | POST | `FormData` with `file` (PDF/text) | `{ feedback: { quickFixes[], keywords, impactScore, summary }, score }` | None (relies on client being authenticated) |
| `/api/images` | GET | None | `string[]` (file paths in `/public/images/`) | None |

### Server Actions (the real backend)

| File | Actions | Tables Touched |
|---|---|---|
| `src/app/academic/actions.ts` | `chatAction`, `getOrCreateChat`, `saveChatMessage`, `getResources`, `voteResource`, `generateFlashcardsAction`, `getStudyGroups`, `createStudyGroup`, `joinStudyGroup`, `createResource`, `deleteResource` (11 actions) | `AcademicAIChat`, `AcademicAIChatMessage`, `Resource`, `ResourceEmbedding`, `StudyGroup`, `StudyGroupMember`, `Course` |
| `src/app/marketplace/actions.ts` | `createListing`, `getListings`, `updateListing` (3 actions) | `MarketplaceListing`, `Profile` |

### Supabase Edge Functions

| Function | Input | Output | AI Model |
|---|---|---|---|
| `academic-ai` | `{ messages: ChatMessage[] }` | `{ response: string }` | Gemini 2.5 Flash |
| `generate-flashcards` | `{ topic: string }` | `{ flashcards: { front, back }[] }` | Gemini 2.5 Flash |

### Data Fetching Patterns Used

| Pattern | Description | Usage |
|---|---|---|
| Pattern A: Direct Supabase Browser Client | `supabase.from()` calls in `useEffect` hooks | **Dominant** — 35+ files (Feed, Messages, Dashboard, Events, Forums, Sidebar, etc.) |
| Pattern B: Next.js Server Actions | `'use server'` functions with cookie-based Supabase client | Academic (11 actions), Marketplace (3 actions) |
| Pattern C: Next.js API Routes | Traditional REST endpoints | Resume analysis, Image listing (2 routes only) |
| Pattern D: Supabase Edge Functions | `supabase.functions.invoke()` | AI chat, Flashcards (via `src/lib/ai.ts` — currently unused, legacy path) |
| Pattern E: React Query | `useQuery` / `useMutation` | **COMPLETELY UNUSED** despite being installed and configured |

### Supabase Realtime Subscriptions

| Location | Channel | Tables Watched | Behavior |
|---|---|---|---|
| Feed page | `public:Post` | `Post (*)` | Refetches all posts on any Post change |
| Messages page | `messages-global` | `Conversation (*)`, `ConversationParticipant (*)`, `Message (*)`, `ConversationPreference (*)` | Refetches entire conversation list on any change to any of these 4 tables |
| ChatWindow | `chat:{conversationId}` | `Message (*)`, `MessageReaction (*)`, `MessageAttachment (*)` | Refetches messages for that conversation |
| Sidebar | `sidebar-unread-count` | `Message (*)` | Recalculates unread message count badge |

### Auth State Flow

#### Client-Side (Browser)
1. Middleware (`src/middleware.ts`): Intercepts all non-static requests (except `/api/*`). Creates a `createServerClient` and calls `supabase.auth.getUser()` with a 3s timeout to refresh the session token in cookies. Failures are logged but never block the request.
2. Browser client (`src/lib/supabase.ts`): `createBrowserClient(url, anonKey)` — auth state comes from cookies managed by the SSR package.
3. In every page/component: `supabase.auth.getUser()` is called independently to get the current user ID.

#### Server-Side (Server Actions)
1. Server client (`src/lib/server-supabase.ts`): `createServerClient(url, anonKey, { cookies })` with `cookies()` from `next/headers`.
2. Every server action calls `supabase.auth.getUser()` and throws "Unauthorized" if no user.

---

## 5. State & Context Management

### Current Reality: **No global state management**

Despite the PROJECT_GUIDE.md mentioning Zustand, **Zustand is not installed or used anywhere**. The actual pattern:

| Layer | Mechanism | Notes |
|---|---|---|
| **Server state** | Raw `useState` + `useEffect` with direct `supabase.from()` calls | No React Query hooks despite `@tanstack/react-query` being installed and `QueryClientProvider` being in the provider tree. **React Query is completely unused.** |
| **Auth state** | `supabase.auth.getUser()` called independently in every component that needs it | No auth context/provider. Every component repeats the same call. |
| **University context** | `useUserUniversity` hook | Exists but underused — only in `/feed`, `/events`, `/news`. Most components do their own `Profile.universityId` lookup. |
| **User settings** | `useUserSettings` hook | Well-structured — used by settings page and accessibility features |
| **Realtime** | 4 independent `supabase.channel()` subscriptions + 2 `setInterval` pollers | No shared realtime context. Sidebar and Messages page both subscribe to `Message` independently. |
| **UI state** | Component-local `useState` | Page-level state passed down to children via props + callbacks |

### Source of Truth

| Data | Source of Truth |
|---|---|
| Auth identity | Supabase Auth cookies (managed by `@supabase/ssr`) |
| User profile context | PostgreSQL `Profile` table (re-fetched per component) |
| All domain data | PostgreSQL via direct Supabase client calls |
| Realtime updates | Supabase Realtime `postgres_changes` channels |

**Inter-component communication:** Exclusively via props drill-down and callback functions. No event bus, no shared context (beyond React Query provider), no pub/sub between siblings.

---

## 6. Database Schema

### Complete Table List (42 Tables)

#### Core / Identity Domain (2 tables)

| Table | Key Columns |
|---|---|
| **University** | `id`, `name`, `abbreviation`, `location`, `logoUrl`, `domains[]`, `studentIdPattern`, `adminEmail`, `adminName`, `adminPhone`, `status` (UniversityStatus), `website`, `createdAt`, `updatedAt` |
| **Profile** | `id`, `email`, `universityEmail`, `username`, `fullName`, `avatarUrl`, `bio`, `role` (UserRole), `department`, `yearOfStudy`, `embedding` (vector), `universityId` → University, `universityName`, `lastSeenAt`, `showOnlineStatus`, `createdAt`, `updatedAt` |

#### Social / Feed Domain (4 tables)

| Table | Key Columns |
|---|---|
| **Post** | `id`, `content`, `mediaUrl`, `type` (PostType), `authorId` → Profile, `universityId` → University, `scope` (ContentScope), `category`, `createdAt`, `updatedAt` |
| **Like** | `id`, `postId` → Post, `userId` → Profile, `createdAt` |
| **Comment** | `id`, `content`, `postId` → Post, `authorId` → Profile, `createdAt`, `updatedAt` |
| **Bookmark** | `id`, `postId` → Post, `userId` → Profile, `createdAt` |

#### Messaging Domain (7 tables)

| Table | Key Columns |
|---|---|
| **Conversation** | `id`, `isGroup`, `name`, `createdBy` (auto auth.uid()), `updatedAt` |
| **ConversationParticipant** | `id`, `conversationId` → Conversation, `userId` → Profile, `role` (ParticipantRole), `status` (ConversationStatus) |
| **ConversationPreference** | `id`, `conversationId` → Conversation, `userId` → Profile, `isMuted`, `mutedUntil`, `isArchived`, `archivedAt`, `isPinned`, `pinnedAt`, `lastReadAt`, `clearedAt`, `createdAt`, `updatedAt` |
| **Message** | `id`, `content`, `conversationId` → Conversation, `senderId` → Profile, `readBy[]`, `isEdited`, `isDeleted`, `deletedAt`, `deletedBy` → Profile, `createdAt`, `updatedAt` |
| **MessageAttachment** | `id`, `messageId` → Message, `uploaderId` → Profile, `fileName`, `fileType`, `fileSize`, `url`, `metadata` (jsonb), `createdAt` |
| **MessageReaction** | `id`, `messageId` → Message, `userId` → Profile, `emoji`, `createdAt` |
| **MessageHidden** | `id`, `messageId` → Message, `userId` → Profile, `hiddenAt` |

#### Academic Domain (9 tables)

| Table | Key Columns |
|---|---|
| **Course** | `id`, `code`, `name`, `universityId` → University |
| **CourseEnrollment** | `id`, `userId` → Profile, `courseId` → Course, `role` |
| **Resource** | `id`, `title`, `description`, `fileUrl`, `type` (ResourceType), `courseId` → Course, `uploaderId` → Profile, `upvotes`, `createdAt` |
| **ResourceEmbedding** | `id`, `resourceId` → Resource, `content`, `embedding` (vector) |
| **AcademicAIChat** | `id`, `userId` (→ Profile), `title`, `createdAt`, `updatedAt` |
| **AcademicAIChatMessage** | `id`, `chatId` → AcademicAIChat, `role`, `content`, `createdAt` |
| **FlashcardSet** | `id`, `title`, `description`, `userId` → Profile, `courseId`, `createdAt`, `updatedAt` |
| **Flashcard** | `id`, `setId` → FlashcardSet, `front`, `back`, `createdAt`, `updatedAt` |
| **StudySession** | `id`, `userId` → Profile, `duration`, `mode`, `courseId`, `createdAt` |

#### Study Groups Domain (2 tables)

| Table | Key Columns |
|---|---|
| **StudyGroup** | `id`, `name`, `description`, `courseId` → Course, `universityId` → University, `isPublic`, `createdAt`, `updatedAt` |
| **StudyGroupMember** | `id`, `studyGroupId` → StudyGroup, `userId` → Profile, `role` |

#### Forums Domain (7 tables)

| Table | Key Columns |
|---|---|
| **ForumThread** | `id`, `title`, `content`, `isAnonymous`, `courseId` → Course, `category`, `authorId`, `scope` (ContentScope), `universityId` → University, `tags[]`, `isPinned`, `viewCount`, `anonymousSeed`, `attachments` (jsonb), `createdAt`, `updatedAt` |
| **ForumReply** | `id`, `content`, `isAnonymous`, `threadId` → ForumThread, `authorId`, `anonymousSeed`, `attachments` (jsonb), `createdAt` |
| **ForumVote** | `id`, `threadId` → ForumThread, `replyId` → ForumReply, `userId` → Profile, `value`, `createdAt` |
| **ForumBookmark** | `id`, `threadId` → ForumThread, `userId` → Profile, `createdAt` |
| **ForumPoll** | `id`, `threadId` → ForumThread, `question`, `expiresAt`, `createdAt` |
| **ForumPollOption** | `id`, `pollId` → ForumPoll, `optionText`, `order` |
| **ForumPollVote** | `id`, `optionId` → ForumPollOption, `userId` → Profile, `pollId` → ForumPoll, `createdAt` |
| **ForumReport** | `id`, `threadId` → ForumThread, `replyId` → ForumReply, `reporterId` → Profile, `reason`, `status`, `createdAt` |

#### Events & Clubs Domain (4 tables)

| Table | Key Columns |
|---|---|
| **Club** | `id`, `name`, `description`, `logoUrl`, `scope` (ContentScope), `universityId` → University, `createdAt` |
| **ClubMember** | `id`, `clubId` → Club, `userId` → Profile, `role` |
| **Event** | `id`, `title`, `description`, `date`, `location`, `imageUrl`, `clubId` → Club, `organizerId`, `scope` (ContentScope), `universityId` → University, `isPinned`, `participantLimit`, `createdAt`, `updatedAt` |
| **EventRSVP** | `id`, `eventId` → Event, `userId` → Profile, `status`, `createdAt` |

#### Marketplace Domain (1 table)

| Table | Key Columns |
|---|---|
| **MarketplaceListing** | `id`, `title`, `description`, `price`, `imageUrl`, `type` (ListingType), `status`, `sellerId` → Profile, `scope` (ContentScope), `universityId` → University, `createdAt` |

#### Research Domain (2 tables)

| Table | Key Columns |
|---|---|
| **ResearchProject** | `id`, `title`, `description`, `status`, `leadId` → Profile, `scope` (ContentScope), `universityId` → University, `createdAt` |
| **ProjectCollaborator** | `id`, `projectId` → ResearchProject, `userId` → Profile, `role` |

#### Travel Domain (2 tables)

| Table | Key Columns |
|---|---|
| **RideOffer** | `id`, `from`, `to`, `date`, `seats`, `price`, `driverId` → Profile, `scope` (ContentScope), `universityId` → University, `createdAt` |
| **RideRequest** | `id`, `offerId` → RideOffer, `passengerId` → Profile, `status` |

#### Social / Friends Domain (2 tables)

| Table | Key Columns |
|---|---|
| **Friendship** | `id`, `requesterId` → Profile, `addresseeId` → Profile, `status` (FriendshipStatus), `createdAt`, `updatedAt` |
| **MentorshipSkill** | `id`, `skill`, `type`, `userId` → Profile |

#### Wellness Domain (1 table)

| Table | Key Columns |
|---|---|
| **MoodLog** | `id`, `userId` → Profile, `moodScore`, `notes`, `activities[]`, `loggedAt` |

#### Career Domain (1 table)

| Table | Key Columns |
|---|---|
| **Resume** | `id`, `fileUrl`, `fileName`, `userId` → Profile, `score`, `feedback` (jsonb), `satsCheck`, `createdAt` |

#### Settings Domain (1 table)

| Table | Key Columns |
|---|---|
| **UserSettings** | `userId` → Profile (PK), `profileVisibility`, `showOnlineStatus`, `resumeVisibility`, `genderFilterEnabled`, `shareLiveTrip`, `privateMoodLogs`, `theme`, `glassmorphism`, `notifyDirectMessages`, `notifyMentions`, `notifyReplies`, `notifyDeadlines`, `notifyStudyGroups`, `notifyEvents`, `notifyJobAlerts`, `notifyResearchUpdates`, `notifyRideUpdates`, `notifyMoodReminder`, `googleCalendarConnected`, `githubConnected`, `linkedinConnected`, `zoomConnected`, `fontScale`, `highContrast`, `reduceMotion`, `screenReader`, `dyslexicFont`, `phone`, `linkedin`, `github`, `createdAt`, `updatedAt` |

#### Utilities Domain (4 tables)

| Table | Key Columns |
|---|---|
| **UtilityService** | `id`, `universityId` → University, `name`, `category`, `description`, `location`, `hours`, `contact`, `website`, `mapX`, `mapY`, `createdAt`, `updatedAt` |
| **UtilityShuttle** | `id`, `universityId` → University, `routeName`, `routeNumber`, `status`, `nextStop`, `etaMinutes`, `schedule[]`, `operatingHours`, `serviceAlerts`, `isAccessible`, `createdAt`, `updatedAt` |
| **UtilityDiscount** | `id`, `universityId` → University, `title`, `brand`, `offer`, `code`, `category`, `link`, `expiresAt`, `eligibility`, `termsUrl`, `redeemType`, `campusLocation`, `isActive`, `createdAt`, `updatedAt` |
| **UtilitySuggestion** | `id`, `universityId` → University, `suggestedBy` → Profile, `category` (UtilityCategory), `status` (UtilitySuggestionStatus), `title`, `description`, + all overlay columns from Service/Shuttle/Discount, `notes`, `adminNote`, `createdAt`, `updatedAt` |

### Foreign Key Dependency Graph

```
University (root hub)
├── Profile.universityId
│   ├── Post.authorId
│   │   ├── Like.postId
│   │   ├── Comment.postId / Comment.authorId → Profile
│   │   └── Bookmark.postId
│   ├── AcademicAIChat.userId
│   │   └── AcademicAIChatMessage.chatId
│   ├── CourseEnrollment.userId
│   ├── Resource.uploaderId
│   │   └── ResourceEmbedding.resourceId
│   ├── FlashcardSet.userId → Flashcard.setId
│   ├── StudySession.userId
│   ├── StudyGroupMember.userId
│   ├── ConversationParticipant.userId
│   ├── ConversationPreference.userId
│   ├── Message.senderId / deletedBy
│   ├── MessageAttachment.uploaderId
│   ├── MessageReaction.userId
│   ├── MessageHidden.userId
│   ├── EventRSVP.userId
│   ├── ClubMember.userId
│   ├── Friendship.requesterId / addresseeId
│   ├── MentorshipSkill.userId
│   ├── MoodLog.userId
│   ├── Resume.userId
│   ├── UserSettings.userId
│   ├── MarketplaceListing.sellerId
│   ├── ResearchProject.leadId → ProjectCollaborator.projectId
│   ├── RideOffer.driverId → RideRequest.offerId
│   ├── ForumVote.userId / ForumPollVote.userId
│   ├── ForumBookmark.userId / ForumReport.reporterId
│   └── UtilitySuggestion.suggestedBy
│
├── Course.universityId
│   ├── CourseEnrollment.courseId
│   ├── Resource.courseId
│   ├── ForumThread.courseId
│   └── StudyGroup.courseId → StudyGroupMember.studyGroupId
│
├── Club.universityId
│   ├── ClubMember.clubId
│   └── Event.clubId → EventRSVP.eventId
│
├── ForumThread.universityId
│   ├── ForumReply.threadId
│   ├── ForumVote.threadId / replyId
│   ├── ForumBookmark.threadId
│   ├── ForumPoll.threadId → ForumPollOption.pollId → ForumPollVote.optionId
│   └── ForumReport.threadId / replyId
│
├── Conversation (no FK to University)
│   ├── ConversationParticipant.conversationId
│   ├── ConversationPreference.conversationId
│   └── Message.conversationId
│       ├── MessageAttachment.messageId
│       ├── MessageReaction.messageId
│       └── MessageHidden.messageId
│
├── UtilityService.universityId
├── UtilityShuttle.universityId
├── UtilityDiscount.universityId
└── UtilitySuggestion.universityId
```

Key hubs by FK fan-out:
- **Profile** → referenced by ~27 tables (god-object)
- **University** → referenced by ~16 tables

### Custom Enums

| Enum | Values |
|---|---|
| `ContentScope` | `CAMPUS`, `UNIVERSE` |
| `ConversationStatus` | `PENDING`, `ACCEPTED`, `REJECTED` |
| `FriendshipStatus` | `PENDING`, `ACCEPTED`, `DECLINED`, `BLOCKED` |
| `ListingType` | `SELL`, `BUY`, `LOST`, `FOUND` |
| `ParticipantRole` | `MEMBER`, `ADMIN` |
| `PostType` | `TEXT`, `IMAGE`, `VIDEO`, `LINK` |
| `ResourceType` | `NOTE`, `PAST_PAPER`, `ASSIGNMENT`, `OTHER` |
| `SuggestionStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `UniversityStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `UserRole` | `STUDENT`, `FACULTY`, `ALUMNI`, `ADMIN` |
| `UtilityCategory` | `SERVICE`, `SHUTTLE`, `DISCOUNT` |
| `UtilitySuggestionStatus` | `PENDING`, `APPROVED`, `REJECTED` |

### Database Functions

| Function | Purpose |
|---|---|
| `match_documents(query_embedding, match_threshold, match_count)` | Vector search over `ResourceEmbedding` — cosine similarity for academic RAG |
| `handle_new_user()` | Trigger: auto-creates `Profile` row on `auth.users` insert |
| `enforce_profile_university_domain()` | Trigger: validates `Profile.universityId` matches email domain |
| `handle_updated_at()` | Trigger: auto-sets `updatedAt = now()` on update |
| `update_conversation_timestamp()` | Trigger: bumps `Conversation.updatedAt` on new `Message` |
| `handle_conversation_creator_status()` | Trigger: auto-`ACCEPTED` for conversation creator |
| `check_conversation_access(convo_id)` | Security: returns boolean if user is `ACCEPTED` participant |
| `make_me_admin()` | SECURITY DEFINER: sets current user's role to ADMIN (**security concern**) |
| `am_i_admin()` | SECURITY DEFINER: checks if current user is ADMIN |

### Storage Buckets

| Bucket | Public | Size Limit | Restriction |
|---|---|---|---|
| `post-images` | Yes | Unlimited | None |
| `academic-resources` | Yes | Unlimited | None |
| `resumes` | No | 10 MB | PDF/DOCX only |

---

## 7. Hidden Dependencies & Coupling

### CRITICAL Issues

| # | Issue | Impact | Where |
|---|---|---|---|
| **C1** | **No data access layer** — 35+ files import `supabase` directly and write raw queries | Any table rename or schema change requires editing dozens of files. No query reuse, no caching. | Every `page.tsx` and most components |
| **C2** | **React Query installed but completely unused** | `staleTime: 60_000` is configured in Providers but zero `useQuery` / `useMutation` hooks exist. Every data fetch is a bespoke `useEffect` with manual loading/error states. | `src/components/providers.tsx` |
| **C3** | **Duplicate `Profile.universityId` lookups** — same raw query copy-pasted in 8+ locations | Unnecessary N+1 queries, inconsistent caching. `useUserUniversity` hook exists but is ignored in most places. | EventCreationModal (duplicated *twice in same file*), SharePostBox, clubs, research, marketplace actions |
| **C4** | **Duplicate Realtime subscriptions** — Sidebar and Messages page both subscribe to `Message` table changes | Double channel overhead, potential race conditions on unread count. | `Sidebar.tsx`, `messages/page.tsx` |
| **C5** | **Cross-domain God components** — `RideFinder.tsx` accesses 5 tables across 3 domains (Travel + Messaging + Identity) | Tight coupling between unrelated features. Can't refactor messaging without breaking travel. | `src/components/travel/RideFinder.tsx` |
| **C6** | **`make_me_admin()` SQL function** — `SECURITY DEFINER` with no auth gate | Any authenticated user can escalate to admin. Likely a debug artifact. | Database function |
| **C7** | **`post-images` and `academic-resources` buckets have no file size limits or MIME type restrictions** | Storage abuse vector — any file type, any size. | `supabase/current_schema/Storage_Buckets.json` |
| **C8** | **Resume analysis API route has no auth check** | `POST /api/career/analyze-resume` doesn't verify Supabase auth — relies on the honor system. | `src/app/api/career/analyze-resume/route.ts` |

### Moderate Issues

| # | Issue | Impact |
|---|---|---|
| **M1** | `aiService` in `src/lib/ai.ts` wraps edge functions but is **unused** — `ChatInterface` uses server actions directly instead | Dead code, confusing dual path |
| **M2** | `UtilitySuggestion` table is a polymorphic mega-table with ~30 nullable overlay columns | 60% nulls per row, hard to validate |
| **M3** | `ForumThread.authorId` and `Event.organizerId` may lack enforced FK constraints | Potential orphan references |
| **M4** | Fallback `setInterval` polling (3-5s) alongside Realtime in Messages | Unnecessary load when Realtime is working |
| **M5** | `@prisma/client` is in devDependencies but there's no `schema.prisma` file visible | Phantom dependency |

### Bottleneck Map

```
                    ┌─────────────────────┐
                    │   supabase client   │ ← THE bottleneck
                    │   (browser-side)    │   Every component imports this directly
                    └────────┬────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
  35+ components      4 realtime channels    2 server action files
  doing raw queries   (3 files)              (only abstraction)
```

### Table Access Heatmap (which tables are accessed from the most files)

| Table | # Files Accessing | Files |
|---|---|---|
| Profile | 11+ | Sidebar, dashboard, SharePostBox, EventCreationModal, research, clubs, marketplace actions, useUserUniversity, UserSearchModal, GroupCreateDialog, ProfileSettings |
| Post | 2 | feed/page.tsx, dashboard/page.tsx |
| Message | 3 | messages/page.tsx, ChatWindow, Sidebar |
| Conversation | 3 | messages/page.tsx, ChatWindow, RideFinder |
| Event | 2 | events/page.tsx, dashboard/page.tsx |
| ForumThread | 2 | ThreadList, AnonymousPostComposer |
| MoodLog | 3 | MoodSelector, TrendChart, InsightCard |
| Resume | 2 | ResumeUploader, AnalysisDashboard |

---

## 8. Technology Summary Table

| Concern | Technology |
|---------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui (Radix) |
| Animation | Framer Motion |
| Client DB access | `@supabase/ssr` `createBrowserClient` |
| Server DB access | `@supabase/ssr` `createServerClient` (cookie-based) |
| AI (server actions) | Google GenAI SDK (`@google/generative-ai`) |
| AI (API routes) | Gemini REST API (`fetch`) |
| AI (edge functions) | Gemini REST API (`fetch` from Deno) |
| Embeddings | `gemini-embedding-001` (RETRIEVAL_QUERY + RETRIEVAL_DOCUMENT) |
| Vector search | `match_documents` Supabase RPC (pgvector) |
| Realtime | Supabase Realtime `postgres_changes` (4 subscriptions) |
| State management | Raw `useState` / `useEffect` — no React Query/SWR |
| File storage | Supabase Storage (`resumes`, `academic-resources`, `post-images` buckets) |
| Auth | Supabase Auth via SSR cookies, refreshed in middleware |
| Forms | react-hook-form + zod |
| Charts | recharts |
| PDF parsing | pdf-parse |
| Markdown | react-markdown |

---

## 9. Improved Prompt (for future architecture audits)

The original prompt was strong. Here's a refined version that yields more actionable output:

---

> **Act as a Lead Software Architect performing a codebase audit.** Deeply analyze this entire workspace by reading imports, exports, and function calls across all directories. Do not list files — map how everything is wired together.
>
> Generate a **System Architecture & Connection Map** with these sections:
>
> ### 1. Blueprint (3 sentences max)
> Core purpose, primary tech stack, and deployment model.
>
> ### 2. Module Wiring & Entry Points
> Map the component hierarchy from root layout → providers → routing → page shells → feature components. Identify which files are orchestrators (compose 5+ children) vs. leaf components.
>
> ### 3. Data Lifecycle — Trace 2 Concrete Paths
> Pick TWO representative user journeys (e.g., "create a post" and "AI chat") and trace them step-by-step from UI event → auth check → state mutation → database write → realtime propagation → UI re-render. Name the exact files, functions, and tables at each step.
>
> ### 4. API Contracts & Data Access Patterns
> Catalog ALL API routes, server actions, and edge functions with their method, input/output shape, and auth model. Then identify the **dominant data-fetching pattern** (direct client calls? React Query? SWR? server components?) and whether it's consistent.
>
> ### 5. State Management — Reality vs. Intent
> Map where global state actually lives (not what the README claims). Identify: auth state propagation, cross-component communication, caching strategy, and realtime subscription ownership.
>
> ### 6. Hidden Dependencies & Architectural Risks
> Flag: (a) tightly coupled modules accessing tables outside their domain, (b) duplicated logic/queries, (c) unused installed dependencies, (d) security gaps (unprotected routes, overprivileged functions), (e) missing abstraction layers that will make the next feature harder.
>
> **Formatting rules:** Use tables for catalogs, ASCII diagrams for flows, and bold for critical findings. Cite specific file paths and line numbers where relevant.

---

### What changed and why:

| Original Issue | Improvement |
|---|---|
| "Trace the lifecycle of **a** core piece of data" — vague | "Trace **2 concrete paths**" + suggest examples — forces coverage of both client-side and server-action flows |
| "How is global state handled?" — descriptive question | "**Reality vs. Intent**" — asks AI to cross-reference README claims against actual code |
| No mention of **security** | Added security gaps as explicit sub-point in section 6 |
| No mention of **unused dependencies** | Added as coupling sub-point — catches dead code |
| "Read through imports, exports, and function calls" — good but could be sharper | Added "Name the exact files, functions, and tables at each step" — forces precision |
| No formatting guidance | Added "Use tables for catalogs, ASCII diagrams for flows" — controls output density |
| Missing the "what makes the next feature harder" angle | Added explicitly in section 6(e) — the most actionable question for an architect |

The core improvement: the original asks **descriptive** questions ("how is X handled?"). The improved version asks **diagnostic** questions ("what's the gap between intent and reality?" / "what breaks when I add the next feature?"). Diagnostic framing produces findings; descriptive framing produces documentation.

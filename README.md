<div align="center">

# UniVerse

### One app for everything you do at college.

UniVerse is a campus super-app. Instead of juggling five different platforms — one for the social feed, another for clubs, a third for the LMS, a fourth for the job board — you get them all in one place, scoped to your university, with real-time updates and AI baked in.

Built with **Next.js 16**, **Supabase**, and **Google Gemini**.

[Live](https://universe-connect.netlify.app) · [Issues](https://github.com/vishalcoc44/UniVerse/issues)

</div>

---

## Why this exists

Most students bounce between WhatsApp groups, Google Classroom, LinkedIn, Reddit, college portals, and a half-dozen Discord servers. Each has a tiny slice of campus life. None talk to each other. UniVerse gathers all of it under one roof and adds AI-driven academic and career tools that nobody else bundles in.

You sign up with your university email. The platform figures out which university you belong to from the domain, drops you into the right campus, and from there everything you do is scoped — your feed, your forums, your study groups, your marketplace listings — all of it lives inside your campus by default. You can opt into the wider Universe view when you want to see what's happening across schools.

---

## What's inside

### The social side

**Social feed** — A Twitter-style feed with two views: **Campus** (people from your university) and **Universe** (everyone, every campus). You can post text, images, links, and polls. People react with emoji, comment, and bookmark posts they want to come back to. Pinned posts stay at the top.

**Forums** — Threaded discussions organized by category. You can post anonymously (the platform tracks who you are for moderation but never shows it in the UI), upvote/downvote replies, attach polls to threads, and bookmark threads to come back to. Reports flow to admins for moderation.

**Direct messages** — Real-time DMs powered by Supabase Realtime. Send text, images, files, voice notes. Reactions, read receipts, typing indicators. You can hide messages just for yourself or delete them for everyone (if you sent them).

**Group chats** — Built on the same messaging system. Used internally for study circles and any other multi-person conversation. Member roles (admin/member), join requests, and per-conversation mute settings.

**Friendships** — Add friends, accept/decline requests, see your network on your profile.

**Notifications** — In-app notification center for likes, comments, mentions, mentorship requests, message activity, university approval status, and more.

### The academic side

**AI tutor (Academic Compass)** — A chat interface that talks to Google Gemini. You can paste questions, drop study notes, and ask follow-ups. The AI pulls context from your uploaded course notes (RAG over `pgvector` embeddings) so it can answer with material from *your* classes, not just generic web knowledge. It handles markdown, code blocks, and remembers conversation context.

**Notes** — A simple notes editor with two AI buttons baked in: **Summarize** turns a long note into bullet points, and **Explain** unpacks a single concept like a tutor would. Notes are tagged to courses.

**Flashcards** — Type a topic, get a deck of AI-generated Q&A flashcards. Save the deck and review later.

**Quiz generator** — Same idea but for multiple-choice quizzes. Five questions, four options each, with explanations. You can attempt the quiz, get a score, and the system tracks every attempt.

**Study plan generator** — Tell it your topics, exam date, and how many hours per day you can study. Gemini lays out a daily schedule between now and your exam. You check off sessions as you complete them.

**Study circles** — Group study spaces. Create one, invite people, share resources, and use the built-in group chat to coordinate. There's also an AI-powered recommender that suggests circles you might want to join based on your major and bio.

**Resources library** — Course-tagged file repository. Upload PDFs, slides, lecture videos, anything. PDFs get automatically chunked and embedded into pgvector so the AI tutor can reference them in answers. Resources have an upvote system (one vote per user, no inflation).

**GPA calculator and Focus Timer** — Small utility tools. The Focus Timer is a Pomodoro with session logging; the GPA calculator does what you'd expect.

### The career side

**Resume analyzer** — Upload a PDF or text resume. Gemini scores it on impact (0-100), extracts keywords found vs missing for a target role, generates 6 quick-fix suggestions, and writes a one-paragraph summary. Bounded so a malicious resume can't poison the output.

**Resume history** — Every analysis is saved. Compare versions over time as you iterate.

**Job board** — Internal job listings managed by employer accounts. Search, filter, save jobs, and track applications. Each application has a status history (Applied → Interview → Offer → etc.).

**Application tracker** — Kanban-ish view of where each of your applications stands.

**Mentorship** — Mentor profiles (alumni and senior students) with skills, availability, and bios. Send a mentorship request with a message. Once accepted, schedule sessions with calendar links and notes.

**Alumni directory** — Browse mentors filtered by department and skills.

**Employer portal** — A separate UI for verified employers to post jobs, review applications, and manage their company profile.

**Salary insights** — Anonymous salary reports submitted by students/alumni. Filter by role, location, experience. Helps people negotiate honestly.

**Company profiles & reviews** — Each company gets a profile page with employee reviews (rating + text).

**Mock interviewer** — An AI that runs you through interview questions for a chosen category, evaluates your typed answers, and gives feedback (strengths, improvements, score). Backed by OpenAI for this specific feature; the rest of the AI tooling uses Gemini.

**Interview question bank** — Crowdsourced + admin-curated interview questions by category and difficulty.

**Skill gap analysis** — Compares your profile's skills against a target role and highlights what to learn.

**Career events** — Career-specific events (career fairs, info sessions, workshops). Same scoping rules as regular events.

**Achievements** — Auto-awarded badges (uploaded resume, applied to first job, etc.). Visible on your profile.

### Daily campus utilities

**Marketplace** — Buy/sell board. Three sub-modes: products (textbooks, electronics, furniture), lost & found, and roommate finder. Each listing is scoped to your campus by default (you can opt into Universe to reach a wider audience).

**Events** — Discover and RSVP to campus events. Organizers can create events, attach images, set capacity, manage attendance. RSVPs auto-add to your dashboard agenda.

**Clubs** — Browse and join campus clubs. Club admins can post announcements, manage membership, and run their own internal channels.

**Travel & rideshare** — Post or find rides to campus. Each offer has a route, date, available seats, price. Other students request to join. Cuts down commute costs and is way safer than asking strangers on Reddit.

**Wellness** — Daily mood tracker. Log how you feel, the platform charts your mood over time and surfaces gentle insights (no diagnosis, no judgment, just awareness).

**Bus tracker** — Live shuttle/bus routes for your campus. Map view with stop markers and timing.

**Campus map** — Interactive map of campus buildings and services with categories. Admin-managed.

**Discount hub** — A list of student discounts at local businesses (food, retail, services). Students can also suggest new discounts; admins approve.

**Research hub** — Faculty and students post research projects, find collaborators, and track progress.

**News** — University-wide announcements. Faculty and admins can publish.

**Departments** — A full academic structure: departments → sections → student/teacher assignments → announcements. Department admins manage their own department's content.

### Behind the scenes

**University verification** — When you sign up with `you@yourschool.edu`, the platform checks the domain against a list of approved universities. If it matches, you're auto-assigned. If your university isn't yet on the platform, anyone can submit a request to add it; platform admins review and approve.

**Three admin tiers** — Platform admins manage the whole platform. University super admins manage their entire university. Regular university admins handle their assigned scope (departments, content moderation).

**PWA** — Installable as an app. Works offline for cached content. Service worker registered automatically.

**Real-time everywhere** — Messages, notifications, post updates, group chats — all stream over WebSockets. No polling, no manual refresh.

**Privacy & feedback** — A built-in feedback widget lets you submit feature requests and bug reports straight from the UI.

---

## Tech stack

| Layer | What we use |
|---|---|
| **Framework** | Next.js 16 (App Router, React 19) |
| **Language** | TypeScript |
| **UI** | Tailwind CSS + shadcn/ui (Radix primitives) + Framer Motion |
| **Database** | PostgreSQL with `pgvector` extension, hosted on Supabase |
| **Auth** | Supabase Auth (email/password + email-domain verification trigger) |
| **Realtime** | Supabase Realtime (Postgres changes over WebSocket) |
| **Edge functions** | Deno on Supabase Edge Functions |
| **Storage** | Supabase Storage (5 buckets: resumes, avatars, post-images, academic-resources, message-attachments) |
| **AI** | Google Gemini 2.5 Flash for most things; OpenAI gpt-4o-mini for the mock interviewer |
| **Vector search** | `pgvector` for RAG over uploaded notes |
| **Forms** | React Hook Form + Zod |
| **Server state** | TanStack React Query |
| **Charts** | Recharts |
| **Maps** | `@vis.gl/react-google-maps` |
| **PDF parsing** | `pdf-parse` (server-side) |
| **Deployment** | Netlify (web) + Supabase (database, auth, edge functions) |

---

## Project structure

```
universe-connect/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── academic/           # AI tutor, notes, quizzes, study plans, study circles
│   │   ├── admin/              # Platform admin panel
│   │   │   └── platform-admins/   # Grant/revoke platform admin
│   │   ├── api/                # Next.js API routes
│   │   │   ├── career/analyze-resume/   # Gemini PDF analysis
│   │   │   ├── maps/places/             # Google Maps proxy
│   │   │   ├── maps/directions/         # Google Maps proxy
│   │   │   ├── updates/feedback/        # Bug/feature feedback
│   │   │   └── images/                  # Public images listing
│   │   ├── auth/                # Login
│   │   ├── career/              # Job board, mentorship, salary, etc.
│   │   ├── clubs/               # Clubs page
│   │   ├── dashboard/           # Main landing for authenticated users
│   │   ├── departments/         # Academic department management
│   │   ├── events/              # Event discovery & RSVP
│   │   ├── feed/                # Social feed
│   │   ├── forums/              # Forums + thread detail page
│   │   ├── marketplace/         # Buy/sell, lost & found, roommates
│   │   ├── messages/            # DMs and group chats
│   │   ├── news/                # University news
│   │   ├── profile/[userId]/    # User profiles
│   │   ├── request-university/  # University registration form
│   │   ├── research/            # Research collaboration
│   │   ├── settings/            # User settings + university admin tools
│   │   ├── signup/              # Email-domain verified signup
│   │   ├── travel/              # Rideshare
│   │   ├── updates/             # Feature flag / changelog
│   │   ├── utilities/           # Bus tracker, campus map, discounts
│   │   └── wellness/            # Mood tracker
│   ├── components/
│   │   ├── ui/                  # shadcn primitives
│   │   ├── academic/            # Chat, study circles, resource grid, study tools
│   │   ├── career/              # Resume tools, jobs, mentorship, employer, salary
│   │   ├── clubs/, events/, forums/, feed/, marketplace/, messages/, news/, research/, travel/, utilities/, wellness/
│   │   ├── layout/              # Sidebar, header, mobile nav, notifications
│   │   ├── settings/            # Profile settings UI
│   │   └── landing/             # Landing-page chunks
│   ├── hooks/                   # useUserUniversity, useUserSettings, use-mobile
│   └── lib/                     # supabase clients, ai service, rate limiter, validations, utils
├── supabase/
│   ├── functions/               # Deno edge functions
│   │   ├── academic-ai/         # Gemini chat with system prompt
│   │   ├── generate-flashcards/ # Gemini flashcard generation
│   │   ├── match-jobs/          # pgvector job matching
│   │   └── evaluate-interview/  # OpenAI mock interview evaluation
│   └── current_schema/          # Live DB schema dumps (read-only reference)
├── scripts/
│   ├── sync-schema.js           # Refresh current_schema/ from the live DB
│   └── generate-pdfs.mjs        # PDF utility
├── docs/                        # Internal docs (PRD, project guide, feature lists)
└── public/                      # Static assets, PWA manifest, service worker
```

---

## Database

PostgreSQL on Supabase, ~84 tables, every single one with row-level security enabled. Multi-tenant by `universityId` — most content tables have a `scope` column (`CAMPUS` or `UNIVERSE`) that controls visibility.

A few highlights:

- **`Profile`** — The central user record. Linked to `auth.users`. Holds role (`STUDENT`/`ADMIN`/`FACULTY`/`EMPLOYER`), `universityId`, and a 1536-dimensional `embedding` for semantic mentor/job matching.
- **`pgvector` tables** — `ResourceEmbedding` (chunked PDFs for RAG), `Profile.embedding` (for matching).
- **Anonymous content** — Forum threads/replies with `isAnonymous: true` keep the `authorId` for moderation but the UI hides it everywhere except admin views.
- **Conversations** — `Conversation` ↔ `ConversationParticipant` ↔ `Message`. Used for both DMs and group chats. `MessageAttachment` for files, `MessageReaction` for emoji.
- **Realtime publication** — A subset of tables broadcast change events to connected clients.

The full schema is dumped as JSON in [`supabase/current_schema/`](supabase/current_schema/) — refresh it with `npm run update-schema`.

---

## Getting started

### What you need

- Node.js 18+
- A Supabase project (free tier works)
- A Google Gemini API key (free tier works)
- Optional: an OpenAI API key (only needed for the mock interview evaluator)

### Setup

```bash
# 1. Clone
git clone https://github.com/vishalcoc44/UniVerse.git
cd UniVerse

# 2. Install
npm install

# 3. Env vars — create .env at the root
cat > .env << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_SERVER_KEY=your_google_maps_server_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_browser_key
EOF

# 4. Apply DB schema — see supabase/current_schema/ for reference SQL
#    or run the migrations in supabase/migrations/ if you maintain that workflow

# 5. Edge function secrets (run once on your Supabase project):
#    GEMINI_API_KEY, OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, ALLOWED_ORIGINS

# 6. Deploy edge functions
supabase functions deploy academic-ai
supabase functions deploy generate-flashcards
supabase functions deploy match-jobs
supabase functions deploy evaluate-interview

# 7. Run dev server (port 3001)
npm run dev
```

Open http://localhost:3001 — sign up with an email matching one of the approved university domains in your `University` table, or seed an entry in `University` with your test domain.

---

## Security

- **Supabase Auth** with email/password and email-domain verification — your university affiliation is enforced by a Postgres trigger that rejects profile inserts when the email domain doesn't match the chosen university.
- **Row-level security** on every table. The application code's `WHERE` clauses are belt-and-suspenders; the database is what actually enforces who sees what.
- **Next.js middleware** redirects unauthenticated users on protected routes and gates `/admin/*` server-side.
- **Edge functions** keep `GEMINI_API_KEY` and `OPENAI_API_KEY` server-side. Never shipped to the browser.
- **Rate limiting** on AI endpoints to prevent quota abuse.
- **CSP, HSTS, X-Frame-Options** all set in `next.config.mjs`.

The platform has been through a structured security audit; remediation work is ongoing in `audit/fixes/` (gitignored).

---


<div align="center">

**UniVerse** — Your campus, finally in one place.

</div>

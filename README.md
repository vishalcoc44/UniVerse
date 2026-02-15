<div align="center">

# 🎓 UniVerse

### Your campus. Your community. One platform.

UniVerse is a unified campus platform that brings together everything a student needs — social networking, academic support, career tools, and daily campus utilities — into a single, thoughtfully designed experience.

Built with **Next.js 16**, **Supabase**, and **Google Gemini AI**.

[Live Demo](https://universe-connect.netlify.app) · [Report Bug](https://github.com/vishalcoc44/UniVerse/issues) · [Request Feature](https://github.com/vishalcoc44/UniVerse/issues)

</div>

---

## 🧩 What is UniVerse?

Most campus tools are scattered — one app for forums, another for events, a separate portal for academics, and nothing that ties them together. UniVerse changes that.

It's a campus super-app where students can:
- Scroll a social feed and stay connected with their campus
- Get instant academic help from an AI tutor
- Analyze their resume and plan their career
- Buy/sell textbooks in a student marketplace
- Find a carpool for the morning commute
- Track their mood and wellness over time

All within one platform, scoped to their university, with real-time updates and a clean, modern interface.

---

## ✨ Features

### 📱 Social Feed
A dual-feed system that lets you switch between **Campus** (your university only) and **Universe** (all universities). Share posts with images, videos, links, and polls. React, comment, and bookmark content that matters to you.

### 🧠 Academic AI
A 24/7 AI-powered study companion built on **Google Gemini**. Ask it anything — from debugging code to explaining quantum mechanics. It renders markdown, code blocks, and maintains conversation context. There's also an AI flashcard generator that turns your study notes into Q&A cards automatically.

### 📝 Forums
Anonymous, course-specific discussion boards. Students can ask questions without the social pressure of putting their name on it. Great for exam doubts, honest course reviews, and open discussions.

### 💼 Career Center
Upload your resume and get an instant AI-powered analysis — ATS compatibility score, section-by-section feedback, and actionable suggestions. The platform also surfaces market trends and skill insights relevant to your field.

### 🏪 Marketplace
A campus classifieds board. List textbooks, electronics, furniture — anything students buy and sell. Scoped to your university so you're always dealing with people nearby.

### 🗓️ Events & Clubs
Discover and RSVP to hackathons, workshops, cultural fests, and club meetups. Event organizers can manage the full lifecycle — creation, updates, and attendance tracking.

### 🚗 Travel & Cab Pooling
Find or offer rides to campus. Students can post ride offers with route, date, available seats, and price. Others can request to join. Simple, practical, and cost-effective.

### 🧘 Wellness
A personal mood tracker with trend visualization. Log how you're feeling daily, and the platform gives you a visual picture of your mental wellness over time — no diagnosis, just awareness and gentle nudges.

### 💬 Messages
Direct messaging between students, powered by **Supabase Realtime** for instant delivery. Conversations are private and persistent.

### � Research Hub
A space where faculty and students collaborate on research projects. Post opportunities, find collaborators, and manage projects transparently.

### 📰 News & Updates
A centralized feed for university announcements, news, and important updates so nothing slips through the cracks.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, React 19) |
| **Language** | TypeScript |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) (Radix Primitives) |
| **Database** | PostgreSQL with [pgvector](https://github.com/pgvector/pgvector) on [Supabase](https://supabase.com/) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Auth** | Supabase Auth (JWT, OAuth, Email verification) |
| **Realtime** | Supabase Realtime (WebSockets) |
| **AI** | Google Gemini 2.5 Flash |
| **Edge Functions** | Deno (Supabase Edge Functions) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Forms** | React Hook Form + Zod validation |
| **State** | TanStack React Query |
| **Deployment** | Netlify |

---

## 📂 Project Structure

```
universe-connect/
├── prisma/
│   └── schema.prisma          # Database schema (source of truth)
├── supabase/
│   └── functions/
│       ├── academic-ai/       # AI tutor edge function
│       └── generate-flashcards/ # Flashcard generation
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── academic/          # AI tutor & resources
│   │   ├── career/            # Resume analysis & career tools
│   │   ├── clubs/             # Student organizations
│   │   ├── dashboard/         # Main landing page
│   │   ├── events/            # Event discovery & RSVP
│   │   ├── feed/              # Social feed (Campus & Universe)
│   │   ├── forums/            # Anonymous discussions
│   │   ├── marketplace/       # Buy & sell
│   │   ├── messages/          # Direct messaging
│   │   ├── news/              # University news
│   │   ├── research/          # Research collaboration
│   │   ├── travel/            # Cab pooling
│   │   ├── wellness/          # Mood tracking
│   │   └── ...
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # shadcn/ui primitives (49 components)
│   │   ├── feed/              # Post cards, share box
│   │   ├── academic/          # Chat interface, resource grids
│   │   ├── career/            # Resume uploader, analysis charts
│   │   ├── layout/            # Sidebar, navbar, user nav
│   │   └── ...
│   ├── hooks/                 # Custom React hooks
│   └── lib/                   # Utilities & Supabase clients
└── public/                    # Static assets
```

---

## 🗄️ Database Design

The database is built on PostgreSQL (via Supabase) with a multi-tenant architecture where each **University** acts as a tenant. Key design decisions:

- **Scoped content** — Posts, events, listings, and rides can be `CAMPUS` (university-only) or `UNIVERSE` (cross-university)
- **Vector embeddings** — User profiles and resources store 1536-dimensional vectors via `pgvector` for semantic search and mentor matching
- **Anonymous forums** — The `authorId` is stored for moderation but hidden from the UI when `isAnonymous` is true
- **Row Level Security (RLS)** — Every table is protected. Users can only read content within their scope and modify their own records

Core models: `Profile`, `University`, `Post`, `Comment`, `ForumThread`, `Course`, `Resource`, `Club`, `Event`, `MarketplaceListing`, `RideOffer`, `Message`, `MoodLog`, `AcademicAIChat`, `ResumeAnalysis`, `ResearchProject`, and more.

---

## � Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Bun](https://bun.sh/) (recommended) or npm
- A [Supabase](https://supabase.com/) project

### 1. Clone the repo
```bash
git clone https://github.com/vishalcoc44/UniVerse.git
cd UniVerse
```

### 2. Install dependencies
```bash
bun install
# or
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_pooled_connection_string
DIRECT_URL=your_direct_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Set up the database
```bash
npx prisma db push
```

### 5. Start developing
```bash
bun run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you're in.

---

## 🔒 Security

- **Supabase Auth** handles all authentication (email/password, OAuth with Google & GitHub)
- **Row Level Security** is enforced on every table — no data leaks even if someone bypasses the UI
- **Next.js Middleware** protects private routes, redirecting unauthenticated users to the login page
- **Edge Functions** run server-side AI logic so API keys never touch the client

---

## 🤝 Contributing

UniVerse is a student-built project and contributions are welcome.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

---

<div align="center">

**UniVerse** — Where your campus meets the world.


</div>

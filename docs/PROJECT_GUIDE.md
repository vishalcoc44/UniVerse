# UniVerse Nexus: The Comprehensive Project Understanding Guide

> **Note**: This document is a "live" representation of the UniVerse project state as of the latest analysis. It covers the architectural philosophy, technical implementation, improved database schemas, and feature-to-code mapping.

---

## 1. Executive Summary

**UniVerse** is a sophisticated **Super App** platform designed for university campuses. It bridges the gap between digital convenience and physical campus life, offering a unified ecosystem for:
-   **Social Networking**: A dual-feed system (Campus vs. Universe) for hyper-local and global connectivity.
-   **Academic Excellence**: AI-powered tutoring, resource sharing, and study group formation.
-   **Career Development**: Resume analysis, market trends, and research opportunities.
-   **Campus Utility**: Event management, ride-sharing, marketplace, and wellness tracking.
-   **Privacy & Safety**: Anonymous forums and secure, verified environments.

The project is architected as a **Progressive Web App (PWA)** using **Next.js 14** (App Router) on the frontend and **Supabase** (PostgreSQL) on the backend, leveraging **Edge Functions** for heavy AI computation.

---

## 2. Technical Architecture & Stack

### **Frontend Link: The "Client"**
-   **Framework**: **Next.js 14** (App Router). This ensures server-side rendering (SSR) for performance and SEO, with React Server Components (RSC) for efficient data fetching.
-   **Language**: **TypeScript**. Extensive use of interfaces and types for robustness (e.g., `interface Post`, `type UserRole`).
-   **Styling**: **Tailwind CSS**. Utility-first styling with a custom design system defined in `tailwind.config.ts`.
-   **UI Library**: **Shadcn UI** (built on Radix Primitives). Gives accessible, unstyled components that are customizable (seen in `src/components/ui`).
-   **State Management**: **Zustand** (implied for global state) and **React Query** (`@tanstack/react-query`) for server state management and caching.
-   **Forms**: `react-hook-form` + `zod` for schema validation.

### **Backend Link: The "Server" & "Database"**
-   **Platform**: **Supabase** (BaaS - Backend as a Service).
-   **Database**: **PostgreSQL 15+**. The core relational data store.
-   **ORM**: **Prisma**. Used for schema definition (`schema.prisma`) and type-safe database queries.
-   **Auth**: **Supabase Auth**. Handles JWTs, OAuth (Google, GitHub), and email verification.
-   **Realtime**: **Supabase Realtime**. Powers the chat and notification systems via WebSocket subscriptions.
-   **Vector Search**: `pgvector` extension enabled for AI embeddings (semantic search for resources and mentors).

### **Edge & AI Layer**
-   **Runtime**: **Deno** (via Supabase Edge Functions).
-   **AI Engines**:
    -   **Google Gemini 1.5 Flash**: For fast, high-volume text generation (chatbots, summarization).
    -   **OpenAI GPT-4o mini**: For complex reasoning (likely fallback or specific high-quality tasks).
    -   **Embeddings**: `text-embedding-3-small` (or similar) for generating vector representations of notes and resumes.

---

## 3. Directory Structure Deep Dive

### `root`
-   **`prisma/schema.prisma`**: The **Source of Truth** for the data model. Defines all tables and relationships.
-   **`supabase/`**:
    -   **`functions/`**: Contains Deno-based Edge Functions.
        -   `academic-ai/`: Handles chat logic, maintaining context and personality.
        -   `generate-flashcards/`: Converts notes into Q&A pairs using LLMs.
    -   `*.sql`: Migration and fix scripts (e.g., `debug_and_fix_rls.sql`).
-   **`src/app/`**: The file-system based router.
    -   Each folder corresponds to a route (e.g., `src/app/feed/page.tsx` -> `domain.com/feed`).
    -   `layout.tsx`: Wraps pages with providers (Theme, Auth, QueryClient) and global UI (Sidebar).
    -   `auth/`: Handles `callback` routes for OAuth.
-   **`src/components/`**:
    -   **`ui/`**: Reusable primitives (Buttons, Dialogs, Inputs).
    -   **`feed/`**: Specifics for the social wall (PostCard, SharePostBox).
    -   **`academic/`**: Chat interfaces, resource grids.
    -   **`career/`**: Resume uploaders, analysis charts.
    -   **`dashboard/`**: Widgets for the main user landing.
    -   **`layout/`**: The `Sidebar`, `Navbar`, and `UserNav`.
-   **`src/hooks/`**: Custom React hooks (e.g., `useUserUniversity` to fetch context).
-   **`src/lib/`**: Utilities (`utils.ts` for `cn` class merging, Supabase client initialization).

---

## 4. Comprehensive Database Schema Analysis

The database is normalized and relationally dense. Here are the core data domains:

### **A. Identity & Access (`Profile`)**
The `Profile` table is the heart of the user system, linked 1:1 with `auth.users`.
-   **Key Fields**: `role` (STUDENT, FACULTY, ADMIN), `universityId` (links to `University`), `reputationPoints`.
-   **Security**: RLS likely policies restrict users to editing only their own profile.

### **B. Social Graph (`Post`, `Comment`, `Like`)**
-   **`Post`**: Central content unit.
    -   `scope`: `CAMPUS` (internal) vs `UNIVERSE` (global). This is a critical architectural decision for data segregation.
    -   `type`: TEXT, IMAGE, VIDEO, LINK.
-   **`Friendship`**: Models bidirectional relationships (`requester` vs `addressee`) with statuses (PENDING, ACCEPTED).

### **C. Institutional Structure (`University`, `Course`)**
-   **`University`**: Functions as a "tenant". Has configuration patterns like `studentIdPattern` (regex for email validation).
-   **`Course`**: Linked to University. Acts as a container for `Resources` and `StudyGroups`.
-   **`StudyGroup`**: Small clusters of students. Can be linked to a specific `Course`.

### **D. Intelligence & Resources (`Resource`, `ResourceEmbedding`)**
-   **`Resource`**: Notes, papers, assignments uploaded by users.
-   **`ResourceEmbedding`**: Stores the **vector** (1536 dimensions) of the resource text. This enables "Semantic Search" — finding a document by meaning rather than just keyword.

### **E. Marketplace & Mobility (`MarketplaceListing`, `RideOffer`)**
-   **`MarketplaceListing`**: Classifieds with status (ACTIVE, SOLD) and types (BUY, SELL).
-   **`RideOffer`**: Carpooling logic. Connects `driver` to `passenger` via `RideRequest`.

### **F. AI & Wellness (`AcademicAIChat`, `MoodLog`)**
-   **`AcademicAIChat`**: Persists chat history with the AI tutor.
-   **`MoodLog`**: Time-series data for wellness tracking. Stores mood score (1-10) and notes.

---

## 5. Feature Ecosystem Breakdown

### 🎓 **Academic AI (`/academic`)**
-   **Goal**: 24/7 Personal Tutor.
-   **Tech**: Uses `academic-ai` Edge Function. Renders markdown/code blocks.
-   **Key Components**: `ChatInterface.tsx`, `ContextSelector.tsx` (switch between "Coding Mentor" vs "Writing Assistant").
-   **Data**: Reads from `AcademicAIChat` and `Resource` tables.

### 💼 **Career Center (`/career`)**
-   **Goal**: Employability booster.
-   **Tech**: PDF polling/parsing. Probably uses an external service or edge function to extract text from resumes and score them against job descriptions.
-   **Key Components**: `ResumeUploader.tsx`, `AnalysisDashboard.tsx` (visualizing ATS scores).

### 🧘 **Wellness & Travel (`/wellness`, `/travel`)**
-   **Goal**: Student well-being and logistics.
-   **Wellness**: Tracks trends over time. Uses `recharts` for visualization (`TrendChart.tsx`).
-   **Travel**: A mini-Uber for campus. `RideFinder.tsx` likely uses simple geospatial filtering or just list-based matching for now.

### 💬 **Messages & Community (`/messages`, `/forums`)**
-   **Messages**: Direct realtime chat.
-   **Forums**: **Anonymous** by design. The database stores the `authorId` for safety/moderation, but the UI component `AnonymousPostComposer.tsx` flags the content to hide identity from public view.

---

## 6. Security & Authorization Model

1.  **Row Level Security (RLS)**:
    -   This is **mandatory**. No client can query the DB without an RLS policy.
    -   Policies typically follow the pattern:
        -   `SELECT`: "Public if scope is UNIVERSE or universityId matches user's university."
        -   `INSERT`: "Only authenticated users."
        -   `UPDATE/DELETE`: "Only the author of the record."
2.  **Authentication**:
    -   JWTs travel with every request.
    -   Middlewares in Next.js (`middleware.ts`) protect `/dashboard` and other private routes, redirecting unauthenticated traffic to `/login`.

---

## 7. Development & Deployment

-   **Environment Variables**:
    -   `NEXT_PUBLIC_SUPABASE_URL`: API Endpoint.
    -   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public key for client-side ops.
    -   `DATABASE_URL`: Transaction pooler connection string for Prisma.
    -   `DIRECT_URL`: Direct connection string for migrations.
-   **Scripts**:
    -   `npm run dev`: Starts local Next.js server.
    -   `npx prisma push`: Updates remote DB schema.
    -   `npx prisma studio`: GUI to view DB data.
-   **Edge Function Deployment**:
    -   `supabase functions deploy [function_name]`.

---

## 8. Current Strengths & Future Potential

**Strengths**:
-   **Holistic**: It doesn't just do one thing; it captures the entire student lifecycle.
-   **Modern**: The stack is bleeding-edge (App Router + Supabase + Shadcn).
-   **Scalable**: The "University as Tenant" data model allows easy onboarding of new campuses.

**Potential**:
-   **Gamification**: The `reputationPoints` field in `Profile` suggests a future karma/reward system.
-   **Alumni Network**: Explicit roles for Alumni create a bridge for mentorship that is rarely seen in student apps.
-   **Local Commerce**: The marketplace could evolve into a campus-specific transaction hub.

---

*Verified by Antigravity Agent Analysis.*

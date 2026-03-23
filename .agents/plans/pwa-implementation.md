# Feature: Convert UniVerse to Progressive Web App (PWA)

**⚠️ CRITICAL UPDATE - Research Verified 2025/2026:**

The original plan had several issues. Based on extensive research:
1. **next-pwa is deprecated** - Original package not maintained since 2024
2. **Serwist needs webpack** - Required for dev testing, not Turbopack
3. **Native Next.js PWA exists** - Zero dependencies approach works
4. **Middleware can block PWA** - Need to allow manifest/sw.js files

---

## Feature Description

Convert UniVerse to a Progressive Web App with installability and optional offline support. Two approaches available:

**Approach A (Simple - Recommended for first phase):**
- Zero dependencies
- Manifest for installability
- Basic service worker for caching
- No offline data sync

**Approach B (Advanced):**
- Serwist package for full offline support
- Advanced caching strategies
- IndexedDB for offline data

**This plan implements Approach A first, with notes on upgrading to Approach B.**

## User Story

As a university student using UniVerse on mobile, I want to install the app on my home screen so that I can access it quickly without opening a browser, even with basic offline viewing capabilities.

---

## Problem Statement

UniVerse is currently a responsive web app requiring internet for all operations. Students need:
- **Installability** - Add to home screen for quick access
- **App-like experience** - No browser chrome when installed
- **Basic offline** - View cached content in poor connectivity areas

---

## Solution Statement

Implement PWA using Next.js 16 native capabilities (zero dependencies):

1. Create `src/app/manifest.ts` - App metadata and icons
2. Create `public/sw.js` - Basic service worker for static asset caching
3. Update `src/app/layout.tsx` - Register SW and add PWA metadata
4. Generate icon assets
5. Handle middleware blocking (if applicable)

---

## Feature Metadata

**Feature Type**: New Capability  
**Estimated Complexity**: Low (Approach A) / Medium (Approach B)  
**Primary Systems Affected**:
- `src/app/manifest.ts` - New file
- `public/sw.js` - New file  
- `src/app/layout.tsx` - Update metadata
- `src/middleware.ts` - May need PWA file whitelist
- `public/icons/` - New directory with icons

**Dependencies**: None for Approach A (recommended)

---

## CONTEXT REFERENCES

### Relevant Codebase Files YOU MUST READ BEFORE IMPLEMENTING!

- `src/app/layout.tsx` - Root layout, needs metadata + SW registration
- `src/middleware.ts` - Check if exists, may block PWA files
- `next.config.mjs` - Current config (NO changes needed for Approach A)

### New Files to Create

- `src/app/manifest.ts` - PWA manifest (App Router)
- `public/sw.js` - Service worker for caching
- `public/icons/icon-192x192.png` - App icon 192px
- `public/icons/icon-512x512.png` - App icon 512px  
- `public/icons/icon-512x512.maskable.png` - Maskable icon

### Documentation YOU SHOULD READ

- [Next.js PWA Official Docs](https://nextjs.org/docs/app/guides/progressive-web-apps)
  - Why: Official 2025/2026 guidance, manifest.ts pattern
- [Next.js manifest.ts Reference](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest)
  - Why: TypeScript types for manifest

---

## STEP-BY-STEP TASKS

### Phase 1: Manifest Setup

#### 1. CREATE src/app/manifest.ts

```typescript
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UniVerse - Your Campus Platform',
    short_name: 'UniVerse',
    description: 'Your unified campus platform for social, academic, and career tools',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#6366f1',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    categories: ['education', 'social networking'],
  };
}
```

**GOTCHA**: Icons path is `/icons/` (not `/public/icons/`) - served from public root

#### 2. UPDATE src/app/layout.tsx metadata

Add to existing metadata export:
```typescript
appleWebApp: {
  capable: true,
  statusBarStyle: 'default',
  title: 'UniVerse',
},
```

### Phase 2: Service Worker

#### 3. CREATE public/sw.js

```javascript
const CACHE_NAME = 'universe-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Don't cache API/auth requests
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('/auth/') ||
    event.request.url.includes('/_next/')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(event.request);
      })
  );
});
```

**GOTCHA**: 
- Don't cache API routes - breaks authentication
- Don't cache Next.js internal routes (`/_next/`)
- This is basic caching, not full offline support

#### 4. REGISTER service worker in layout.tsx

Add at bottom of layout.tsx (before closing body):
```typescript
<Script
  id="register-sw"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js');
        });
      }
    `,
  }}
/>
```

### Phase 3: Icon Assets

#### 5. GENERATE PWA icons

Create directory: `mkdir -p public/icons`

Generate from `public/universe_logo.png`:
- `public/icons/icon-192x192.png` (192x192)
- `public/icons/icon-512x512.png` (512x512)  
- `public/icons/icon-512x512.maskable.png` (512x512, transparent bg)

**TOOL**: Use https://www.pwa-builder.com/ or similar

### Phase 4: Middleware Check (If applicable)

#### 6. CHECK and UPDATE src/middleware.ts

If middleware exists, ensure it allows PWA files:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Allow PWA critical files
  const pwaFiles = ['/manifest.json', '/sw.js', '/icons/'];
  if (pwaFiles.some(file => url.pathname.startsWith(file))) {
    return NextResponse.next();
  }
  
  // ... rest of middleware
}
```

**GOTCHA**: Without this, manifest.json and sw.js may be blocked, breaking PWA!

---

## VALIDATION COMMANDS

```bash
# Build the app
npm run build

# Start production server
npm run start

# Check in Chrome:
# 1. Open DevTools > Application
# 2. Check Manifest - should show UniVerse details
# 3. Check Service Workers - should show registered
```

---

## ACCEPTANCE CRITERIA

- [ ] Manifest loads at /manifest.json or /manifest.webmanifest
- [ ] Service worker registers successfully
- [ ] "Add to Home Screen" available in browser
- [ ] Icons display in browser's app icon
- [ ] Build completes without errors

---

## UPGRADING TO APPROACH B (Full Offline)

If later needed, add Serwist:

1. Install: `npm install @serwist/next`
2. Update next.config.mjs with Serwist config
3. Add src/sw.ts with advanced caching
4. Use `npm run build -- --webpack` for testing
5. Add SERWIST_SUPPRESS_TURBOPACK_WARNING=1 in .env

---

## NOTES

**Why Approach A first?**
- Zero dependencies = less maintenance
- Installability covers 80% of user needs
- Full offline requires significantly more work
- Can always upgrade later

**UniVerse-specific considerations:**
- Auth pages shouldn't be cached
- Real-time features (messages) need network
- Consider which pages benefit most from caching
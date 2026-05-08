'use client';

import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Browser-side auth user cache.
//
// Why this exists: Supabase's auth client serializes getUser/getSession calls
// through a navigator lock to coordinate token refreshes. When many components
// (Header, MobileNav, NotificationCenter, FriendRequestsCenter, page effects,
// etc.) all call supabase.auth.getUser() on first mount, they contend for that
// lock and the runtime emits "Lock ... was released because another request
// stole it" warnings.
//
// This helper deduplicates concurrent callers — the first call kicks off one
// real getUser(), every other caller awaits the same promise, and the result
// is cached for subsequent synchronous-feeling reads. Auth state changes
// invalidate the cache.

let cachedUser: User | null | undefined = undefined;
let pending: Promise<User | null> | null = null;

// Set up the auth-state listener exactly once when this module is first
// imported on the client. Server-side imports are no-ops (the supabase
// browser client's onAuthStateChange just won't fire anything).
let listenerAttached = false;
function attachListener() {
  if (listenerAttached) return;
  listenerAttached = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUser = session?.user ?? null;
    // Drop any in-flight promise — its result may be stale relative to the
    // new session.
    pending = null;
  });
}

/**
 * Get the current Supabase user without contending for the auth lock on
 * every call. Concurrent calls share a single in-flight getUser(); subsequent
 * calls return the cached value.
 */
export async function getCachedUser(): Promise<User | null> {
  if (typeof window !== 'undefined') attachListener();
  if (cachedUser !== undefined) return cachedUser;
  if (pending) return pending;

  pending = supabase.auth.getUser().then(({ data }) => {
    cachedUser = data.user ?? null;
    pending = null;
    return cachedUser;
  }).catch((err) => {
    pending = null;
    throw err;
  });
  return pending;
}

/**
 * Synchronous read — returns undefined if the user hasn't been resolved yet.
 * Useful for places that already have an async path and just want to skip a
 * round-trip when the value is already known.
 */
export function getCachedUserSync(): User | null | undefined {
  return cachedUser;
}

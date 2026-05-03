/**
 * Lightweight first-party analytics for UniVerse.
 *
 * - Fire-and-forget. Never blocks the UI.
 * - Anonymous sessionId stored in sessionStorage; resets each browser session.
 * - Does NOT capture IP. Does capture path + user agent.
 * - Tables (Analytics_PageView, Analytics_Event) have RLS that lets anyone
 *   INSERT and only platform admins SELECT.
 *
 * See audit/fixes/09-analytics-tables.sql for the schema.
 */

import { supabase } from "./supabase";

const SESSION_KEY = "uv_session_id";

function isBrowser(): boolean {
	return typeof window !== "undefined";
}

function getSessionId(): string {
	if (!isBrowser()) return "ssr";
	let id = window.sessionStorage.getItem(SESSION_KEY);
	if (!id) {
		// Generate a 24-char id; not cryptographically random, just unique enough
		id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
		try {
			window.sessionStorage.setItem(SESSION_KEY, id);
		} catch {
			// sessionStorage may be blocked (private mode, embedded contexts) — fall through
		}
	}
	return id;
}

async function getUserContext(): Promise<{ userId: string | null; universityId: string | null }> {
	if (!isBrowser()) return { userId: null, universityId: null };
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return { userId: null, universityId: null };
		const { data: profile } = await supabase
			.from("Profile")
			.select("universityId")
			.eq("id", user.id)
			.maybeSingle();
		return { userId: user.id, universityId: profile?.universityId ?? null };
	} catch {
		return { userId: null, universityId: null };
	}
}

/**
 * Record a page view. Called automatically by AnalyticsTracker on route
 * changes; rarely needed manually.
 */
export async function trackPageView(path: string, referrer: string | null = null): Promise<void> {
	if (!isBrowser()) return;
	try {
		const sessionId = getSessionId();
		const { userId, universityId } = await getUserContext();
		await supabase.from("Analytics_PageView").insert({
			userId,
			sessionId,
			path: path.slice(0, 500),
			referrer: referrer ? referrer.slice(0, 500) : null,
			userAgent: navigator.userAgent.slice(0, 500),
			universityId,
		});
	} catch (err) {
		// Never let analytics break the UI — swallow.
		if (process.env.NODE_ENV !== "production") console.warn("trackPageView failed:", err);
	}
}

/**
 * Record a custom event. Use for clicks, form submissions, errors users hit, etc.
 *
 * @example
 *   track("click_resume_upload");
 *   track("submit_post", { scope: "CAMPUS", hasImage: true });
 */
export async function track(eventName: string, properties?: Record<string, unknown>): Promise<void> {
	if (!isBrowser()) return;
	try {
		const sessionId = getSessionId();
		const { userId, universityId } = await getUserContext();
		await supabase.from("Analytics_Event").insert({
			userId,
			sessionId,
			eventName: eventName.slice(0, 100),
			properties: properties ?? null,
			path: window.location.pathname.slice(0, 500),
			universityId,
		});
	} catch (err) {
		if (process.env.NODE_ENV !== "production") console.warn(`track(${eventName}) failed:`, err);
	}
}

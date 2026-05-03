"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

/**
 * Mounts at the root layout. Fires a page view on every client-side route
 * change. The first page load also fires once.
 *
 * Skips:
 *   - The /admin/analytics page itself (avoids feedback loop in the dashboard)
 *   - The /api/* paths (those won't render this anyway, but defensive)
 */
export function AnalyticsTracker() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const lastTrackedRef = useRef<string | null>(null);

	useEffect(() => {
		if (!pathname) return;

		// Don't track the analytics dashboard itself
		if (pathname.startsWith("/admin/analytics")) return;

		const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

		// Avoid duplicate fire if pathname/searchParams effectively unchanged
		if (lastTrackedRef.current === url) return;
		lastTrackedRef.current = url;

		// Reset referrer on internal navigation; only first hit gets document.referrer
		const referrer = lastTrackedRef.current === url && document.referrer ? document.referrer : document.referrer || null;

		trackPageView(url, referrer);
	}, [pathname, searchParams]);

	return null;
}

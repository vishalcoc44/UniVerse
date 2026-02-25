'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress
NProgress.configure({
	showSpinner: false,
	trickleSpeed: 200,
	minimum: 0.08
});

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	useEffect(() => {
		// This runs whenever pathname or searchParams change
		// We finish the progress when the route change is "complete"
		NProgress.done();

		return () => {
			// Small delay to start progress on the NEXT transition
			// Note: Next.js doesn't have a built-in "onRouteChangeStart" in App Router
			// but we can trigger it on link clicks or use a proxy for router.push
		};
	}, [pathname, searchParams]);

	return <>{children}</>;
}

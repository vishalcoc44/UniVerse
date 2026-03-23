'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const MIN_DISPLAY_MS = 1000; // minimum time the bar stays visible
const MAX_LOADING_MS = 8000; // fail-safe: force complete if route completion signal is missed

export function TopLoader() {
	const [progress, setProgress] = useState(0);
	const [visible, setVisible] = useState(false);
	const loadingRef = useRef(false);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const startTimeRef = useRef<number>(0);
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const startLoading = useCallback(() => {
		if (loadingRef.current) return;
		loadingRef.current = true;
		startTimeRef.current = Date.now();
		setVisible(true);
		setProgress(0);

		if (maxTimerRef.current) {
			clearTimeout(maxTimerRef.current);
			maxTimerRef.current = null;
		}

		maxTimerRef.current = setTimeout(() => {
			if (!loadingRef.current) return;
			loadingRef.current = false;

			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}

			setProgress(100);
			setTimeout(() => {
				setVisible(false);
				setProgress(0);
			}, 400);
		}, MAX_LOADING_MS);

		// Animate progress
		timerRef.current = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 90) return 90;
				return prev + Math.random() * 12;
			});
		}, 200);
	}, []);

	const finishBar = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}

		if (maxTimerRef.current) {
			clearTimeout(maxTimerRef.current);
			maxTimerRef.current = null;
		}

		setProgress(100);
		setTimeout(() => {
			setVisible(false);
			setProgress(0);
		}, 400);
	}, []);

	const completeLoading = useCallback(() => {
		if (!loadingRef.current) return;
		loadingRef.current = false;

		const elapsed = Date.now() - startTimeRef.current;
		const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

		// Wait until at least MIN_DISPLAY_MS has passed before finishing
		setTimeout(() => finishBar(), remaining);
	}, [finishBar]);

	// Complete loading when route/search changes (new page loaded)
	useEffect(() => {
		completeLoading();
	}, [pathname, searchParams, completeLoading]);

	// Intercept clicks on internal links
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const link = target.closest('a[href]');

			if (link) {
				const href = link.getAttribute('href');
				const currentRoute = `${window.location.pathname}${window.location.search}`;
				if (href && href.startsWith('/') && href !== currentRoute && !href.startsWith('#')) {
					startLoading();
				}
			}
		};

		document.addEventListener('click', handleClick, true);
		return () => document.removeEventListener('click', handleClick, true);
	}, [pathname, startLoading]);

	// Intercept history.pushState but defer state update to avoid useInsertionEffect conflict
	useEffect(() => {
		const originalPushState = history.pushState.bind(history);

		history.pushState = function (...args) {
			const nextUrlValue = args[2];
			const nextUrl = nextUrlValue != null ? new URL(String(nextUrlValue), window.location.href) : null;
			const currentRoute = `${window.location.pathname}${window.location.search}`;
			const nextRoute = nextUrl ? `${nextUrl.pathname}${nextUrl.search}` : currentRoute;

			if (nextRoute !== currentRoute) {
				// Defer the loading trigger to next macrotask to avoid
				// "useInsertionEffect must not schedule updates" error
				setTimeout(() => startLoading(), 0);
			}
			return originalPushState(...args);
		};

		const handlePopState = () => {
			startLoading();
		};

		window.addEventListener('popstate', handlePopState);

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}

			if (maxTimerRef.current) {
				clearTimeout(maxTimerRef.current);
				maxTimerRef.current = null;
			}

			history.pushState = originalPushState;
			window.removeEventListener('popstate', handlePopState);
		};
	}, [startLoading]);

	if (!visible) return null;

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				height: '3px',
				zIndex: 2147483647,
				pointerEvents: 'none',
			}}
		>
			<div
				style={{
					height: '100%',
					width: `${progress}%`,
					background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)',
					backgroundSize: '200% 100%',
					transition: progress === 100 ? 'width 200ms ease-out, opacity 300ms ease-out' : 'width 400ms ease',
					opacity: progress === 100 ? 0 : 1,
					borderRadius: '0 2px 2px 0',
					boxShadow: '0 0 10px rgba(59, 130, 246, 0.7), 0 0 5px rgba(139, 92, 246, 0.5)',
				}}
			/>
		</div>
	);
}

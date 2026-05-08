'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';

export function PWAInstallPrompt() {
	const [isVisible, setIsVisible] = useState(false);
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const pathname = usePathname();

	const isIOS = useMemo(() => {
		if (typeof navigator === 'undefined') return false;
		return /iPad|iPhone|iPod/.test(navigator.userAgent);
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const dismissed = window.localStorage.getItem(DISMISS_KEY) === '1';
		const isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as Navigator & { standalone?: boolean }).standalone === true;

		if (dismissed || isStandalone) return;

		if (isIOS) {
			setIsVisible(true);
			return;
		}

		const fallbackTimer = window.setTimeout(() => {
			setIsVisible(true);
		}, 5000);

		const onBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			setDeferredPrompt(event as BeforeInstallPromptEvent);
			setIsVisible(true);
		};

		window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

		return () => {
			window.clearTimeout(fallbackTimer);
			window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
		};
	}, [isIOS]);

	const dismiss = () => {
		if (typeof window !== 'undefined') {
			window.localStorage.setItem(DISMISS_KEY, '1');
		}
		setIsVisible(false);
	};

	const install = async () => {
		if (!deferredPrompt) return;
		await deferredPrompt.prompt();
		const choice = await deferredPrompt.userChoice;
		if (choice.outcome === 'accepted') {
			setIsVisible(false);
		}
		setDeferredPrompt(null);
	};

	const publicInstallRoutes = ['/', '/auth', '/signup', '/request-university'];
	if (!publicInstallRoutes.includes(pathname)) return null;

	if (!isVisible) return null;

	return (
		<div
			className="fixed left-1/2 -translate-x-1/2 bottom-3 sm:bottom-6 z-50 w-[calc(100vw-1rem)] sm:w-auto sm:min-w-[420px] sm:max-w-[520px] rounded-2xl border border-border bg-background/95 p-4 sm:p-5 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/85 max-h-[calc(100vh-1.5rem)] overflow-y-auto"
			role="dialog"
			aria-label="Install UniVerse app"
		>
			<div className="flex items-start gap-3 sm:gap-4">
				<div className="shrink-0 h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
					{isIOS ? <Share className="h-5 w-5 sm:h-6 sm:w-6" /> : <Download className="h-5 w-5 sm:h-6 sm:w-6" />}
				</div>

				<div className="flex-1 min-w-0 space-y-1">
					<p className="text-base sm:text-lg font-bold leading-tight">Install UniVerse</p>
					{isIOS ? (
						<p className="text-xs sm:text-sm text-muted-foreground leading-snug">
							Tap <span className="font-semibold">Share</span> in Safari, then select <span className="font-semibold">Add to Home Screen</span>.
						</p>
					) : (
						<p className="text-xs sm:text-sm text-muted-foreground leading-snug">
							Get faster access from your home screen — works offline, no app store needed.
						</p>
					)}
				</div>

				<Button
					variant="ghost"
					size="icon"
					onClick={dismiss}
					aria-label="Dismiss install prompt"
					className="shrink-0 h-8 w-8 -mt-1 -mr-1 text-muted-foreground hover:text-foreground"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{!isIOS && deferredPrompt && (
				<div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2">
					<Button onClick={install} className="flex-1 h-10 sm:h-11 text-sm font-semibold gap-2">
						<Download className="h-4 w-4" />
						Install app
					</Button>
					<Button variant="outline" onClick={dismiss} className="h-10 sm:h-11 text-sm font-medium sm:w-auto">
						Not now
					</Button>
				</div>
			)}
			{!isIOS && !deferredPrompt && (
				<p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-snug">
					Open your browser menu and tap <span className="font-semibold">Add to Home screen</span>.
				</p>
			)}
		</div>
	);
}

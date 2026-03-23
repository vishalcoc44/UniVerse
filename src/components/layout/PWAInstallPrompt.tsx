'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';

export function PWAInstallPrompt() {
	const [isVisible, setIsVisible] = useState(false);
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

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

		const onBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			setDeferredPrompt(event as BeforeInstallPromptEvent);
			setIsVisible(true);
		};

		window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

		return () => {
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

	if (!isVisible) return null;

	return (
		<div className="fixed inset-x-4 bottom-4 z-50 rounded-lg border border-border bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
			<div className="flex items-start justify-between gap-3">
				<div className="space-y-1">
					<p className="text-sm font-semibold">Install UniVerse</p>
					{isIOS ? (
						<p className="text-xs text-muted-foreground">
							Tap Share in Safari, then select Add to Home Screen.
						</p>
					) : (
						<p className="text-xs text-muted-foreground">
							Install UniVerse for faster access from your home screen.
						</p>
					)}
				</div>
				<Button variant="ghost" size="sm" onClick={dismiss} aria-label="Dismiss install prompt">
					✕
				</Button>
			</div>
			{!isIOS && deferredPrompt && (
				<div className="mt-2">
					<Button size="sm" onClick={install}>Install app</Button>
				</div>
			)}
		</div>
	);
}

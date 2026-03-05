import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import "./globals.css";
import { Providers } from "@/components/providers";
import { TopLoader } from "@/components/layout/TopLoader";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'UniVerse',
	description: 'Your Campus Super App',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{
					__html: `
						(function () {
							var RETRY_KEY = '__chunk_retry_once__';
							var RETRY_PARAM = '__chunk_retry';

							function hasAlreadyRetried() {
								try {
									return sessionStorage.getItem(RETRY_KEY) === '1';
								} catch (_) {
									return false;
								}
							}

							function markRetried() {
								try {
									sessionStorage.setItem(RETRY_KEY, '1');
								} catch (_) {}
							}

							function clearRetried() {
								try {
									sessionStorage.removeItem(RETRY_KEY);
								} catch (_) {}
							}

							function hasRetryParam() {
								try {
									var url = new URL(window.location.href);
									return url.searchParams.has(RETRY_PARAM);
								} catch (_) {
									return false;
								}
							}

							function stripRetryParamFromUrl() {
								try {
									var url = new URL(window.location.href);
									if (!url.searchParams.has(RETRY_PARAM)) return;
									url.searchParams.delete(RETRY_PARAM);
									window.history.replaceState(window.history.state, '', url.toString());
								} catch (_) {}
							}

							function isChunkLoadErrorMessage(message) {
								if (!message) return false;
								return (
									message.indexOf('ChunkLoadError') !== -1 ||
									message.indexOf('Failed to load chunk') !== -1
								);
							}

							function retryWithCacheBust() {
								if (hasAlreadyRetried() || hasRetryParam()) return;
								markRetried();
								var url = new URL(window.location.href);
								url.searchParams.set(RETRY_PARAM, String(Date.now()));
								window.location.replace(url.toString());
							}

							window.addEventListener('load', function () {
								stripRetryParamFromUrl();
								clearRetried();
							});

							window.addEventListener('error', function (event) {
								var target = event && event.target;
								var src = target && target.src;
								if (typeof src === 'string' && src.indexOf('/_next/static/chunks/') !== -1) {
									retryWithCacheBust();
									return;
								}
								if (isChunkLoadErrorMessage(event && event.message)) {
									retryWithCacheBust();
								}
							}, true);

							window.addEventListener('unhandledrejection', function (event) {
								var reason = event && event.reason;
								var message = reason && (reason.message || String(reason));
								if (isChunkLoadErrorMessage(message)) {
									retryWithCacheBust();
								}
							});
						})();
					`
				}} />
			</head>
			<body className={inter.className}>
				<Providers>
					<TopLoader />
					{children}
				</Providers>
			</body>
		</html>
	);
}

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
						window.addEventListener('error', function(event) {
							if (event.message && (
								event.message.indexOf('ChunkLoadError') !== -1 || 
								event.message.indexOf('Loading chunk') !== -1 ||
								event.message.indexOf('Failed to load resource') !== -1
							)) {
								console.warn('ChunkLoadError detected in head, reloading page...', event.message);
								window.location.reload();
							}
						}, true);
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

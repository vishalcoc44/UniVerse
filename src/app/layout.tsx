import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import "./globals.css";
import { Providers } from "@/components/providers";
import { TopLoader } from "@/components/layout/TopLoader";
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'UniVerse',
	description: 'Your Campus Super App',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'default',
		title: 'UniVerse',
	},
};

export const viewport: Viewport = {
	themeColor: '#6366f1',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={inter.className}>
				<Providers>
					<TopLoader />
					{children}
				</Providers>
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
			</body>
		</html>
	);
}

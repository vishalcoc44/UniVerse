'use client'

import { useEffect } from 'react'

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		console.error('Page Error Boundary caught:', error)
	}, [error])

	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] p-4 text-center">
			<h2 className="text-2xl font-bold mb-4">Oops, something went wrong!</h2>
			<p className="text-muted-foreground mb-6 max-w-md">
				We encountered an error while loading this page. This might be due to a temporary connection issue or a new version of the app being deployed.
			</p>
			<div className="flex flex-gap-4 justify-center gap-4">
				<button
					onClick={() => reset()}
					className="px-4 py-2 border rounded-md hover:bg-accent transition-colors"
				>
					Try Again
				</button>
				<button
					onClick={() => window.location.reload()}
					className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
				>
					Refresh Page
				</button>
			</div>
		</div>
	)
}

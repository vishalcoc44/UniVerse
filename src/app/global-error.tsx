'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global Error Boundary caught:', error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Something went wrong!</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem', maxWidth: '28rem' }}>
            The application encountered an error. Please try refreshing the page.
          </p>
          <button
            onClick={() => reset()}
            style={{ padding: '0.5rem 1rem', background: '#000', color: '#fff', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}

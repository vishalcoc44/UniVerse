import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	})

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll()
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value, options }) =>
						request.cookies.set(name, value)
					)
					supabaseResponse = NextResponse.next({
						request,
					})
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options)
					)
				},
			},
		}
	)

	// Refresh auth token with a 3s timeout so a Supabase network hiccup
	// never blocks page/API requests.
	try {
		const timeout = new Promise<null>((_, reject) =>
			setTimeout(() => reject(new Error('Supabase auth timeout')), 3000)
		)
		await Promise.race([supabase.auth.getUser(), timeout])
	} catch (err: any) {
		// Log the issue but always proceed — don't let auth block the request.
		if (err?.message !== 'Supabase auth timeout') {
			console.error('Middleware: auth error:', err?.message ?? err)
		}
	}

	return supabaseResponse
}

export async function middleware(request: NextRequest) {
	// Skip auth session refresh for API routes — they handle auth independently.
	if (request.nextUrl.pathname.startsWith('/api/')) {
		return NextResponse.next({ request })
	}
	return await updateSession(request)
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
		 * Feel free to modify this pattern to include more paths.
		 */
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
}

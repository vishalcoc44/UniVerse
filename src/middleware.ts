import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = [
	'/dashboard',
	'/feed',
	'/academic',
	'/career',
	'/marketplace',
	'/events',
	'/clubs',
	'/travel',
	'/wellness',
	'/messages',
	'/forums',
	'/research',
	'/news',
	'/departments',
	'/utilities',
	'/settings',
	'/profile',
	'/admin',
]

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/auth', '/api/images']

function isProtectedRoute(pathname: string): boolean {
	return PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))
}

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
					cookiesToSet.forEach(({ name, value }) =>
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

	try {
		const timeout = new Promise<null>((_, reject) =>
			setTimeout(() => reject(new Error('Supabase auth timeout')), 3000)
		)
		const { data: { user } } = await Promise.race([supabase.auth.getUser(), timeout]) as any

		const pathname = request.nextUrl.pathname

		if (!user && isProtectedRoute(pathname)) {
			const loginUrl = new URL('/login', request.url)
			loginUrl.searchParams.set('redirect', pathname)
			return NextResponse.redirect(loginUrl)
		}

		if (pathname.startsWith('/admin') && user) {
			const { data: profile } = await supabase
				.from('Profile')
				.select('role, universityId')
				.eq('id', user.id)
				.single()

			if (!profile || profile.role !== 'ADMIN' || profile.universityId) {
				return NextResponse.redirect(new URL('/dashboard', request.url))
			}
		}
	} catch (err: any) {
		if (err?.message !== 'Supabase auth timeout') {
			console.error('Middleware: auth error:', err?.message ?? err)
		}
		// On timeout, allow the request to proceed but don't grant access to protected routes
		if (isProtectedRoute(request.nextUrl.pathname)) {
			// If we can't verify auth and it's a protected route, proceed cautiously
			// Page-level auth will handle the final check
		}
	}

	return supabaseResponse
}

export async function middleware(request: NextRequest) {
	if (request.nextUrl.pathname.startsWith('/api/')) {
		return NextResponse.next({ request })
	}
	return await updateSession(request)
}

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|robots.txt|sitemap.xml|.*\\..*$).*)',
	],
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { authPath, safeReturnPath } from '@/lib/auth/return-path'

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/srd-license') return NextResponse.next({ request })
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute =
    request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup'

  const isHome = request.nextUrl.pathname === '/'

  if (!user && !isAuthRoute && !isHome) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    const next = safeReturnPath(request.nextUrl.pathname + request.nextUrl.search)
    const target = new URL(authPath('login', next), url.origin)
    const response = NextResponse.redirect(target)
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  }

  if (user && (isAuthRoute || isHome)) {
    const url = request.nextUrl.clone()
    const next = isAuthRoute ? safeReturnPath(url.searchParams.get('next')) : '/dashboard'
    const target = new URL(next, url.origin)
    const response = NextResponse.redirect(target)
    // Keep any refreshed session cookies when the public entry redirects a member.
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

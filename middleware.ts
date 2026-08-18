import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 menit
const PROTECTED_PREFIXES = ['/admin']

async function getDefaultPathForUser(supabase: any, userId: string): Promise<string> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profile?.role === 'super_admin') return '/admin/super-admin'
    if (profile?.role === 'assessor') return '/admin/assessor'
    return '/admin/cabang'
  } catch {
    return '/admin/cabang'
  }
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  // 1. Jika TIDAK ADA session valid dan route terlindungi -> redirect ke /login
  if (!user) {
    if (isProtected) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // 2. Jika ADA session valid
  const sessionLoginAtStr = request.cookies.get('session_login_at')?.value
  const isProduction = process.env.NODE_ENV === 'production'

  // a & b. Jika cookie session_login_at TIDAK ADA (sesi lama / race condition) -> set baseline sekarang
  if (!sessionLoginAtStr) {
    response.cookies.set('session_login_at', Date.now().toString(), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isProduction,
    })

    if (isProtected) {
      const currentPath = pathname + request.nextUrl.search
      response.cookies.set('last_visited_path', currentPath, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      })
    }

    if (pathname === '/login' || pathname === '/') {
      let targetPath = request.cookies.get('last_visited_path')?.value
      if (!targetPath || targetPath === '/' || targetPath === '/login') {
        targetPath = await getDefaultPathForUser(supabase, user.id)
      }
      return NextResponse.redirect(new URL(targetPath, request.url))
    }

    return response
  }

  // c. Jika cookie session_login_at ADA -> hitung selisih waktu
  const sessionLoginAt = parseInt(sessionLoginAtStr, 10)
  const diff = Date.now() - sessionLoginAt

  // Jika selisih > SESSION_TIMEOUT_MS (Session Expired)
  if (isNaN(sessionLoginAt) || diff > SESSION_TIMEOUT_MS) {
    await supabase.auth.signOut()
    const redirectRes = NextResponse.redirect(new URL('/login?reason=session_expired', request.url))
    
    // Copy cookie clearance set by signOut
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie)
    })
    redirectRes.cookies.delete('session_login_at')
    redirectRes.cookies.delete('last_visited_path')
    return redirectRes
  }

  // Jika selisih <= SESSION_TIMEOUT_MS (Session Still Valid)
  if (isProtected) {
    const currentPath = pathname + request.nextUrl.search
    response.cookies.set('last_visited_path', currentPath, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isProduction,
    })
  }

  if (pathname === '/login' || pathname === '/') {
    let targetPath = request.cookies.get('last_visited_path')?.value
    if (!targetPath || targetPath === '/' || targetPath === '/login') {
      targetPath = await getDefaultPathForUser(supabase, user.id)
    }
    return NextResponse.redirect(new URL(targetPath, request.url))
  }

  return response
}

export const config = {
  matcher: ['/', '/login', '/admin/:path*'],
}

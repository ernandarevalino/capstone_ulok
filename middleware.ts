import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SESSION_TIMEOUT_MS = 60 * 60 * 1000 // 1 jam (3600000 ms)
const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7 // 7 hari dalam detik (604800 s)
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

  // 2. Jika ADA session valid (terautentikasi)
  const lastActivityAtStr = request.cookies.get('last_activity_at')?.value
  const isProduction = process.env.NODE_ENV === 'production'

  // Helper function untuk memproses Logout secara menyeluruh di Middleware
  const performLogout = async () => {
    await supabase.auth.signOut()
    const redirectRes = NextResponse.redirect(
      new URL('/login?reason=session_expired', request.url)
    )

    // Menyalin instruksi penghapusan/perubahan cookie hasil supabase.auth.signOut()
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie)
    })

    // Menghapus cookie token Supabase secara manual apabila masih tersisa
    request.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith('sb-') || cookie.name.includes('auth-token')) {
        redirectRes.cookies.delete(cookie.name)
      }
    })

    redirectRes.cookies.delete('last_activity_at')
    redirectRes.cookies.delete('last_visited_path')
    return redirectRes
  }

  // KONDISI 1: User Memiliki Session Supabase TETAPI cookie last_activity_at TIDAK ADA (undefined)
  // Asumsi: Sesi sudah terlalu lama atau anomali -> WAJIB LOGOUT
  if (!lastActivityAtStr) {
    return await performLogout()
  }

  // KONDISI 2: Cookie last_activity_at ADA -> Hitung selisih waktu
  const lastActivityAt = parseInt(lastActivityAtStr, 10)
  const isIdle = isNaN(lastActivityAt) || (Date.now() - lastActivityAt > SESSION_TIMEOUT_MS)

  // Jika isIdle bernilai true -> WAJIB LOGOUT
  if (isIdle) {
    return await performLogout()
  }

  // Jika selisih <= SESSION_TIMEOUT_MS (Sesi Masih Aktif) -> Perbarui timestamp last_activity_at dengan maxAge 7 Hari
  response.cookies.set('last_activity_at', Date.now().toString(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: isProduction,
    maxAge: SEVEN_DAYS_SECONDS,
  })

  const isRSC =
    request.headers.get('rsc') === '1' ||
    request.headers.has('next-router-state-tree') ||
    request.headers.has('next-url')

  if (isProtected && !isRSC) {
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
    const redirectRes = NextResponse.redirect(new URL(targetPath, request.url))
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectRes
  }

  return response
}

export const config = {
  matcher: ['/', '/login', '/admin/:path*'],
}

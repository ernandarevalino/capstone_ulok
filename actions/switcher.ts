'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export interface SavedAccount {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'admin_cabang' | 'assessor' | string
  avatar_url?: string | null
  nik?: string | null
  branch_name?: string | null
  last_activity_at: number
}

const REGISTRY_COOKIE_NAME = 'prisma_account_registry'
const SESSION_SLOT_PREFIX = 'prisma_sess_'
const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7
const SESSION_TIMEOUT_MS = 60 * 60 * 1000 // 1 jam

/**
 * Helper: Sanitasi & ekstrak email murni dari string (menghapus nama, kurung, atau spasi berlebih)
 */
function sanitizeEmail(input: string): string {
  if (!input) return ''
  let cleaned = String(input).trim()
  // Jika formatnya "Nama Lengkap (email@domain.com)", ambil di dalam kurung
  const match = cleaned.match(/\(([^)]+)\)/)
  if (match && match[1] && match[1].includes('@')) {
    cleaned = match[1].trim()
  }
  // Ambil hanya bagian email murni dari string menggunakan regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  const emailMatch = cleaned.match(emailRegex)
  if (emailMatch) {
    return emailMatch[0].toLowerCase()
  }
  return cleaned.toLowerCase()
}

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: isProduction,
    maxAge: SEVEN_DAYS_SECONDS,
  }
}

/**
 * Helper: Ambil daftar akun tersimpan dari cookie `prisma_account_registry`
 */
async function parseRegistryCookie(): Promise<SavedAccount[]> {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get(REGISTRY_COOKIE_NAME)?.value
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((acc: any) => ({
      id: String(acc.id || ''),
      email: sanitizeEmail(String(acc.email || '')),
      full_name: String(acc.full_name || 'Pengguna'),
      role: String(acc.role || 'admin_cabang'),
      avatar_url: acc.avatar_url ? String(acc.avatar_url) : null,
      nik: acc.nik ? String(acc.nik) : null,
      branch_name: acc.branch_name ? String(acc.branch_name) : null,
      last_activity_at: Number(acc.last_activity_at || Date.now()),
    }))
  } catch (err) {
    console.error('[parseRegistryCookie] Error parsing registry cookie:', err)
    return []
  }
}

/**
 * Helper: Simpan daftar akun registry ke cookie `prisma_account_registry`
 */
async function saveRegistryCookie(accounts: SavedAccount[]) {
  try {
    const cookieStore = await cookies()
    const sanitizedAccounts = accounts.map((acc) => ({
      id: String(acc.id),
      email: sanitizeEmail(String(acc.email)),
      full_name: String(acc.full_name || 'Pengguna'),
      role: String(acc.role || 'admin_cabang'),
      avatar_url: acc.avatar_url ? String(acc.avatar_url) : null,
      nik: acc.nik ? String(acc.nik) : null,
      branch_name: acc.branch_name ? String(acc.branch_name) : null,
      last_activity_at: Number(acc.last_activity_at || Date.now()),
    }))
    cookieStore.set(REGISTRY_COOKIE_NAME, JSON.stringify(sanitizedAccounts), getCookieOptions())
  } catch (err) {
    console.error('[saveRegistryCookie] Error saving registry cookie:', err)
  }
}

/**
 * Helper: Simpan token { access_token, refresh_token } milik userId ke cookie `prisma_sess_[userId]`
 */
async function saveUserSessionSlot(userId: string, session: { access_token: string; refresh_token: string }) {
  try {
    const cookieStore = await cookies()
    const payload = JSON.stringify({
      access_token: String(session.access_token || ''),
      refresh_token: String(session.refresh_token || ''),
    })
    cookieStore.set(`${SESSION_SLOT_PREFIX}${userId}`, payload, getCookieOptions())
  } catch (err) {
    console.error('[saveUserSessionSlot] Error setting cookie:', err)
  }
}

/**
 * Helper: Ambil token { access_token, refresh_token } milik userId dari cookie `prisma_sess_[userId]`
 */
async function getUserSessionSlot(userId: string): Promise<{ access_token: string; refresh_token: string } | null> {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get(`${SESSION_SLOT_PREFIX}${userId}`)?.value
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.access_token || !parsed.refresh_token) return null
    return {
      access_token: String(parsed.access_token),
      refresh_token: String(parsed.refresh_token),
    }
  } catch {
    return null
  }
}

/**
 * Helper: Hapus cookie session slot milik userId
 */
async function deleteUserSessionSlot(userId: string) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(`${SESSION_SLOT_PREFIX}${userId}`)
  } catch (err) {
    console.error('[deleteUserSessionSlot] Error deleting cookie:', err)
  }
}

/**
 * Helper: Dapatkan rute halaman utama berdasarkan role pengguna
 */
function getDefaultPathForRole(role: string): string {
  if (role === 'super_admin') return '/admin/super-admin'
  if (role === 'assessor') return '/admin/assessor'
  return '/admin/cabang'
}

// ==========================================
// 1. GET SAVED ACCOUNTS
// ==========================================
export async function getSavedAccounts() {
  try {
    const supabase = await createClient()
    const cookieStore = await cookies()

    // 1. Dapatkan user aktif dari Supabase session saat ini
    const { data: { user: activeUser } } = await supabase.auth.getUser()
    const { data: { session: activeSession } } = await supabase.auth.getSession()

    let accounts = await parseRegistryCookie()

    if (activeUser && activeSession) {
      // Pastikan user aktif tercatat di registry
      const existingIdx = accounts.findIndex((acc) => acc.id === activeUser.id)

      // Ambil profile terbaru dari database
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          id, full_name, role, nik, avatar_url, branch_id,
          branches ( nama_cabang )
        `)
        .eq('id', activeUser.id)
        .maybeSingle()

      const currentAccountData: SavedAccount = {
        id: String(activeUser.id),
        email: sanitizeEmail(activeUser.email || ''),
        full_name: String(profile?.full_name || 'Pengguna'),
        role: String(profile?.role || 'admin_cabang'),
        avatar_url: profile?.avatar_url ? String(profile.avatar_url) : null,
        nik: profile?.nik ? String(profile.nik) : null,
        branch_name: (profile?.branches as any)?.nama_cabang ? String((profile?.branches as any)?.nama_cabang) : null,
        last_activity_at: Number(Date.now()),
      }

      if (existingIdx >= 0) {
        // Update data visual & timestamp
        accounts[existingIdx] = {
          ...accounts[existingIdx],
          ...currentAccountData,
          last_activity_at: Number(Date.now()),
        }
      } else {
        // Tambahkan user aktif ke registry (maks 3)
        if (accounts.length >= 3) {
          // Hapus akun paling lama inaktif jika sudah penuh
          accounts.sort((a, b) => b.last_activity_at - a.last_activity_at)
          accounts = accounts.slice(0, 2)
        }
        accounts.unshift(currentAccountData)
      }

      // Simpan juga session slot untuk user aktif
      await saveUserSessionSlot(activeUser.id, {
        access_token: String(activeSession.access_token),
        refresh_token: String(activeSession.refresh_token),
      })

      // Tulis ulang registry cookie
      await saveRegistryCookie(accounts)

      // Perbarui cookie last_activity_at
      try {
        cookieStore.set('last_activity_at', Date.now().toString(), getCookieOptions())
      } catch (cErr) {
        console.error('[getSavedAccounts] Error setting last_activity_at:', cErr)
      }
    }

    return {
      success: true,
      accounts: JSON.parse(JSON.stringify(accounts)),
      activeUserId: activeUser?.id ? String(activeUser.id) : null,
    }
  } catch (error: any) {
    console.error('[getSavedAccounts] Error:', error)
    return {
      success: false,
      error: typeof error === 'string' ? error : (error?.message ? String(error.message) : 'Gagal memuat akun tersimpan.'),
      accounts: [],
      activeUserId: null,
    }
  }
}

// ==========================================
// 2. ADD ACCOUNT (POPUP LOGIN)
// ==========================================
export async function addAccountAction(payload: FormData | { email?: string; password?: string }) {
  try {
    let rawEmail = ''
    let password = ''

    if (payload instanceof FormData) {
      rawEmail = (payload.get('email') as string) || ''
      password = (payload.get('password') as string) || ''
    } else if (typeof payload === 'object' && payload !== null) {
      rawEmail = ((payload as any).email as string) || ''
      password = ((payload as any).password as string) || ''
    }

    const cleanEmail = sanitizeEmail(rawEmail)

    if (!cleanEmail || !password) {
      return { success: false, error: 'Email murni dan password wajib diisi!' }
    }

    let accounts = await parseRegistryCookie()

    if (accounts.length >= 3) {
      return {
        success: false,
        error: 'Kapasitas maksimal 3 akun telah tercapai. Silakan hapus salah satu akun inaktif terlebih dahulu.',
      }
    }

    // A. Simpan sesi user aktif saat ini ke slot cookie-nya sendiri (menggunakan client awal)
    try {
      const initialSupabase = await createClient()
      const { data: { user: currentUser } } = await initialSupabase.auth.getUser()
      const { data: { session: currentSession } } = await initialSupabase.auth.getSession()

      if (currentUser && currentSession) {
        await saveUserSessionSlot(currentUser.id, {
          access_token: String(currentSession.access_token),
          refresh_token: String(currentSession.refresh_token),
        })
        const activeIdx = accounts.findIndex((a) => a.id === currentUser.id)
        if (activeIdx >= 0) {
          accounts[activeIdx].last_activity_at = Date.now()
        }
      }
    } catch (saveErr) {
      console.error('[addAccountAction] Error saving active session:', saveErr)
    }

    // B. Buat client Supabase baru yang bersih untuk melakukan signInWithPassword
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (authError || !authData || !authData.user || !authData.session) {
      return {
        success: false,
        error: authError?.message ? String(authError.message) : 'Gagal masuk. Periksa kembali email & password.',
      }
    }

    const newUser = authData.user
    const newSession = authData.session

    // C. Ambil profil user baru dari DB
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        id, full_name, role, nik, avatar_url, branch_id,
        branches ( nama_cabang )
      `)
      .eq('id', newUser.id)
      .maybeSingle()

    const newAccount: SavedAccount = {
      id: String(newUser.id),
      email: sanitizeEmail(newUser.email || cleanEmail),
      full_name: String(profile?.full_name || 'Pengguna'),
      role: String(profile?.role || 'admin_cabang'),
      avatar_url: profile?.avatar_url ? String(profile.avatar_url) : null,
      nik: profile?.nik ? String(profile.nik) : null,
      branch_name: (profile?.branches as any)?.nama_cabang ? String((profile?.branches as any)?.nama_cabang) : null,
      last_activity_at: Number(Date.now()),
    }

    // D. Simpan slot session akun baru & update registry
    await saveUserSessionSlot(newUser.id, {
      access_token: String(newSession.access_token),
      refresh_token: String(newSession.refresh_token),
    })

    // Filter jika akun sudah pernah tersimpan sebelumnya, lalu taruh di paling depan
    accounts = accounts.filter((a) => a.id !== newUser.id)
    accounts.unshift(newAccount)

    await saveRegistryCookie(accounts)

    // E. Set cookie last_activity_at & last_visited_path untuk sesi aktif baru
    const cookieStore = await cookies()
    const targetPath = getDefaultPathForRole(newAccount.role)
    try {
      cookieStore.set('last_activity_at', Date.now().toString(), getCookieOptions())
      cookieStore.set('last_visited_path', targetPath, getCookieOptions())
    } catch (cErr) {
      console.error('[addAccountAction] Error setting active cookies:', cErr)
    }

    return {
      success: true,
      targetPath: String(targetPath),
      role: String(newAccount.role),
      user: JSON.parse(JSON.stringify(newAccount)),
    }
  } catch (error: any) {
    console.error('[addAccountAction] Error:', error)
    return {
      success: false,
      error: typeof error === 'string' ? error : (error?.message ? String(error.message) : 'Terjadi kesalahan sistem saat menambah akun.'),
    }
  }
}

// ==========================================
// 3. REMOVE ACCOUNT (TRASH)
// ==========================================
export async function removeSavedAccountAction(targetUserId: string) {
  try {
    const cleanId = String(targetUserId || '')
    if (!cleanId) return { success: false, error: 'ID Akun tidak valid.' }

    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (currentUser && currentUser.id === cleanId) {
      return { success: false, error: 'Akun yang sedang aktif tidak dapat dihapus!' }
    }

    // 1. Hapus cookie slot session
    await deleteUserSessionSlot(cleanId)

    // 2. Filter registry cookie
    let accounts = await parseRegistryCookie()
    accounts = accounts.filter((acc) => acc.id !== cleanId)
    await saveRegistryCookie(accounts)

    return { success: true }
  } catch (error: any) {
    console.error('[removeSavedAccountAction] Error:', error)
    return {
      success: false,
      error: typeof error === 'string' ? error : (error?.message ? String(error.message) : 'Gagal menghapus akun.'),
    }
  }
}

// ==========================================
// 4. SWITCH ACCOUNT (SEAMLESS & RE-AUTH)
// ==========================================
export async function switchAccountAction(params: { targetUserId: string; password?: string }) {
  try {
    const targetUserId = String(params?.targetUserId || '')
    const password = params?.password ? String(params.password) : undefined

    if (!targetUserId) {
      return { success: false, error: 'ID Akun target tidak valid.' }
    }

    let accounts = await parseRegistryCookie()
    const targetAccount = accounts.find((a) => a.id === targetUserId)

    if (!targetAccount) {
      return { success: false, error: 'Data akun tidak ditemukan dalam sistem.' }
    }

    // Sanitasi email murni dari targetAccount
    const cleanEmail = sanitizeEmail(targetAccount.email)

    // 1. Cek apakah sesi kedaluwarsa (> 1 jam dari last_activity_at)
    const timeDiff = Date.now() - targetAccount.last_activity_at
    const isExpired = timeDiff > SESSION_TIMEOUT_MS

    // KONDISI A: Expired dan Password belum diisi -> Minta Re-Auth Password
    if (isExpired && !password) {
      return {
        success: false,
        requiresPassword: true,
        email: cleanEmail,
        fullName: String(targetAccount.full_name || ''),
        role: String(targetAccount.role || ''),
        message: 'Sesi akun ini telah kedaluwarsa (> 1 jam). Masukkan kata sandi untuk melanjutkan.',
      }
    }

    // 2. Buat client Supabase segar untuk operasi otentikasi
    const supabase = await createClient()

    // KONDISI B: Re-auth dengan Password
    if (password) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (authError || !authData || !authData.session) {
        return {
          success: false,
          requiresPassword: true,
          email: cleanEmail,
          fullName: String(targetAccount.full_name || ''),
          role: String(targetAccount.role || ''),
          error: authError?.message ? String(authError.message) : 'Kata sandi yang Anda masukkan salah. Silakan coba lagi.',
        }
      }

      // Re-auth berhasil -> Simpan slot session baru untuk targetUserId
      await saveUserSessionSlot(targetUserId, {
        access_token: String(authData.session.access_token),
        refresh_token: String(authData.session.refresh_token),
      })
    } else {
      // KONDISI C: Seamless Swap (< 1 jam) -> Memulihkan sesi dari cookie slot
      const savedSlot = await getUserSessionSlot(targetUserId)

      if (!savedSlot || !savedSlot.access_token || !savedSlot.refresh_token) {
        return {
          success: false,
          requiresPassword: true,
          email: cleanEmail,
          fullName: String(targetAccount.full_name || ''),
          role: String(targetAccount.role || ''),
          message: 'Sesi tersimpan tidak ditemukan. Silakan masukkan kata sandi.',
        }
      }

      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: String(savedSlot.access_token),
        refresh_token: String(savedSlot.refresh_token),
      })

      if (setSessionError) {
        return {
          success: false,
          requiresPassword: true,
          email: cleanEmail,
          fullName: String(targetAccount.full_name || ''),
          role: String(targetAccount.role || ''),
          message: 'Gagal memulihkan sesi. Silakan masukkan kata sandi kembali.',
        }
      }
    }

    // 3. Update timestamp & registry cookie
    const targetIdx = accounts.findIndex((a) => a.id === targetUserId)
    if (targetIdx >= 0) {
      accounts[targetIdx].email = cleanEmail
      accounts[targetIdx].last_activity_at = Date.now()
    }
    await saveRegistryCookie(accounts)

    // 4. Update cookie last_activity_at & last_visited_path untuk sesi aktif baru
    const cookieStore = await cookies()
    const targetPath = getDefaultPathForRole(targetAccount.role)
    const isProduction = process.env.NODE_ENV === 'production'

    try {
      cookieStore.set('last_activity_at', Date.now().toString(), {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
        maxAge: 60 * 60 * 24 * 7,
      })

      cookieStore.set('last_visited_path', targetPath, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      })
    } catch (cErr) {
      console.error('[switchAccountAction] Error setting active cookies:', cErr)
    }

    return {
      success: true,
      targetPath: String(targetPath),
      role: String(targetAccount.role || 'admin_cabang'),
    }
  } catch (error: any) {
    console.error('[switchAccountAction] Error:', error)
    return {
      success: false,
      error: typeof error === 'string' ? error : (error?.message ? String(error.message) : 'Terjadi kesalahan sistem saat switch akun.'),
    }
  }
}

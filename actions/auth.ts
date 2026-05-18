'use server'

import { createClient } from '@/utils/supabase/server'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi' }
  }

  try {
    const supabase = await createClient()

    // 1. Jalankan autentikasi di Supabase Auth server-side
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // 2. Ambil data role langsung di server (Aman & Bypass masalah delay cookie client)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single()

    if (profileError) {
      throw new Error(`Gagal memuat profil pengguna: ${profileError.message}`)
    }

    // Kembalikan status sukses beserta role-nya ke komponen frontend
    return { success: true, role: profile.role }
    
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
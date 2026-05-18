'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Ambil semua list usulan berdasarkan admin cabang yang login
export async function getUlokSubmissions() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const { data, error } = await supabase
      .from('ulok_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 2. Buat data usulan lokasi awal dari Pop-up modal
export async function createUlokSubmission(payload: {
  nama_lokasi: string
  jenis_badan_hukum: string
  nama_pemegang_hak: string
}) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const { data, error } = await supabase
      .from('ulok_submissions')
      .insert([
        {
          admin_id: user.id, // ID diambil langsung dari session server yang aman 100%
          nama_lokasi: payload.nama_lokasi,
          jenis_badan_hukum: payload.jenis_badan_hukum,
          nama_pemegang_hak: payload.nama_pemegang_hak,
          status: 'Draft'
        }
      ])
      .select()
      .single()

    if (error) throw error
    revalidatePath('/admin/cabang/usulan-lokasi')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 3. Ambil Detail Tunggal dari 1 data ULOK
export async function getUlokDetail(id: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('ulok_submissions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 4. Ambil list template checklist dari DB berdasarkan kriteria badan hukum
export async function getChecklistMaster(jenisBadanHukum: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('checklist_master')
      .select('*')
      .eq('jenis_badan_hukum', jenisBadanHukum)

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 5. Ambil file berkas yang sudah pernah diupload untuk lokasi ini
export async function getUploadedDocuments(ulokId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('ulok_id', ulokId)

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 6. Simpan / Update perubahan form (Section 1 & Section 2) ke database
export async function updateUlokSubmission(id: string, payload: any) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('ulok_submissions')
      .update({
        nama_lokasi: payload.nama_lokasi,
        nama_pemegang_hak: payload.nama_pemegang_hak,
        jenis_alas_hak: payload.jenis_alas_hak,
        no_sertifikat_alas_hak: payload.no_sertifikat_alas_hak,
        nama_sertifikat_alas_hak: payload.nama_sertifikat_alas_hak,
        bentuk_objek: payload.bentuk_objek,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
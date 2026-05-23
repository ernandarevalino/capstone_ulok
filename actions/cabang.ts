'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/* ========================================================================== */
/* #region MODUL MANAJEMEN USULAN LOKASI (ULOK) */
/* ========================================================================== */

/**
 * Mengambil seluruh daftar usulan lokasi (ULOK) yang diajukan oleh Admin Cabang yang sedang aktif.
 * Hasil query akan diurutkan berdasarkan waktu pembuatan terbaru.
 * * @returns Objek status operasi beserta array data usulan lokasi atau pesan kesalahan.
 */
export async function getUlokSubmissions() {
  try {
    const supabase = await createClient()
    
    // Validasi token sesi untuk memastikan identitas pengguna terautentikasi
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    // Melakukan query data dari tabel 'ulok_submissions'
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

/**
 * Membuat entitas data usulan lokasi (ULOK) baru pada tahap awal melalui modal/pop-up.
 * Status awal otomatis ditetapkan sebagai 'Draft'.
 * * @param payload - Objek berisi parameter nama_lokasi, jenis_badan_hukum, dan nama_pemegang_hak.
 * @returns Objek status operasi beserta rekaman data yang berhasil disimpan.
 */
export async function createUlokSubmission(payload: {
  nama_lokasi: string
  jenis_badan_hukum: string
  nama_pemegang_hak: string
}) {
  try {
    const supabase = await createClient()
    
    // Validasi token sesi guna mendapatkan ID pengguna secara aman di sisi server
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    // Menyisipkan data baru ke dalam tabel 'ulok_submissions'
    const { data, error } = await supabase
      .from('ulok_submissions')
      .insert([
        {
          admin_id: user.id, 
          nama_lokasi: payload.nama_lokasi,
          jenis_badan_hukum: payload.jenis_badan_hukum,
          nama_pemegang_hak: payload.nama_pemegang_hak,
          status: 'Draft'
        }
      ])
      .select()
      .single()

    if (error) throw error
    
    // Melakukan pembersihan cache (purge cache) pada rute navigasi terkait agar data antarmuka diperbarui secara realtime
    revalidatePath('/admin/cabang/usulan-lokasi')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Mengambil informasi detail tunggal dari satu berkas usulan lokasi berdasarkan unique identifier (ID).
 * * @param id - String UUID dari usulan lokasi terkait.
 * @returns Objek status operasi beserta data detail usulan lokasi.
 */
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

/**
 * Memuat master template checklist kelengkapan dokumen berdasarkan jenis badan hukum yang dipilih.
 * Digunakan sebagai acuan validasi berkas fisik maupun digital di tingkat cabang.
 * * @param jenisBadanHukum - Parameter string kategori badan hukum (misal: PT, CV, Perorangan).
 * @returns Objek status operasi beserta daftar master kriteria checklist.
 */
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

/**
 * Mengambil daftar berkas atau dokumen lampiran digital yang telah diunggah sebelumnya pada suatu usulan lokasi.
 * * @param ulokId - ID referensi usulan lokasi yang berelasi dengan tabel dokumen.
 * @returns Objek status operasi beserta array list dokumen pendukung.
 */
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

/**
 * Memperbarui struktur isian formulir usulan lokasi secara berkala (meliputi modifikasi isian Section 1 dan Section 2).
 * Fungsi ini mencatat waktu pembaruan terakhir secara otomatis melalui penanda ISO Timestamp.
 * * @param id - ID target berkas usulan lokasi yang akan diubah.
 * @param payload - Objek kumpulan data formulir baru hasil input pengguna.
 * @returns Objek status operasi sukses pembaruan data.
 */
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
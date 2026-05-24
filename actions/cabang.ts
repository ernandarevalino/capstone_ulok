'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/actions/superadmin' // Import fungsi notifikasi pusat

/* ========================================================================== */
/* #region MODUL MANAJEMEN USULAN LOKASI (ULOK) */
/* ========================================================================== */

/**
 * Mengambil seluruh daftar usulan lokasi (ULOK) yang diajukan oleh Admin Cabang yang sedang aktif.
 * Hasil query akan diurutkan berdasarkan waktu pembuatan terbaru.
 * @returns Objek status operasi beserta array data usulan lokasi atau pesan kesalahan.
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
 * Menghapus entitas data usulan lokasi (ULOK) berdasarkan ID.
 * @param id - String UUID dari usulan lokasi yang akan dihapus.
 * @returns Objek status operasi sukses atau gagal.
 */
export async function deleteUlokSubmission(id: string) {
  try {
    const supabase = await createClient()
    
    // Validasi token sesi memastikan pengguna terautentikasi
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    // Eksekusi penghapusan baris data di tabel 'ulok_submissions'
    const { error } = await supabase
      .from('ulok_submissions')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Revalidasi path agar data di client-side langsung sinkron terbaru
    revalidatePath('/admin/cabang/usulan-lokasi')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Membuat entitas data usulan lokasi (ULOK) baru pada tahap awal melalui modal/pop-up.
 * Status awal otomatis ditetapkan sebagai 'Draft'.
 * @param payload - Objek berisi parameter nama_lokasi, jenis_badan_hukum, dan nama_pemegang_hak.
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

    // =========================================================================
    // IMPLEMENTASI NOTIFIKASI PUSAT UNTUK SUPER ADMIN
    // =========================================================================
    try {
      // Ambil nama admin dan relasi nama cabang berdasarkan admin_id yang sedang aktif
      const { data: profileData } = await supabase
        .from('profiles')
        .select(`
          full_name,
          branches (
            nama_cabang
          )
        `)
        .eq('id', user.id)
        .single()

      if (profileData) {
        const adminName = profileData.full_name;
        // Gunakan optional chaining untuk mengantisipasi jika branch_id bernilai null
        const branchName = (profileData.branches as any)?.nama_cabang || 'Cabang Tidak Diketahui';

        // Pemicu otomatis log notifikasi ke sistem pusat superadmin
        await createNotification(
          'Usulan Lokasi (ULOK) Baru',
          `Admin ${adminName} dari ${branchName} telah menambahkan usulan lokasi baru: "${payload.nama_lokasi}".`
        );
      }
    } catch (notifErr) {
      // Catch blok internal agar jika notifikasi gagal, proses utama simpan ULOK tidak ikut gagal/gantung
      console.error("Gagal memicu notifikasi ULOK baru:", notifErr);
    }
    // =========================================================================
    
    // Melakukan pembersihan cache (purge cache) pada rute navigasi terkait agar data antarmuka diperbarui secara realtime
    revalidatePath('/admin/cabang/usulan-lokasi')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Mengambil informasi detail tunggal dari satu berkas usulan lokasi berdasarkan unique identifier (ID).
 * @param id - String UUID dari usulan lokasi terkait.
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
 * @param jenisBadanHukum - Parameter string kategori badan hukum (misal: PT, CV, Perorangan).
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
 * @param ulokId - ID referensi usulan lokasi yang berelasi dengan tabel dokumen.
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
 * Memperbarui struktur isian formulir usulan lokasi secara berkala.
 * Disesuaikan secara menyeluruh dengan SKEMA DATABASE ASLI (tanpa meta_isian).
 */
export async function updateUlokSubmission(id: string, payload: any) {
  try {
    const supabase = await createClient()
    
    // Mapping selektif agar kolom yang tidak diubah tidak tertimpa NULL
    const updateData: any = { updated_at: new Date().toISOString() }

    // Isian Data Dasar
    if (payload.nama_lokasi !== undefined) updateData.nama_lokasi = payload.nama_lokasi
    if (payload.nama_pemegang_hak !== undefined) updateData.nama_pemegang_hak = payload.nama_pemegang_hak
    if (payload.jenis_badan_hukum !== undefined) updateData.jenis_badan_hukum = payload.jenis_badan_hukum
    if (payload.alamat_koordinat !== undefined) updateData.alamat_koordinat = payload.alamat_koordinat
    if (payload.detail_alamat !== undefined) updateData.detail_alamat = payload.detail_alamat
    if (payload.status !== undefined) updateData.status = payload.status

    // Isian Dokumen Identitas & Pajak Dasar (Section 1)
    if (payload.jenis_identitas !== undefined) updateData.jenis_identitas = payload.jenis_identitas
    if (payload.nik_pemilik !== undefined) updateData.nik_pemilik = payload.nik_pemilik
    if (payload.nama_kitas !== undefined) updateData.nama_kitas = payload.nama_kitas
    if (payload.no_kk !== undefined) updateData.no_kk = payload.no_kk
    if (payload.no_buku_nikah !== undefined) updateData.no_buku_nikah = payload.no_buku_nikah
    
    // Dokumen Tambahan Pernikahan / Ganti Nama
    if (payload.nama_sebelum_ganti !== undefined) updateData.nama_sebelum_ganti = payload.nama_sebelum_ganti
    if (payload.nama_sesudah_ganti !== undefined) updateData.nama_sesudah_ganti = payload.nama_sesudah_ganti
    
    // Status Khusus Kepemilikan
    if (payload.no_surat_kematian !== undefined) updateData.no_surat_kematian = payload.no_surat_kematian
    
    // Alas Hak / Bukti Kepemilikan Lahan
    if (payload.jenis_alas_hak !== undefined) updateData.jenis_alas_hak = payload.jenis_alas_hak
    if (payload.no_sertifikat_alas_hak !== undefined) updateData.no_sertifikat_alas_hak = payload.no_sertifikat_alas_hak
    if (payload.nama_sertifikat_alas_hak !== undefined) updateData.nama_sertifikat_alas_hak = payload.nama_sertifikat_alas_hak
    if (payload.luas_sertifikat !== undefined) updateData.luas_sertifikat = payload.luas_sertifikat ? parseFloat(payload.luas_sertifikat) : null
    if (payload.masa_berlaku_sertifikat !== undefined) updateData.masa_berlaku_sertifikat = payload.masa_berlaku_sertifikat || null
    
    // AJB / Dokumen Tambahan
    if (payload.nama_ajb_lainnya !== undefined) updateData.nama_ajb_lainnya = payload.nama_ajb_lainnya
    if (payload.no_ajb_lainnya !== undefined) updateData.no_ajb_lainnya = payload.no_ajb_lainnya
    if (payload.luas_ajb_lainnya !== undefined) updateData.luas_ajb_lainnya = payload.luas_ajb_lainnya
    
    // Surat Kelurahan & Dokumen Proses Sertifikat
    if (payload.no_surat_kelurahan !== undefined) updateData.no_surat_kelurahan = payload.no_surat_kelurahan
    if (payload.tanggal_surat_kelurahan !== undefined) updateData.tanggal_surat_kelurahan = payload.tanggal_surat_kelurahan || null
    if (payload.tanggal_proses_sertifikat !== undefined) updateData.tanggal_proses_sertifikat = payload.tanggal_proses_sertifikat || null
    
    // Bentuk Objek & Status Jaminan Bank
    if (payload.bentuk_objek !== undefined) updateData.bentuk_objek = payload.bentuk_objek
    if (payload.dokumen_jaminan !== undefined) {
      updateData.dokumen_jaminan = payload.dokumen_jaminan === true || payload.dokumen_jaminan === "Ya";
    }
    if (payload.jaminan_bank_nama !== undefined) updateData.jaminan_bank_nama = payload.jaminan_bank_nama
    if (payload.jaminan_bank_no_surat !== undefined) updateData.jaminan_bank_no_surat = payload.jaminan_bank_no_surat
    if (payload.jaminan_bank_tanggal !== undefined) updateData.jaminan_bank_tanggal = payload.jaminan_bank_tanggal || null
    
    // Data Keterangan Tambahan
    if (payload.data_pribadi_tambahan !== undefined) updateData.data_pribadi_tambahan = payload.data_pribadi_tambahan

    const { data, error } = await supabase
      .from('ulok_submissions')
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    // Melakukan purge cache secara komprehensif pada semua rute form kelompok agar data realtime berlanjut
    revalidatePath('/admin/cabang/usulan-lokasi')
    revalidatePath(`/admin/cabang/usulan-lokasi/form/perorangan`)
    revalidatePath(`/admin/cabang/usulan-lokasi/form/perorangan/section1`)
    revalidatePath(`/admin/cabang/usulan-lokasi/form/perorangan/section2`)
    revalidatePath(`/admin/cabang/usulan-lokasi/form/badanhukum`)
    revalidatePath(`/admin/cabang/usulan-lokasi/form/badanhukum/section1`)
    revalidatePath(`/admin/cabang/usulan-lokasi/form/badanhukum/section2`)

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Mengunggah berkas lampiran digital fisik ke bucket storage 'dokumen-ulok'
 * dan menyimpannya secara otomatis ke dalam tabel 'documents'.
 */
export async function uploadUlokFile(ulokId: string, docType: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const file = formData.get('file') as File
    if (!file) throw new Error('Berkas data file fisik kosong.')

    const fileExtension = file.name.split('.').pop()
    const storagePath = `${ulokId}/${docType}-${Date.now()}.${fileExtension}`
    
    // FIXED BUCKET NAME: sesuai dengan instruksi 'dokumen-ulok'
    const { error: storageError } = await supabase.storage
      .from('dokumen-ulok')
      .upload(storagePath, file, { upsert: true })

    if (storageError) throw storageError

    // Dapatkan tautan publik dari storage bucket
    const { data: { publicUrl } } = supabase.storage
      .from('dokumen-ulok')
      .getPublicUrl(storagePath)

    // Cek ketersediaan duplikasi document_type untuk record bersangkutan
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('id')
      .eq('ulok_id', ulokId)
      .eq('document_type', docType)
      .maybeSingle()

    if (existingDoc) {
      // Jika tipe dokumen sudah pernah diupload, timpa data url yang lama
      const { error: updateError } = await supabase
        .from('documents')
        .update({ 
          file_url: publicUrl, 
          uploaded_at: new Date().toISOString() 
        })
        .eq('id', existingDoc.id)
      if (updateError) throw updateError
    } else {
      // Jika dokumen baru pertama kali dimasukkan
      const { error: insertError } = await supabase
        .from('documents')
        .insert([
          { 
            ulok_id: ulokId, 
            document_type: docType, 
            file_url: publicUrl 
          }
        ])
      if (insertError) throw insertError
    }

    // Refresh halaman section2 agar tampilan tombol 'View' / 'Delete' sinkron secara instan
    revalidatePath(`/admin/cabang/usulan-lokasi/form/perorangan/section2`)
    revalidatePath(`/admin/cabang/usulan-lokasi/form/badanhukum/section2`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Menghapus berkas fisik dari Supabase Storage beserta record barisnya di tabel 'documents'.
 * @param docId - String UUID baris dokumen pada tabel 'documents'.
 * @param fileUrl - Tautan publik lengkap berkas dokumen yang akan dihapus dari storage.
 */
export async function deleteUlokFile(docId: string, fileUrl: string) {
  try {
    const supabase = await createClient()
    
    // Ekstraksi pemisah path lokasi file dari string URL internal bucket
    const segments = fileUrl.split('/dokumen-ulok/')
    if (segments.length > 1) {
      const storageFilePath = segments[1]
      // Hapus berkas fisik di storage bucket 'dokumen-ulok'
      await supabase.storage.from('dokumen-ulok').remove([storageFilePath])
    }
    
    // Hapus record metadata di tabel documents database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId)

    if (dbError) throw dbError

    // Refresh data client component
    revalidatePath(`/admin/cabang/usulan-lokasi/form/perorangan/section2`)
    revalidatePath(`/admin/cabang/usulan-lokasi/form/badanhukum/section2`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
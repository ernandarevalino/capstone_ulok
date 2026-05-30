'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/actions/superadmin' // Import fungsi notifikasi pusat
import { calculateULOKSAW } from '@/actions/saw'

/* ========================================================================== */
/* #region MODUL MANAJEMEN USULAN LOKASI (ULOK) */
/* ========================================================================== */

/**
 * Mengambil seluruh daftar usulan lokasi (ULOK) yang diajukan oleh SIAPAPUN,
 * asalkan berasal dari Cabang (branch_id) yang sama dengan Admin yang sedang aktif.
 * Hasil query akan diurutkan berdasarkan waktu pembuatan terbaru.
 * @returns Objek status operasi beserta array data usulan lokasi atau pesan kesalahan.
 */
export async function getUlokSubmissions() {
  try {
    const supabase = await createClient()
    
    // Validasi token sesi untuk memastikan identitas pengguna terautentikasi
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    // 1. Ambil data branch_id dari profil admin yang sedang login saat ini
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('branch_id')
      .eq('id', user.id)
      .single()

    if (profileError || !currentProfile) {
      throw new Error('Profil pengguna atau data asal cabang tidak ditemukan')
    }

    // Jika admin tidak memiliki branch_id, kembalikan array kosong
    if (!currentProfile.branch_id) {
      return { success: true, data: [] }
    }

    // 2. Ambil semua ID user (admin) yang bekerja di cabang yang sama
    const { data: siblingProfiles, error: siblingError } = await supabase
      .from('profiles')
      .select('id')
      .eq('branch_id', currentProfile.branch_id)

    if (siblingError) throw siblingError

    // Kumpulkan semua ID admin satu cabang ke dalam sebuah array string
    const branchAdminIds = siblingProfiles.map(profile => profile.id)

    // 3. Ambil data ULOK yang 'admin_id'-nya ada di dalam daftar admin satu cabang tadi
    // Menggunakan .in() dengan select('*') untuk menghindari error ambiguitas multi-foreign key
    const { data, error } = await supabase
      .from('ulok_submissions')
      .select('*')
      .in('admin_id', branchAdminIds) // Filter menggunakan flat array (Anti Error Join!) 
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Mengambil seluruh daftar usulan lokasi (ULOK) satu cabang beserta data komentar/catatan revisi.
 * Digunakan pada halaman Feedback Admin Cabang.
 */
export async function getFeedbackSubmissions() {
  try {
    const supabase = await createClient()
    
    // Validasi token sesi
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    // 1. Ambil data branch_id dari profil admin yang sedang login
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('branch_id')
      .eq('id', user.id)
      .single()

    if (profileError || !currentProfile) {
      throw new Error('Profil pengguna atau data asal cabang tidak ditemukan')
    }

    if (!currentProfile.branch_id) {
      return { success: true, data: [] }
    }

    // 2. Ambil semua ID user (admin) yang bekerja di cabang yang sama
    const { data: siblingProfiles, error: siblingError } = await supabase
      .from('profiles')
      .select('id')
      .eq('branch_id', currentProfile.branch_id)

    if (siblingError) throw siblingError

    const branchAdminIds = siblingProfiles.map(profile => profile.id)

    // 3. Ambil data ULOK beserta relasi comments dan profiles pengirim komentar
    const { data, error } = await supabase
      .from('ulok_submissions')
      .select(`
        *,
        comments (
          *,
          profiles:user_id (
            full_name,
            role
          )
        )
      `)
      .in('admin_id', branchAdminIds)

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Menghapus entitas data usulan lokasi (ULOK) berdasarkan ID.
 * Diperbarui: Menghapus data anak di tabel 'documents' terlebih dahulu agar tidak error Foreign Key!
 * @param id - String UUID dari usulan lokasi yang akan dihapus.
 * @returns Objek status operasi sukses atau gagal.
 */
export async function deleteUlokSubmission(id: string) {
  try {
    const supabase = await createClient()
    
    // Validasi token sesi memastikan pengguna terautentikasi
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    // 1. HAPUS DAHULU SEMUA BERKAS TERKAIT DI TABEL DOCUMENTS (Anti Error Foreign Key!)
    await supabase
      .from('documents')
      .delete()
      .eq('ulok_id', id)

    // 2. BARU EKSEKUSI PENGHAPUSAN BARIS DATA UTAMA DI TABEL 'ulok_submissions'
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
    
    // Ambil data status saat ini sebelum update
    const { data: currentUlok } = await supabase
      .from('ulok_submissions')
      .select('status, nama_lokasi, admin_id, first_in_review_at')
      .eq('id', id)
      .single()

    // Mapping selektif agar kolom yang tidak diubah tidak tertimpa NULL
    const updateData: any = { updated_at: new Date().toISOString() }

    // Isian Data Dasar
    if (payload.nama_lokasi !== undefined) updateData.nama_lokasi = payload.nama_lokasi
    if (payload.nama_pemegang_hak !== undefined) updateData.nama_pemegang_hak = payload.nama_pemegang_hak
    if (payload.jenis_badan_hukum !== undefined) updateData.jenis_badan_hukum = payload.jenis_badan_hukum
    if (payload.alamat_koordinat !== undefined) updateData.alamat_koordinat = payload.alamat_koordinat
    if (payload.detail_alamat !== undefined) updateData.detail_alamat = payload.detail_alamat
    if (payload.status !== undefined) {
      updateData.status = payload.status
      if (payload.status === 'In Review' && !currentUlok?.first_in_review_at) {
        updateData.first_in_review_at = new Date().toISOString()
      }
    }

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
    if (payload.harga_sewa !== undefined) updateData.harga_sewa = payload.harga_sewa
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

    // Jika jenis_badan_hukum diubah, sinkronkan dokumen di database
    if (payload.jenis_badan_hukum !== undefined) {
      const newJbh = payload.jenis_badan_hukum
      let allowedIds: number[] = []
      
      if (newJbh === 'PT') {
        allowedIds = Array.from({ length: 11 }, (_, i) => 1 + i)
      } else if (newJbh === 'Yayasan') {
        allowedIds = Array.from({ length: 9 }, (_, i) => 12 + i)
      } else if (newJbh === 'Koperasi') {
        allowedIds = Array.from({ length: 9 }, (_, i) => 21 + i)
      } else if (newJbh === 'Perorangan') {
        allowedIds = Array.from({ length: 9 }, (_, i) => 30 + i)
      } else if (newJbh === 'Kuasa') {
        allowedIds = Array.from({ length: 11 }, (_, i) => 30 + i)
      } else if (newJbh === 'Waris') {
        allowedIds = Array.from({ length: 9 }, (_, i) => 30 + i).concat([41, 42, 43, 44])
      } else if (newJbh === 'Hibah') {
        allowedIds = Array.from({ length: 9 }, (_, i) => 30 + i).concat([45])
      }

      if (allowedIds.length > 0) {
        const { data: existingDocs } = await supabase
          .from('documents')
          .select('id, checklist_id')
          .eq('ulok_id', id)

        if (existingDocs && existingDocs.length > 0) {
          const docsToDelete = existingDocs.filter(doc => 
            doc.checklist_id !== null && 
            doc.checklist_id !== undefined && 
            !allowedIds.includes(doc.checklist_id)
          )

          if (docsToDelete.length > 0) {
            const deleteIds = docsToDelete.map(d => d.id)
            await supabase
              .from('documents')
              .delete()
              .in('id', deleteIds)
          }
        }
      }
    }

    // Kirim notifikasi jika status diubah dari Draft ke Submitted
    if (currentUlok && currentUlok.status === 'Draft' && payload.status === 'Submitted') {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select(`
            full_name,
            branches (
              nama_cabang
            )
          `)
          .eq('id', currentUlok.admin_id)
          .single()

        const adminName = profileData?.full_name || 'Admin';
        const branchName = (profileData?.branches as any)?.nama_cabang || 'Cabang';

        const { data: assessors } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'assessor')

        if (assessors && assessors.length > 0) {
          for (const ass of assessors) {
            await createNotification(
              'Usulan Baru Masuk',
              `Admin ${adminName} dari ${branchName} telah mengajukan usulan lokasi baru: "${currentUlok.nama_lokasi}".`,
              ass.id,
              'submission'
            )
          }
        }
      } catch (notifErr) {
        console.error("Gagal memicu notifikasi submission baru:", notifErr)
      }
    }

    // Pemicu kalkulasi ulang skor SAW real-time agar dashboard sinkron
    await calculateULOKSAW(id)

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
    
    const { error: storageError } = await supabase.storage
      .from('dokumen-ulok')
      .upload(storagePath, file, { upsert: true })

    if (storageError) throw storageError

    const { data: { publicUrl } } = supabase.storage
      .from('dokumen-ulok')
      .getPublicUrl(storagePath)

    const { data: existingDoc } = await supabase
      .from('documents')
      .select('id')
      .eq('ulok_id', ulokId)
      .eq('document_type', docType)
      .maybeSingle()

    if (existingDoc) {
      const { error: updateError } = await supabase
        .from('documents')
        .update({ 
          file_url: publicUrl, 
          uploaded_at: new Date().toISOString() 
        })
        .eq('id', existingDoc.id)
      if (updateError) throw updateError
    } else {
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

    // =========================================================================
    // TRIGGER OTOMATIS STATUS 'IN REVIEW' (SISI ADMIN CABANG):
    // Jika Admin Cabang sudah mengupload dokumen DAN mengirimkan komentar pertama kali pada ULOK yang berstatus 'Draft', otomatis sistem akan menembakkan update status ULOK tersebut menjadi 'In Review'.
    // =========================================================================
    const { data: commentList, error: commentError } = await supabase
      .from('comments')
      .select('id')
      .eq('ulok_id', ulokId)

    if (!commentError && commentList && commentList.length > 0) {
      const { error: statusError } = await supabase
        .from('ulok_submissions')
        .update({ 
          status: 'In Review',
          first_in_review_at: new Date().toISOString()
        })
        .eq('id', ulokId)
        .eq('status', 'Draft')

      if (statusError) {
        console.error("Gagal update status ULOK:", statusError)
        throw new Error(`Gagal memperbarui status ke In Review: ${statusError.message}`)
      }
    }
    // =========================================================================

    // Perluas revalidatePath agar mencakup form Section 1 & Section 2 secara menyeluruh
    revalidatePath('/admin/cabang/usulan-lokasi')
    revalidatePath(`/admin/cabang/usulan-lokasi/form/perorangan/section1`)
    revalidatePath(`/admin/cabang/usulan-lokasi/form/perorangan/section2`)
    revalidatePath(`/admin/cabang/usulan-lokasi/form/badanhukum/section1`)
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

/**
 * Mengambil daftar seluruh komentar untuk usulan lokasi (ULOK) tertentu,
 * di-JOIN dengan profiles untuk mendapatkan full_name dan role pengirim.
 * @param ulokId - String UUID usulan lokasi terkait.
 */
export async function getComments(ulokId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          full_name,
          role
        )
      `)
      .eq('ulok_id', ulokId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Menyimpan komentar baru pada suatu usulan lokasi (ULOK).
 * @param ulokId - ID usulan lokasi terkait.
 * @param userId - ID pengguna pengirim pesan.
 * @param message - Isi teks pesan komentar.
 */
export async function createComment(ulokId: string, userId: string, message: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          ulok_id: ulokId,
          user_id: userId,
          message: message,
        }
      ])
      .select()
      .single()

    if (error) throw error

    // Kirim notifikasi berdasarkan role komentator
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', userId)
        .single()

      const { data: ulok } = await supabase
        .from('ulok_submissions')
        .select('admin_id, nama_lokasi')
        .eq('id', ulokId)
        .single()

      if (profile && ulok) {
        if (profile.role === 'assessor') {
          await createNotification(
            'Komentar Baru dari Assessor',
            `Assessor ${profile.full_name} memberikan komentar pada usulan "${ulok.nama_lokasi}": "${message}"`,
            ulok.admin_id,
            'comment'
          )
        } else if (profile.role === 'admin_cabang') {
          const { data: assessors } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'assessor')

          if (assessors && assessors.length > 0) {
            for (const ass of assessors) {
              await createNotification(
                'Balasan Komentar Cabang',
                `Admin Cabang ${profile.full_name} membalas komentar pada usulan "${ulok.nama_lokasi}": "${message}"`,
                ass.id,
                'comment'
              )
            }
          }
        }
      }
    } catch (notifErr) {
      console.error("Gagal memicu notifikasi komentar baru:", notifErr)
    }

    // =========================================================================
    // TRIGGER OTOMATIS STATUS 'IN REVIEW' (SISI ADMIN CABANG):
    // Jika Admin Cabang sudah mengupload dokumen DAN mengirimkan komentar pertama kali pada ULOK yang berstatus 'Draft', otomatis sistem akan menembakkan update status ULOK tersebut menjadi 'In Review'.
    // =========================================================================
    const { data: ulok, error: ulokError } = await supabase
      .from('ulok_submissions')
      .select('status')
      .eq('id', ulokId)
      .single()

    if (!ulokError && ulok && ulok.status === 'Draft') {
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('id')
        .eq('ulok_id', ulokId)

      if (!docsError && docs && docs.length > 0) {
        await supabase
          .from('ulok_submissions')
          .update({ 
            status: 'In Review',
            first_in_review_at: new Date().toISOString()
          })
          .eq('id', ulokId)
      }
    }
    // =========================================================================

    revalidatePath(`/admin/cabang/usulan-lokasi/form/perorangan`)
    revalidatePath(`/admin/cabang/usulan-lokasi/form/badanhukum`)
    revalidatePath(`/admin/assessor/penilaian/ulok-badanhukum`)
    revalidatePath(`/admin/assessor/penilaian/ulok-perorangan`)

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

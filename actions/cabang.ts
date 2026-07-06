'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/actions/superadmin'
import { calculateULOKSAW } from '@/actions/saw'
import { updateUlokProgressAndTimestamp } from './pengelompokan'
import { calculateProgress } from '@/utils/progress'

// === ACTIONS: AMBIL DAFTAR USULAN LOKASI ===
export async function getUlokSubmissions() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

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

    const { data: siblingProfiles, error: siblingError } = await supabase
      .from('profiles')
      .select('id')
      .eq('branch_id', currentProfile.branch_id)

    if (siblingError) throw siblingError

    const branchAdminIds = siblingProfiles.map(profile => profile.id)

    const { data: rawData, error } = await supabase
      .from('ulok_submissions')
      .select(`
        *,
        ulok_pemilik(*),
        ulok_sertifikat(*),
        ulok_legal(*),
        ulok_jaminan(*),
        documents (*),
        metode_saw(*)
      `)
      .in('admin_id', branchAdminIds)
      .order('created_at', { ascending: false })

    if (error) throw error

    const data = (rawData || []).map((item: any) => {
      const { numerator, denominator, persentase } = calculateProgress(item, item.documents || [])
      return {
        ...item,
        ...item.metode_saw,
        numerator,
        denominator,
        persentase
      }
    })

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ACTIONS: AMBIL SUBMISSIONS FEEDBACK ===
export async function getFeedbackSubmissions() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

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

    const { data: siblingProfiles, error: siblingError } = await supabase
      .from('profiles')
      .select('id')
      .eq('branch_id', currentProfile.branch_id)

    if (siblingError) throw siblingError

    const branchAdminIds = siblingProfiles.map(profile => profile.id)

    const { data: rawData, error } = await supabase
      .from('ulok_submissions')
      .select(`
        *,
        comments (
          *,
          profiles:user_id (
            full_name,
            role
          )
        ),
        metode_saw(*)
      `)
      .in('admin_id', branchAdminIds)

    if (error) throw error

    const data = (rawData || []).map((item: any) => ({
      ...item,
      ...item.metode_saw
    }))

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ACTIONS: HAPUS USULAN LOKASI ===
export async function deleteUlokSubmission(id: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    await supabase
      .from('documents')
      .delete()
      .eq('ulok_id', id)

    // Delete from normalized child tables first to avoid FK constraint errors
    await supabase.from('ulok_pemilik').delete().eq('ulok_id', id)
    await supabase.from('ulok_sertifikat').delete().eq('ulok_id', id)
    await supabase.from('ulok_legal').delete().eq('ulok_id', id)
    await supabase.from('ulok_jaminan').delete().eq('ulok_id', id)
    await supabase.from('metode_saw').delete().eq('ulok_id', id)

    const { error } = await supabase
      .from('ulok_submissions')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/cabang/usulan-lokasi')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ACTIONS: BUAT USULAN LOKASI BARU ===
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

    // Initialize 1:1 sub-tables with empty rows to prevent any data errors or undefined values
    const newUlokId = data.id;
    await Promise.all([
      supabase.from('ulok_pemilik').insert({ ulok_id: newUlokId }),
      supabase.from('ulok_sertifikat').insert({ ulok_id: newUlokId }),
      supabase.from('ulok_legal').insert({ ulok_id: newUlokId }),
      supabase.from('ulok_jaminan').insert({ ulok_id: newUlokId }),
      supabase.from('metode_saw').insert({ ulok_id: newUlokId })
    ]);

    try {
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
        const branchName = (profileData.branches as any)?.nama_cabang || 'Cabang Tidak Diketahui';

        const { data: staff } = await supabase
          .from('profiles')
          .select('id')
          .in('role', ['assessor', 'super_admin']);

        if (staff && staff.length > 0) {
          for (const s of staff) {
            await createNotification(
              'Usulan Lokasi (ULOK) Baru',
              `Admin ${adminName} dari ${branchName} telah menambahkan usulan lokasi baru: "${payload.nama_lokasi}" (Status: Draft).`,
              s.id,
              'submission'
            );
          }
        }
      }
    } catch (notifErr) {
      console.error("Gagal memicu notifikasi ULOK baru:", notifErr);
    }
    
    revalidatePath('/admin/cabang/usulan-lokasi')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ACTIONS: AMBIL DETAIL USULAN LOKASI ===
export async function getUlokDetail(id: string) {
  try {
    const supabase = await createClient()
    const { data: rawData, error } = await supabase
      .from('ulok_submissions')
      .select(`
        *,
        ulok_pemilik(*),
        ulok_sertifikat(*),
        ulok_legal(*),
        ulok_jaminan(*),
        metode_saw(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    const data = rawData ? {
      ...rawData,
      ...(rawData as any).ulok_pemilik,
      ...(rawData as any).ulok_sertifikat,
      ...(rawData as any).ulok_legal,
      ...(rawData as any).ulok_jaminan,
      ...(rawData as any).metode_saw
    } : null

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ACTIONS: AMBIL MASTER CHECKLIST ===
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

// === ACTIONS: AMBIL DOKUMEN YANG DIUPLOAD ===
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

// === ACTIONS: UPDATE DATA USULAN LOKASI ===
export async function updateUlokSubmission(id: string, payload: any) {
  try {
    const supabase = await createClient()
    
    const { data: currentUlok } = await supabase
      .from('ulok_submissions')
      .select('status, nama_lokasi, admin_id, first_in_review_at')
      .eq('id', id)
      .single()

    const parentData: any = { updated_at: new Date().toISOString() }
    const pemilikData: any = {}
    const sertifikatData: any = {}
    const legalData: any = {}
    const jaminanData: any = {}

    // parent
    if (payload.nama_lokasi !== undefined) parentData.nama_lokasi = payload.nama_lokasi
    if (payload.nama_pemegang_hak !== undefined) parentData.nama_pemegang_hak = payload.nama_pemegang_hak
    if (payload.jenis_badan_hukum !== undefined) parentData.jenis_badan_hukum = payload.jenis_badan_hukum
    if (payload.alamat_koordinat !== undefined) parentData.alamat_koordinat = payload.alamat_koordinat
    if (payload.detail_alamat !== undefined) parentData.detail_alamat = payload.detail_alamat
    if (payload.harga_sewa !== undefined) {
      parentData.harga_sewa = (payload.harga_sewa !== null && payload.harga_sewa !== '') ? Math.round(Number(payload.harga_sewa)) : null
    }
    if (payload.status !== undefined) {
      parentData.status = payload.status
      if (payload.status === 'In Review' && !currentUlok?.first_in_review_at) {
        parentData.first_in_review_at = new Date().toISOString()
      }
    }

    // pemilik
    if (payload.jenis_identitas !== undefined) pemilikData.jenis_identitas = payload.jenis_identitas
    if (payload.nik_pemilik !== undefined) pemilikData.nik_pemilik = payload.nik_pemilik
    if (payload.nama_kitas !== undefined) pemilikData.nama_kitas = payload.nama_kitas
    if (payload.no_kk !== undefined) pemilikData.no_kk = payload.no_kk
    if (payload.no_buku_nikah !== undefined) pemilikData.no_buku_nikah = payload.no_buku_nikah
    if (payload.nama_sebelum_ganti !== undefined) pemilikData.nama_sebelum_ganti = payload.nama_sebelum_ganti
    if (payload.nama_sesudah_ganti !== undefined) pemilikData.nama_sesudah_ganti = payload.nama_sesudah_ganti
    if (payload.bentuk_objek !== undefined) pemilikData.bentuk_objek = payload.bentuk_objek
    if (payload.data_pribadi_lainnya !== undefined) pemilikData.data_pribadi_lainnya = payload.data_pribadi_lainnya
    if (payload.no_surat_kematian !== undefined) pemilikData.no_surat_kematian = payload.no_surat_kematian

    // sertifikat
    if (payload.jenis_alas_hak !== undefined) sertifikatData.jenis_alas_hak = payload.jenis_alas_hak
    if (payload.no_sertifikat_alas_hak !== undefined) sertifikatData.no_sertifikat_alas_hak = payload.no_sertifikat_alas_hak
    if (payload.nama_sertifikat !== undefined) sertifikatData.nama_sertifikat = payload.nama_sertifikat
    if (payload.luas_sertifikat !== undefined) sertifikatData.luas_sertifikat = payload.luas_sertifikat ? parseFloat(payload.luas_sertifikat) : null
    if (payload.masa_berlaku !== undefined) sertifikatData.masa_berlaku = payload.masa_berlaku || null
    if (payload.tanggal_proses !== undefined) sertifikatData.tanggal_proses = payload.tanggal_proses || null

    // legal
    if (payload.nama_ajb !== undefined) legalData.nama_ajb = payload.nama_ajb
    if (payload.no_ajb_lainnya !== undefined) legalData.no_ajb_lainnya = payload.no_ajb_lainnya
    if (payload.luas_ajb !== undefined) legalData.luas_ajb = payload.luas_ajb
    if (payload.no_surat_kelurahan !== undefined) legalData.no_surat_kelurahan = payload.no_surat_kelurahan
    if (payload.tanggal_surat_kelurahan !== undefined) legalData.tanggal_surat_kelurahan = payload.tanggal_surat_kelurahan || null

    // jaminan
    if (payload.dokumen_jaminan !== undefined) {
      jaminanData.dokumen_jaminan = payload.dokumen_jaminan === true || payload.dokumen_jaminan === "Ya";
    }
    if (payload.nama_jaminan !== undefined) jaminanData.nama_jaminan = payload.nama_jaminan
    if (payload.no_surat_jaminan !== undefined) jaminanData.no_surat_jaminan = payload.no_surat_jaminan
    if (payload.tanggal_jaminan !== undefined) jaminanData.tanggal_jaminan = payload.tanggal_jaminan || null

    const { error: parentError } = await supabase
      .from('ulok_submissions')
      .update(parentData)
      .eq('id', id)

    if (parentError) throw parentError

    if (Object.keys(pemilikData).length > 0) {
      const { error } = await supabase.from('ulok_pemilik').upsert({ ulok_id: id, ...pemilikData })
      if (error) throw error
    }
    if (Object.keys(sertifikatData).length > 0) {
      const { error } = await supabase.from('ulok_sertifikat').upsert({ ulok_id: id, ...sertifikatData })
      if (error) throw error
    }
    if (Object.keys(legalData).length > 0) {
      const { error } = await supabase.from('ulok_legal').upsert({ ulok_id: id, ...legalData })
      if (error) throw error
    }
    if (Object.keys(jaminanData).length > 0) {
      const { error } = await supabase.from('ulok_jaminan').upsert({ ulok_id: id, ...jaminanData })
      if (error) throw error
    }

    const detailRes = await getUlokDetail(id)
    if (!detailRes.success) throw new Error(detailRes.error)
    const data = detailRes.data

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

    if (currentUlok && currentUlok.status === 'Draft' && (payload.status === 'In Review' || payload.status === 'Submitted')) {
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

        const { data: staff } = await supabase
          .from('profiles')
          .select('id')
          .in('role', ['assessor', 'super_admin']);

        if (staff && staff.length > 0) {
          for (const s of staff) {
            await createNotification(
              'Usulan Baru Masuk',
              `Admin ${adminName} dari ${branchName} telah mengajukan usulan lokasi baru: "${currentUlok.nama_lokasi}".`,
              s.id,
              'submission'
            )
          }
        }
      } catch (notifErr) {
        console.error("Gagal memicu notifikasi submission baru:", notifErr)
      }
    }

    await updateUlokProgressAndTimestamp(id)
    await calculateULOKSAW(id)

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

// === ACTIONS: UPLOAD FILE USULAN LOKASI ===
export async function uploadUlokFile(ulokId: string, docType: string, formData: FormData) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const file = formData.get('file') as File
    if (!file) throw new Error('Berkas data file fisik kosong.')

    const fileExtension = file.name.split('.').pop()
    const randomString = Math.random().toString(36).substring(2, 7)
    const storagePath = `${ulokId}/${docType}-${Date.now()}-${randomString}.${fileExtension}`
    
    const { error: storageError } = await supabase.storage
      .from('dokumen-ulok')
      .upload(storagePath, file, { upsert: true })

    if (storageError) throw storageError

    const { data: { publicUrl } } = supabase.storage
      .from('dokumen-ulok')
      .getPublicUrl(storagePath)

    let existingDoc = null
    if (docType !== 'dokumen_tambahan') {
      const { data } = await supabase
        .from('documents')
        .select('id')
        .eq('ulok_id', ulokId)
        .eq('document_type', docType)
        .maybeSingle()
      existingDoc = data
    }

    if (existingDoc) {
      const { error: updateError } = await supabase
        .from('documents')
        .update({ 
          file_url: publicUrl, 
          uploaded_at: new Date().toISOString(),
          uploaded_by: user.id
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
            file_url: publicUrl,
            uploaded_by: user.id
          }
        ])
      if (insertError) throw insertError
    }

    const { data: currentUlok, error: ulokError } = await supabase
      .from('ulok_submissions')
      .select('status')
      .eq('id', ulokId)
      .single()

    if (!ulokError && currentUlok && currentUlok.status === 'Draft') {
      const { error: statusError } = await supabase
        .from('ulok_submissions')
        .update({ 
          status: 'In Review',
          first_in_review_at: new Date().toISOString()
        })
        .eq('id', ulokId)

      if (statusError) {
        console.error("Gagal update status ULOK ke In Review:", statusError)
        throw new Error(`Gagal memperbarui status ke In Review: ${statusError.message}`)
      }

      // Trigger notification for the submission transitioning from Draft to In Review
      try {
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

        const adminName = profileData?.full_name || 'Admin';
        const branchName = (profileData?.branches as any)?.nama_cabang || 'Cabang';

        const { data: ulokDetails } = await supabase
          .from('ulok_submissions')
          .select('nama_lokasi')
          .eq('id', ulokId)
          .single()

        const { data: staff } = await supabase
          .from('profiles')
          .select('id')
          .in('role', ['assessor', 'super_admin']);

        if (staff && staff.length > 0) {
          for (const s of staff) {
            await createNotification(
              'Usulan Baru Masuk',
              `Admin ${adminName} dari ${branchName} telah mengajukan usulan lokasi baru: "${ulokDetails?.nama_lokasi || 'Usulan Lokasi'}".`,
              s.id,
              'submission'
            )
          }
        }
      } catch (notifErr) {
        console.error("Gagal memicu notifikasi upload file ke In Review:", notifErr)
      }
    }

    await updateUlokProgressAndTimestamp(ulokId)

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

// === ACTIONS: HAPUS FILE USULAN LOKASI ===
export async function deleteUlokFile(docId: string, fileUrl: string) {
  try {
    const supabase = await createClient()
    
    const { data: docData } = await supabase
      .from('documents')
      .select('ulok_id')
      .eq('id', docId)
      .single()

    const segments = fileUrl.split('/dokumen-ulok/')
    if (segments.length > 1) {
      const storageFilePath = segments[1]
      await supabase.storage.from('dokumen-ulok').remove([storageFilePath])
    }
    
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId)

    if (dbError) throw dbError

    if (docData?.ulok_id) {
      await updateUlokProgressAndTimestamp(docData.ulok_id)
    }

    revalidatePath(`/admin/cabang/usulan-lokasi/form/perorangan/section2`)
    revalidatePath(`/admin/cabang/usulan-lokasi/form/badanhukum/section2`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ACTIONS: AMBIL KOMENTAR ===
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

// === ACTIONS: BUAT KOMENTAR BARU ===
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

    revalidatePath(`/admin/cabang/usulan-lokasi/form/perorangan`)
    revalidatePath(`/admin/cabang/usulan-lokasi/form/badanhukum`)
    revalidatePath(`/admin/assessor/penilaian/ulok-badanhukum`)
    revalidatePath(`/admin/assessor/penilaian/ulok-perorangan`)

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === ACTIONS: AMBIL NOTIFIKASI CABANG ===
export async function getNotificationsAction(userId?: string | null) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized: Silakan login kembali')

    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, is_read, created_at, category, user_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

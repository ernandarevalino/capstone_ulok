'use server'

import { createClient } from '@/utils/supabase/server'

export async function exportUlokSubmissionsCSV(role: 'admin_cabang' | 'assessor', branchId?: number) {
  try {
    const supabase = await createClient()

    // 1. Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized: Silakan login kembali')
    }

    // 2. Base Query
    let query = supabase
      .from('ulok_submissions')
      .select(`
        id,
        nama_lokasi,
        jenis_badan_hukum,
        nama_pemegang_hak,
        harga_sewa,
        status,
        created_at,
        approved_at,
        metode_saw(*),
        ulok_sertifikat(*),
        admin_profile:profiles!ulok_submissions_admin_id_fkey(
          full_name,
          branch_id,
          branches:branch_id(nama_cabang, kabupaten_kota, provinsi)
        ),
        reviewer_profile:profiles!ulok_submissions_updated_by_fkey(full_name)
      `)
      .is('deleted_at', null)

    if (role === 'admin_cabang') {
      let targetBranchId = branchId

      if (!targetBranchId) {
        const { data: userProfile, error: profileErr } = await supabase
          .from('profiles')
          .select('branch_id')
          .eq('id', user.id)
          .single()

        if (profileErr) throw profileErr
        targetBranchId = userProfile?.branch_id || undefined
      }

      if (targetBranchId) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id')
          .eq('branch_id', targetBranchId)

        if (profilesError) throw profilesError

        const profileIds = (profiles || []).map(p => p.id)
        if (profileIds.length === 0) {
          return { success: true, csvData: getEmptyCSV(), filename: getFilename(role) }
        }
        query = query.in('admin_id', profileIds)
      } else {
        return { success: true, csvData: getEmptyCSV(), filename: getFilename(role) }
      }
    }

    const { data: rawData, error: queryError } = await query.order('created_at', { ascending: false })
    if (queryError) throw queryError

    const submissionsData = rawData || []

    // 3. Generate CSV content
    const headers = [
      "ID ULOK",
      "Nama Lokasi",
      "Cabang",
      "Kabupaten/Kota",
      "Provinsi",
      "Jenis Badan Hukum",
      "Nama Pemegang Hak",
      "Jenis Alas Hak",
      "No Sertifikat",
      "Luas Tanah (m2)",
      "Harga Sewa Total (5 Thn)",
      "Status",
      "Skor C1 (Dokumen)",
      "Skor C2 (Durasi)",
      "Skor C3 (Harga)",
      "Final Score SAW",
      "Kategori Rekomendasi",
      "Pengaju (Admin)",
      "Reviewer Terakhir",
      "Tanggal Dibuat",
      "Tanggal Approved"
    ]

    const csvRows = [headers.map(h => `"${h}"`).join(',')]

    function escapeCSVValue(val: any): string {
      if (val === null || val === undefined) return '';
      const str = String(val);
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    }

    function formatDate(dateStr: string | null | undefined): string {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      
      const pad = (n: number) => String(n).padStart(2, '0');
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    for (const item of submissionsData) {
      const adminProfile = Array.isArray(item.admin_profile) ? item.admin_profile[0] : item.admin_profile
      const branchInfo = Array.isArray(adminProfile?.branches) ? adminProfile?.branches[0] : adminProfile?.branches
      const saw = Array.isArray(item.metode_saw) ? item.metode_saw[0] : item.metode_saw
      const cert = Array.isArray(item.ulok_sertifikat) ? item.ulok_sertifikat[0] : item.ulok_sertifikat
      const reviewer = Array.isArray(item.reviewer_profile) ? item.reviewer_profile[0] : item.reviewer_profile

      const finalScore = saw?.final_score ?? 0
      const kategoriRekomendasi = finalScore >= 0.75 ? "Rekomendasi Utama" : "Kategori Peringatan"

      const row = [
        escapeCSVValue(item.id),
        escapeCSVValue(item.nama_lokasi),
        escapeCSVValue(branchInfo?.nama_cabang),
        escapeCSVValue(branchInfo?.kabupaten_kota),
        escapeCSVValue(branchInfo?.provinsi),
        escapeCSVValue(item.jenis_badan_hukum),
        escapeCSVValue(item.nama_pemegang_hak),
        escapeCSVValue(cert?.jenis_alas_hak),
        escapeCSVValue(cert?.no_sertifikat_alas_hak),
        escapeCSVValue(cert?.luas_sertifikat),
        escapeCSVValue(item.harga_sewa),
        escapeCSVValue(item.status),
        escapeCSVValue(saw?.c1_score),
        escapeCSVValue(saw?.c2_score),
        escapeCSVValue(saw?.c3_score),
        escapeCSVValue(saw?.final_score),
        escapeCSVValue(kategoriRekomendasi),
        escapeCSVValue(adminProfile?.full_name),
        escapeCSVValue(reviewer?.full_name),
        escapeCSVValue(formatDate(item.created_at)),
        escapeCSVValue(formatDate(item.approved_at))
      ]
      csvRows.push(row.join(','))
    }

    return {
      success: true,
      csvData: csvRows.join('\n'),
      filename: getFilename(role)
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Gagal mengekspor data ke CSV'
    }
  }
}

function getEmptyCSV(): string {
  const headers = [
    "ID ULOK",
    "Nama Lokasi",
    "Cabang",
    "Kabupaten/Kota",
    "Provinsi",
    "Jenis Badan Hukum",
    "Nama Pemegang Hak",
    "Jenis Alas Hak",
    "No Sertifikat",
    "Luas Tanah (m2)",
    "Harga Sewa Total (5 Thn)",
    "Status",
    "Skor C1 (Dokumen)",
    "Skor C2 (Durasi)",
    "Skor C3 (Harga)",
    "Final Score SAW",
    "Kategori Rekomendasi",
    "Pengaju (Admin)",
    "Reviewer Terakhir",
    "Tanggal Dibuat",
    "Tanggal Approved"
  ]
  return headers.map(h => `"${h}"`).join(',')
}

function getFilename(role: string): string {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return role === 'assessor' 
    ? `ulok_export_assessor_${timestamp}.csv` 
    : `ulok_export_branch_${timestamp}.csv`
}

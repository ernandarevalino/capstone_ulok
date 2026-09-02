import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import VendorUploadClient from './VendorUploadClient'

// Service-role client to bypass RLS for public page data fetching
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function VendorUploadPage({ params }: PageProps) {
  const { token } = await params
  const supabase = getAdminClient()

  // 1. Look up the ULOK by vendor token
  const { data: submission, error } = await supabase
    .from('ulok_submissions')
    .select(`
      id,
      nama_lokasi,
      jenis_badan_hukum,
      vendor_token_expires_at
    `)
    .eq('vendor_token', token)
    .maybeSingle()

  // 2. Check validity and expiry
  const isExpired =
    !submission ||
    error ||
    !submission.vendor_token_expires_at ||
    new Date(submission.vendor_token_expires_at) < new Date()

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] dark:bg-[#0D0D0D] flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md overflow-hidden">
          {/* Error Header */}
          <div className="bg-[#D91E2E] px-6 py-5 flex items-center gap-3">
            <span className="text-white text-2xl">🔒</span>
            <div>
              <h1 className="text-white font-bold text-base tracking-tight">Link Akses Kadaluarsa</h1>
              <p className="text-red-100 text-xs mt-0.5">Vendor Upload Portal — PRISMA</p>
            </div>
          </div>

          {/* Error Body */}
          <div className="p-6 space-y-4">
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-800 dark:text-red-300 leading-relaxed">
                Link akses ini <strong>tidak valid atau telah kadaluarsa</strong>.
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 leading-relaxed">
                Token vendor hanya berlaku selama <strong>1 jam</strong> dan akan diperpanjang otomatis selama halaman tetap terbuka.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                📞 Silakan hubungi <strong>tim Alfamidi</strong> untuk meminta link akses baru dari Assessor yang bertanggung jawab.
              </p>
            </div>

            {/* PRISMA branding */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="w-6 h-6 bg-[#142B4D] rounded-md flex items-center justify-center">
                <span className="text-white text-[10px] font-black">P</span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold">
                PRISMA · Sistem Penilaian Lokasi Alfamidi
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 3. Fetch checklist master for this ULOK's jenis_badan_hukum
  const { data: checklistMaster } = await supabase
    .from('checklist_master')
    .select('*')
    .eq('jenis_badan_hukum', submission.jenis_badan_hukum)
    .order('id', { ascending: true })

  // 4. Fetch existing uploaded documents for this ULOK
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('ulok_id', submission.id)
    .is('deleted_at', null)
    .order('is_latest', { ascending: false })
    .order('version', { ascending: false })

  return (
    <VendorUploadClient
      token={token}
      ulokId={submission.id}
      namaLokasi={submission.nama_lokasi}
      jenisBadanHukum={submission.jenis_badan_hukum}
      checklistMaster={checklistMaster || []}
      initialDocuments={documents || []}
    />
  )
}

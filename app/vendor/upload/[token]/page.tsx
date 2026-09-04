import { createClient as createAdminClient } from '@supabase/supabase-js'
import VendorUploadClient from './VendorUploadClient'
import FooterGlobal from '@/components/footer_global'

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

// Reusable Layout wrapper for the Vendor route (Matching Admin Cabang Header & Layout Structure)
const VendorLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 transition-colors duration-300">
    {/* === UTAMA: HEADER DESKTOP (Matching HeaderDesktop style) === */}
    <header className="hidden md:flex items-center justify-between bg-[#142B4D] px-8 py-[26px] shadow-md text-white">
      {/* === UTAMA: LOGO === */}
      <div className="flex items-center">
        <img
          src="/images/prisma-white-navbar.png"
          alt="Logo PRISMA"
          className="h-5 w-auto object-contain"
        />
        <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded ml-1.5 uppercase tracking-wider shadow-sm">
          VENDOR
        </span>
      </div>

      {/* === PANEL: INFORMASI AKSI / SESI === */}
      <div className="flex items-center space-x-5">
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-slate-200">Eksternal</span>
        </div>
      </div>
    </header>

    {/* === UTAMA: HEADER MOBILE (Matching HeaderMobile style) === */}
    <header className="block md:hidden bg-[#142B4D] text-white shadow-md relative z-[100] h-16">
      <div className="flex items-center justify-between px-4 h-full">
        {/* === UTAMA: LOGO === */}
        <div className="flex items-center">
          <img
            src="/images/prisma-white-navbar.png"
            alt="Logo PRISMA"
            className="h-4 w-auto object-contain"
          />
          <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded ml-1.5 uppercase tracking-wider shadow-sm">
            VENDOR
          </span>
        </div>

        {/* === PANEL: STATUS SESI === */}
        <div className="flex items-center">
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/60 px-2 py-1 rounded-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Sesi Aman
          </span>
        </div>
      </div>
    </header>

    {/* === KONTEN: HALAMAN (Matching Admin Cabang Layout: max-w-7xl mx-auto p-4 md:p-8) === */}
    <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
      {children}
    </main>

    {/* === FOOTER GLOBAL === */}
    <FooterGlobal />
  </div>
)

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
      <VendorLayout>
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md overflow-hidden">
            {/* Error Header */}
            <div className="bg-[#D91E2E] px-6 py-5 flex items-center gap-3">
              <div>
                <h1 className="text-white font-bold text-base tracking-tight">Link Akses Kadaluarsa</h1>
                <p className="text-red-100 text-xs mt-0.5">Vendor Upload Portal</p>
              </div>
            </div>

            {/* Error Body */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300 leading-relaxed">
                  Link akses ini <strong>telah kadaluarsa</strong>.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Silakan hubungi <strong>tim Alfamidi</strong> untuk meminta link akses baru dari Assessor yang bertanggung jawab.
                </p>
              </div>
            </div>
          </div>
        </div>
      </VendorLayout>
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
    <VendorLayout>
      <VendorUploadClient
        token={token}
        ulokId={submission.id}
        namaLokasi={submission.nama_lokasi}
        jenisBadanHukum={submission.jenis_badan_hukum}
        checklistMaster={checklistMaster || []}
        initialDocuments={documents || []}
      />
    </VendorLayout>
  )
}

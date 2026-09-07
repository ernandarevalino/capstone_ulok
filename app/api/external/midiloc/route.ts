import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Simulate a network response delay
  await new Promise(resolve => setTimeout(resolve, 800))

  const { searchParams } = new URL(request.url)
  const nomorUlokQuery = searchParams.get('nomor_ulok') || searchParams.get('query') || searchParams.get('id')

  // Midiloc external data structure (Mock) with aaaa-bbbb-cccc format (e.g. M001-2609-0001 or MDLA-2026-0905)
  const mockExternalData = [
    {
      external_id: 'MDL1-2609-0001',
      nomor_ulok: 'MDL1-2609-0001',
      site_name: 'Alfamidi Super [API Midiloc 1]',
      legal_type: 'PT',
      owner_name: 'PT Akselerasi Retail Indonesia',
      coords: '-6.205000, 106.825000',
      address_detail: 'Jl. Jend. Sudirman No. 45, Jakarta Pusat (Source: Midiloc API)',
      estimated_price: 85000000,
      luas_tanah: 500,
      luas_bangunan: 350,
      documents: [
        {
          checklist_id: 1, // E-KTP (yang mewakili)
          document_type: 'E-KTP (yang mewakili)',
          file_url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop',
          is_verified: true
        },
        {
          checklist_id: 2, // Akta Pendirian & SK Menteri
          document_type: 'Akta Pendirian & SK Menteri',
          file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          is_verified: false
        },
        {
          checklist_id: 6, // NIB OSS RBA
          document_type: 'NIB OSS RBA',
          file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          is_verified: true
        },
        {
          checklist_id: 7, // NPWP
          document_type: 'NPWP',
          file_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop',
          is_verified: true
        },
        {
          checklist_id: 12, // Sertifikat Tanah
          document_type: 'Sertifikat Tanah (Hak Milik / HGB / Hak Pakai)',
          file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          is_verified: false
        }
      ]
    },
    {
      external_id: 'MDLA-2026-8811',
      nomor_ulok: 'MDLA-2026-8811',
      site_name: 'Alfamidi Express [API Midiloc 2]',
      legal_type: 'Perorangan',
      owner_name: 'Bapak Sudarsono',
      coords: '-6.215000, 106.835000',
      address_detail: 'Jl. Thamrin No. 12, Jakarta Pusat (Source: Midiloc API)',
      estimated_price: 60000000,
      luas_tanah: 300,
      luas_bangunan: 200,
      documents: [
        {
          checklist_id: 45, // E-KTP Perorangan
          document_type: 'E-KTP',
          file_url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop',
          is_verified: true
        },
        {
          checklist_id: 47, // NPWP Perorangan
          document_type: 'NPWP',
          file_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop',
          is_verified: true
        },
        {
          checklist_id: 49, // KK
          document_type: 'Kartu Keluarga',
          file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          is_verified: false
        },
        {
          checklist_id: 54, // Sertifikat Tanah
          document_type: 'Sertifikat Tanah (Hak Milik / HGB / Hak Pakai)',
          file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          is_verified: false
        }
      ]
    },
    {
      external_id: 'MDL1-2609-0003',
      nomor_ulok: 'MDL1-2609-0003',
      site_name: 'Alfamidi Express [API Midiloc 3]',
      legal_type: 'Perorangan',
      owner_name: 'Ibu Wati',
      coords: '-6.123456, 106.835000',
      address_detail: 'Jl. Thamrin No. 11, Jakarta (Source: Midiloc API)',
      estimated_price: 60000000,
      luas_tanah: 250,
      luas_bangunan: 180,
      documents: []
    },
    {
      external_id: 'MDLA-2026-0904',
      nomor_ulok: 'MDLA-2026-0904',
      site_name: 'Alfamidi Super Jababeka [API Midiloc 4]',
      legal_type: 'PT',
      owner_name: 'PT Mitra Retail Mandiri',
      coords: '-6.285000, 107.165000',
      address_detail: 'Kawasan Industri Jababeka II No. 88, Cikarang (Source: Midiloc API)',
      estimated_price: 95000000,
      luas_tanah: 650,
      luas_bangunan: 450,
      documents: [
        {
          checklist_id: 1,
          document_type: 'E-KTP (yang mewakili)',
          file_url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop',
          is_verified: true
        },
        {
          checklist_id: 7,
          document_type: 'NPWP',
          file_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop',
          is_verified: true
        },
        {
          checklist_id: 14,
          document_type: 'Surat Pemberitahuan Pajak Terutang (SPPT PBB) Terbaru',
          file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          is_verified: true
        },
        {
          checklist_id: 15,
          document_type: 'Izin Mendirikan Bangunan (IMB) / Persetujuan Bangunan Gedung (PBG)',
          file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          is_verified: false
        }
      ]
    },
    {
      external_id: 'MDLA-2026-0905',
      nomor_ulok: 'MDLA-2026-0905',
      site_name: 'Alfamidi Harapan Indah [API Midiloc 5]',
      legal_type: 'Koperasi',
      owner_name: 'Koperasi Karyawan Sejahtera',
      coords: '-6.182000, 106.985000',
      address_detail: 'Kota Harapan Indah Blok B12, Bekasi (Source: Midiloc API)',
      estimated_price: 75000000,
      luas_tanah: 400,
      luas_bangunan: 280,
      documents: [
        {
          checklist_id: 31,
          document_type: 'E-KTP (yang mewakili)',
          file_url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop',
          is_verified: true
        },
        {
          checklist_id: 36,
          document_type: 'NPWP',
          file_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop',
          is_verified: true
        }
      ]
    }
  ]

  let filteredData = mockExternalData

  if (nomorUlokQuery) {
    const q = nomorUlokQuery.trim().toLowerCase()
    filteredData = mockExternalData.filter(
      item => item.nomor_ulok.toLowerCase() === q || 
              item.external_id.toLowerCase() === q ||
              item.nomor_ulok.toLowerCase().includes(q)
    )
  }

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    count: filteredData.length,
    data: filteredData
  })
}

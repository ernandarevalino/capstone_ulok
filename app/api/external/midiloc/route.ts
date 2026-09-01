import { NextResponse } from 'next/server'

export async function GET() {
  // Simulate a slow network response from an external server
  await new Promise(resolve => setTimeout(resolve, 1200))

  // Midiloc external data structure (Mock)
  const mockExternalData = [
    {
      external_id: 'MDL-2026-881',
      site_name: 'Alfamidi Super [API Midiloc 1]',
      legal_type: 'PT',
      owner_name: 'PT Akselerasi Retail',
      coords: '-6.205000, 106.825000',
      address_detail: 'Jl. Jend. Sudirman No. 45, Jakarta Pusat (Source: Midiloc API)',
      estimated_price: 85000000
    },
    {
      external_id: 'MDL-2026-882',
      site_name: 'Alfamidi Express [API Midiloc 2]',
      legal_type: 'Perorangan',
      owner_name: 'Bapak Sudarsono',
      coords: '-6.215000, 106.835000',
      address_detail: 'Jl. Thamrin No. 12, Jakarta Pusat (Source: Midiloc API)',
      estimated_price: 60000000
    },
    {
      external_id: 'MDL-2026-811',
      site_name: 'Alfamidi Express [API Midiloc 3]',
      legal_type: 'Perorangan',
      owner_name: 'Ibu Wati',
      coords: '-6.123456, 106.835000',
      address_detail: 'Jl. Thamrin No. 11, Jakarta (Source: Midiloc API)',
      estimated_price: 60000000
    }
  ]

  return NextResponse.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    data: mockExternalData
  })
}

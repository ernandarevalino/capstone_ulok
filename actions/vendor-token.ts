'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getEffectiveChecklistId } from '@/utils/progress'
import { revalidatePath } from 'next/cache'

// Service-role admin client — bypasses RLS for vendor (anonymous) uploads
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createAdminClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

// === GENERATE VENDOR TOKEN ===
// Called by Assessor. Creates a 1-hour shareable token on a given ULOK.
export async function generateVendorToken(ulokId: string) {
  try {
    const supabase = await createClient()

    // Only authenticated assessors can call this
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // +1 hour

    const { error } = await supabase
      .from('ulok_submissions')
      .update({
        vendor_token: token,
        vendor_token_expires_at: expiresAt,
      })
      .eq('id', ulokId)

    if (error) throw error

    return { success: true, token }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === EXTEND VENDOR TOKEN (HEARTBEAT) ===
// Called by VendorUploadClient every 15 minutes to keep the session alive.
export async function extendVendorToken(token: string) {
  try {
    const supabase = getAdminClient()

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // +1 hour

    const { error } = await supabase
      .from('ulok_submissions')
      .update({ vendor_token_expires_at: expiresAt })
      .eq('vendor_token', token)
      .gt('vendor_token_expires_at', new Date().toISOString()) // Only extend if still valid

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// === VALIDATE VENDOR TOKEN ===
// Used by the server page component to check validity.
export async function validateVendorToken(token: string) {
  try {
    const supabase = getAdminClient()

    const { data, error } = await supabase
      .from('ulok_submissions')
      .select(`
        id,
        nama_lokasi,
        jenis_badan_hukum,
        vendor_token_expires_at
      `)
      .eq('vendor_token', token)
      .single()

    if (error || !data) return { valid: false, data: null }

    const expiresAt = new Date(data.vendor_token_expires_at)
    if (expiresAt < new Date()) return { valid: false, data: null, expired: true }

    return { valid: true, data }
  } catch {
    return { valid: false, data: null }
  }
}

// === UPLOAD VENDOR DOCUMENT ===
// Called by VendorUploadClient. Uses service role to bypass RLS.
export async function uploadVendorDocument(
  token: string,
  docType: string,
  formData: FormData
) {
  try {
    const supabase = getAdminClient()

    // 1. Validate token (must still be valid)
    const { data: submission, error: tokenError } = await supabase
      .from('ulok_submissions')
      .select('id, jenis_badan_hukum, vendor_token_expires_at')
      .eq('vendor_token', token)
      .single()

    if (tokenError || !submission) throw new Error('Token tidak valid.')

    const expiresAt = new Date(submission.vendor_token_expires_at)
    if (expiresAt < new Date()) throw new Error('Token telah kadaluarsa.')

    const ulokId = submission.id

    // 2. Get file from formData
    const file = formData.get('file') as File
    if (!file) throw new Error('File tidak ditemukan.')

    // 3. Upload to Supabase Storage
    const fileExtension = file.name.split('.').pop()
    const randomString = Math.random().toString(36).substring(2, 7)
    const storagePath = `${ulokId}/${docType}-${Date.now()}-${randomString}.${fileExtension}`

    const { error: storageError } = await supabase.storage
      .from('dokumen-ulok')
      .upload(storagePath, file, { upsert: true })

    if (storageError) throw storageError

    const {
      data: { publicUrl },
    } = supabase.storage.from('dokumen-ulok').getPublicUrl(storagePath)

    // 4. Determine checklist_id
    const checklistId = getEffectiveChecklistId(
      { document_type: docType },
      submission.jenis_badan_hukum
    )

    // 5. Version management — get max version for this doc type / checklist
    let nextVersion = 1
    if (docType !== 'dokumen_tambahan') {
      const query = supabase
        .from('documents')
        .select('id, version')
        .eq('ulok_id', ulokId)

      if (checklistId !== null && checklistId !== undefined) {
        query.eq('checklist_id', checklistId)
      } else {
        query.eq('document_type', docType)
      }

      const { data: existingDocs } = await query

      if (existingDocs && existingDocs.length > 0) {
        const maxVersion = existingDocs.reduce(
          (max, d) => Math.max(max, d.version || 1),
          0
        )
        nextVersion = maxVersion + 1

        const existingIds = existingDocs.map((d) => d.id)
        await supabase
          .from('documents')
          .update({ is_latest: false })
          .in('id', existingIds)
      }
    }

    // 6. Insert document record (uploaded_by = null for vendor/anonymous)
    const { error: insertError } = await supabase.from('documents').insert([
      {
        ulok_id: ulokId,
        document_type: docType,
        checklist_id: checklistId,
        file_url: publicUrl,
        uploaded_by: null,
        version: nextVersion,
        is_latest: true,
      },
    ])

    if (insertError) throw insertError

    revalidatePath(`/vendor/upload/${token}`)

    return { success: true, publicUrl }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

import React from 'react'
import { redirect } from 'next/navigation'
import { getUlokDetail, getComments } from '@/actions/cabang'
import { getCurrentProfile } from '@/actions/auth'
import { createClient } from '@/utils/supabase/server'
import { DetailPenilaianPeroranganClient } from './DetailPenilaianPeroranganClient'

export default async function DetailPenilaianPeroranganPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; prefill?: string }> | { id?: string; prefill?: string }
}) {
  const resolvedParams = await searchParams
  const ulokId = resolvedParams?.id
  const prefill = resolvedParams?.prefill || ''

  if (!ulokId) {
    redirect('/admin/assessor/penilaian')
  }

  // Fetch all necessary data in parallel directly on the server to optimize load performance
  const [res, commentsRes, profileRes, supabaseServer] = await Promise.all([
    getUlokDetail(ulokId),
    getComments(ulokId),
    getCurrentProfile(),
    createClient()
  ])

  const { data: { user } } = await supabaseServer.auth.getUser()
  const currentUserId = user?.id || null

  if (!res.success || !res.data) {
    redirect('/admin/assessor/penilaian')
  }

  const initialDetail = res.data
  const initialComments = (commentsRes.success && commentsRes.data) ? commentsRes.data : []
  const initialProfile = (profileRes.success && profileRes.profile) ? profileRes.profile : null

  return (
    <DetailPenilaianPeroranganClient
      ulokId={ulokId}
      initialPrefill={prefill}
      initialDetail={initialDetail}
      initialComments={initialComments}
      initialProfile={initialProfile}
      initialUserId={currentUserId}
    />
  )
}

'use client'

import React, { createContext, useContext } from 'react'

export interface AssessorProfile {
  id: string
  full_name: string
  role: string
  nik?: string | null
  avatar_url?: string | null
  branch_id?: number | string | null
  branches?: any
  [key: string]: any
}

const AssessorProfileContext = createContext<AssessorProfile | null>(null)

export function AssessorProfileProvider({
  profile,
  children,
}: {
  profile: AssessorProfile | null
  children: React.ReactNode
}) {
  return (
    <AssessorProfileContext.Provider value={profile}>
      {children}
    </AssessorProfileContext.Provider>
  )
}

export function useAssessorProfile() {
  const ctx = useContext(AssessorProfileContext)
  return ctx
}

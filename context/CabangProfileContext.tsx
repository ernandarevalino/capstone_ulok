'use client'

import React, { createContext, useContext } from 'react'

export interface CabangProfile {
  id: string
  full_name: string
  role: string
  nik?: string | null
  avatar_url?: string | null
  branch_id?: number | string | null
  branches?: any
  [key: string]: any
}

const CabangProfileContext = createContext<CabangProfile | null>(null)

export function CabangProfileProvider({
  profile,
  children,
}: {
  profile: CabangProfile | null
  children: React.ReactNode
}) {
  return (
    <CabangProfileContext.Provider value={profile}>
      {children}
    </CabangProfileContext.Provider>
  )
}

export function useCabangProfile() {
  const ctx = useContext(CabangProfileContext)
  return ctx
}

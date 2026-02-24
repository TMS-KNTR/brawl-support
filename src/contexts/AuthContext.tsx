import React, { createContext, useContext } from 'react'
import { useAuthImpl } from '../hooks/useAuth'

type AuthContextType = ReturnType<typeof useAuthImpl>

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthImpl()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

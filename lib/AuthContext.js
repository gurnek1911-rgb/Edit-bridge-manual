// lib/AuthContext.js
// Auth context — SSR-safe, no Firebase needed

import { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser, setCurrentUser, getUser, signOut as dbSignOut, seedDemoData } from './db'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Runs only in browser — safe for Vercel SSR
    seedDemoData()
    const authUser = getCurrentUser()
    if (authUser) {
      setUser(authUser)
      setProfile(getUser(authUser.uid))
    }
    setLoading(false)
  }, [])

  const refreshProfile = () => {
    if (user) setProfile(getUser(user.uid))
  }

  const login = (authUser) => {
    setCurrentUser(authUser)
    setUser(authUser)
    setProfile(getUser(authUser.uid))
  }

  const logout = () => {
    dbSignOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
    }

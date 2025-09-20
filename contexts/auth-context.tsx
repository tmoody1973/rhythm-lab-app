'use client'

import React, { createContext, useContext } from 'react'

export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  email: string
  role: 'user' | 'admin'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: any | null
  profile: Profile | null
  session: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  createProfile: (user: any, username?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  createProfile: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Temporary bypass for development - creating a mock admin user
  const mockUser = {
    id: 'admin-user',
    email: 'admin@test.com'
  }

  const mockProfile: Profile = {
    id: 'admin-user',
    username: 'admin',
    display_name: 'Admin User',
    email: 'admin@test.com',
    role: 'admin',
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const signIn = async (email: string, password: string) => {
    // Mock sign in - for development only
    console.log('Mock sign in for:', email)

    // Simple validation for demo purposes
    if (email === 'admin@test.com' && password === 'admin') {
      return { error: null }
    } else {
      return { error: { message: 'Invalid email or password' } }
    }
  }

  const signOut = async () => {
    // Mock sign out
    console.log('Mock sign out')
  }

  const createProfile = async () => {
    // Mock create profile
    console.log('Mock create profile')
  }

  const value: AuthContextType = {
    user: mockUser,
    profile: mockProfile,
    session: { user: mockUser },
    loading: false,
    signIn,
    signOut,
    createProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
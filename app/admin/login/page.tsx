"use client"

import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Dynamically import the form to avoid SSR hydration issues with password managers
const LoginFormContent = dynamic(
  () => import('./login-form').then(mod => mod.LoginForm),
  {
    ssr: false,
    loading: () => (
      <div className="text-center py-8">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }
)

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginFormContent />

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Only authorized administrators can access this area.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import { SignIn } from '@clerk/nextjs'

export default function SimpleAdminLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Login Test</h1>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
            }
          }}
        />
      </div>
    </div>
  )
}
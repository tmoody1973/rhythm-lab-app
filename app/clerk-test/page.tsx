"use client"

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser
} from '@clerk/nextjs'

export default function ClerkTestPage() {
  const { user } = useUser()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">
          Clerk Authentication Test
        </h1>

        <SignedOut>
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              Not signed in. Try the buttons below:
            </p>
            <div className="flex gap-4 justify-center">
              <SignInButton mode="modal">
                <button className="bg-blue-500 text-white px-4 py-2 rounded">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-green-500 text-white px-4 py-2 rounded">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="text-center space-y-4">
            <p className="text-green-600 font-semibold">
              ✅ Successfully signed in with Clerk!
            </p>
            <p className="text-gray-600">
              User: {user?.firstName} {user?.lastName}
            </p>
            <p className="text-gray-600">
              Email: {user?.primaryEmailAddress?.emailAddress}
            </p>
            <div className="flex justify-center">
              <UserButton afterSignOutUrl="/clerk-test" />
            </div>
          </div>
        </SignedIn>

        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Admin Status:</h3>
          <p className="text-sm text-gray-600">
            Admin routes still use Supabase - check <a href="/admin" className="text-blue-500 underline">/admin</a>
          </p>
        </div>
      </div>
    </div>
  )
}
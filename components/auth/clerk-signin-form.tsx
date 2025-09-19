"use client"

import { SignIn } from "@clerk/nextjs"

export function ClerkSignInForm() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Sign in to your Rhythm Lab Radio account
        </p>
      </div>

      <SignIn
        appearance={{
          elements: {
            formButtonPrimary:
              "bg-[#b12e2e] hover:bg-[#9a2525] text-sm normal-case",
            card: "shadow-none border-0",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            socialButtonsBlockButton:
              "border border-gray-300 text-gray-700 hover:bg-gray-50",
            dividerLine: "bg-gray-300",
            dividerText: "text-gray-500",
            formFieldInput:
              "border border-gray-300 focus:border-[#b12e2e] focus:ring-[#b12e2e]",
            footerActionLink: "hidden",
            footer: "hidden"
          },
          variables: {
            colorPrimary: "#b12e2e",
          }
        }}
      />

      <div className="text-center text-sm">
        <span className="text-gray-500">Don't have an account? </span>
        <a href="/signup" className="text-[#b12e2e] hover:underline">
          Sign up
        </a>
      </div>
    </div>
  )
}
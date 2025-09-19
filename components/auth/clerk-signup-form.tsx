"use client"

import { SignUp } from "@clerk/nextjs"
import Link from "next/link"

export function ClerkSignupForm() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Join Rhythm Lab Radio</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Create your account to discover and save your favorite tracks
        </p>
      </div>

      <SignUp
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
            footerActionLink: "text-[#b12e2e] hover:text-[#9a2525]"
          },
          variables: {
            colorPrimary: "#b12e2e",
          }
        }}
      />

      <div className="text-center text-sm">
        <span className="text-gray-500">Already have an account? </span>
        <Link href="/sign-in" className="text-[#b12e2e] hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}
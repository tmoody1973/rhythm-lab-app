"use client"

import { SignIn } from "@clerk/nextjs"
import Link from "next/link"

export function ClerkSignInForm() {
  return (
    <div className="mx-auto max-w-sm space-y-6">

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
        <Link href="/signup" className="text-[#b12e2e] hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  )
}
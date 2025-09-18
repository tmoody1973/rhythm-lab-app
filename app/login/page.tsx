"use client"

import dynamic from 'next/dynamic'
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"

// Dynamically import login form to avoid SSR hydration issues with password managers
const LoginForm = dynamic(
  () => import('@/components/auth/login-form').then(mod => ({ default: mod.LoginForm })),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Loading login form...
          </p>
        </div>
      </div>
    )
  }
)

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <Card className="bg-background border border-border/50">
            <CardContent className="p-6">
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
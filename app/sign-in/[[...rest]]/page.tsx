import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { ClerkSignInForm } from "@/components/auth/clerk-signin-form"
import Image from "next/image"

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          {/* Logo Section */}
          <div className="flex flex-col items-center text-center mb-8">
            <Image
              src="/images/rlr_logo.png"
              alt="Rhythm Lab Logo"
              width={280}
              height={92}
              className="h-20 w-auto filter drop-shadow-lg mb-6"
              priority
            />
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground text-sm">
              Sign in to continue your musical journey
            </p>
          </div>

          {/* Sign In Card */}
          <Card className="bg-card/80 backdrop-blur-sm border border-border/30 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8">
              <ClerkSignInForm />
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground">
              © 2025 Rhythm Lab Radio. All rights reserved.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
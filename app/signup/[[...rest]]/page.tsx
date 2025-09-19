import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { ClerkSignupForm } from "@/components/auth/clerk-signup-form"

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <Card className="bg-background border border-border/50">
            <CardContent className="p-6">
              <ClerkSignupForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
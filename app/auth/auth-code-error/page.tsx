import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#1e2332] border-[#2a2f3e]">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <CardTitle className="text-xl font-bold text-white">
            Email Confirmation Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-[#a1a1aa]">
            We couldn't verify your email confirmation link. This might happen if:
          </p>
          <ul className="text-sm text-[#a1a1aa] text-left space-y-2">
            <li>• The confirmation link has expired</li>
            <li>• The link has already been used</li>
            <li>• There was a network error</li>
          </ul>
          <div className="space-y-3 pt-4">
            <Button asChild className="w-full">
              <Link href="/signup">
                Try Signing Up Again
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/login">
                Back to Sign In
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
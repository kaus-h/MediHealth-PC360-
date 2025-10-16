"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center flex flex-col items-center">
          <Link href="/" className="inline-block">
            <Image
              src="/images/medihealth-icon.png"
              alt="MediHealth Logo"
              width={120}
              height={120}
              className="mb-4"
              priority
            />
          </Link>
          <h1 className="font-serif font-bold text-4xl text-primary">MediHealth</h1>
          <p className="mt-2 text-muted-foreground">Home Health Patient Portal</p>
        </div>

        <Card className="shadow-2xl border-2 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-serif">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your care information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} aria-label="Sign in form">
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                    aria-describedby={error ? "login-error" : undefined}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    aria-describedby={error ? "login-error" : undefined}
                  />
                </div>

                {error && (
                  <Alert variant="destructive" role="alert">
                    <AlertCircle className="size-4" aria-hidden="true" />
                    <AlertDescription id="login-error">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-2 hover:bg-accent/10 bg-transparent"
                  onClick={() => router.push("/demo")}
                >
                  Continue as Guest
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <div className="mt-6 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="font-medium text-primary underline-offset-4 hover:underline">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          This is a secure, HIPAA-compliant portal. Your health information is protected with enterprise-grade
          encryption.
        </p>
      </div>
    </div>
  )
}

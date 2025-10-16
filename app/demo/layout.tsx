"use client"

import type React from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DemoNav } from "@/components/demo/demo-nav"
import Image from "next/image"
import Link from "next/link"

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const mockUserName = "Sarah Johnson"

  return (
    <div className="flex h-screen overflow-hidden">
      <DemoNav userName={mockUserName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/images/medihealth-logo-colored.png" alt="MediHealth" width={32} height={32} />
                <div>
                  <h2 className="text-lg font-semibold">Demo Mode</h2>
                  <p className="text-xs text-muted-foreground">Exploring with sample data</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  alert("This feature is for authenticated users only")
                }}
              >
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

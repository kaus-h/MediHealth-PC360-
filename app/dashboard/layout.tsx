import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import Link from "next/link"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  const userName = `${profile.first_name} ${profile.last_name}`

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardNav userRole={profile.role} userName={userName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b bg-card px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <Image
              src="/images/medihealth-logo-colored.png"
              alt="MediHealth"
              width={28}
              height={28}
              className="w-7 h-7"
            />
            <span className="font-semibold text-base sm:text-lg">MediHealth</span>
          </Link>
          <div className="hidden lg:block w-10" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell unreadCount={unreadCount || 0} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden max-w-full bg-background p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}

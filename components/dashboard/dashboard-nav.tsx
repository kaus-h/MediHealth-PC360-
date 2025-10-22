"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  FileText,
  User,
  LogOut,
  Users,
  Activity,
  Menu,
  UserPlus,
  Mail,
  Heart,
  Pill,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { UserRole } from "@/lib/types/database"
import { useState } from "react"
import Image from "next/image"

interface DashboardNavProps {
  userRole: UserRole
  userName: string
}

export function DashboardNav({ userRole, userName }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["patient", "caregiver", "clinician", "agency_admin"],
    },
    {
      title: "My Caregivers",
      href: "/dashboard/caregivers",
      icon: Heart,
      roles: ["patient"],
    },
    {
      title: "Medications",
      href: "/dashboard/medications",
      icon: Pill,
      roles: ["patient", "caregiver"],
    },
    {
      title: "Patients",
      href: "/dashboard/patients",
      icon: Users,
      roles: ["clinician"],
    },
    {
      title: "Care Team",
      href: "/dashboard/team",
      icon: UserPlus,
      roles: ["patient"],
    },
    {
      title: "Invitations",
      href: "/dashboard/invitations",
      icon: Mail,
      roles: ["patient", "clinician"],
    },
    {
      title: "Visits",
      href: "/dashboard/visits",
      icon: Calendar,
      roles: ["patient", "caregiver", "clinician"],
    },
    {
      title: "Messages",
      href: "/dashboard/messages",
      icon: MessageSquare,
      roles: ["patient", "caregiver", "clinician", "agency_admin"],
    },
    {
      title: "My Care Plans",
      href: "/dashboard/care-plans",
      icon: Activity,
      roles: ["patient", "caregiver"],
    },
    {
      title: "Patient Care Plans",
      href: "/dashboard/clinician/care-plans",
      icon: Activity,
      roles: ["clinician"],
    },
    {
      title: "Patient Medications",
      href: "/dashboard/clinician/medications",
      icon: Pill,
      roles: ["clinician"],
    },
    {
      title: "Documents",
      href: "/dashboard/documents",
      icon: FileText,
      roles: ["patient", "caregiver", "clinician"],
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: User,
      roles: ["patient", "caregiver", "clinician", "agency_admin"],
    },
  ]

  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole))

  const NavContent = () => (
    <>
      <div className="border-b border-border/50 p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image
                src="/images/medihealth-logo-colored.png"
                alt="MediHealth"
                width={40}
                height={40}
                className="flex-shrink-0"
              />
              <div>
                <h2 className="text-2xl font-serif font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-foreground">
                  MediHealth
                </h2>
                <p className="text-sm text-muted-foreground mt-1 truncate font-medium">{userName}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto scrollbar-thin">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground hover:border hover:border-border/50",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110",
                  isActive && "text-primary",
                )}
              />
              <span className={cn(isActive && "font-semibold")}>{item.title}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border/50 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sign Out</span>
        </Button>
      </div>
    </>
  )

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Toggle menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 sm:w-80 p-0 flex flex-col">
          <NavContent />
        </SheetContent>
      </Sheet>

      <div className="hidden lg:flex h-screen w-64 flex-col border-r bg-card shadow-sm">
        <NavContent />
      </div>
    </>
  )
}
